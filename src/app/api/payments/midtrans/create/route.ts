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
  payment_url: string | null;
};

export const runtime = "nodejs";        // pastikan Node runtime (bukan Edge)
export const dynamic = "force-dynamic"; // no caching

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_IS_PRODUCTION =
  (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";

const COLS =
  "id,invoice_no,client_name,client_email,amount_total,currency,status,payment_url";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { invoiceId } = (await req.json()) as { invoiceId?: string };
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    // Cek env biar errornya jelas, bukan 500 random
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env" },
        { status: 500 }
      );
    }
    if (!MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured: missing MIDTRANS_SERVER_KEY" },
        { status: 500 }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Ambil invoice (sekaligus payment_url utk fallback)
    const { data: inv, error: invErr } = await admin
      .from("invoices")
      .select(COLS)
      .eq("id", invoiceId)
      .single<InvoiceRow>();

    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 500 });
    }
    if (!inv) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (inv.status !== "unpaid") {
      return NextResponse.json({ error: "Invoice not unpaid" }, { status: 400 });
    }

    const gross = Math.round(Number(inv.amount_total ?? 0));
    if (!Number.isFinite(gross) || gross <= 0) {
      return NextResponse.json({ error: "Invalid amount_total" }, { status: 400 });
    }

    const snap = new midtransClient.Snap({
      isProduction: MIDTRANS_IS_PRODUCTION,
      serverKey: MIDTRANS_SERVER_KEY,
    });

    try {
      // Coba bikin transaksi baru
      const trx = await snap.createTransaction({
        transaction_details: {
          order_id: inv.invoice_no, // harus unik di Midtrans
          gross_amount: gross,      // integer (tanpa desimal)
        },
        customer_details: {
          first_name: inv.client_name ?? "Client",
          email: inv.client_email ?? undefined,
        },
        item_details: [
          {
            id: inv.id,
            price: gross,
            quantity: 1,
            name: `Invoice ${inv.invoice_no}`,
          },
        ],
        credit_card: { secure: true },
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/invoices/${inv.id}`,
        },
      });

      // Simpan payment_url supaya bisa dipakai ulang
      await admin
        .from("invoices")
        .update({ payment_url: trx.redirect_url })
        .eq("id", inv.id);

      return NextResponse.json({
        token: trx.token,
        redirect_url: trx.redirect_url,
      });
    } catch (e: any) {
      // Handle duplikat order_id (user klik Pay 2x, dll.)
      const msg =
        e?.ApiResponse?.status_message ||
        e?.message ||
        "Midtrans error";
      if (/order_id.*used/i.test(msg) || /duplicate order id/i.test(msg)) {
        if (inv.payment_url) {
          // Fallback: pakai payment_url lama (token mungkin gak ada, gak masalah —
          // client akan redirect langsung)
          return NextResponse.json({ token: null, redirect_url: inv.payment_url });
        }
      }
      console.error("[midtrans.createTransaction] error:", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[payments/midtrans/create] fatal:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}