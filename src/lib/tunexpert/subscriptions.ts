import "server-only";

import {
  createMidtransSubscription,
  formatMidtransJakarta,
  getMidtransGopayToken,
  getMidtransTransaction,
} from "@/lib/payments/midtrans-recurring";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type InitialSubscriptionPayment = {
  order_id: string;
  payment_type?: string;
  saved_token_id?: string;
  masked_card?: string;
  account_id?: string;
};

type ActivationClaim = {
  subscription_id: string;
  user_id: string;
  provider_name: string;
  plan_code: string;
  monthly_credits: number;
  amount_idr: number;
  next_billing_at: string;
};

export async function activateTuneXpertSubscription(payment: InitialSubscriptionPayment): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("TuneXpert billing is not configured");

  const { data, error } = await admin.rpc("tunexpert_claim_subscription_activation", { p_order_no: payment.order_id });
  if (error) throw new Error("Unable to claim subscription activation");
  const claim = (Array.isArray(data) ? data[0] : data) as ActivationClaim | null;
  if (!claim) return;

  try {
    const details = await getMidtransTransaction(payment.order_id);
    const paymentType = payment.payment_type || details.payment_type;
    if (paymentType !== "credit_card" && paymentType !== "gopay") {
      throw new Error("This payment method does not support automatic renewal");
    }

    const accountId = payment.account_id || details.account_id;
    const token = paymentType === "credit_card"
      ? payment.saved_token_id || details.saved_token_id
      : accountId ? await getMidtransGopayToken(accountId) : null;
    if (!token) throw new Error("Midtrans did not return a reusable payment token");

    const nextBillingAt = claim.next_billing_at;
    const subscription = await createMidtransSubscription({
      idempotencyKey: claim.subscription_id,
      name: claim.provider_name,
      amountIdr: Number(claim.amount_idr),
      paymentType,
      token,
      accountId: accountId || undefined,
      startTime: formatMidtransJakarta(nextBillingAt),
      metadata: { tuneXpert_subscription_id: claim.subscription_id, plan_code: claim.plan_code },
    });

    const { error: updateError } = await admin.from("tunexpert_subscriptions").update({
      status: subscription.status === "active" ? "active" : "activation_failed",
      provider_subscription_id: subscription.id,
      payment_type: paymentType,
      masked_payment_method: paymentType === "credit_card" ? payment.masked_card || details.masked_card || "Saved card" : "GoPay",
      current_period_start: new Date().toISOString(),
      current_period_end: nextBillingAt,
      next_billing_at: nextBillingAt,
      activation_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", claim.subscription_id);
    if (updateError) throw new Error("Unable to save subscription activation");
  } catch (error) {
    await admin.from("tunexpert_subscriptions").update({
      status: "activation_failed",
      activation_error: error instanceof Error ? error.message.slice(0, 500) : "Midtrans recurring activation failed",
      updated_at: new Date().toISOString(),
    }).eq("id", claim.subscription_id);
    throw error;
  }
}

export function tuneXpertProviderNameFromOrder(orderId: string): string | null {
  const match = orderId.match(/^(TXS-[A-F0-9]{20})/);
  return match?.[1] ?? null;
}
