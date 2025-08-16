// app/client/layout.tsx  (SERVER)
import "@/app/globals.css";
import React from "react";
import { getEffectiveRole } from "@/lib/roles/effective";
import ClientShell from "./ClientShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const role = await getEffectiveRole(); // hasilnya "client" | "guest" | ...

  return (
    <ClientShell role={role}>
      {children}
    </ClientShell>
  );
}