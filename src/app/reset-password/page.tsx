"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage(): React.JSX.Element {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getSupabaseClient().auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError("This password reset link is invalid or has expired. Request a new link.");
      }
      setChecking(false);
    });
  }, []);

  const validationError = useMemo(() => {
    if (password.length > 0 && password.length < 8) return "Password must contain at least 8 characters.";
    if (confirmation.length > 0 && password !== confirmation) return "Passwords do not match.";
    return null;
  }, [password, confirmation]);

  const canSubmit = !checking && !loading && password.length >= 8 && password === confirmation;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Password could not be updated.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    await fetch("/auth/signout", { method: "POST", cache: "no-store" }).catch(() => undefined);
    window.location.replace("/login?m=Password%20updated.%20Please%20log%20in.");
  };

  return (
    <main className="mx-auto grid min-h-[65vh] w-full max-w-xl place-items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-black/10 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/40 sm:p-8">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto h-7 w-7 text-indigo-600 dark:text-indigo-300" />
          <h1 className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-white">Create a new password</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Use at least 8 characters and keep it unique to this account.</p>
        </div>

        {checking ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-600 dark:text-neutral-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking reset link…
          </div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="new-password" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">New password</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.06]">
              <Lock className="ml-3 h-5 w-5 text-neutral-500" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="w-full bg-transparent px-3 py-3 text-neutral-900 outline-none dark:text-white"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="p-3 text-neutral-500" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <label htmlFor="confirm-password" className="mt-4 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Confirm new password</label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-3 text-neutral-900 outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              required
            />

            {(error || validationError) && (
              <p className="mt-3 rounded-lg border border-red-200/60 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                {error || validationError}
              </p>
            )}

            {error?.includes("expired") ? (
              <a href="/forgot-password" className="mt-5 inline-flex w-full justify-center rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white dark:bg-white dark:text-black">Request a new reset link</a>
            ) : (
              <button type="submit" disabled={!canSubmit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Updating password…" : "Update password"}
              </button>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
