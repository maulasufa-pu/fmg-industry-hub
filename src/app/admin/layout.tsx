// src/app/admin/layout.tsx
import "@/app/globals.css";
import React from "react";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
