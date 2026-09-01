import crypto from "node:crypto";
import midtransClient from "midtrans-client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { oneMonthFromNowInJakarta } from "@/lib/payments/midtrans-recurring";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { tuneXpertSubscriptionPlan } from "@/lib/tunexpert/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({ planCode: z.string().trim().min(1).max(30) });

function publicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function paymentsAreLive(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY)
    && process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const auth = await requireAuthenticatedRequest(request);
    const rate = consumeRateLimit(request, "tunexpert-subscription-checkout", 4, 10 * 60_000, auth.user.id);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many checkout attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    }
    if (process.env.VERCEL_ENV === "production" && !paymentsAreLive()) {
      return NextResponse.json({ error: "Live Midtrans payments are still being configured." }, { status: 503 });
    }

    const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid subscription plan." }, { status: 400 });
    const plan = tuneXpertSubscriptionPlan(parsed.data.planCode);
    if (!plan) return NextResponse.json({ error: "Subscription plan not found." }, { status: 404 });

    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    const admin = getSupabaseAdminClient();
    if (!serverKey || !admin) return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });

    const { data: existing } = await admin.from("tunexpert_subscriptions")
      .select("id,status")
      .eq("user_id", auth.user.id)
      .in("status", ["pending", "activating", "active", "past_due"])
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "You already have an active or pending tuneXpert subscription." }, { status: 409 });
    }

    const subscriptionId = crypto.randomUUID();
    const providerName = `TXS-${subscriptionId.replaceAll("-", "").slice(0, 20).toUpperCase()}`;
    const orderNo = `TXP-SUB-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const nextBilling = oneMonthFromNowInJakarta();
    const { error: subscriptionError } = await admin.from("tunexpert_subscriptions").insert({
      id: subscriptionId,
      user_id: auth.user.id,
      plan_code: plan.code,
      monthly_credits: plan.credits,
      amount_idr: plan.amountIdr,
      provider_name: providerName,
      next_billing_at: nextBilling.iso,
    });
    if (subscriptionError) {
      return NextResponse.json({ error: "Unable to create subscription. Check whether another plan is still active." }, { status: 409 });
    }

    const { data: order, error: orderError } = await admin.from("tunexpert_credit_orders").insert({
      order_no: orderNo,
      user_id: auth.user.id,
      package_code: `subscription_${plan.code}`,
      credits: plan.credits,
      amount_idr: plan.amountIdr,
      currency: "IDR",
      status: "pending",
      order_type: "subscription_initial",
      subscription_id: subscriptionId,
    }).select("id").single();
    if (orderError || !order) {
      await admin.from("tunexpert_subscriptions").delete().eq("id", subscriptionId);
      return NextResponse.json({ error: "Unable to create the subscription order." }, { status: 500 });
    }

    const snap = new midtransClient.Snap({
      isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true",
      serverKey,
    });

    try {
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: orderNo, gross_amount: plan.amountIdr },
        customer_details: {
          first_name: auth.user.user_metadata?.name || "FMG Client",
          email: auth.user.email || undefined,
        },
        item_details: [{ id: plan.code, price: plan.amountIdr, quantity: 1, name: `tuneXpert ${plan.name} monthly` }],
        enabled_payments: ["credit_card", "gopay"],
        user_id: `tunexpert-${auth.user.id}`,
        credit_card: { secure: true },
        recurring: { required: true, start_time: nextBilling.midtrans, interval_unit: "month" },
        callbacks: { finish: `${publicOrigin(request)}/tuneXpert?subscription=finish` },
      });

      await admin.from("tunexpert_credit_orders").update({ payment_url: transaction.redirect_url, updated_at: new Date().toISOString() }).eq("id", order.id);
      return NextResponse.json({ redirectUrl: transaction.redirect_url });
    } catch (error) {
      await Promise.all([
        admin.from("tunexpert_credit_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id),
        admin.from("tunexpert_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", subscriptionId),
      ]);
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open Midtrans checkout." }, { status: 502 });
    }
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to start subscription checkout." }, { status: 500 });
  }
}
