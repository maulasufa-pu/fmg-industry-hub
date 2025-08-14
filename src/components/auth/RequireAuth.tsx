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
  const retryTimerRef = useRef<number | null>(null);
  const lastKickRef = useRef(0);

  const isLoginPage = pathname?.startsWith("/login") ?? false;

  const clearRetry = () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // getSession aman: kembalikan
  // - object  : ada session
  // - null    : tegas tidak ada session
  // - undefined: gagal cek (timeout/network), jangan langsung redirect
  const getSessionSafe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session; // session | null
    } catch {
      return undefined;
    }
  };

  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;
    // double-check sebelum redirect
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || statusRef.current === "authed") return;
    } catch { /* abaikan */ }

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    startTransition(() => router.replace(to));
  };

  const checkSession = async (opts?: { retry?: boolean; attempt?: number }) => {
    const attempt = opts?.attempt ?? 0;
    const session = await getSessionSafe();
    if (!mountedRef.current) return;

    if (session) {
      clearRetry();
      setStatus("authed");
      return;
    }
    if (session === null) {
      clearRetry();
      setStatus("guest");
      void goLoginOnce("no-session");
      return;
    }

    // undefined = gagal cek (transient) -> retry ringan dengan backoff
    if (opts?.retry !== false) {
      const backoff = Math.min(300 + attempt * 300, 1500);
      if (statusRef.current !== "checking") setStatus("checking");
      clearRetry();
      retryTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) void checkSession({ retry: true, attempt: attempt + 1 });
      }, backoff) as unknown as number;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void checkSession({ retry: true });

    // Dengarkan perubahan auth realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!mountedRef.current) return;

      if (evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED") {
        clearRetry();
        setStatus("authed");
        return;
      }
      if (evt === "SIGNED_OUT") {
        clearRetry();
        setStatus("guest");
        void goLoginOnce("signed-out");
        return;
      }

      // USER_UPDATED, PASSWORD_RECOVERY, dsb → verifikasi ulang
      setStatus("checking");
      void checkSession({ retry: true });
    });

    // Re-validate saat balik fokus / BFCache
    const kick = () => {
      const now = Date.now();
      if (now - lastKickRef.current < 500) return; // debounce
      lastKickRef.current = now;
      if (statusRef.current !== "checking") setStatus("checking");
      void checkSession({ retry: true, attempt: 0 });
    };

    const onVis = () => { if (document.visibilityState === "visible") kick(); };
    const onShow = () => kick();
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mountedRef.current = false;
      clearRetry();
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
