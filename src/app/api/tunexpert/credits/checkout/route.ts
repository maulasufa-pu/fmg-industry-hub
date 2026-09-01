import crypto from "node:crypto";
import midtransClient from "midtrans-client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { tuneXpertPackage } from "@/lib/tunexpert/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({ packageCode: z.string().trim().min(1).max(30) });

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
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const auth = await requireAuthenticatedRequest(request);
    const rate = consumeRateLimit(request, "tunexpert-credit-checkout", 5, 10 * 60_000, auth.user.id);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many checkout attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    }

    if (process.env.VERCEL_ENV === "production" && !paymentsAreLive()) {
      return NextResponse.json({ error: "Live payments are still being configured." }, { status: 503 });
    }

    const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid credit package." }, { status: 400 });
    const selectedPackage = tuneXpertPackage(parsed.data.packageCode);
    if (!selectedPackage) return NextResponse.json({ error: "Credit package not found." }, { status: 404 });

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });

    const orderNo = `TXP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const { data: order, error: orderError } = await admin.from("tunexpert_credit_orders").insert({
      order_no: orderNo,
      user_id: auth.user.id,
      package_code: selectedPackage.code,
      credits: selectedPackage.credits,
      amount_idr: selectedPackage.amountIdr,
      currency: "IDR",
      status: "pending",
    }).select("id").single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Unable to create the credit order." }, { status: 500 });
    }

    const snap = new midtransClient.Snap({
      isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true",
      serverKey,
    });

    try {
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: orderNo, gross_amount: selectedPackage.amountIdr },
        customer_details: { first_name: auth.user.user_metadata?.name || "FMG Client", email: auth.user.email || undefined },
        item_details: [{
          id: selectedPackage.code,
          price: selectedPackage.amountIdr,
          quantity: 1,
          name: `tuneXpert ${selectedPackage.credits} credits`,
        }],
        credit_card: { secure: true },
        callbacks: { finish: `${publicOrigin(request)}/tuneXpert?payment=finish` },
      });

      await admin.from("tunexpert_credit_orders").update({ payment_url: transaction.redirect_url, updated_at: new Date().toISOString() }).eq("id", order.id);
      return NextResponse.json({ redirectUrl: transaction.redirect_url });
    } catch (error: unknown) {
      await admin.from("tunexpert_credit_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
      const message = error instanceof Error ? error.message : "Unable to open Midtrans checkout.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
