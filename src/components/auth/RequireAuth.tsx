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

  // getSession aman:
  // - object   : ada session
  // - null     : tegas tidak ada session
  // - undefined: gagal cek (transient)
  const getSessionSafe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session; // session | null
    } catch {
      return undefined;
    }
  };

  // Redirect hanya jika benar2 guest.
  // TIDAK menurunkan status ke "guest" dulu; baru set guest jika benar2 redirect.
  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;

    // Double-check: kalau ternyata sudah authed, pulihkan status
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || statusRef.current === "authed") {
        if (statusRef.current !== "authed") setStatus("authed");
        return;
      }
    } catch {
      // kalau error di sini, jangan memaksa redirect — biarkan check lain yang memutuskan
      return;
    }

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    // status "guest" baru dipasang saat memang akan redirect
    setStatus("guest");
    startTransition(() => router.replace(to));
  };

  // Initial check (tanpa flicker di kasus transient)
  const checkSession = async () => {
    const session = await getSessionSafe();
    if (!mountedRef.current) return;

    if (session) setStatus("authed");
    else if (session === null) void goLoginOnce("no-session");
    else setStatus("authed"); // transient error: jangan ganggu UI
  };

  // Passive recheck saat balik fokus: tanpa ubah UI
  const userBusy = () => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };

  const passiveRecheckOnFocus = async () => {
    const now = Date.now();
    if (now - lastPassiveCheckRef.current < 10_000) return; // throttle 10s
    lastPassiveCheckRef.current = now;
    if (userBusy()) return;

    // cek diam-diam (dua kali bila transient)
    let s = await getSessionSafe();
    if (s === undefined) {
      await new Promise(r => setTimeout(r, 1200));
      s = await getSessionSafe();
    }
    if (!mountedRef.current) return;

    if (s) return; // tetap authed, tidak sentuh UI
    if (s === null) {
      // Grace + double-check lagi supaya tidak false redirect
      await new Promise(r => setTimeout(r, 1000));
      if (!mountedRef.current) return;
      const s2 = await getSessionSafe();
      if (s2 === null) {
        // baru sekarang kita redirect & set guest
        await goLoginOnce("focus-no-session");
      } else if (s2) {
        // pulihkan jika ternyata sudah authed
        if (statusRef.current !== "authed") setStatus("authed");
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void checkSession();

    // Realtime auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!mountedRef.current) return;

      if (evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED") {
        setStatus("authed");
        return;
      }
      if (evt === "SIGNED_OUT") {
        // Jangan set guest dulu; serahkan ke goLoginOnce agar bisa recovery jika balapan
        void goLoginOnce("signed-out");
        return;
      }

      // Event lain → cek diam-diam
      void checkSession();
    });

    // Passive recheck on focus/BFCache — tanpa setStatus("checking")
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
