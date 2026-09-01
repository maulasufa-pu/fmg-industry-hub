import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { TUNEXPERT_CREDIT_PACKAGES, TUNEXPERT_SECONDS_PER_CREDIT, TUNEXPERT_SUBSCRIPTION_PLANS } from "@/lib/tunexpert/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedRequest(request);
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });

    const [{ data: wallet, error: walletError }, { data: orders, error: ordersError }, { data: subscription, error: subscriptionError }] = await Promise.all([
      admin.from("tunexpert_wallets").select("balance,lifetime_purchased,lifetime_used").eq("user_id", auth.user.id).maybeSingle(),
      admin.from("tunexpert_credit_orders").select("id,order_no,package_code,credits,amount_idr,status,payment_url,created_at,paid_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(5),
      admin.from("tunexpert_subscriptions").select("id,plan_code,monthly_credits,amount_idr,status,payment_type,masked_payment_method,current_period_end,next_billing_at,cancelled_at").eq("user_id", auth.user.id).in("status", ["pending", "activating", "activation_failed", "active", "past_due"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (walletError || ordersError || subscriptionError) {
      return NextResponse.json({ error: "Unable to load tuneXpert billing." }, { status: 500 });
    }

    return NextResponse.json({
      balance: wallet?.balance ?? 0,
      lifetimePurchased: wallet?.lifetime_purchased ?? 0,
      lifetimeUsed: wallet?.lifetime_used ?? 0,
      secondsPerCredit: TUNEXPERT_SECONDS_PER_CREDIT,
      packages: TUNEXPERT_CREDIT_PACKAGES,
      subscriptionPlans: TUNEXPERT_SUBSCRIPTION_PLANS,
      subscription: subscription ?? null,
      orders: orders ?? [],
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load tuneXpert billing." }, { status: 500 });
  }
}
