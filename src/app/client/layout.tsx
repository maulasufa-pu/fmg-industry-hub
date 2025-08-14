// src/app/client/layout.tsx
"use client";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;
import { useReInitOnFocus } from "@/hooks/useReInitOnFocus";

import "@/app/globals.css";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
import React, { useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";


// util: timeout guard untuk promise apa pun
function withTimeout<T>(p: Promise<T>, ms: number, tag = "op"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`[timeout] ${tag} > ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch((e) => { clearTimeout(t); reject(e); });
  });
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // State dan handler refresh
  // useReInitOnFocus();
  // const [loading, setLoading] = React.useState(false);
  // const handleRefresh = async () => {
  //   setLoading(true);
  //   window.dispatchEvent(new Event('client-refresh'));
  //   setTimeout(() => setLoading(false), 1000); // simulasi
  // };

  const router = useRouter();
  const busyRef = useRef(false);
  const lastRunRef = useRef(0);

  useEffect(() => {
    const recover = async (reason: string) => {
      const now = Date.now();
      if (busyRef.current || now - lastRunRef.current < 600) return; // debounce
      busyRef.current = true;

      try {
        const supabase = getSupabaseClient();

        // Pastikan session kebaca; jika macet, coba refresh cepat.
        try {
          await withTimeout(supabase.auth.getSession(), 700, "getSession");
        } catch {
          try {
            await withTimeout(supabase.auth.refreshSession(), 800, "refreshSession");
          } catch {
            // diamkan: fallback berikutnya akan memulihkan UI
          }
        }

        // Soft refresh RSC boundary (tanpa full reload)
        startTransition(() => router.refresh());
      } finally {
        lastRunRef.current = Date.now();
        busyRef.current = false;
      }
    };

    const onFocus = () => { void recover("focus"); };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void recover("visibility");
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      // BFCache restore di mobile/Chromium
      if (e.persisted) {
        void recover("pageshow-bfcache");
      } else {
        void recover("pageshow");
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return (
    <RequireAuth>
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        <SidebarSection />
        <main className="flex-1 min-w-0">
          {/* <button
            onClick={handleRefresh}
            disabled={loading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            style={{ position: 'absolute', top: 16, right: 32, zIndex: 50 }}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button> */}
          {children}
        </main>
      </div>
    </RequireAuth>
  );
  
}