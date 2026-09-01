import "server-only";

type MidtransSubscriptionSchedule = {
  next_execution_at?: string | null;
  previous_execution_at?: string | null;
};

export type MidtransSubscription = {
  id: string;
  name: string;
  amount: string;
  currency: "IDR";
  status: "active" | "inactive";
  payment_type: "credit_card" | "gopay";
  schedule?: MidtransSubscriptionSchedule;
};

export type MidtransTransactionDetails = {
  payment_type?: string;
  saved_token_id?: string;
  saved_token_id_expired_at?: string;
  masked_card?: string;
  account_id?: string;
};

function midtransBaseUrl(): string {
  return process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function serverKey(): string {
  const value = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!value) throw new Error("Midtrans is not configured");
  return value;
}

async function midtransRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${midtransBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null) as { status_message?: string; validation_messages?: string[] } | null;
  if (!response.ok) {
    const message = body?.validation_messages?.join(", ") || body?.status_message || `Midtrans request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function getMidtransTransaction(orderId: string): Promise<MidtransTransactionDetails> {
  return midtransRequest<MidtransTransactionDetails>(`/v2/${encodeURIComponent(orderId)}/status`);
}

export async function getMidtransGopayToken(accountId: string): Promise<string> {
  const account = await midtransRequest<{
    account_status?: string;
    metadata?: { payment_options?: Array<{ name?: string; active?: boolean; token?: string }> };
  }>(`/v2/pay/account/${encodeURIComponent(accountId)}`);
  const option = account.metadata?.payment_options?.find((item) => item.active && item.token);
  if (account.account_status !== "ENABLED" || !option?.token) throw new Error("GoPay account is not enabled for recurring payment");
  return option.token;
}

export async function createMidtransSubscription(input: {
  idempotencyKey: string;
  name: string;
  amountIdr: number;
  paymentType: "credit_card" | "gopay";
  token: string;
  accountId?: string;
  startTime: string;
  metadata: Record<string, string>;
}): Promise<MidtransSubscription> {
  return midtransRequest<MidtransSubscription>("/v1/subscriptions", {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      name: input.name,
      amount: String(input.amountIdr),
      currency: "IDR",
      payment_type: input.paymentType,
      token: input.token,
      schedule: { interval: 1, interval_unit: "month", start_time: input.startTime },
      retry_schedule: { interval: 1, interval_unit: "day", max_interval: 3 },
      metadata: input.metadata,
      ...(input.paymentType === "gopay" && input.accountId ? { gopay: { account_id: input.accountId } } : {}),
    }),
  });
}

export async function getMidtransSubscription(subscriptionId: string): Promise<MidtransSubscription> {
  return midtransRequest<MidtransSubscription>(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function disableMidtransSubscription(subscriptionId: string): Promise<void> {
  await midtransRequest(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}/disable`, { method: "POST" });
}

export function oneMonthFromNowInJakarta(): { iso: string; midtrans: string } {
  const jakarta = new Date(Date.now() + 7 * 60 * 60 * 1000);
  jakarta.setUTCMonth(jakarta.getUTCMonth() + 1);
  const iso = new Date(jakarta.getTime() - 7 * 60 * 60 * 1000).toISOString();
  return { iso, midtrans: formatMidtransJakarta(iso) };
}

export function formatMidtransJakarta(value: string | Date): string {
  const instant = value instanceof Date ? value : new Date(value);
  const jakarta = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${jakarta.getUTCFullYear()}-${pad(jakarta.getUTCMonth() + 1)}-${pad(jakarta.getUTCDate())}`;
  const time = `${pad(jakarta.getUTCHours())}:${pad(jakarta.getUTCMinutes())}:${pad(jakarta.getUTCSeconds())}`;
  return `${date} ${time} +0700`;
}
