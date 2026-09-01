"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  Check,
  CalendarDays,
  Coins,
  CreditCard,
  Download,
  Gauge,
  Headphones,
  Layers3,
  Music2,
  Repeat2,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { LoginSection } from "@/app/ui/main_container/login";
import { useLanguage } from "@/contexts/LanguageContext";
import { TUNEXPERT_CREDIT_PACKAGES, TUNEXPERT_SUBSCRIPTION_PLANS, tuneXpertCreditsForSeconds } from "@/lib/tunexpert/billing";

type ToolMode = "music" | "isolate";
type AudioResult = { url: string; filename: string };
type TuneXpertSubscription = {
  id: string;
  plan_code: string;
  monthly_credits: number;
  amount_idr: number;
  status: "pending" | "activating" | "activation_failed" | "active" | "past_due" | "cancelled";
  payment_type?: string | null;
  masked_payment_method?: string | null;
  current_period_end?: string | null;
  next_billing_at?: string | null;
};
type WalletResponse = { balance?: number; subscription?: TuneXpertSubscription | null; error?: string };

const waveform = [34, 58, 43, 76, 48, 92, 64, 39, 83, 56, 96, 68, 44, 87, 52, 73, 41, 90, 61, 47, 79, 55, 88, 37];
const durations = [10, 20, 30, 45, 60] as const;

const promptIdeas = [
  { id: "mood", idText: "hangat, emosional, cinematic", enText: "warm, emotional, cinematic" },
  { id: "tempo", idText: "tempo 118 BPM", enText: "118 BPM tempo" },
  { id: "instrument", idText: "piano lembut, strings lebar, bass hangat", enText: "soft piano, wide strings, warm bass" },
  { id: "structure", idText: "intro minimal lalu berkembang perlahan", enText: "minimal intro with a gradual build" },
  { id: "energy", idText: "chorus terasa besar tapi tetap elegan", enText: "a big but elegant chorus" },
];

function responseFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition") || "";
  return disposition.match(/filename="([^"]+)"/i)?.[1] || fallback;
}

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TuneXpertClient({ isAuthenticated, initialBalance, initialSubscription, paymentsLive }: { isAuthenticated: boolean; initialBalance: number; initialSubscription: TuneXpertSubscription | null; paymentsLive: boolean }) {
  const { pick } = useLanguage();
  const rootRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<ToolMode>("music");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(20);
  const [instrumental, setInstrumental] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingMode, setBillingMode] = useState<"subscription" | "topup">("subscription");
  const [subscription, setSubscription] = useState<TuneXpertSubscription | null>(initialSubscription);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [loginOpen, setLoginOpen] = useState(false);

  const musicCost = tuneXpertCreditsForSeconds(duration);
  const isolationCost = fileDuration ? tuneXpertCreditsForSeconds(fileDuration) : null;

  const scrollToCredits = () => document.getElementById("tunexpert-credits")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const rememberGuestDraft = () => {
    try {
      window.sessionStorage.setItem("tunexpert-guest-draft", JSON.stringify({ mode, prompt, title, duration, instrumental }));
    } catch { /* Browser storage can be unavailable in privacy mode. */ }
  };

  const openLogin = () => {
    rememberGuestDraft();
    setError(null);
    setAuthRequired(false);
    setLoginOpen(true);
  };

  const refreshWallet = async () => {
    const response = await fetch("/api/tunexpert/wallet", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json() as WalletResponse;
    if (typeof body.balance === "number") setBalance(body.balance);
    if ("subscription" in body) setSubscription(body.subscription ?? null);
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("payment") !== "finish" && query.get("subscription") !== "finish") return;
    void refreshWallet();
    const timer = window.setInterval(() => void refreshWallet(), 3_000);
    const stop = window.setTimeout(() => window.clearInterval(timer), 18_000);
    return () => { window.clearInterval(timer); window.clearTimeout(stop); };
  }, []);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("tunexpert-guest-draft");
      if (!raw) return;
      const draft = JSON.parse(raw) as { mode?: ToolMode; prompt?: string; title?: string; duration?: number; instrumental?: boolean };
      if (draft.mode === "music" || draft.mode === "isolate") setMode(draft.mode);
      if (typeof draft.prompt === "string") setPrompt(draft.prompt);
      if (typeof draft.title === "string") setTitle(draft.title);
      if (typeof draft.duration === "number" && durations.includes(draft.duration as (typeof durations)[number])) setDuration(draft.duration);
      if (typeof draft.instrumental === "boolean") setInstrumental(draft.instrumental);
      if (isAuthenticated) window.sessionStorage.removeItem("tunexpert-guest-draft");
    } catch { /* Ignore malformed or unavailable session storage. */ }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loginOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoginOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [loginOpen]);

  useEffect(() => {
    if (!file) {
      setSourcePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const replaceResult = (next: AudioResult | null) => {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return next;
    });
  };

  const selectMode = (next: ToolMode) => {
    if (busy) return;
    setMode(next);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
  };

  const appendPromptIdea = (text: string) => {
    setPrompt((current) => {
      if (!current.trim()) return text;
      if (current.trimEnd().endsWith(",")) return `${current.trimEnd()} ${text}`;
      return `${current.trimEnd()}, ${text}`;
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || !rootRef.current) return;
    rootRef.current.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    rootRef.current.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  };

  const generateMusic = async () => {
    if (prompt.trim().length < 20 || busy) return;
    if (!authenticated) {
      openLogin();
      return;
    }
    if (balance < musicCost) {
      setError(pick("Kreditmu belum cukup untuk proses ini. Pilih paket yang sesuai lalu coba lagi.", "You need a few more credits for this process. Choose a package, then try again."));
      scrollToCredits();
      return;
    }
    setBusy(true);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
    try {
      const response = await fetch("/api/tunexpert/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, title, durationSeconds: duration, instrumental }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          setAuthRequired(true);
          setLoginOpen(true);
        }
        if (response.status === 402) { void refreshWallet(); scrollToCredits(); }
        throw new Error(await responseError(response, pick("Track belum berhasil dibuat. Coba sesuaikan arahanmu atau ulangi beberapa saat lagi.", "Your track could not be created yet. Try refining the direction or run it again.")));
      }
      const nextBalance = Number(response.headers.get("x-tunexpert-balance"));
      if (Number.isFinite(nextBalance)) setBalance(nextBalance);
      const blob = await response.blob();
      replaceResult({
        url: URL.createObjectURL(blob),
        filename: responseFilename(response, `${title.trim() || "tunexpert-track"}.mp3`),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : pick("Ada kendala saat memproses track. Silakan coba lagi.", "Something interrupted the track process. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const isolateAudio = async () => {
    if (!file || busy) return;
    if (file.size > 4 * 1024 * 1024) {
      setError(pick("File ini lebih besar dari 4 MB. Pilih versi yang lebih kecil untuk melanjutkan.", "This file is larger than 4 MB. Choose a smaller version to continue."));
      return;
    }
    if (!authenticated) {
      openLogin();
      return;
    }
    if (isolationCost !== null && balance < isolationCost) {
      setError(pick("Kreditmu belum cukup untuk memproses seluruh durasi audio ini.", "You need more credits to process the full duration of this audio."));
      scrollToCredits();
      return;
    }
    setBusy(true);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
    try {
      const form = new FormData();
      form.append("audio", file);
      const response = await fetch("/api/tunexpert/isolate", { method: "POST", body: form });
      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          setAuthRequired(true);
          setLoginOpen(true);
        }
        if (response.status === 402) { void refreshWallet(); scrollToCredits(); }
        throw new Error(await responseError(response, pick("Suara belum berhasil dipisahkan dengan baik. Coba file lain atau ulangi prosesnya.", "The voice could not be isolated cleanly yet. Try another file or run the process again.")));
      }
      const nextBalance = Number(response.headers.get("x-tunexpert-balance"));
      if (Number.isFinite(nextBalance)) setBalance(nextBalance);
      const blob = await response.blob();
      replaceResult({
        url: URL.createObjectURL(blob),
        filename: responseFilename(response, "tunexpert-isolated.mp3"),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : pick("Ada kendala saat memproses audio. Silakan coba lagi.", "Something interrupted the audio process. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const chooseFile = (next: File | null) => {
    if (!next) return;
    setFile(next);
    setFileDuration(null);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
    const preview = URL.createObjectURL(next);
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) setFileDuration(Math.ceil(probe.duration));
      URL.revokeObjectURL(preview);
    };
    probe.onerror = () => URL.revokeObjectURL(preview);
    probe.src = preview;
  };

  const startCheckout = async (packageCode: string) => {
    if (!authenticated) {
      openLogin();
      return;
    }
    if (checkoutLoading || !paymentsLive) return;
    setCheckoutLoading(packageCode);
    setBillingError(null);
    try {
      const response = await fetch("/api/tunexpert/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageCode }),
      });
      const body = await response.json() as { redirectUrl?: string; error?: string };
      if (!response.ok || !body.redirectUrl) throw new Error(body.error || pick("Pembayaran belum dapat dibuka. Silakan coba lagi.", "Checkout could not be opened. Please try again."));
      window.location.assign(body.redirectUrl);
    } catch (cause) {
      setBillingError(cause instanceof Error ? cause.message : pick("Pembayaran belum dapat dibuka. Silakan coba lagi.", "Checkout could not be opened. Please try again."));
      setCheckoutLoading(null);
    }
  };

  const startSubscriptionCheckout = async (planCode: string) => {
    if (!authenticated) {
      openLogin();
      return;
    }
    if (checkoutLoading || !paymentsLive) return;
    const loadingKey = `subscription:${planCode}`;
    setCheckoutLoading(loadingKey);
    setBillingError(null);
    try {
      const response = await fetch("/api/tunexpert/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const body = await response.json() as { redirectUrl?: string; error?: string };
      if (!response.ok || !body.redirectUrl) throw new Error(body.error || pick("Subscription belum dapat dibuka.", "Subscription checkout could not be opened."));
      window.location.assign(body.redirectUrl);
    } catch (checkoutError) {
      setBillingError(checkoutError instanceof Error ? checkoutError.message : pick("Terjadi masalah saat membuka pembayaran.", "There was a problem opening checkout."));
      setCheckoutLoading(null);
    }
  };

  const cancelSubscription = async () => {
    if (cancelBusy) return;
    setCancelBusy(true);
    setBillingError(null);
    try {
      const response = await fetch("/api/tunexpert/subscriptions/cancel", { method: "POST" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || pick("Subscription belum dapat dihentikan.", "Subscription could not be cancelled."));
      setSubscription(null);
      await refreshWallet();
    } catch (cancelError) {
      setBillingError(cancelError instanceof Error ? cancelError.message : pick("Terjadi masalah saat menghentikan subscription.", "There was a problem cancelling the subscription."));
    } finally {
      setCancelBusy(false);
    }
  };

  const handleAuthenticated = async () => {
    setAuthenticated(true);
    setLoginOpen(false);
    setAuthRequired(false);
    setError(null);
    try { window.sessionStorage.removeItem("tunexpert-guest-draft"); } catch { }
    await refreshWallet();
  };

  return (
    <main
      ref={rootRef}
      onPointerMove={handlePointerMove}
      className="relative min-h-screen overflow-hidden bg-[#090817] text-white [--pointer-x:50%] [--pointer-y:30%]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--pointer-x)_var(--pointer-y),rgba(255,116,177,0.17),transparent_28%),linear-gradient(145deg,#080714_0%,#11102a_42%,#080812_100%)]" />
        <motion.div className="absolute -left-32 top-24 h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/20 blur-[110px]" animate={{ x: [0, 80, 10], y: [0, 40, 0], scale: [1, 1.16, 1] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -right-28 top-[30rem] h-[30rem] w-[30rem] rounded-full bg-orange-500/15 blur-[120px]" animate={{ x: [0, -55, 0], y: [0, -65, 0], scale: [1.1, 0.9, 1.1] }} transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <section className="relative mx-auto max-w-[1500px] px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1.12fr_.88fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-center gap-3">
              <span data-no-translate className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-white/80 backdrop-blur-xl">FMG LABS / tuneXpert</span>
              <span className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />{pick("Siap bikin sesuatu", "Ready when you are")}</span>
              <button type="button" onClick={scrollToCredits} className="flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-200/20"><Coins className="h-4 w-4" />{balance} {pick("kredit", "credits")}</button>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-5xl text-[clamp(3.8rem,9vw,9rem)] font-black uppercase leading-[0.78] tracking-[-0.07em]">
              <span className="block">Shape</span>
              <span className="block bg-gradient-to-r from-[#ff78b8] via-[#f6a3ff] to-[#ffb05c] bg-clip-text text-transparent">the sound.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 max-w-2xl text-lg leading-8 text-white/64 sm:text-xl">
              {pick("Punya bayangan musik di kepala? Tulis rasanya, instrumennya, energinya, lalu biarkan tuneXpert membantumu membentuk versi pertama yang bisa langsung kamu dengar. Atau, unggah rekaman dan tarik suara utamanya lebih ke depan.", "Have a sound in your head? Describe the mood, instruments, and energy, then let tuneXpert shape a first version you can actually hear. Or upload a recording and bring the main voice forward.")}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-8 flex flex-wrap gap-3 text-sm text-white/55">
              <span className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2">{pick("Text → music", "Text → music")}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2">{pick("Voice cleanup", "Voice cleanup")}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2">{pick("Preview langsung", "Instant preview")}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2">{pick("Unduh MP3", "MP3 download")}</span>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#111026]/70 p-5 shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
            <div className="flex h-56 items-center justify-center gap-1.5 overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-fuchsia-400/20 via-purple-500/5 to-orange-400/15 px-5">
              {waveform.map((height, index) => (
                <motion.span key={index} className="w-1.5 rounded-full bg-gradient-to-t from-orange-300 via-pink-300 to-white sm:w-2" style={{ height: `${height}%` }} animate={{ scaleY: [0.35, 1, 0.48] }} transition={{ duration: 0.9 + (index % 5) * 0.15, repeat: Infinity, ease: "easeInOut", delay: index * 0.035 }} />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-300">CREATIVE AUDIO WORKSPACE</p><p className="mt-1 text-sm text-white/55">Music Generator · Voice Isolator</p></div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#111026]"><Headphones className="h-5 w-5" /></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[pick("Tulis ide", "Describe"), pick("Proses", "Create"), pick("Dengarkan", "Listen")].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/15 p-3 text-center">
                  <span className="block text-[10px] font-black tracking-[0.2em] text-white/30">0{index + 1}</span>
                  <span className="mt-1 block text-xs font-bold text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-4 border-y border-white/10 py-6 sm:grid-cols-3">
          {[
            [WandSparkles, pick("Mulai dari ide sesederhana satu kalimat", "Start with an idea as simple as one sentence")],
            [Gauge, pick("Atur durasi dan arah hasil sebelum diproses", "Set the duration and direction before processing")],
            [Headphones, pick("Dengarkan hasilnya langsung tanpa pindah aplikasi", "Preview the result without leaving the page")],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof WandSparkles;
            return <div key={String(label)} className="flex items-center gap-3 rounded-2xl px-2 py-2 text-sm font-medium leading-6 text-white/62"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-pink-300/20 bg-pink-300/10"><FeatureIcon className="h-4 w-4 text-pink-200" /></span>{String(label)}</div>;
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-[1500px] px-5 pb-28 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-300">CHOOSE YOUR ENGINE</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{pick("Mulai dari yang kamu butuhkan.", "Start with what you need.")}</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/50">{pick("Bikin ide musik dari nol, atau rapikan rekaman yang sudah kamu punya. Dua alat, satu alur kerja yang tetap sederhana.", "Create music from scratch, or clean up a recording you already have. Two tools, one simple workflow.")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[.34fr_.66fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={() => selectMode("music")} aria-pressed={mode === "music"} className={`group relative min-h-56 overflow-hidden rounded-[1.75rem] border p-6 text-left transition duration-300 ${mode === "music" ? "border-pink-300/70 bg-gradient-to-br from-pink-400/25 to-purple-700/20 shadow-[0_22px_70px_rgba(236,72,153,.18)]" : "border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.07]"}`}>
              <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#151127]"><WandSparkles className="h-5 w-5" /></span><span className="text-xs font-bold tracking-[0.2em] text-white/40">01</span></div>
              <h3 className="mt-10 text-2xl font-black">{pick("Buat musik", "Generate music")}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{pick("Cocok untuk demo, ide aransemen, konten, scoring pendek, atau eksplorasi suasana baru.", "Great for demos, arrangement ideas, content, short scoring, or exploring a new mood.")}</p>
            </button>

            <button type="button" onClick={() => selectMode("isolate")} aria-pressed={mode === "isolate"} className={`group relative min-h-56 overflow-hidden rounded-[1.75rem] border p-6 text-left transition duration-300 ${mode === "isolate" ? "border-orange-300/70 bg-gradient-to-br from-orange-400/25 to-fuchsia-700/20 shadow-[0_22px_70px_rgba(251,146,60,.16)]" : "border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.07]"}`}>
              <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#151127]"><AudioLines className="h-5 w-5" /></span><span className="text-xs font-bold tracking-[0.2em] text-white/40">02</span></div>
              <h3 className="mt-10 text-2xl font-black">{pick("Perjelas suara", "Bring out the voice")}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{pick("Cocok untuk voice note, dialog, wawancara, atau rekaman dengan ambience dan musik latar.", "Great for voice notes, dialogue, interviews, or recordings with ambience and background music.")}</p>
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.055] p-5 shadow-[0_35px_100px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-400/10 blur-3xl" />
            <AnimatePresence mode="wait">
              {mode === "music" ? (
                <motion.div key="music" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  <div className="flex items-center gap-3"><Music2 className="h-5 w-5 text-pink-300" /><span className="text-xs font-black uppercase tracking-[0.26em] text-white/55">MUSIC GENERATOR</span></div>
                  <h3 className="mt-5 text-3xl font-black tracking-[-0.03em] sm:text-5xl">{pick("Ceritakan musik yang kamu bayangkan.", "Describe the music in your head.")}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{pick("Tidak perlu pakai istilah teknis. Tulis saja suasana, tempo, instrumen, bentuk lagu, atau momen yang ingin terasa. Semakin jelas arahnya, semakin mudah hasilnya mendekati bayanganmu.", "You do not need technical language. Describe the mood, tempo, instruments, structure, or the moment you want it to feel like. Clearer direction usually gives the engine more to work with.")}</p>

                  <div className="mt-7 rounded-[1.5rem] border border-pink-300/15 bg-pink-300/[0.055] p-4 sm:p-5">
                    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-pink-200" /><strong className="text-sm">{pick("Butuh titik awal?", "Need a starting point?")}</strong></div>
                    <p className="mt-1 text-xs leading-5 text-white/42">{pick("Klik beberapa ide di bawah untuk menyusun prompt, lalu ubah dengan bahasamu sendiri.", "Tap a few ideas below to build a prompt, then rewrite it in your own words.")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {promptIdeas.map((idea) => {
                        const label = pick(idea.idText, idea.enText);
                        return <button key={idea.id} type="button" onClick={() => appendPromptIdea(label)} className="rounded-full border border-white/10 bg-black/15 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-pink-300/35 hover:bg-pink-300/10 hover:text-white">+ {label}</button>;
                      })}
                    </div>
                  </div>

                  <div className="mt-7 grid gap-5">
                    <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{pick("Judul file", "File title")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder={pick("Contoh: Midnight Bloom", "Example: Midnight Bloom")} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-pink-300/60 focus:ring-4 focus:ring-pink-300/10" /></label>

                    <label className="grid gap-2">
                      <span className="flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/60"><span>{pick("Arahan kreatif", "Creative direction")}</span><span className="font-medium tracking-normal text-white/30">{prompt.length}/4100</span></span>
                      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4_100} rows={7} placeholder={pick("Contoh: pop elektronik yang hangat dan sedikit nostalgic, 118 BPM, piano lembut di intro, bass bulat, synth lebar, build perlahan menuju chorus yang emosional, instrumental...", "Example: warm, slightly nostalgic electronic pop, 118 BPM, soft piano intro, rounded bass, wide synths, a gradual build into an emotional chorus, instrumental...")} className="resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-pink-300/60 focus:ring-4 focus:ring-pink-300/10" />
                    </label>

                    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                      <div><span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{pick("Durasi", "Duration")}</span><div className="mt-2 flex flex-wrap gap-2">{durations.map((value) => <button type="button" key={value} onClick={() => setDuration(value)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${duration === value ? "bg-white text-[#151127]" : "border border-white/10 bg-white/5 text-white/55 hover:bg-white/10"}`}>{value}s</button>)}</div></div>
                      <label className="flex min-w-48 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span><strong className="block text-sm">{pick("Instrumental", "Instrumental")}</strong><span className="text-xs text-white/40">{instrumental ? pick("Tanpa vokal", "No vocals") : pick("Vokal diperbolehkan", "Vocals allowed")}</span></span><input type="checkbox" checked={instrumental} onChange={(event) => setInstrumental(event.target.checked)} className="h-5 w-5 accent-pink-400" /></label>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-xs text-white/45"><span>{pick("Perkiraan kredit", "Estimated credits")}</span><strong className="text-white">{musicCost} {pick("kredit", "credits")}</strong></div>

                    <button type="button" onClick={() => void generateMusic()} disabled={busy || prompt.trim().length < 20} className="group mt-1 flex min-h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#ff5fa2] via-[#ff7885] to-[#ff9d49] px-6 font-black text-white shadow-[0_16px_45px_rgba(255,95,162,.28)] transition hover:scale-[1.01] hover:shadow-[0_18px_55px_rgba(255,95,162,.4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">{busy ? <><Sparkles className="h-5 w-5 animate-spin" />{pick("Sedang merangkai trackmu...", "Shaping your track...")}</> : !authenticated ? <>{pick("Masuk untuk membuat", "Sign in to create")}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></> : balance < musicCost ? <>{pick("Tambah kredit", "Add credits")}<Coins className="h-5 w-5" /></> : <>{pick("Buat track", "Create track")}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>}</button>

                    <p className="text-xs leading-5 text-white/32">{pick("Tips: gunakan deskripsi gaya, suasana, instrumen, tempo, dan struktur. Hindari menyalin lirik berhak cipta atau meminta tiruan langsung dari artis tertentu.", "Tip: describe style, mood, instruments, tempo, and structure. Avoid copying copyrighted lyrics or asking for a direct imitation of a specific artist.")}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="isolate" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  <div className="flex items-center gap-3"><Layers3 className="h-5 w-5 text-orange-300" /><span className="text-xs font-black uppercase tracking-[0.26em] text-white/55">VOICE ISOLATOR</span></div>
                  <h3 className="mt-5 text-3xl font-black tracking-[-0.03em] sm:text-5xl">{pick("Bikin suaranya lebih mudah didengar.", "Make the voice easier to hear.")}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{pick("Unggah rekaman yang punya noise, ambience, atau musik latar. tuneXpert akan mencoba memusatkan perhatian pada suara utama. Fitur ini ditujukan untuk voice atau speech, bukan pemisahan stem multitrack.", "Upload a recording with noise, ambience, or background music. tuneXpert will try to bring the main voice forward. This tool is designed for voice or speech, not full multitrack stem separation.")}</p>

                  <div className="mt-7 grid grid-cols-3 gap-2">
                    {[pick("Voice note", "Voice note"), pick("Dialog", "Dialogue"), pick("Wawancara", "Interview")].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-center text-xs font-bold text-white/55">{item}</div>)}
                  </div>

                  <input ref={fileInputRef} type="file" accept="audio/*,.aac,.aiff,.flac,.m4a,.mp3,.mp4,.ogg,.opus,.wav,.webm" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0] ?? null); }} className={`mt-7 grid min-h-72 w-full place-items-center rounded-[1.75rem] border border-dashed px-6 text-center transition ${dragging ? "border-orange-300 bg-orange-300/15 scale-[1.01]" : "border-white/20 bg-black/15 hover:border-orange-300/50 hover:bg-white/[0.045]"}`}>
                    <span><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#151127]"><UploadCloud className="h-7 w-7" /></span><strong className="mt-5 block text-xl">{file ? file.name : pick("Tarik audio ke sini", "Drop your audio here")}</strong><span className="mt-2 block text-sm text-white/45">{file ? `${formatBytes(file.size)} · ${file.type || "audio"}` : pick("atau klik untuk memilih file · maksimal 4 MB", "or click to choose a file · maximum 4 MB")}</span></span>
                  </button>

                  {file && <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3"><div className="min-w-0 flex-1">{sourcePreview && <audio controls src={sourcePreview} className="h-10 w-full" />}</div><button type="button" aria-label={pick("Hapus file", "Remove file")} onClick={() => { setFile(null); setFileDuration(null); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 hover:bg-white/10"><X className="h-4 w-4" /></button></div>}

                  {file && <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-xs text-white/45"><span>{pick("Kredit mengikuti durasi audio", "Credits follow audio duration")}</span><strong className="text-white">{isolationCost ? `${isolationCost} ${pick("kredit", "credits")}` : pick("Membaca durasi...", "Reading duration...")}</strong></div>}

                  <button type="button" onClick={() => void isolateAudio()} disabled={busy || !file} className="group mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#ff7a45] via-[#ff5f91] to-[#c76dff] px-6 font-black shadow-[0_16px_45px_rgba(255,122,69,.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">{busy ? <><AudioLines className="h-5 w-5 animate-pulse" />{pick("Sedang memusatkan suara...", "Bringing the voice forward...")}</> : !authenticated ? <>{pick("Masuk untuk memproses", "Sign in to process")}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></> : isolationCost && balance < isolationCost ? <>{pick("Tambah kredit", "Add credits")}<Coins className="h-5 w-5" /></> : <>{pick("Proses audio", "Process audio")}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>}</button>

                  <p className="mt-4 text-xs leading-5 text-white/32">{pick("Untuk hasil yang lebih konsisten, gunakan file dengan suara utama yang cukup terdengar dan hindari rekaman yang sudah sangat terdistorsi.", "For more consistent results, use audio where the main voice is still reasonably audible and avoid heavily distorted recordings.")}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(error || result) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`mt-6 rounded-[1.5rem] border p-5 ${error ? "border-red-300/25 bg-red-400/10" : "border-emerald-300/25 bg-emerald-300/10"}`}>
                  {error ? <div><p className="font-bold text-red-100">{error}</p>{authRequired && <button type="button" onClick={openLogin} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#151127]">{pick("Masuk lalu lanjutkan", "Sign in and continue")}<ArrowRight className="h-4 w-4" /></button>}</div> : result ? <div><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-300 text-emerald-950"><Check className="h-5 w-5" /></span><div><strong className="block">{pick("Sudah jadi. Coba dengarkan.", "It is ready. Give it a listen.")}</strong><span className="text-xs text-white/45">{pick("Kalau sudah pas, simpan hasilnya ke perangkatmu.", "If it feels right, save the result to your device.")}</span></div></div><audio controls autoPlay src={result.url} className="w-full" /><a href={result.url} download={result.filename} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#151127] transition hover:scale-[1.01]"><Download className="h-4 w-4" />{pick("Unduh hasil", "Download result")}</a></div> : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-black/10 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-300">A SIMPLE FLOW</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{pick("Lebih sedikit teknis. Lebih cepat dengar hasil.", "Less setup. Faster first listen.")}</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/50">{pick("tuneXpert dibuat untuk fase eksplorasi: saat kamu butuh mendengar ide lebih cepat, mencoba arah baru, atau membersihkan bahan rekaman sebelum lanjut ke proses produksi berikutnya.", "tuneXpert is built for exploration: when you want to hear an idea sooner, test a new direction, or clean up source audio before moving into the next production stage.")}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { n: "01", title: pick("Mulai dari bahan yang kamu punya", "Start with what you have"), text: pick("Tulis arahan musik atau unggah rekaman. Tidak perlu menyiapkan project rumit.", "Describe the music or upload a recording. No complicated project setup needed."), icon: WandSparkles },
              { n: "02", title: pick("Atur seperlunya", "Set what matters"), text: pick("Pilih durasi, mode instrumental, atau cek kebutuhan kredit sebelum menjalankan proses.", "Choose duration, instrumental mode, or check the credit estimate before processing."), icon: Gauge },
              { n: "03", title: pick("Dengar, nilai, simpan", "Listen, judge, save"), text: pick("Preview langsung di halaman. Kalau cocok, unduh dan lanjutkan ke workflow musikmu.", "Preview it on the page. If it works, download it and continue in your music workflow."), icon: Headphones },
            ].map((item) => {
              const ItemIcon = item.icon;
              return <article key={item.n} className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 sm:p-7"><div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-pink-400/10 blur-3xl transition group-hover:bg-pink-400/20" /><div className="flex items-center justify-between"><span className="text-xs font-black tracking-[0.24em] text-white/30">{item.n}</span><span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5"><ItemIcon className="h-4 w-4 text-pink-200" /></span></div><h3 className="mt-12 text-xl font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-white/48">{item.text}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section id="tunexpert-credits" className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-amber-200"><Coins className="h-4 w-4" />{pick("KREDIT TUNEXPERT", "TUNEXPERT CREDITS")}</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-7xl">{pick("Pakai kredit sesuai durasi yang kamu proses.", "Use credits based on what you process.")}</h2>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-5 backdrop-blur-xl">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{authenticated ? pick("Saldo saat ini", "Current balance") : pick("Mode tamu", "Guest mode")}</span>
              <div className="mt-2 flex items-end justify-between gap-4"><strong className="text-4xl font-black text-white">{authenticated ? balance : pick("Tamu", "Guest")}</strong><span className="pb-1 text-sm text-white/50">{authenticated ? pick("kredit tersedia", "credits available") : pick("masuk saat siap membuat", "sign in when ready to create")}</span></div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <p className="max-w-3xl text-sm leading-7 text-white/55">{pick("Satu kredit memproses hingga 10 detik audio. Sebelum kamu menjalankan proses, estimasi kebutuhan kredit selalu ditampilkan agar tidak ada kejutan di akhir.", "One credit processes up to 10 seconds of audio. Before you run anything, the estimated credit use is shown so you know what to expect.")}</p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {[10, 20, 30, 60].map((seconds) => <span key={seconds} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-white/55">{seconds}s = {tuneXpertCreditsForSeconds(seconds)} {pick("kredit", "credits")}</span>)}
            </div>
          </div>

          <div className="mt-10 flex w-fit rounded-full border border-white/12 bg-black/25 p-1">
            <button type="button" onClick={() => setBillingMode("subscription")} className={`rounded-full px-5 py-3 text-sm font-black transition ${billingMode === "subscription" ? "bg-white text-[#151127]" : "text-white/55 hover:text-white"}`}>
              {pick("Langganan bulanan", "Monthly subscription")}
            </button>
            <button type="button" onClick={() => setBillingMode("topup")} className={`rounded-full px-5 py-3 text-sm font-black transition ${billingMode === "topup" ? "bg-white text-[#151127]" : "text-white/55 hover:text-white"}`}>
              {pick("Beli sekali", "One-time top-up")}
            </button>
          </div>

          {!paymentsLive && <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">{pick("Daftar harga sudah tersedia. Checkout Midtrans akan aktif setelah kredensial production merchant dipasang.", "Pricing is ready. Midtrans checkout will activate once the production merchant credentials are installed.")}</div>}

          {billingMode === "subscription" && subscription && subscription.status !== "activation_failed" ? (
            <div className="mt-8 overflow-hidden rounded-[2rem] border border-emerald-300/25 bg-gradient-to-br from-emerald-400/15 via-white/[0.055] to-cyan-400/10 p-6 sm:p-8">
              <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-950">{subscription.status}</span><span data-no-translate className="text-sm font-black uppercase tracking-[0.2em] text-white/55">{subscription.plan_code}</span></div>
                  <h3 className="mt-4 text-3xl font-black sm:text-5xl">{subscription.monthly_credits} {pick("kredit setiap bulan", "credits every month")}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{subscription.next_billing_at ? pick(`Perpanjangan berikutnya ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(subscription.next_billing_at))}.`, `Next renewal ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(subscription.next_billing_at))}.`) : pick("Aktivasi pembayaran otomatis sedang diproses.", "Automatic billing activation is being processed.")}</p>
                  {subscription.masked_payment_method && <p className="mt-1 text-xs text-white/35">Midtrans · {subscription.masked_payment_method}</p>}
                </div>
                <button type="button" onClick={() => void cancelSubscription()} disabled={cancelBusy || subscription.status === "pending" || subscription.status === "activating"} className="rounded-full border border-white/16 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-40">{cancelBusy ? pick("Menghentikan...", "Cancelling...") : pick("Hentikan perpanjangan", "Cancel renewal")}</button>
              </div>
            </div>
          ) : billingMode === "subscription" ? (
            <>
              {subscription?.status === "activation_failed" && <div className="mt-6 rounded-2xl border border-red-300/25 bg-red-400/10 px-5 py-4 text-sm text-red-100">{pick("Pembayaran awal masuk dan kredit tetap diberikan, tetapi perpanjangan otomatis belum aktif. Kamu dapat memilih paket lagi atau menghubungi admin.", "The initial payment was credited, but automatic renewal is not active. You can choose a plan again or contact support.")}</div>}
              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {TUNEXPERT_SUBSCRIPTION_PLANS.map((item) => {
                  const loadingKey = `subscription:${item.code}`;
                  return (
                    <article key={item.code} className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${item.featured ? "border-pink-300/50 bg-gradient-to-br from-pink-400/20 via-purple-500/10 to-orange-400/10 shadow-[0_24px_80px_rgba(236,72,153,.16)]" : "border-white/12 bg-white/[0.045]"}`}>
                      {item.featured && <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#151127]">{pick("Paling populer", "Most popular")}</span>}
                      <p data-no-translate className="text-xs font-black uppercase tracking-[0.24em] text-white/45">{item.name}</p>
                      <div className="mt-8 flex items-end gap-2"><strong className="text-6xl font-black tracking-[-0.06em]">{item.credits}</strong><span className="pb-2 text-sm text-white/45">{pick("kredit/bulan", "credits/month")}</span></div>
                      <p className="mt-4 text-2xl font-black">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.amountIdr)}<span className="text-sm font-semibold text-white/40">/{pick("bulan", "month")}</span></p>
                      <p className="mt-2 text-sm text-white/45">{pick(`Hingga sekitar ${Math.floor(item.credits / 6)} menit audio setiap bulan. Kredit yang tersisa tidak hangus.`, `Up to roughly ${Math.floor(item.credits / 6)} audio minutes each month. Unused credits do not expire.`)}</p>
                      <button type="button" onClick={() => void startSubscriptionCheckout(item.code)} disabled={Boolean(checkoutLoading) || !paymentsLive} className={`mt-8 flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${item.featured ? "bg-white text-[#151127] hover:scale-[1.01]" : "border border-white/16 bg-white/8 text-white hover:bg-white/14"}`}><Repeat2 className="h-4 w-4" />{checkoutLoading === loadingKey ? pick("Membuka Midtrans...", "Opening Midtrans...") : pick("Berlangganan", "Subscribe")}</button>
                    </article>
                  );
                })}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/38"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />{pick("Perpanjangan otomatis diproses oleh Midtrans. Untuk subscription, metode yang didukung adalah kartu dan GoPay sesuai aktivasi akun merchant.", "Automatic renewals are processed by Midtrans. Subscription supports cards and GoPay, subject to merchant activation.")}</p>
            </>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {TUNEXPERT_CREDIT_PACKAGES.map((item) => (
                <article key={item.code} className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${item.featured ? "border-pink-300/50 bg-gradient-to-br from-pink-400/20 via-purple-500/10 to-orange-400/10 shadow-[0_24px_80px_rgba(236,72,153,.16)]" : "border-white/12 bg-white/[0.045]"}`}>
                  {item.featured && <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#151127]">{pick("Paling fleksibel", "Most flexible")}</span>}
                  <p data-no-translate className="text-xs font-black uppercase tracking-[0.24em] text-white/45">{item.name}</p>
                  <div className="mt-8 flex items-end gap-2"><strong className="text-6xl font-black tracking-[-0.06em]">{item.credits}</strong><span className="pb-2 text-sm text-white/45">{pick("kredit", "credits")}</span></div>
                  <p className="mt-4 text-2xl font-black">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.amountIdr)}</p>
                  <p className="mt-2 text-sm text-white/45">{pick(`Sekali bayar untuk sekitar ${Math.floor(item.credits / 6)} menit audio. Kredit tidak hangus.`, `One payment for roughly ${Math.floor(item.credits / 6)} audio minutes. Credits do not expire.`)}</p>
                  <button type="button" onClick={() => void startCheckout(item.code)} disabled={Boolean(checkoutLoading) || !paymentsLive} className={`mt-8 flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${item.featured ? "bg-white text-[#151127] hover:scale-[1.01]" : "border border-white/16 bg-white/8 text-white hover:bg-white/14"}`}><CreditCard className="h-4 w-4" />{checkoutLoading === item.code ? pick("Membuka Midtrans...", "Opening Midtrans...") : pick("Beli kredit", "Buy credits")}</button>
                </article>
              ))}
            </div>
          )}

          {billingError && <p role="alert" className="mt-5 rounded-2xl border border-red-300/25 bg-red-400/10 px-5 py-4 text-sm font-semibold text-red-100">{billingError}</p>}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              [pick("Estimasi terlihat sebelum proses", "See the estimate before processing"), pick("Kamu bisa cek kebutuhan kredit terlebih dahulu sebelum menjalankan engine.", "You can check the credit estimate before running the engine.")],
              [pick("Saldo diperbarui otomatis", "Balance updates automatically"), pick("Setelah proses atau pembayaran berhasil, saldo akun akan ikut diperbarui.", "After a successful process or payment, your account balance updates accordingly.")],
              [pick("Satu saldo untuk dua alat", "One balance for both tools"), pick("Kredit yang sama dapat digunakan untuk Music Generator maupun Voice Isolator.", "The same credits can be used for both Music Generator and Voice Isolator.")],
            ].map(([titleText, bodyText]) => <div key={titleText} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"><strong className="text-sm">{titleText}</strong><p className="mt-2 text-xs leading-5 text-white/42">{bodyText}</p></div>)}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-black/20 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p data-no-translate className="text-sm font-black uppercase tracking-[0.28em] text-pink-300">Beyond Sound. Built-in Intelligence.</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-7xl">{pick("AI bantu kamu sampai ke ide lebih cepat. Arah akhirnya tetap kamu yang tentukan.", "AI gets you to the idea faster. The final direction is still yours.")}</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">{pick("Gunakan tuneXpert sebagai partner eksplorasi, bukan pengganti keputusan kreatifmu. Coba, dengarkan, revisi, lalu bawa hasil yang paling kuat ke proses produksi berikutnya.", "Use tuneXpert as an exploration partner, not a replacement for your creative decisions. Try, listen, revise, then take the strongest result into your next production step.")}</p>
          </div>
          <Link href="/labs" className="inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-4 font-bold transition hover:border-white/50 hover:bg-white/10">FMG Labs <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>

      <AnimatePresence>
        {loginOpen && (
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setLoginOpen(false);
            }}
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#090711]/72 px-3 py-5 backdrop-blur-xl sm:px-6 sm:py-8"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="tunexpert-login-title"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative my-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/18 bg-[#100d1d]/95 p-3 shadow-[0_35px_120px_rgba(0,0,0,.7)] sm:p-5"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(255,95,162,.24),transparent_58%),radial-gradient(circle_at_top_right,rgba(113,79,255,.24),transparent_55%)]" />
              <button
                type="button"
                aria-label={pick("Tutup form masuk", "Close sign-in form")}
                onClick={() => setLoginOpen(false)}
                className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-black/30 text-white/70 backdrop-blur transition hover:bg-white/12 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-[1.45rem]">
                <div className="px-4 pb-1 pt-5 sm:px-7 sm:pt-7">
                  <p data-no-translate className="text-xs font-black uppercase tracking-[0.24em] text-pink-300">tuneXpert</p>
                  <h2 id="tunexpert-login-title" className="mt-2 pr-12 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
                    {pick("Masuk untuk mulai membuat.", "Sign in to start creating.")}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
                    {pick("Brief-mu tetap tersimpan. Setelah masuk, kamu akan kembali ke sini dan bisa langsung melanjutkan.", "Your brief stays saved. After signing in, you will return here and continue right where you left off.")}
                  </p>
                </div>
                <Suspense fallback={<div className="m-5 h-80 animate-pulse rounded-2xl bg-white/5" />}>
                  <LoginSection embedded nextOverride="/tuneXpert" onAuthenticated={handleAuthenticated} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
