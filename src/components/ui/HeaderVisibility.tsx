"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function HeaderVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Sembunyikan header di /settings atau /client/settings/*
  const hideHeader =
    pathname?.startsWith("/client");

  if (hideHeader) return null;
  return <>{children}</>;
}
