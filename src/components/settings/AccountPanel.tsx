// src/components/settings/AccountPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ensureFreshSession } from "@/lib/supabase/safe";
import { Google, Envelope } from "@/icons";

export default function AccountPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [isEmailUser, setIsEmailUser] = useState<boolean>(false);
  const [primaryProvider, setPrimaryProvider] = useState<string>("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureFreshSession();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) { setErr(error.message); return; }

      const user = session?.user;
      setEmail(user?.email ?? "");

      type Identity = { provider?: string | null };
      const identities = (user?.identities ?? []) as Identity[];
      const hasEmailIdentity = identities.some((i) => i.provider === "email");

      // Hindari any: ketatkan tipe app_metadata lalu cek jenisnya
      type AppMeta = Record<string, unknown> & { provider?: string };
      const appMeta: AppMeta = (user?.app_metadata ?? {}) as AppMeta;
      const provider =
        typeof appMeta.provider === "string" ? appMeta.provider : undefined;

      setIsEmailUser(hasEmailIdentity || provider === "email");
      setPrimaryProvider(
        provider || (hasEmailIdentity ? "email" : (identities[0]?.provider ?? "unknown") || "unknown")
      );
    })();
  }, [supabase]);

  const resetAlerts = () => { setErr(null); setOk(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    if (!newPassword || newPassword.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNew) {
      setErr("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await ensureFreshSession();
      if (isEmailUser) {
        if (!currentPassword) {
          setErr("Current password is required.");
          setSaving(false);
          return;
        }
        const reauth = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (reauth.error) {
          setErr(reauth.error.message || "Current password is incorrect.");
          setSaving(false);
          return;
        }
        const upd = await supabase.auth.updateUser({ password: newPassword });
        if (upd.error) throw upd.error;
        setOk("Password updated successfully.");
      } else {
        const upd = await supabase.auth.updateUser({ password: newPassword });
        if (upd.error) {
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?flow=recovery`,
          });
          setOk("We sent you a password setup link. Please check your email.");
        } else {
          setOk("Password set successfully.");
        }
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    } catch (e: unknown) { // ⬅️ was: any
      setErr(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const ProviderBadge = () => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-coolgray-10 text-coolgray-90">
      {primaryProvider === "google" ? (
        <Google />
      ) : (
        <Envelope />
      )}
      <span className="text-sm">
        {primaryProvider === "google" ? "Registered with Google Account" : "Registered with Email & Password"}
      </span>
    </div>
  );

  return (
    <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
      <div className="flex items-center justify-between w-full">
        <h2 className="font-heading-6 text-coolgray-90">Account</h2>
        <ProviderBadge />
      </div>

      {err && <p className="text-[13px] text-red-600 -mt-2">{err}</p>}
      {ok && <p className="text-[13px] text-green-700 -mt-2">{ok}</p>}

      <form onSubmit={handleSave} className="flex flex-col w-[616px] items-start gap-4">
        {/* Email (read-only) */}
        <div className="flex flex-col gap-1 w-full">
          <label className="font-body-s text-coolgray-90">Email</label>
          <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
            <input
              type="email"
              value={email}
              readOnly
              className="flex-1 font-body-m text-coolgray-60 bg-transparent cursor-not-allowed"
              placeholder="you@company.com"
              aria-readonly="true"
            />
          </div>
          <p className="text-[12px] text-coolgray-60">Email cannot be changed here.</p>
        </div>

        {/* Current password → hanya untuk email/password user */}
        {isEmailUser && (
          <div className="flex flex-col gap-1 w-full">
            <label className="font-body-s text-coolgray-90">Current Password</label>
            <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                placeholder="••••••••"
                disabled={saving}
                autoComplete="current-password"
              />
            </div>
          </div>
        )}

        {/* New & Confirm */}
        <div className="flex flex-col gap-1 w-full">
          <label className="font-body-s text-coolgray-90">
            {isEmailUser ? "New Password" : "Set Password"}
          </label>
          <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 font-body-m text-coolgray-60 bg-transparent"
              placeholder="At least 8 characters"
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
          <p className="text-[12px] text-coolgray-60">
            Min. 8 characters, suggested to include numbers & symbols.
          </p>
        </div>

        <div className="flex flex-col gap-1 w-full">
          <label className="font-body-s text-coolgray-90">Confirm New Password</label>
          <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
            <input
              type="password"
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              className="flex-1 font-body-m text-coolgray-60 bg-transparent"
              placeholder="Repeat new password"
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Info khusus Google */}
        {!isEmailUser && (
          <p className="text-[12px] text-coolgray-60 -mt-2">
            You signed up with Google. If direct password update isn’t allowed, we’ll email you a password setup link.
          </p>
        )}

        <div className="flex items-center justify-end gap-4 w-full">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center px-4 bg-primary-60 border-2 border-primary-60 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : (isEmailUser ? "Save Changes" : "Set Password")}
          </button>
        </div>
      </form>
    </section>
  );
}
