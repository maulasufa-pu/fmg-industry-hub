import { NextRequest, NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";

type InvoiceStatus = "draft" | "unpaid" | "paid" | "cancelled";
type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_name: string | null;
  client_email: string | null;
  amount_total: number | null;
  currency: string | null;
  status: InvoiceStatus;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_IS_PRODUCTION =
  (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";

const COLS =
  "id,invoice_no,client_name,client_email,amount_total,currency,status";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { invoiceId } = (await req.json()) as { invoiceId?: string };
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ⬇️ PAKE maybeSingle() (atau single()), TANPA .returns<...>()
  const { data: inv, error: invErr } = await admin
    .from("invoices")
    .select(COLS)
    .eq("id", invoiceId)
    .maybeSingle<InvoiceRow>();

  if (invErr) {
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }
  if (!inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (inv.status !== "unpaid") {
    return NextResponse.json({ error: "Invoice not unpaid" }, { status: 400 });
  }
  if (!Number.isFinite(inv.amount_total)) {
    return NextResponse.json({ error: "Missing amount_total" }, { status: 400 });
  }

  const snap = new midtransClient.Snap({
    isProduction: MIDTRANS_IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
  });

  const trx = await snap.createTransaction({
    transaction_details: {
      order_id: inv.invoice_no,
      gross_amount: inv.amount_total as number,
    },
    customer_details: {
      first_name: inv.client_name ?? "Client",
      email: inv.client_email ?? "no-reply@example.com",
    },
    item_details: [
      {
        id: inv.id,
        price: inv.amount_total as number,
        quantity: 1,
        name: `Invoice ${inv.invoice_no}`,
      },
    ],
    credit_card: { secure: true },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/invoices/${inv.id}`,
    },
  });

  await admin
    .from("invoices")
    .update({ payment_url: trx.redirect_url })
    .eq("id", inv.id);

  return NextResponse.json({
    token: trx.token,
    redirect_url: trx.redirect_url,
  });
}
