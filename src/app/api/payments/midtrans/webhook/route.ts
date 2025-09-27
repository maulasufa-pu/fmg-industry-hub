//src\app\api\payments\midtrans\webhook\route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

type MidtransNotif = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "expire"
    | "cancel"
    | "refund"
    | "partial_refund";
  fraud_status?: "accept" | "deny" | "challenge";
  signature_key: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as MidtransNotif;

  const expected = crypto
    .createHash("sha512")
    .update(body.order_id + body.status_code + body.gross_amount + MIDTRANS_SERVER_KEY)
    .digest("hex");

  if (expected !== body.signature_key) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let nextStatus: "paid" | "unpaid" | "cancelled" = "unpaid";
  if (body.transaction_status === "settlement") nextStatus = "paid";
  else if (body.transaction_status === "capture" && body.fraud_status === "accept") nextStatus = "paid";
  else if (body.transaction_status === "pending") nextStatus = "unpaid";
  else if (["deny", "expire", "cancel"].includes(body.transaction_status)) nextStatus = "cancelled";

  const { error } = await admin
    .from("invoices")
    .update({ status: nextStatus })
    .eq("invoice_no", body.order_id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
