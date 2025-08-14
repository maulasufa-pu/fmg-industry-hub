"use client";
import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Props = { children: React.ReactNode };

function withTimeout<T>(p: Promise<T>, ms: number, tag = "op"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[timeout] ${tag} > ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [status, setStatus] = useState<"checking" | "authed" | "guest">("checking");
  const statusRef = useRef<typeof status>("checking");
  useEffect(() => { statusRef.current = status; }, [status]);

  const redirectingRef = useRef(false);
  const mountedRef = useRef(false);
  const lastKickRef = useRef(0);
  const isLoginPage = pathname?.startsWith("/login") ?? false;

  const getSessionSafe = async () => {
    try {
      const { data: { session } } =
        await withTimeout(supabase.auth.getSession(), 1800, "getSession");
      return session; // session | null
    } catch {
      return undefined; // unknown (timeout/error)
    }
  };

  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;
    try {
      const { data: { session } } =
        await withTimeout(supabase.auth.getSession(), 900, "pre-redirect");
      if (session || statusRef.current === "authed") return;
    } catch {}
    redirectingRef.current = true;
    startTransition(() =>
      router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`)
    );
  };

  const checkSession = async () => {
    const s = await getSessionSafe();
    if (!mountedRef.current) return;

    if (s) setStatus("authed");
    else if (s === null) { setStatus("guest"); void goLoginOnce("no-session"); }
    else {
      // unknown → retry ringan
      setStatus("checking");
      setTimeout(() => { if (mountedRef.current && statusRef.current==="checking") void checkSession(); }, 700);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!mountedRef.current) return;
      if (evt === "SIGNED_IN" || evt === "TOKEN_REFreshed".toUpperCase()) setStatus("authed");
      else if (evt === "SIGNED_OUT") { setStatus("guest"); void goLoginOnce("signed-out"); }
      else { setStatus("checking"); void checkSession(); }
    });

    const kick = () => {
      const now = Date.now();
      if (now - lastKickRef.current < 500) return;
      lastKickRef.current = now;
      if (statusRef.current !== "checking") {
        setStatus("checking");
        void checkSession();
      }
    };

    const onVis = () => { if (document.visibilityState === "visible") kick(); };
    const onShow = () => kick();
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVis);
      subscription.unsubscribe();
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, isLoginPage]);

  if (status !== "authed") {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking session…
      </div>
    );
  }
  return <>{children}</>;
}
