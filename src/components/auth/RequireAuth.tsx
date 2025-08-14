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
  const redirectingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastKickRef = useRef(0);

  // Satu-satunya tempat redirect
  const goLoginOnce = (reason: string) => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`;
    // Hindari throwing sinkron ke render pipeline
    startTransition(() => router.replace(to));
  };

  const checkSession = async () => {
    try {
      // 1) getSession cepat; kalau nge-timeout → refreshSession sekali
      const getFast = async () => {
        try {
          return await withTimeout(supabase.auth.getSession(), 800, "getSession");
        } catch {
          // refresh sekali
          try {
            await withTimeout(supabase.auth.refreshSession(), 900, "refreshSession");
          } catch {
            // biarkan lanjut ke getSession biasa; kalau gagal, dianggap tidak login
          }
          return await withTimeout(supabase.auth.getSession(), 800, "getSession-2");
        }
      };

      const { data: { session } } = await getFast();
      if (!mountedRef.current) return;

      if (session) {
        setStatus("authed");
      } else {
        setStatus("guest");
        goLoginOnce("no-session");
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus("guest");
      goLoginOnce("error");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    // Cek segera saat mount
    void checkSession();

    // Reaksi realtime saat token berubah
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mountedRef.current) return;
      if (session) {
        setStatus("authed");
      } else {
        setStatus("guest");
        goLoginOnce("state-change");
      }
    });

    // Re-validate saat balik fokus / BFCache
    const kick = () => {
      const now = Date.now();
      if (now - lastKickRef.current < 500) return; // debounce
      lastKickRef.current = now;
      if (status === "checking") return; // sudah jalan
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
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); // router/pathname tidak perlu di deps untuk mencegah re-init

  if (status !== "authed") {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
