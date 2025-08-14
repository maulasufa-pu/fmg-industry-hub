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
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[timeout] ${tag} > ${ms}ms`)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
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
  const busy = useRef(false);
  const last = useRef(0);

  useEffect(() => {
    const recover = async (reason: string) => {
      const now = Date.now();
      if (busy.current || now - last.current < 600) return; // debounce
      busy.current = true;

      try {
        // 1) Coba “pulihkan sistem” secara halus, batasi tiap step dengan timeout
        const supabase = getSupabaseClient();

        // Pastikan session “terbaca”; kalau macet >700ms, anggap beku
        try {
          await withTimeout(supabase.auth.getSession(), 700, "getSession");
        } catch {
          // Coba refresh cepat; kalau macet, lanjut ke fallback refresh RSC
          try { await withTimeout(supabase.auth.refreshSession(), 800, "refreshSession"); } catch {}
        }

        // 2) Soft refresh RSC boundary (tanpa full reload)
        //    startTransition supaya tidak block UI thread
        startTransition(() => router.refresh());

      } finally {
        last.current = Date.now();
        busy.current = false;
      }
    };

    // Handler multi-skenario
    const onFocus = () => recover("focus");
    const onVisibility = () => {
      if (document.visibilityState === "visible") recover("visibility");
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // BFCache restore di mobile: e.persisted true → wajib refresh RSC
      if ((e as any).persisted) recover("pageshow-bfcache");
      else recover("pageshow");
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow as any);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow as any);
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