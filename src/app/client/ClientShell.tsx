"use client";

import React, { useEffect, useRef, startTransition } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

function withTimeout<T>(p: Promise<T>, ms: number, tag = "op"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(
      () => reject(new Error(`[timeout] ${tag} > ${ms}ms`)),
      ms
    );
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const busyRef = useRef(false);
  const lastRunRef = useRef(0);

  useEffect(() => {
    const recover = async () => {
      const now = Date.now();
      if (busyRef.current || now - lastRunRef.current < 600) return; // debounce
      busyRef.current = true;

      try {
        const supabase = getSupabaseClient();
        try {
          await withTimeout(supabase.auth.getSession(), 700, "getSession");
        } catch {
          try {
            await withTimeout(supabase.auth.refreshSession(), 800, "refreshSession");
          } catch {
            // ignore
          }
        }
        startTransition(() => router.refresh());
      } finally {
        lastRunRef.current = Date.now();
        busyRef.current = false;
      }
    };

    const onFocus = () => void recover();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void recover();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      void recover();
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
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </RequireAuth>
  );
}
