// src/app/layout.tsx

"use client";
import "./globals.css";
import { HeaderSection } from "@/app/ui/HeaderSection";
import { LogoSection } from "@/app/ui/LogoSection";
import HeaderVisibility from "@/components/ui/HeaderVisibility";
import { usePathname } from "next/navigation";

function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client"); // halaman sidebar

  const wrapperCls = isApp
    ? "w-full" 
    : "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  return <main className={wrapperCls}>{children}</main>;
}

function Footer() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client");

  if (isApp) return null; // sembunyiin footer di halaman app
  return (
    <section
      aria-label="Trusted by"
      className="border-b border-[var(--border)] bg-[var(--card)]"
    >
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <LogoSection />
      </div>
    </section>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <HeaderVisibility>
          <header className="sticky top-0 inset-x-0 z-50 bg-defaultwhite border-b border-[var(--border)]">
            <div className="mx-auto w-full max-w-screen-xl">
              <HeaderSection />
            </div>
          </header>
        </HeaderVisibility>

        <MainContainer>{children}</MainContainer>
        <Footer />
      </body>
    </html>
  );
}
