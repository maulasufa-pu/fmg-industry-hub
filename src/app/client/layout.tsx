// src/app/client/layout.tsx
"use client";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

import "@/app/globals.css";
import ClientWakeRefetch from "@/components/ClientWakeRefetch";
import ClientWakeReloader from "@/components/ClientWakeReloader";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import ClientAutoF5 from "@/components/ClientWakeReloader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useFocusWarmAuth();
    return (
    <RequireAuth>
      <ClientAutoF5/>
      <ClientWakeRefetch />
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        <SidebarSection />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </RequireAuth>
  );
  
}