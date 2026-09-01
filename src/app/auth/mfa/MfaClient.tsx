"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { safeInternalPath } from "@/lib/safe-next";
import { getSupabaseClient } from "@/lib/supabase/client";

type Screen = "loading" | "challenge" | "enroll" | "done";

export default function MfaClient() {
  const search = useSearchParams();
  const next = safeInternalPath(search.get("next"), "/admin/dashboard");
  const started = useRef(false);
  const [screen, setScreen] = useState<Screen>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        window.location.replace(next);
        return;
      }
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setError(factorsError.message);
        setScreen("challenge");
        return;
      }
      const verified = factors.totp.find((factor) => factor.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setScreen("challenge");
        return;
      }
      const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "FMG Admin Authenticator" });
      if (enrollmentError) {
        setError(enrollmentError.message);
        setScreen("enroll");
        return;
      }
      setFactorId(enrollment.id);
      setQrCode(enrollment.totp.qr_code);
      setSecret(enrollment.totp.secret);
      setScreen("enroll");
    })();
  }, [next]);

  async function persistSession() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Secure session was not returned.");
    const response = await fetch("/auth/set", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }),
    });
    if (!response.ok) throw new Error("Secure session could not be saved.");
  }

  async function verifyFactor(enrolling: boolean) {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    if (enrolling && (password.length < 12 || password !== confirmPassword)) {
      setError(password.length < 12 ? "New password must contain at least 12 characters." : "Password confirmation does not match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (enrolling) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw passwordError;
      }
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (verifyError) throw verifyError;
      await persistSession();
      setScreen("done");
      window.setTimeout(() => window.location.replace(next), 500);
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "Authenticator verification failed.");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  if (screen === "loading") return <div className="grid min-h-screen place-items-center bg-slate-950 text-white"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" />Preparing secure verification…</div></div>;

  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#312e81_0,#020617_48%)] p-4 text-white">
    <section className="w-full max-w-lg rounded-[2rem] border border-white/15 bg-slate-950/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><ShieldCheck className="h-7 w-7" /></div>
      <h1 className="mt-5 text-center text-2xl font-black sm:text-3xl">{screen === "enroll" ? "Secure adminfmg" : screen === "done" ? "Access verified" : "Authenticator required"}</h1>
      <p className="mt-2 text-center text-sm leading-6 text-slate-300">{screen === "enroll" ? "Set your private password, scan the QR code, then verify the current six-digit code." : screen === "done" ? "Opening the admin dashboard…" : "Enter the current code from Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app."}</p>

      {screen === "enroll" && qrCode ? <div className="mt-6 space-y-4"><div className="mx-auto w-fit rounded-2xl bg-white p-3"><Image src={qrCode} alt="Authenticator enrollment QR code" width={208} height={208} unoptimized /></div><details className="rounded-xl border border-white/10 bg-white/5 p-3"><summary className="cursor-pointer text-sm font-bold">Cannot scan? Show setup key</summary><code className="mt-2 block break-all rounded-lg bg-black/30 p-3 text-xs text-violet-200">{secret}</code></details><div><label className="text-xs font-black uppercase tracking-wider text-slate-400">Create password</label><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-violet-400" placeholder="At least 12 characters" /></div><div><label className="text-xs font-black uppercase tracking-wider text-slate-400">Confirm password</label><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-violet-400" /></div></div> : null}

      {screen !== "done" ? <div className="mt-5"><label className="text-xs font-black uppercase tracking-wider text-slate-400">Authenticator code</label><div className="relative mt-2"><KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="w-full rounded-xl border border-white/15 bg-white/5 py-4 pl-12 pr-4 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-violet-400" placeholder="000000" /></div></div> : <CheckCircle2 className="mx-auto mt-6 h-12 w-12 text-emerald-400" />}
      {error ? <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}
      {screen !== "done" ? <button type="button" onClick={() => void verifyFactor(screen === "enroll")} disabled={busy || !factorId} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-black text-slate-950 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{screen === "enroll" ? "Set password & enable Authenticator" : "Verify & open admin"}</button> : null}
    </section>
  </main>;
}
