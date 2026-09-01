import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import TuneXpertClient from "./TuneXpertClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "tuneXpert — AI Music Generation & Voice Isolation",
  description: "Create original music from a creative brief and isolate clean voice from noisy audio with tuneXpert by FMG Universe.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/tuneXpert" },
  openGraph: {
    title: "tuneXpert — Shape sound beyond the prompt",
    description: "AI music generation and voice isolation inside FMG Universe.",
    url: "/tuneXpert",
    type: "website",
  },
};

export default async function TuneXpertPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login?next=%2FtuneXpert");

  const admin = getSupabaseAdminClient();
  const [{ data: wallet }, { data: subscription }] = admin
    ? await Promise.all([
      admin.from("tunexpert_wallets").select("balance").eq("user_id", auth.user.id).maybeSingle(),
      admin.from("tunexpert_subscriptions").select("id,plan_code,monthly_credits,amount_idr,status,payment_type,masked_payment_method,current_period_end,next_billing_at,cancelled_at").eq("user_id", auth.user.id).in("status", ["pending", "activating", "activation_failed", "active", "past_due"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ])
    : [{ data: null }, { data: null }];

  const paymentsLive = Boolean(process.env.MIDTRANS_SERVER_KEY)
    && process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  return <TuneXpertClient initialBalance={Number(wallet?.balance ?? 0)} initialSubscription={subscription} paymentsLive={paymentsLive} />;
}
