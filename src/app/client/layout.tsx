// src/app/client/layout.tsx (SERVER)
import "@/app/globals.css";
import React from "react";

import RequireAuth from "@/app/auth/RequireAuth";
import ClientShell from "./client_shell";
import { getEffectiveRole } from "@/lib/roles/effective";
import GlobalChatPopover from "@/components/chat/GlobalChatPopover";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const role = await getEffectiveRole();  // role sudah akurat di server

  return (
    <RequireAuth area="client">
      <ClientShell role={role}>
        {children}
        {/* Cukup mount TANPA prop. Tidak ada hooks di server, tidak kirim function */}
        <GlobalChatPopover />
      </ClientShell>
    </RequireAuth>
  );
}