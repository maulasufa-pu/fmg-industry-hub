import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { disableMidtransSubscription } from "@/lib/payments/midtrans-recurring";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const auth = await requireAuthenticatedRequest(request);
    const rate = consumeRateLimit(request, "tunexpert-subscription-cancel", 3, 10 * 60_000, auth.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
    const { data: subscription, error } = await admin.from("tunexpert_subscriptions")
      .select("id,provider_subscription_id,status")
      .eq("user_id", auth.user.id)
      .in("status", ["activating", "active", "past_due"])
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Unable to load subscription." }, { status: 500 });
    if (!subscription) return NextResponse.json({ error: "No active subscription was found." }, { status: 404 });

    if (subscription.provider_subscription_id) {
      await disableMidtransSubscription(subscription.provider_subscription_id);
    }
    const now = new Date().toISOString();
    const { error: updateError } = await admin.from("tunexpert_subscriptions").update({
      status: "cancelled",
      cancelled_at: now,
      next_billing_at: null,
      updated_at: now,
    }).eq("id", subscription.id).eq("user_id", auth.user.id);
    if (updateError) return NextResponse.json({ error: "Midtrans was disabled, but local status could not be updated." }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to cancel subscription." }, { status: 500 });
  }
}
