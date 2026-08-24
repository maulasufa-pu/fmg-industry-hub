"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPrice } from "@/lib/currency";

export default function GlobalPrice({ usd }: { usd: number }) {
  const { currency, rates, loading } = useCurrency();
  if (loading && currency !== "USD") return <span aria-label="Loading price">…</span>;
  return <>{formatPrice(usd, currency, rates)}</>;
}
