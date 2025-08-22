"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Footer from "@/app/ui/page_section/FooterSection";

export default function FooterClient() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client");
  if (isApp) return null;
  return (
    <section
      aria-label="Trusted by"
      className="border-[var(--border)] bg-[var(--card)]"
    >
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Footer />
      </div>
    </section>
  );
}
