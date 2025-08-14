"use client";

import React, { useEffect, useRef } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const SOFT_REFRESH_COOLDOWN = 600;       // ms, debounce
const HARD_REFRESH_AFTER = 10 * 60_000;  // ms, >10 menit idle → segarkan RSC sekali

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const busyRef = useRef(false);
  const lastRunRef = useRef(0);
  const lastHardRef = useRef(0);

  useEffect(() => {
    const softRefresh = () => {
      // biar komponen client (dashboard/projects/invoices/etc.) refetch tanpa remount
      window.dispatchEvent(new Event("client-refresh"));
    };

    const maybeRecover = async (reason: "focus" | "visible" | "pageshow" | "pageshow-bfcache") => {
      const now = Date.now();
      if (busyRef.current || now - lastRunRef.current < SOFT_REFRESH_COOLDOWN) return;
      busyRef.current = true;

      try {
        // Pastikan session OK (ini tidak meremount UI)
        await supabase.auth.getSession().catch(() => { /* ignore */ });

        if (reason === "pageshow") {
          // Restore normal: cukup soft refresh
          softRefresh();
        } else if (reason === "pageshow-bfcache") {
          // BFCache restore: lakukan hard refresh sekali (jarang terjadi)
          if (now - lastHardRef.current > 30_000) {
            lastHardRef.current = now;
            router.refresh(); // hanya di BFCache
          }
        } else {
          // focus/visible:
          // Kalau idle > HARD_REFRESH_AFTER, segarkan RSC sekali; selain itu soft saja
          if (now - lastHardRef.current > HARD_REFRESH_AFTER) {
            lastHardRef.current = now;
            router.refresh(); // sesekali agar data server side ikut fresh
          } else {
            softRefresh();
          }
        }
      } finally {
        lastRunRef.current = Date.now();
        busyRef.current = false;
      }
    };

    const onFocus = () => { void maybeRecover("focus"); };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void maybeRecover("visible");
    };
    const onPageShow = (e: PageTransitionEvent) => {
      void maybeRecover(e.persisted ? "pageshow-bfcache" : "pageshow");
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router, supabase]);

  return (
    // <RequireAuth>
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        <SidebarSection />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    // </RequireAuth>
  );
}
