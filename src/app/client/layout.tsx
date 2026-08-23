// src/app/client/layout.tsx (SERVER)
import "@/app/globals.css";
import React from "react";

import ClientShell from "./client_shell";
import GlobalChatPopover from "@/components/chat/GlobalChatPopover";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login?next=/client/dashboard");

  return (
    <ClientShell role={auth.effectiveRole}>
      {children}
      <GlobalChatPopover />
    </ClientShell>
  );
}
