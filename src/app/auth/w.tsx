// src/components/auth/RequireAuth.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Props = { children: React.ReactNode };
type GuardStatus = "checking" | "authed" | "guest";

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [status, setStatus] = useState<GuardStatus>("checking");
  const statusRef = useRef<GuardStatus>("checking");
  useEffect(() => { statusRef.current = status; }, [status]);

  const mountedRef = useRef(false);
  const redirectingRef = useRef(false);
  const lastPassiveCheckRef = useRef(0);

  const isLoginPage = pathname?.startsWith("/login") ?? false;

  // --- getSession aman: kembalikan
  // - object   : ada session
  // - null     : tegas tidak ada session
  // - undefined: gagal cek (timeout/network) → jangan ganggu UI
  const getSessionSafe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session; // session | null
    } catch {
      return undefined; // transient error
    }
  };

  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;
    // double-check sebelum redirect (hindari balapan)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || statusRef.current === "authed") return;
    } catch { /* abaikan */ }

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    startTransition(() => router.replace(to));
  };

  const checkSession = async () => {
    const session = await getSessionSafe();
    if (!mountedRef.current) return;
    if (session) setStatus("authed");
    else if (session === null) { setStatus("guest"); void goLoginOnce("no-session"); }
    else setStatus("authed"); // gagal cek (transient) → jangan ganggu UI
  };

  // --- PASSIVE recheck saat balik fokus: tanpa ubah UI, tanpa flicker
  const userBusy = () => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };

  const passiveRecheckOnFocus = async () => {
    // throttle 10 detik
    const now = Date.now();
    if (now - lastPassiveCheckRef.current < 10_000) return;
    lastPassiveCheckRef.current = now;

    if (userBusy()) return; // jangan ganggu saat user mengetik / isi form

    // cek diam-diam
    let s = await getSessionSafe();
    if (s === undefined) {
      // transient → grace lalu cek lagi
      await new Promise((r) => setTimeout(r, 1200));
      s = await getSessionSafe();
    }
    if (!mountedRef.current) return;

    if (s) return; // aman, tidak ubah apapun
    if (s === null) {
      // tegas tidak ada session → grace + double-check sebelum redirect
      await new Promise((r) => setTimeout(r, 1000));
      if (!mountedRef.current) return;
      const s2 = await getSessionSafe();
      if (s2 === null) {
        setStatus("guest");
        void goLoginOnce("focus-no-session");
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void checkSession();

    // Dengarkan perubahan auth realtime (tanpa ganggu fokus)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!mountedRef.current) return;

      if (evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED") {
        setStatus("authed");
        return;
      }
      if (evt === "SIGNED_OUT") {
        setStatus("guest");
        void goLoginOnce("signed-out");
        return;
      }

      // USER_UPDATED, PASSWORD_RECOVERY, dll → verifikasi diam-diam
      void checkSession();
    });

    // Recheck pasif saat balik fokus / BFCache (tanpa setStatus("checking"))
    const onVis = () => { if (document.visibilityState === "visible") { void passiveRecheckOnFocus(); } };
    const onShow = () => { void passiveRecheckOnFocus(); };

    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVis);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, isLoginPage, pathname]);

  if (status !== "authed") {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
