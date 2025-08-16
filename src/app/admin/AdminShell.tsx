"use client";

import React, { useEffect, useRef, useMemo } from "react";
import RequireAuth from "@/app/auth/RequireAuth";
import AdminSidebarSection from "@/app/admin/ui/AdminSidebarSection";
import type { UserRole } from "@/lib/roles";

const WAKE_EVENT = "admin-wake";
const DEBOUNCE_MS = 1500;

type Props = {
  role: UserRole;            // ⬅️ diterima dari layout (server)
  children: React.ReactNode;
};

export default function AdminShell({ role, children }: Props): React.JSX.Element {
  const last = useRef<number>(0);

  useEffect(() => {
    const fire = () => {
      const now = Date.now();
      if (now - last.current < DEBOUNCE_MS) return;
      last.current = now;
      window.dispatchEvent(new Event(WAKE_EVENT));
    };
    const onFocus = () => fire();
    const onVis = () => { if (document.visibilityState === "visible") fire(); };
    const onPageShow = () => fire();

    window.addEventListener("focus", onFocus, { passive: true });
    document.addEventListener("visibilitychange", onVis, { passive: true });
    window.addEventListener("pageshow", onPageShow, { passive: true });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // Kalau kamu mau tampilkan badge kecil role di header, bisa pakai memo ini.
  const rolePretty = useMemo(() => role.replace("_", " ").toUpperCase(), [role]);

  return (
    <RequireAuth area="admin">
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        {/* Sidebar kini role-aware */}
        <AdminSidebarSection role={role} />

        <main className="flex-1 min-w-0">
          {/* Optional topbar mini role indicator */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white/70 backdrop-blur border-b px-4 py-2">
            <div className="text-sm text-coolgray-70">FMG Industry Hub</div>
            <div className="text-xs rounded-full border px-2 py-0.5 text-coolgray-70">
              Role: <span className="font-medium">{rolePretty}</span>
            </div>
          </div>

          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
