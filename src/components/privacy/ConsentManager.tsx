"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const GOOGLE_ANALYTICS_ID = "G-BED00R69W0";

export const CONSENT_VERSION = "2026-08-23";
export const CONSENT_STORAGE_KEY = "fmg_cookie_consent";
export const OPEN_CONSENT_EVENT = "fmg:open-consent";
export const SET_CONSENT_EVENT = "fmg:set-consent";

export type ConsentPreferences = {
  version: string;
  updatedAt: string;
  analytics: boolean;
  embeds: boolean;
};

type ConsentContextValue = {
  preferences: ConsentPreferences | null;
  openPreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue>({ preferences: null, openPreferences: () => undefined });

function readPreferences(): ConsentPreferences | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (value.version !== CONSENT_VERSION || typeof value.analytics !== "boolean" || typeof value.embeds !== "boolean") return null;
    return value as ConsentPreferences;
  } catch {
    return null;
  }
}

function persistPreferences(value: ConsentPreferences): void {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${CONSENT_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(value))}; Path=/; SameSite=Lax; Expires=${expires}; Secure`;
  window.dispatchEvent(new CustomEvent("fmg:consent-changed", { detail: value }));
}

export function useConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}

function GoogleAnalyticsTag() {
  return (
    <>
      <Script
        id="google-analytics-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ANALYTICS_ID}');
        `}
      </Script>
    </>
  );
}

export default function ConsentManager({ children }: { children: React.ReactNode }) {
  const { pick } = useLanguage();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [embeds, setEmbeds] = useState(false);

  const save = useCallback((next: Pick<ConsentPreferences, "analytics" | "embeds">) => {
    const value: ConsentPreferences = {
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
      ...next,
    };
    persistPreferences(value);
    setPreferences(value);
    setAnalytics(value.analytics);
    setEmbeds(value.embeds);
    setOpen(false);
  }, []);

  useEffect(() => {
    const stored = readPreferences();
    setPreferences(stored);
    setAnalytics(stored?.analytics ?? false);
    setEmbeds(stored?.embeds ?? false);
    if (!stored) setOpen(true);
    const show = () => setOpen(true);
    const update = (event: Event) => {
      const detail = (event as CustomEvent<Pick<ConsentPreferences, "analytics" | "embeds">>).detail;
      if (detail && typeof detail.analytics === "boolean" && typeof detail.embeds === "boolean") save(detail);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, show);
    window.addEventListener(SET_CONSENT_EVENT, update);
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, show);
      window.removeEventListener(SET_CONSENT_EVENT, update);
    };
  }, [save]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[data-consent-primary]")?.focus());
  }, [open]);

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && preferences) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const context = useMemo(() => ({ preferences, openPreferences: () => setOpen(true) }), [preferences]);

  return (
    <ConsentContext.Provider value={context}>
      {children}
      {preferences?.analytics ? <><GoogleAnalyticsTag /><Analytics /><SpeedInsights /></> : null}
      {open ? (
        <div data-no-translate ref={dialogRef} onKeyDown={onDialogKeyDown} className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/15 bg-neutral-950/95 p-5 text-white shadow-2xl backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <h2 id="consent-title" className="text-lg font-semibold">{pick("Pilihan privasimu", "Your privacy choices")}</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">{pick("Cookie esensial menjaga akun dan keamanan tetap berfungsi. Analytics dan media pihak ketiga tetap nonaktif sampai kamu mengizinkannya.", "Essential cookies keep accounts and security working. Analytics and third-party embeds stay off until you allow them.")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/15 p-3 text-sm"><span><strong className="block">Analytics</strong><span className="text-white/60">{pick("Data penggunaan anonim dan performa", "Anonymous usage and performance")}</span></span><input aria-label={pick("Izinkan analytics", "Allow analytics")} type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-5 w-5" /></label>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/15 p-3 text-sm"><span><strong className="block">{pick("Media eksternal", "External media")}</strong><span className="text-white/60">{pick("Peta dan media dari platform lain", "Maps and media embeds")}</span></span><input aria-label={pick("Izinkan media eksternal", "Allow external media")} type="checkbox" checked={embeds} onChange={(event) => setEmbeds(event.target.checked)} className="h-5 w-5" /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button data-consent-primary type="button" onClick={() => save({ analytics, embeds })} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950">{pick("Simpan pilihan", "Save choices")}</button>
            <button type="button" onClick={() => save({ analytics: true, embeds: true })} className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold">{pick("Izinkan semua", "Accept all")}</button>
            <button type="button" onClick={() => save({ analytics: false, embeds: false })} className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold">{pick("Tolak yang tidak esensial", "Reject non-essential")}</button>
            {preferences ? <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-xl px-3 py-2 text-sm text-white/65">{pick("Tutup", "Close")}</button> : null}
          </div>
        </div>
      ) : null}
    </ConsentContext.Provider>
  );
}
