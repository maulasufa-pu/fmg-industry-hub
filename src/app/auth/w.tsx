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

  const getSessionSafe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session; 
    } catch {
      return undefined; 
    }
  };

  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || statusRef.current === "authed") return;
    } catch {  }

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    startTransition(() => router.replace(to));
  };

  const checkSession = async () => {
    const session = await getSessionSafe();
    if (!mountedRef.current) return;
    if (session) setStatus("authed");
    else if (session === null) { setStatus("guest"); void goLoginOnce("no-session"); }
    else setStatus("authed"); 
  };

  const userBusy = () => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };

  const passiveRecheckOnFocus = async () => {
    const now = Date.now();
    if (now - lastPassiveCheckRef.current < 10_000) return;
    lastPassiveCheckRef.current = now;

    if (userBusy()) return; 

    let s = await getSessionSafe();
    if (s === undefined) {
      await new Promise((r) => setTimeout(r, 1200));
      s = await getSessionSafe();
    }
    if (!mountedRef.current) return;

    if (s) return; 
    if (s === null) {
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

      void checkSession();
    });

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
