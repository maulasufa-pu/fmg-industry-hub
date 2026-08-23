"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Google } from "@/icons"; 
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { safeInternalPath, withNext } from "@/lib/safe-next";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

const validate = (v: { email: string; password: string }): FieldErrors => {
  const next: FieldErrors = {};
  if (!v.email.trim()) next.email = "Email is required.";
  else if (!emailRe.test(v.email)) next.email = "Enter a valid email address.";

  if (!v.password.trim()) next.password = "Password is required.";
  else if (v.password.length < 8) next.password = "Minimum 8 characters.";
  return next;
};

export const LoginSection = (): React.JSX.Element => {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState<number>(0); 
  const siteKey: string = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ?? "";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPass, setShowPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const qp = useSearchParams();
  const requestedNext = qp.get("next") || qp.get("redirectedFrom");
  const nextPath = safeInternalPath(requestedNext);
  const msg = qp.get("m");
  const callbackError = qp.get("err");
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (!callbackError) return;
    const messages: Record<string, string> = {
      oauth: "Google sign-in could not be completed. Please try again.",
      setcookie: "Your account was verified, but the session could not be saved. Please try again.",
      "hash-setsession": "This sign-in link is invalid or has expired.",
      "hash-setcookie": "Your account was verified, but the session could not be saved. Please try again.",
      nocode: "This sign-in link is invalid or has expired.",
    };
    setErr(messages[callbackError] ?? "Sign-in could not be completed. Please try again.");
  }, [callbackError]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("remember_email") : null;
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const canSubmit = useMemo(() => {
    const v = validate({ email, password });
    return Object.keys(v).length === 0 && !!captchaToken && !loading;
  }, [email, password, loading, captchaToken]);

  const resetCaptcha = (): void => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);

    const next = validate({ email, password });
    setErrors(next);
    setTouched({ email: true, password: true });
    if (Object.keys(next).length > 0) {
      if (next.email) emailRef.current?.focus();
      else if (next.password) passwordRef.current?.focus();
      return;
    }

    if (!captchaToken) {
      setErr("Please complete the captcha.");
      return;
    }

    setLoading(true);
    try {
      
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captchaToken! }, 
      });

      if (error) throw new Error(error.message || "Login failed")

      const session = data.session;
      if (!session) throw new Error("No session returned");

      const resp = await fetch("/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });
      if (!resp.ok) {
        let m = "Failed to set server session";
        try { m = (await resp.json())?.error || m; } catch {}
        throw new Error(m);
      }

      if (rememberMe) localStorage.setItem("remember_email", email);
      else localStorage.removeItem("remember_email");

      window.location.replace(requestedNext ? withNext("/login", nextPath) : "/login");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    setErr(null);
    setSocialLoading(true);
    try {
      const supabase = getSupabaseClient();

      const redirectTo = `${window.location.origin}${withNext("/auth/callback", nextPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) setErr(error.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "OAuth failed");
    } finally {
      setSocialLoading(false);
    }
  };


  const emailInvalid = touched.email && !!errors.email;
  const passwordInvalid = touched.password && !!errors.password;
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
              <span className="text-xs tracking-wide uppercase">Secure Sign In</span>
            </div>
            <h1 className="mt-3 text-center text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-300">
              Please log in to continue
            </p>
            {msg && (
              <p className="mt-3 text-center text-xs text-indigo-700 dark:text-indigo-300">{msg}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8">
            <label htmlFor="email" className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
              Email address
            </label>
            <div
              className={`mt-1.5 flex items-center rounded-xl border bg-white/70 dark:bg-white/[0.06]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus-within:ring-2 ${
                  emailInvalid
                    ? "border-red-300 dark:border-red-800 focus-within:ring-red-400/40"
                    : "border-black/10 dark:border-white/10 focus-within:ring-indigo-400/40"
                }`}
            >
              <span className="pl-3 pr-1 text-neutral-500 dark:text-neutral-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                disabled={loading}
                placeholder="you@company.com"
                className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60 dark:text-white"
                aria-invalid={emailInvalid}
                aria-describedby={emailInvalid ? "email-error" : undefined}
              />
            </div>
            {emailInvalid && (
              <p id="email-error" className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                {errors.email}
              </p>
            )}

            <div className="mt-4">
              <label htmlFor="password" className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                Password
              </label>
              <div
                className={`mt-1.5 flex items-center rounded-xl border bg-white/70 dark:bg-white/[0.06]
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus-within:ring-2 ${
                    passwordInvalid
                      ? "border-red-300 dark:border-red-800 focus-within:ring-red-400/40"
                      : "border-black/10 dark:border-white/10 focus-within:ring-indigo-400/40"
                  }`}
              >
                <span className="pl-3 pr-1 text-neutral-500 dark:text-neutral-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60 dark:text-white"
                  aria-invalid={passwordInvalid}
                  aria-describedby={passwordInvalid ? "password-error" : "password-help"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="pr-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p id="password-help" className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-400">
                Use at least 8 characters, with letters & numbers.
              </p>
              {passwordInvalid && (
                <p id="password-error" className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="
                    h-4 w-4 shrink-0 rounded-sm
                    border border-neutral-300 dark:border-neutral-600
                    bg-white dark:bg-neutral-900
                    appearance-auto
                    text-indigo-600 accent-indigo-600
                    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
                  "
                />
                <span className="text-[13px] text-neutral-800 dark:text-neutral-200">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-[13px] font-medium text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Forgot password?
              </button>
            </div>

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
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-3 text-[15px] font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Log In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {(err || Object.keys(errors).length > 0) && (
              <div className="mt-3 rounded-lg border border-red-200/60 bg-red-50/70 p-3 text-[13px] text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                {err ? (
                  <>{err}</>
                ) : (
                  <>
                    {errors.email && <div>• {errors.email}</div>}
                    {errors.password && <div>• {errors.password}</div>}
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              <span className="text-[12px] text-neutral-500 whitespace-nowrap">
                or continue with
              </span>
              <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <motion.button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={socialLoading}
                aria-label="Log in with Google"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="
                  group relative inline-flex w-full items-center justify-center gap-3
                  rounded-2xl border border-black/10 dark:border-white/10
                  bg-white/90 dark:bg-white/[0.06]
                  px-4 py-3 text-[15px] font-medium
                  text-neutral-900 dark:text-neutral-100
                  shadow-sm transition-colors
                  hover:bg-white hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50
                "
              >
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600/0 via-violet-600/0 to-fuchsia-600/0 opacity-0 transition-opacity duration-200 group-hover:opacity-10" />
                {socialLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Google className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
                )}
                {socialLoading ? "Connecting to Google…" : "Continue with Google"}
              </motion.button>
            </div>

            <p className="mt-6 text-center text-[13px] text-neutral-700 dark:text-neutral-300">
              No account yet?{" "}
              <button
                type="button"
                onClick={() => router.push(withNext("/signup", nextPath))}
                className="font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </section>
  );
};

export default LoginSection;
