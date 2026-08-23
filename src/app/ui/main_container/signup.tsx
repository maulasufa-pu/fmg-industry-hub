"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { safeInternalPath, withNext } from "@/lib/safe-next";
import { Google } from "@/icons";
import { TERMS_CONSENT_STORAGE_KEY, TERMS_VERSION } from "@/lib/legal";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  RefreshCcw,
  Check,
} from "lucide-react";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  agree?: string;
};

const validate = (v: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agree: boolean;
}): FieldErrors => {
  const next: FieldErrors = {};
  if (!v.firstName.trim()) next.firstName = "First name is required.";
  if (!v.lastName.trim()) next.lastName = "Last name is required.";
  if (!v.email.trim()) next.email = "Email is required.";
  else if (!emailRe.test(v.email)) next.email = "Enter a valid email address.";
  if (!v.password.trim()) next.password = "Password is required.";
  else if (v.password.length < 8) next.password = "Minimum 8 characters.";
  if (!v.agree) next.agree = "You must accept the Terms & Conditions.";
  return next;
};


export function SignUpSection(): React.JSX.Element {
  const [firstName, setFirst] = useState<string>("");
  const [lastName, setLast] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPass] = useState<string>("");
  const [agree, setAgree] = useState<boolean>(false);

  const [showPass, setShowPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false); // Track if confirmation email was sent

  const sp = useSearchParams();
  const nextPath = safeInternalPath(sp.get("next") || sp.get("redirectedFrom"));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{
    firstName: boolean;
    lastName: boolean;
    email: boolean;
    password: boolean;
    agree: boolean;
  }>({ firstName: false, lastName: false, email: false, password: false, agree: false });

  const firstRef = useRef<HTMLInputElement | null>(null);
  const lastRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);
  const agreeRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState<number>(0); // force re-mount on reset
  const siteKey: string = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ?? "";

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    const res = await fetch("/api/verify-hcaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const json: { ok: boolean } = await res.json();
    return json.ok === true;
  };

  const resetCaptcha = (): void => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  };

  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const buildRedirect = () => {
    const origin =
      (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://flemmomusic.com")
        .replace(/\/+$/, "");
    return `${origin}${withNext("/auth/callback", nextPath)}`;
  };

  const canSubmit = useMemo(() => {
    const v = validate({ firstName, lastName, email, password, agree });
    return Object.keys(v).length === 0 && !!captchaToken && !loading;
  }, [firstName, lastName, email, password, agree, loading, captchaToken]);

  const focusFirstInvalid = (v: FieldErrors) => {
    if (v.firstName) { firstRef.current?.focus(); return; }
    if (v.lastName) { lastRef.current?.focus(); return; }
    if (v.email) { emailRef.current?.focus(); return; }
    if (v.password) { passRef.current?.focus(); return; }
    if (v.agree) { agreeRef.current?.focus(); return; }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const next = validate({ firstName, lastName, email, password, agree });
    setErrors(next);
    setTouched({ firstName: true, lastName: true, email: true, password: true, agree: true });
    if (Object.keys(next).length > 0) { focusFirstInvalid(next); return; }

    if (!captchaToken) {
      setErr("Please complete the captcha.");
      return;
    }

    setLoading(true);
    try {
      const ok = await verifyCaptcha(captchaToken);
      if (!ok) {
        resetCaptcha();
        throw new Error("Captcha verification failed. Please try again.");
      }

      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            terms_version: TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          },
          emailRedirectTo: buildRedirect(),
          captchaToken: captchaToken ?? undefined, 
        },
      });
      if (error) {
        // Handle specific error for existing user
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        throw error;
      }

      if (!data.session) {
        setMsg("We’ve sent a confirmation link to your email. Please verify to continue.");        setEmailSent(true); // Mark email as sent        resetCaptcha(); 
        return;
      }

      const resp = await fetch("/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });
      if (!resp.ok) {
        let m = "Failed to set server session";
        try { m = (await resp.json())?.error || m; } catch {}
        throw new Error(m);
      }

      router.replace(nextPath);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign up failed");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || resendCooldown > 0 || !emailRe.test(email)) return;
    setErr(null);
    setMsg(null);

    if (!captchaToken) {
      setErr("Please complete the captcha before resending.");
      return;
    }

    setResendLoading(true);
    try {
      const ok = await verifyCaptcha(captchaToken);
      if (!ok) throw new Error("Captcha verification failed. Please try again.");

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: buildRedirect(),
          captchaToken: captchaToken ?? undefined, 
        },
      });
      if (error) throw error;

      setMsg("We’ve re-sent the confirmation link. Please check your inbox/spam.");
      setResendCooldown(30);
      resetCaptcha();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Resend failed");
      resetCaptcha();
    } finally {
      setResendLoading(false);
    }
  };

  const [, setOauthLoading] = useState<null | "google">(null);

  const handleOAuth = async (provider: "google") => {
    setErr(null); setMsg(null);
    if (!agree) {
      setTouched((current) => ({ ...current, agree: true }));
      setErr("You must accept the Terms & Conditions before continuing.");
      agreeRef.current?.focus();
      return;
    }
    setOauthLoading(provider);
    try {
      const supabase = getSupabaseClient();
      const redirectTo = buildRedirect();
      window.localStorage.setItem(TERMS_CONSENT_STORAGE_KEY, JSON.stringify({ version: TERMS_VERSION, acceptedAt: new Date().toISOString() }));
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) setErr(error.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "OAuth failed");
    } finally {
      setOauthLoading(null);
    }
  };

  const firstInvalid = touched.firstName && !!errors.firstName;
  const lastInvalid = touched.lastName && !!errors.lastName;
  const emailInvalid = touched.email && !!errors.email;
  const passInvalid = touched.password && !!errors.password;
  const agreeInvalid = touched.agree && !!errors.agree;

  // If email confirmation was sent, show dedicated resend UI
  if (emailSent) {
    return (
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-md sm:max-w-lg"
        >
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
            
            {/* Header */}
            <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-black/5 dark:border-white/5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 mb-4"
              >
                <Mail className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Check your email
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                We&apos;ve sent a confirmation link to
              </p>
              <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                {email}
              </p>
            </div>

            {/* Content */}
            <div className="px-6 sm:px-8 py-6">
              {/* Success Message */}
              {msg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 rounded-xl bg-green-50/70 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 flex-1">
                      {msg}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
                >
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {err}
                  </p>
                </motion.div>
              )}

              {/* Instructions */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs mt-0.5">
                    1
                  </div>
                  <p>Open your email inbox</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs mt-0.5">
                    2
                  </div>
                  <p>Click the verification link in the email</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs mt-0.5">
                    3
                  </div>
                  <p>You&apos;ll be redirected to login</p>
                </div>
              </div>

              {/* Captcha */}
              <div className="mb-5 flex justify-center">
                <HCaptcha
                  key={captchaKey}
                  sitekey={siteKey}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => {
                    setCaptchaToken(null);
                    setErr("Captcha error. Please reload.");
                  }}
                />
              </div>

              {/* Resend Button */}
              <motion.button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0 || !captchaToken}
                whileHover={resendCooldown === 0 && captchaToken ? { y: -1 } : {}}
                whileTap={resendCooldown === 0 && captchaToken ? { scale: 0.98 } : {}}
                className="
                  group relative w-full inline-flex items-center justify-center gap-2
                  rounded-xl px-5 py-3.5 text-[15px] font-semibold
                  bg-gradient-to-r from-indigo-600 to-violet-600
                  text-white shadow-lg shadow-indigo-500/30
                  transition-all duration-200
                  hover:shadow-xl hover:shadow-indigo-500/40
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg
                "
              >
                {resendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                <span>
                  {resendLoading
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend confirmation email"}
                </span>
              </motion.button>

              {/* Helper Text */}
              <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Didn&apos;t receive the email? Check your spam folder or click resend.
              </p>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                <span className="text-xs text-neutral-500">Need help?</span>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>

              {/* Back to Signup */}
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                ← Back to sign up form
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

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
              <span className="text-xs tracking-wide uppercase">Secure Sign Up</span>
            </div>
            <h1 className="mt-3 text-center text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">
              Sign up free
            </h1>
            <p className="mt-1 text-center text-sm text-neutral-600 dark:text-neutral-300">
              Please insert your credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="first" className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                  First name
                </label>
                <div
                  className={`mt-1.5 flex items-center rounded-xl border bg-white/70 dark:bg-white/[0.06]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus-within:ring-2 ${
                      firstInvalid
                        ? "border-red-300 dark:border-red-800 focus-within:ring-red-400/40"
                        : "border-black/10 dark:border-white/10 focus-within:ring-indigo-400/40"
                    }`}
                >
                  <span className="pl-3 pr-1 text-neutral-500 dark:text-neutral-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    ref={firstRef}
                    id="first"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirst(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                    disabled={loading}
                    placeholder="First name"
                    className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60 dark:text-white"
                    aria-invalid={firstInvalid}
                    aria-describedby={firstInvalid ? "first-error" : undefined}
                  />
                </div>
                {firstInvalid && (
                  <p id="first-error" className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="last" className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                  Last name
                </label>
                <div
                  className={`mt-1.5 flex items-center rounded-xl border bg-white/70 dark:bg-white/[0.06]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus-within:ring-2 ${
                      lastInvalid
                        ? "border-red-300 dark:border-red-800 focus-within:ring-red-400/40"
                        : "border-black/10 dark:border-white/10 focus-within:ring-indigo-400/40"
                    }`}
                >
                  <span className="pl-3 pr-1 text-neutral-500 dark:text-neutral-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    ref={lastRef}
                    id="last"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLast(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                    disabled={loading}
                    placeholder="Last name"
                    className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60 dark:text-white"
                    aria-invalid={lastInvalid}
                    aria-describedby={lastInvalid ? "last-error" : undefined}
                  />
                </div>
                {lastInvalid && (
                  <p id="last-error" className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
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
                  required
                  autoComplete="email"
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
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="block text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                Password
              </label>
              <div
                className={`mt-1.5 flex items-center rounded-xl border bg-white/70 dark:bg-white/[0.06]
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus-within:ring-2 ${
                    passInvalid
                      ? "border-red-300 dark:border-red-800 focus-within:ring-red-400/40"
                      : "border-black/10 dark:border-white/10 focus-within:ring-indigo-400/40"
                  }`}
              >
                <span className="pl-3 pr-1 text-neutral-500 dark:text-neutral-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  ref={passRef}
                  id="password"
                  type={showPass ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPass(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60 dark:text-white"
                  aria-invalid={passInvalid}
                  aria-describedby={passInvalid ? "password-error" : "password-help"}
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
              {passInvalid && (
                <p id="password-error" className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  ref={agreeRef}
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  onBlur={() => setTouched((t) => ({ ...t, agree: true }))}
                  className="
                    h-4 w-4 shrink-0 rounded-sm
                    border border-neutral-300 dark:border-neutral-600
                    bg-white dark:bg-neutral-900
                    appearance-auto
                    text-indigo-600 accent-indigo-600
                    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
                  "
                />
                <span className="text-[13px] text-neutral-800 dark:text-neutral-200">
                  I accept the{" "}
                  <a href="/legal/terms" className="font-medium text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 underline">
                    Terms & Conditions
                  </a>
                </span>
              </label>
              {agreeInvalid && (
                <p className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                  {errors.agree}
                </p>
              )}
            </div>

            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Forgot password?
            </Link>

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
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Sign Up <ArrowRight className="h-4 w-4" />
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
                {err ? err : msg}
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
                onClick={() => handleOAuth("google")}
                aria-label="Sign up with Google"
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
                <Google className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
                Continue with Google
              </motion.button>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-center text-[13px] text-neutral-700 dark:text-neutral-300">
                Already have an account?{" "}
                <a href={withNext("/login", nextPath)} className="font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 underline">
                  Log in
                </a>
              </p>
              <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                Didn&apos;t receive confirmation email?{" "}
                <button
                  type="button"
                  onClick={() => setEmailSent(true)}
                  className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                >
                  Resend here
                </button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </section>
  );
}

export default SignUpSection;
