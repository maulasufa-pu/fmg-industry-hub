// src/app/client/layout.tsx  (SERVER COMPONENT — no “use client”)
import "@/app/globals.css";
import React from "react";
import ClientShell from "./ClientShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientShell>{children}</ClientShell>;
}
