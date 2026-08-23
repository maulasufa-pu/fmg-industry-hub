//src\app\api\payments\midtrans\webhook\route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { midtransAmountMatches, midtransInvoiceStatus, verifyMidtransSignature, type MidtransTransactionStatus } from "@/lib/payments/midtrans";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

type MidtransNotif = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: MidtransTransactionStatus;
  fraud_status?: "accept" | "deny" | "challenge";
  signature_key: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as MidtransNotif;

  if (!verifyMidtransSignature({ orderId: body.order_id, statusCode: body.status_code, grossAmount: body.gross_amount, signature: body.signature_key }, MIDTRANS_SERVER_KEY)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
