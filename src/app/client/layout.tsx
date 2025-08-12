// src/app/client/layout.tsx
"use client";
import "@/app/globals.css";
import RequireAuth from "@/components/auth/RequireAuth";
import { SidebarSection } from "@/components/SidebarSection";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import { getSupabaseClient } from "@/lib/client";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  document.addEventListener('visibilitychange', () => {
  console.log('Visibility changed to:', document.visibilityState);
  if (document.visibilityState === 'visible') {
    getSupabaseClient().auth.getSession().then(({ data }) => {
      console.log('Current session after focus:', data.session);
    });
  }
});
  useFocusWarmAuth();
    return (
    <RequireAuth>
      <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen">
        <SidebarSection />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </RequireAuth>
  );
  
}