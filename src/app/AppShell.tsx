//E:\FMGIH\fmg-industry-hub\src\app\AppShell.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Footer from "@/app/ui/page_section/FooterSection";
import { HeaderSection } from "@/app/ui/page_section/HeaderSection";

function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp =
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/profile");

  const FULL_BLEED = ["/"];
  const isFullBleed =
    FULL_BLEED.some((p) => pathname === p || pathname?.startsWith(`${p}`));

  const wrapperCls =
    isApp || isFullBleed
      ? "w-full"
      : "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  return <div className={wrapperCls}>{children}</div>;
}

function Header() {
  const pathname = usePathname();
  const isApp =
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/profile");

  if (isApp) return null;
  return <HeaderSection />;
}

function FooterWrapper() {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith("/admin") || pathname?.startsWith("/client");
  if (hideFooter) return null;
  return <Footer />;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MainContainer>{children}</MainContainer>
      <FooterWrapper />
    </>
  );
}
