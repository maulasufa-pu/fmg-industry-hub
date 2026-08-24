"use client";

import Link from "next/link";
import { ArrowRight, BadgePercent, CheckCircle2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatIdrAnchoredPrice } from "@/lib/currency";
import { ARRANGEMENT_ORDER_PATH } from "@/lib/arrangement";
import { useLanguage } from "@/contexts/LanguageContext";

const PROMO_IDR = 6_000_000;

export default function NewCustomerPromoCard() {
  const { currency, rates } = useCurrency();
  const { pick } = useLanguage();
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-7 shadow-xl dark:border-rose-800 dark:from-rose-950/40 dark:via-black dark:to-amber-950/30 sm:p-9">
        <div className="absolute right-0 top-0 rounded-bl-2xl bg-rose-600 px-4 py-2 text-xs font-bold tracking-wide text-white">{pick("CUSTOMER BARU", "NEW CUSTOMER")}</div>
        <BadgePercent className="h-9 w-9 text-rose-600" />
        <h2 className="mt-4 text-3xl font-bold">{pick("Paket Hemat Aransemen", "Arrangement Starter Package")}</h2>
        <p className="mt-3 text-4xl font-black text-rose-600">{formatIdrAnchoredPrice(PROMO_IDR, currency, rates)}</p>
        <p className="mt-1 text-sm font-semibold">{pick("Penawaran spesial untuk project pertama Anda.", "A special offer for your first project.")}</p>
        <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">{["Composition & arrangement", "Digital audio production", "Editing, mixing & mastering", "Vocal directing"].map((item) => <div key={item} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />{item}</div>)}</div>
        <Link href={ARRANGEMENT_ORDER_PATH} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-bold text-white hover:bg-rose-700">{pick("Mulai Project Pertama", "Start Your First Project")} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
