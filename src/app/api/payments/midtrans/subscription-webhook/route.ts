import { NextResponse } from "next/server";
import { getMidtransSubscription } from "@/lib/payments/midtrans-recurring";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionNotification = {
  id?: string;
  name?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ error: "Midtrans recurring webhook is not configured" }, { status: 503 });
  }
  const body = await request.json().catch(() => null) as SubscriptionNotification | null;
  if (!body?.id || !body.name) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });

  try {
    // Recurring notifications do not carry the normal transaction signature.
    // Re-fetching from Midtrans makes the provider API the source of truth.
    const verified = await getMidtransSubscription(body.id);
    if (verified.name !== body.name) return NextResponse.json({ error: "Subscription identity mismatch" }, { status: 403 });

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
    const { data: local, error } = await admin.from("tunexpert_subscriptions")
      .select("id,amount_idr,currency,status")
      .eq("provider_subscription_id", verified.id)
      .eq("provider_name", verified.name)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Unable to verify local subscription" }, { status: 500 });
    if (!local || local.currency !== "IDR" || Number(local.amount_idr) !== Math.round(Number(verified.amount))) {
      return NextResponse.json({ error: "Subscription details mismatch" }, { status: 403 });
    }

    const status = verified.status === "active" ? "active" : local.status === "cancelled" ? "cancelled" : "past_due";
    const { error: updateError } = await admin.from("tunexpert_subscriptions").update({
      status,
      next_billing_at: verified.schedule?.next_execution_at || null,
      updated_at: new Date().toISOString(),
    }).eq("id", local.id);
    if (updateError) return NextResponse.json({ error: "Unable to update subscription" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to verify Midtrans subscription" }, { status: 502 });
  }
}
