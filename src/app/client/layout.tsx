// src/app/client/layout.tsx (SERVER)
import "@/app/globals.css";
import React from "react";

import RequireAuth from "@/app/auth/RequireAuth";
import ClientShell from "./client_shell";
import { getEffectiveRole } from "@/lib/roles/effective";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const role = await getEffectiveRole();  // ← role sudah akurat di server

  // Otorisasi area client (punya RequireAuth mu sendiri)
  return (
    <RequireAuth area="client">
      <ClientShell role={role}>{children}</ClientShell>
    </RequireAuth>
  );
}