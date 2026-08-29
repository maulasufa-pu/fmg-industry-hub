"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, Check, ChevronDown, Gift, Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConsent } from "@/components/privacy/ConsentManager";
import { ARRANGEMENT_ORDER_PATH, NEW_CUSTOMER_PROMO_IDR } from "@/lib/arrangement";
import { formatIdrAnchoredPrice } from "@/lib/currency";

const DISMISSED_KEY = "fmg-home-promo-dismissed-v1";
const SESSION_SHOWN_KEY = "fmg-home-promo-shown-v1";
const REOPEN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export default function HomePromoPopup() {
  const { currency, rates } = useCurrency();
  const { language, pick } = useLanguage();
  const { preferences } = useConsent();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!preferences) return;
    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
    const dismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < REOPEN_AFTER_MS;
    const shownThisSession = window.sessionStorage.getItem(SESSION_SHOWN_KEY) === "1";

    if (dismissedRecently || shownThisSession) return;

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
      setOpen(true);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [preferences]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const features = language === "id"
    ? ["Komposisi & aransemen", "Produksi audio digital", "Editing, mixing & mastering", "Vocal directing"]
    : ["Composition & arrangement", "Digital audio production", "Editing, mixing & mastering", "Vocal directing"];

  if (!mounted || !preferences) return null;

  return (
    <div data-no-translate>
      {!open && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-rose-300/80 bg-white/95 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_14px_45px_rgba(225,29,72,0.25)] backdrop-blur-xl dark:border-rose-700 dark:bg-slate-950/95 dark:text-white sm:bottom-7 sm:left-7"
          aria-label={pick("Buka promo pelanggan baru", "Open new customer offer")}
        >
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-white">
            <Gift className="h-4 w-4" />
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/30" />
          </span>
          <span>{pick("Promo project pertama", "First-project offer")}</span>
        </motion.button>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[calc(100dvh-1.5rem)] w-[min(760px,calc(100vw-1.5rem))] max-w-none overflow-y-auto border-white/15 bg-slate-950 p-0 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-[2rem]"
        >
          <div className="relative isolate overflow-hidden rounded-[inherit]">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,rgba(244,63,94,0.38),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(124,58,237,0.35),transparent_38%),linear-gradient(135deg,#020617,#0f172a_55%,#020617)]" />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full border border-white/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute bottom-7 left-4 h-4 w-4 rounded-full bg-rose-400 shadow-[0_0_28px_rgba(251,113,133,0.9)]" />
            </motion.div>

            <div className="grid gap-0 md:grid-cols-[0.88fr_1.12fr]">
              <div className="relative hidden min-h-[460px] overflow-hidden border-r border-white/10 p-8 md:flex md:flex-col md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-rose-200 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    {pick("Khusus customer baru", "New customers only")}
                  </div>
                  <p className="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.05em]">FMG<br />UNIVERSE</p>
                  <p className="mt-4 max-w-[15rem] text-sm leading-6 text-slate-300">Beyond Sound. Built-in Intelligence.</p>
                </div>
                <div className="relative h-32">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="absolute bottom-0 h-24 w-24 rounded-full border border-white/20 bg-white/[0.04] backdrop-blur"
                      style={{ left: index * 58, zIndex: 3 - index }}
                      animate={{ y: [0, index % 2 ? -8 : -4, 0] }}
                      transition={{ duration: 3 + index, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-5 pt-12 sm:p-8 sm:pt-12 md:p-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-rose-300 ring-1 ring-rose-400/30">
                  <BadgePercent className="h-3.5 w-3.5" />
                  {pick("Paket project pertama", "First-project package")}
                </div>

                <DialogTitle className="mt-5 text-balance text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  {pick("Wujudkan lagu pertamamu bersama FMG.", "Bring your first FMG project to life.")}
                </DialogTitle>
                <DialogDescription className="mt-3 text-base leading-7 text-slate-300">
                  {pick("Satu paket untuk membawa materi lagumu dari ide hingga file akhir yang siap digunakan.", "One complete package to take your song material from an idea to ready-to-use final files.")}
                </DialogDescription>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{pick("Harga spesial", "Special offer")}</p>
                  <motion.p key={`${currency}-${rates[currency]}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-4xl font-black tracking-tight text-white">
                    {formatIdrAnchoredPrice(NEW_CUSTOMER_PROMO_IDR, currency, rates)}
                  </motion.p>
                  <p className="mt-1 text-xs text-slate-400">{pick("Untuk project pertamamu.", "For your first project.")}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen((current) => !current)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-sm font-semibold text-slate-200 hover:text-white"
                  aria-expanded={detailsOpen}
                >
                  {pick("Apa saja yang termasuk?", "What is included?")}
                  <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }}><ChevronDown className="h-4 w-4" /></motion.span>
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: detailsOpen ? "auto" : 0, opacity: detailsOpen ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-2 pb-2 sm:grid-cols-2">
                    {features.map((feature) => (
                      <div key={feature} className="flex gap-2 rounded-xl bg-white/[0.05] p-3 text-xs leading-5 text-slate-200">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400 text-slate-950"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Link
                    href={ARRANGEMENT_ORDER_PATH}
                    onClick={() => setOpen(false)}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3.5 font-bold text-white shadow-[0_12px_30px_rgba(244,63,94,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(244,63,94,0.42)]"
                  >
                    {pick("Ambil promo ini", "Claim this offer")}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href={language === "id" ? "/id/harga" : "/pricing"}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                  >
                    {pick("Lihat paket", "View packages")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
