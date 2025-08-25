"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPublicOrigin = (): string => {
  const env =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";
  const win = typeof window !== "undefined" ? window.location.origin : "";
  const base = (env || win || "").replace(/\/+$/, "");
  return base || "https://fmg-industry-hub.vercel.app";
};

export default function ForgotPasswordPage(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // hCaptcha
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const siteKey: string = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ?? "";

  const valid = useMemo(() => emailRe.test(email), [email]);

  // (Opsional) verifikasi ke server kamu sendiri.
  // Boleh dihapus kalau kamu mau rely 100% ke verifikasi Supabase.
  const verifyCaptchaLocally = async (token: string): Promise<boolean> => {
    const res = await fetch("/api/verify-hcaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const json: { ok: boolean } = await res.json();
    return json.ok === true;
  };

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1); // re-mount widget
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!valid) {
      setErr("Enter a valid email address.");
      return;
    }
    if (!captchaToken) {
      setErr("Please complete the captcha.");
      return;
    }

    setLoading(true);
    try {
      // (Opsional) cek juga ke backend kamu sendiri:
      // kalau mau, biarkan; kalau tidak perlu, hapus blok ini.
      const localOk = await verifyCaptchaLocally(captchaToken);
      if (!localOk) {
        resetCaptcha();
        throw new Error("Captcha verification failed. Please try again.");
      }

      // Wajib: kirim captchaToken ke Supabase jika Captcha ON untuk reset password
      const supabase = getSupabaseClient();
      const redirectTo = `${getPublicOrigin()}/auth/callback`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
        captchaToken: captchaToken ?? undefined, // <-- INI KUNCI-NYA
      });
      if (error) throw error;

      setMsg("We’ve sent a password reset link to your email. Please check your inbox/spam.");
      resetCaptcha();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send reset link");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto w-full max-w-md sm:max-w-lg lg:max-w-xl"
      >
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-6 sm:px-8 pt-7 pb-4">
            <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs tracking-wide uppercase">Account Recovery</span>
            </div>
            <h1 className="mt-3 text-center text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">
              Reset your password
            </h1>
            <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-300">
              Enter your account email. We’ll send you a secure reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8">
            <label htmlFor="email" className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
              Email address
            </label>
            <div
              className={`mt-1.5 flex items-center rounded-xl border bg-white/70 dark:bg-white/[0.06]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus-within:ring-2 ${
                  email && !valid
                    ? "border-red-300 dark:border-red-800 focus-within:ring-red-400/40"
                    : "border-black/10 dark:border-white/10 focus-within:ring-indigo-400/40"
                }`}
            >
              <span className="pl-3 pr-1 text-neutral-500 dark:text-neutral-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60 dark:text-white"
                aria-invalid={!!email && !valid}
              />
            </div>

            {/* hCaptcha */}
            <div className="mt-4 flex justify-center">
              <HCaptcha
                key={captchaKey}
                sitekey={siteKey}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => {
                  setCaptchaToken(null);
                  setErr("Captcha error. Please reload the captcha.");
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!valid || !captchaToken || loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-3 text-[15px] font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending reset link…
                </>
              ) : (
                <>
                  Send reset link <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {(err || msg) && (
              <div
                className={`mt-3 rounded-lg p-3 text-[13px] ${
                  err
                    ? "border border-red-200/60 bg-red-50/70 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                    : "border border-emerald-200/60 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                }`}
              >
                {err || msg}
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </section>
  );
}
