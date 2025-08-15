// src/components/auth/RequireAuth.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Props = {
  children: React.ReactNode;
  /** Target area yang diharapkan halaman ini */
  area?: "any" | "client" | "admin";
};
type GuardStatus = "checking" | "authed" | "guest";
type Role = "client" | "admin" | "owner";

export default function RequireAuth({ children, area = "any" }: Props) {
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
  const roleCheckedRef = useRef(false);

  const isLoginPage = pathname?.startsWith("/login") ?? false;

  const clearRetry = () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // getSession aman
  const getSessionSafe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session; // session | null
    } catch {
      return undefined;
    }
  };

  const goLoginOnce = async () => {
    if (redirectingRef.current || isLoginPage) return;
    // double-check sebelum redirect
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || statusRef.current === "authed") return;
    } catch { /* ignore */ }

    redirectingRef.current = true;
    const to = `/login?redirectedFrom=${encodeURIComponent(pathname || (area === "admin" ? "/admin/dashboard" : "/client/dashboard"))}`;
    startTransition(() => {
      router.prefetch("/login");
      router.replace(to);
    });
  };

  const checkSession = async (opts?: { retry?: boolean; attempt?: number }) => {
    const attempt = opts?.attempt ?? 0;
    const session = await getSessionSafe();
    if (!mountedRef.current) return;

    if (session) {
      clearRetry();
      setStatus("authed");
      // Jika halaman mensyaratkan area tertentu, cek role sekali
      if (!roleCheckedRef.current && area !== "any") {
        roleCheckedRef.current = true;
        void checkRoleGate(session.user.id, area);
      }
      return;
    }
    if (session === null) {
      clearRetry();
      setStatus("guest");
      void goLoginOnce();
      return;
    }

    // undefined = gagal cek -> retry
    if (opts?.retry !== false) {
      const backoff = Math.min(300 + attempt * 300, 1500);
      if (statusRef.current !== "checking") setStatus("checking");
      clearRetry();
      retryTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) void checkSession({ retry: true, attempt: attempt + 1 });
      }, backoff) as unknown as number;
    }
  };

  const checkRoleGate = async (userId: string, expected: "client" | "admin") => {
    // Ambil role dari DB
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      const role = (prof?.role ?? "client") as Role;
      const isAdminLike = role === "admin" || role === "owner";

      if (expected === "admin" && !isAdminLike) {
        router.prefetch("/client/dashboard");
        startTransition(() => router.replace("/client/dashboard"));
        return;
      }
      if (expected === "client" && isAdminLike) {
        router.prefetch("/admin/dashboard");
        startTransition(() => router.replace("/admin/dashboard"));
        return;
      }
      // else: cocok, stay
    } catch {
      // Kalau gagal baca role, biar UX aman: jangan mengusir user yang sudah authed
      // (server-side guard/middleware tetap akan menolak jika tak berhak)
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    roleCheckedRef.current = false;
    void checkSession({ retry: true });

    // Dengarkan perubahan auth realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt) => {
      if (!mountedRef.current) return;

      if (evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED") {
        clearRetry();
        setStatus("authed");
        roleCheckedRef.current = false; // re-check gate on fresh token
        return;
      }
      if (evt === "SIGNED_OUT") {
        clearRetry();
        setStatus("guest");
        void goLoginOnce();
        return;
      }

      setStatus("checking");
      void checkSession({ retry: true });
    });

    // Re-validate saat balik fokus / BFCache
    const kick = () => {
      const now = Date.now();
      if (now - lastKickRef.current < 500) return; // debounce
      lastKickRef.current = now;
      if (statusRef.current !== "checking") setStatus("checking");
      roleCheckedRef.current = false;
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
  }, [supabase, isLoginPage, pathname, area]);

  if (status !== "authed") {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking session…
      </div>
    );
  }
  return <>{children}</>;
}
