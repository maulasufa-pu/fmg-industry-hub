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

  // Satu-satunya tempat redirect
  const goLoginOnce = async (reason: string) => {
    if (redirectingRef.current || isLoginPage) return;

    // Double-check masih guest sebelum redirect
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 400, "pre-redirect-getSession");
      if (session || statusRef.current === "authed") return;
    } catch {/* abaikan */}

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    startTransition(() => router.replace(to));
  };

  const checkSession = async () => {
    try {
      const getFast = async () => {
        try {
          return await withTimeout(supabase.auth.getSession(), 800, "getSession");
        } catch {
          try {
            await withTimeout(supabase.auth.refreshSession(), 900, "refreshSession");
          } catch {/* biarkan lanjut */}
          return await withTimeout(supabase.auth.getSession(), 800, "getSession-2");
        }
      };

      const { data: { session } } = await getFast();
      if (!mountedRef.current) return;

      if (session) setStatus("authed");
      else { setStatus("guest"); void goLoginOnce("no-session"); }
    } catch { 
      if (!mountedRef.current) return;
      setStatus("guest");
      void goLoginOnce("error");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void checkSession();

    // ✅ onAuthStateChange: destructuring & cleanup yang benar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mountedRef.current) return;
      if (session) setStatus("authed");
      else { setStatus("guest"); void goLoginOnce("state-change"); }
    });

    // Re-validate saat balik fokus / BFCache
    const kick = () => {
      const now = Date.now();
      if (now - lastKickRef.current < 500) return; // debounce
      lastKickRef.current = now;
      if (statusRef.current === "checking") return; // sudah jalan
      setStatus("checking");
      void checkSession();
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
