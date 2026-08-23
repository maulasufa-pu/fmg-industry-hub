// src/app/admin/layout.tsx (SERVER)
import "@/app/globals.css";
import React from "react";
import AdminShell from "./admin_shell";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login?next=/admin/dashboard");
  if (!auth.isAdmin) redirect("/client/dashboard?error=forbidden");
  return <AdminShell role={auth.effectiveRole}>{children}</AdminShell>;
}
