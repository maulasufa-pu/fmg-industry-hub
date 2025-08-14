// src/app/client/layout.tsx
"use client";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;
import { useReInitOnFocus } from "@/hooks/useReInitOnFocus";

import "@/app/globals.css";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
import React from "react";


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // State dan handler refresh
  useReInitOnFocus();
  const [loading, setLoading] = React.useState(false);
  const handleRefresh = async () => {
    setLoading(true);
    window.dispatchEvent(new Event('client-refresh'));
    setTimeout(() => setLoading(false), 1000); // simulasi
  };

  return (
    <RequireAuth>
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        <SidebarSection />
        <main className="flex-1 min-w-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            style={{ position: 'absolute', top: 16, right: 32, zIndex: 50 }}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
          {children}
        </main>
      </div>
    </RequireAuth>
  );
  
}