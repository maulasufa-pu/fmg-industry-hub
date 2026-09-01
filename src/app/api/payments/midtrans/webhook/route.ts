//src\app\api\payments\midtrans\webhook\route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { midtransAmountMatches, midtransInvoiceStatus, verifyMidtransSignature, type MidtransTransactionStatus } from "@/lib/payments/midtrans";
import { disableMidtransSubscription } from "@/lib/payments/midtrans-recurring";
import { activateTuneXpertSubscription, tuneXpertProviderNameFromOrder } from "@/lib/tunexpert/subscriptions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

type MidtransNotif = {
  order_id: string;
  transaction_id?: string;
  status_code: string;
  gross_amount: string;
  transaction_status: MidtransTransactionStatus;
  fraud_status?: "accept" | "deny" | "challenge";
  payment_type?: string;
  saved_token_id?: string;
  masked_card?: string;
  account_id?: string;
  signature_key: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ error: "Payment webhook is not configured" }, { status: 503 });
  }
  const body = (await req.json()) as MidtransNotif;

  if (!verifyMidtransSignature({ orderId: body.order_id, statusCode: body.status_code, grossAmount: body.gross_amount, signature: body.signature_key }, MIDTRANS_SERVER_KEY)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (body.order_id.startsWith("TXP-")) {
    const { data: creditOrder, error: creditOrderError } = await admin
      .from("tunexpert_credit_orders")
      .select("amount_idr,currency,order_type,subscription_id,tunexpert_subscriptions(provider_subscription_id)")
      .eq("order_no", body.order_id)
      .maybeSingle();
    if (creditOrderError) return NextResponse.json({ error: "Unable to verify credit order" }, { status: 500 });
    if (!creditOrder) return NextResponse.json({ error: "Credit order not found" }, { status: 404 });
    if (!midtransAmountMatches(body.gross_amount, creditOrder.amount_idr, creditOrder.currency)) {
      return NextResponse.json({ error: "Credit order amount mismatch" }, { status: 400 });
    }

    if (body.transaction_status === "settlement" || (body.transaction_status === "capture" && body.fraud_status === "accept")) {
      const { error } = await admin.rpc("tunexpert_settle_credit_order", {
        p_order_no: body.order_id,
        p_provider_transaction_id: body.transaction_id ?? null,
      });
      if (error) return NextResponse.json({ error: "Unable to settle credit order" }, { status: 500 });
      if (creditOrder.order_type === "subscription_initial") {
        try {
          await activateTuneXpertSubscription(body);
        } catch {
          return NextResponse.json({ error: "Credits were granted, but recurring activation will be retried" }, { status: 500 });
        }
      }
    } else if (body.transaction_status === "refund" || body.transaction_status === "partial_refund") {
      const { error } = await admin.rpc("tunexpert_reverse_credit_order", { p_order_no: body.order_id });
      if (error) return NextResponse.json({ error: "Unable to reverse credit order" }, { status: 500 });
      if (creditOrder.subscription_id) {
        const relation = Array.isArray(creditOrder.tunexpert_subscriptions)
          ? creditOrder.tunexpert_subscriptions[0]
          : creditOrder.tunexpert_subscriptions;
        if (relation?.provider_subscription_id) {
          await disableMidtransSubscription(relation.provider_subscription_id).catch(() => undefined);
        }
        await admin.from("tunexpert_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", creditOrder.subscription_id);
      }
    } else if (["deny", "expire", "cancel"].includes(body.transaction_status)) {
      const { error } = await admin.rpc("tunexpert_cancel_credit_order", { p_order_no: body.order_id });
      if (error) return NextResponse.json({ error: "Unable to cancel credit order" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const providerName = tuneXpertProviderNameFromOrder(body.order_id);
  if (providerName) {
    const { data: subscription, error: subscriptionError } = await admin
      .from("tunexpert_subscriptions")
      .select("amount_idr,currency,status")
      .eq("provider_name", providerName)
      .maybeSingle();
    if (subscriptionError) return NextResponse.json({ error: "Unable to verify subscription" }, { status: 500 });
    if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    if (!midtransAmountMatches(body.gross_amount, subscription.amount_idr, subscription.currency)) {
      return NextResponse.json({ error: "Subscription amount mismatch" }, { status: 400 });
    }

    if (body.transaction_status === "settlement" || (body.transaction_status === "capture" && body.fraud_status === "accept")) {
      const { error } = await admin.rpc("tunexpert_settle_subscription_payment", {
        p_provider_name: providerName,
        p_provider_order_id: body.order_id,
        p_provider_transaction_id: body.transaction_id ?? "",
        p_amount_idr: Math.round(Number(body.gross_amount)),
      });
      if (error) return NextResponse.json({ error: "Unable to grant subscription credits" }, { status: 500 });
    } else if (body.transaction_status === "refund" || body.transaction_status === "partial_refund") {
      const { error } = await admin.rpc("tunexpert_reverse_subscription_payment", { p_provider_order_id: body.order_id });
      if (error) return NextResponse.json({ error: "Unable to reverse subscription credits" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("id,amount_total,currency")
    .eq("invoice_no", body.order_id)
    .maybeSingle();
  if (invoiceError) return NextResponse.json({ error: "Unable to verify invoice" }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!midtransAmountMatches(body.gross_amount, invoice.amount_total, invoice.currency)) {
    return NextResponse.json({ error: "Invoice amount mismatch" }, { status: 400 });
  }

  const nextStatus = midtransInvoiceStatus(body.transaction_status, body.fraud_status);

  const { error } = await admin
    .from("invoices")
    .update({ status: nextStatus })
    .eq("id", invoice.id);

  if (error) return NextResponse.json({ ok: false, error: "Unable to update invoice" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
