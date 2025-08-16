// src/app/admin/layout.tsx (SERVER)
import "@/app/globals.css";
import React from "react";
import RequireAuth from "@/app/auth/RequireAuth";
import AdminShell from "./AdminShell";
import { getEffectiveRole } from "@/lib/roles/effective";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getEffectiveRole();
  return (
    <RequireAuth area="admin">
      <AdminShell role={role}>{children}</AdminShell>
    </RequireAuth>
  );
}