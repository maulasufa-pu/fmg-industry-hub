"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function MainContainerClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client");
  const wrapperCls = isApp
    ? "w-full"
    : "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";
  return <main className={wrapperCls}>{children}</main>;
}
