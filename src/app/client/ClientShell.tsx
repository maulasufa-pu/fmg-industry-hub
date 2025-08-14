// app/client/ClientShell.tsx  (CLIENT)
"use client";

import React, { useEffect, useRef } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
// import { getSupabaseClient } from "@/lib/supabase/client"; // tak perlu jika hanya wake event

const WAKE_EVENT = "client-wake";
const DEBOUNCE_MS = 1500;

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const last = useRef(0);

  useEffect(() => {
    const fire = () => {
      const now = Date.now();
      if (now - last.current < DEBOUNCE_MS) return;
      last.current = now;
      // Satu-satunya hal yang kita lakukan saat fokus/visible:
      window.dispatchEvent(new Event(WAKE_EVENT));
    };

    const onFocus = () => fire();
    const onVis = () => { if (document.visibilityState === "visible") fire(); };
    const onPageShow = () => fire(); // aman untuk BFCache juga

    window.addEventListener("focus", onFocus, { passive: true });
    document.addEventListener("visibilitychange", onVis, { passive: true });
    window.addEventListener("pageshow", onPageShow, { passive: true });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    // <RequireAuth>
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        <SidebarSection />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    // </RequireAuth>
  );
}
 