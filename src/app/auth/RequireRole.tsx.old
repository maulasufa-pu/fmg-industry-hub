"use client";

import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role = "admin" | "staff" | "client";
type GuardStatus = "checking" | "ok" | "forbidden";

type Props = {
  children: React.ReactNode;
  required: Role | Role[];
  /** Redirect ke /403 saat role tidak memenuhi (default: true) */
  redirectOnForbidden?: boolean;
  /** Nama event window untuk re-check (opsional, mis: "admin-wake" / "client-wake") */
  wakeEventName?: string;
};

export default function RequireRole({
  children,
  required,
  redirectOnForbidden = true,
  wakeEventName,
}: Props): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [status, setStatus] = useState<GuardStatus>("checking");
  const statusRef = useRef<GuardStatus>("checking");
  useEffect(() => { statusRef.current = status; }, [status]);

  const isAllowed = (role: Role | null): boolean => {
    if (!role) return false;
    return Array.isArray(required) ? required.includes(role) : role === required;
  };

  const fetchRole = async (): Promise<Role | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return null;
      return (data?.role ?? "client") as Role;
    } catch {
      return null;
    }
  };

  const evaluate = async () => {
    setStatus("checking");
    const role = await fetchRole();
    if (!isAllowed(role)) {
      setStatus("forbidden");
      if (redirectOnForbidden && statusRef.current !== "forbidden") {
        startTransition(() => {
          const to = `/403?from=${encodeURIComponent(pathname ?? "/")}`;
          router.replace(to);
        });
      }
      return;
    }
    setStatus("ok");
  };

  useEffect(() => {
    void evaluate();

    // re-check saat auth berubah
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void evaluate();
    });

    // opsional: re-check saat WAKE event
    const onWake = () => { void evaluate(); };
    if (wakeEventName) {
      window.addEventListener(wakeEventName, onWake as EventListener, { passive: true });
    }

    // juga saat kembali fokus/BFCache
    const onVis = () => { if (document.visibilityState === "visible") void evaluate(); };
    const onShow = () => { void evaluate(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onShow, { passive: true });

    return () => {
      subscription.unsubscribe();
      if (wakeEventName) window.removeEventListener(wakeEventName, onWake as EventListener);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, pathname, wakeEventName]);

  if (status !== "ok") {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking permission…
      </div>
    );
  }
  return <>{children}</>;
}
