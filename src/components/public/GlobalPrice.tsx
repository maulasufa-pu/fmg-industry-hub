"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { formatIdrAnchoredPrice, formatPrice } from "@/lib/currency";

export default function GlobalPrice({ usd, idr }: { usd: number; idr?: number }) {
  const { currency, rates, loading } = useCurrency();
  if (loading && currency !== "USD") return <span aria-label="Loading price">…</span>;
  return <>{idr ? formatIdrAnchoredPrice(idr, currency, rates) : formatPrice(usd, currency, rates)}</>;
}
