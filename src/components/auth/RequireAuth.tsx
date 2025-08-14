// src/components/auth/RequireAuth.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Props = { children: React.ReactNode };
type GuardStatus = "checking" | "authed" | "guest";

const DEBUG = false;

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [status, setStatus] = useState<GuardStatus>("checking");
  const statusRef = useRef<GuardStatus>("checking");
  useEffect(() => { statusRef.current = status; }, [status]);

  const mountedRef = useRef(false);
  const redirectingRef = useRef(false);
  const isLoginPage = pathname?.startsWith("/login") ?? false;

  const log = (...a: unknown[]) => { if (DEBUG) console.debug("[RequireAuth]", ...a); };

  // Aman: kembalikan session | null | undefined (undefined = error/transient)
  const getSessionSafe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session; // session | null
    } catch (e) {
      log("getSession error:", e);
      return undefined;
    }
  };

  // Redirect hanya jika benar2 guest; jangan ganggu UI kalau ragu
  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;
    // double-check sebelum redirect (hindari race)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        log("cancel redirect, session valid (reason:", reason, ")");
        if (statusRef.current !== "authed") setStatus("authed");
        return;
      }
    } catch {
      // error transient → jangan paksa redirect
      log("cancel redirect due to transient error (reason:", reason, ")");
      return;
    }

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    log("redirect ->", to, "reason:", reason);
    // pasang 'guest' HANYA saat memang redirect
    setStatus("guest");
    startTransition(() => router.replace(to));
  };

  const initialCheck = async () => {
    const s = await getSessionSafe();
    if (!mountedRef.current) return;

    if (s) {
      log("initial: authed");
      setStatus("authed");
      return;
    }
    if (s === null) {
      log("initial: no session -> login");
      await goLoginOnce("initial-no-session");
      return;
    }
    // s === undefined -> transient; jangan ganggu UI
    log("initial: transient error -> assume authed for UX");
    setStatus("authed");
  };

  useEffect(() => {
    mountedRef.current = true;
    void initialCheck();

    // Realtime auth events: ini satu-satunya pemicu perubahan
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!mountedRef.current) return;
      log("auth event:", evt);

      if (evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED") {
        setStatus("authed");
        return;
      }
      if (evt === "SIGNED_OUT") {
        // Jangan ubah UI ke 'guest' dulu; serahkan ke goLoginOnce agar bisa recovery kalau balapan
        void goLoginOnce("signed-out");
        return;
      }

      // Event lain (USER_UPDATED, PASSWORD_RECOVERY, dsb): cek ringan tanpa ganggu UI
      void (async () => {
        const s = await getSessionSafe();
        if (!mountedRef.current) return;
        if (s) setStatus("authed");
        else if (s === null) await goLoginOnce("event-no-session");
        // undefined -> silent
      })();
    });

    return () => {
      mountedRef.current = false;
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
