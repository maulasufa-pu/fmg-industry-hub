import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import midtransClient from "midtrans-client";

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
  client_id: string | null;
};

export const runtime = "nodejs";        
export const dynamic = "force-dynamic"; 
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_IS_PRODUCTION =
  (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";

const COLS =
  "id,invoice_no,client_id,client_name,client_email,amount_total,currency,status,payment_url";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const actor = await requireAuthenticatedRequest(req);
    const rate = consumeRateLimit(req, "midtrans-create", 10, 60_000, actor.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many payment requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const { invoiceId } = (await req.json()) as { invoiceId?: string };
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

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
    if (!actor.isAdmin && inv.client_id !== actor.user.id) {
      return NextResponse.json({ error: "Invoice access denied" }, { status: 403 });
    }
    if (inv.status !== "unpaid") {
      return NextResponse.json({ error: "Invoice not unpaid" }, { status: 400 });
    }
    if ((inv.currency ?? "").toUpperCase() !== "IDR") {
      return NextResponse.json({ error: "Midtrans payments require an IDR invoice" }, { status: 400 });
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
      const trx = await snap.createTransaction({
        transaction_details: {
          order_id: inv.invoice_no, 
          gross_amount: gross,      
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
          finish: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${actor.isAdmin ? "admin" : "client"}/invoices/${inv.id}`,
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
    } catch (e: any) {
      const msg =
        e?.ApiResponse?.status_message ||
        e?.message ||
        "Midtrans error";
      if (/order_id.*used/i.test(msg) || /duplicate order id/i.test(msg)) {
        if (inv.payment_url) {
          return NextResponse.json({ token: null, redirect_url: inv.payment_url });
        }
      }
      //console.error("[midtrans.createTransaction] error:", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err: any) {
    const authResponse = apiAuthErrorResponse(err);
    if (authResponse) return authResponse;
    //console.error("[payments/midtrans/create] fatal:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
