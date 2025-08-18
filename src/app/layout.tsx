// src/app/layout.tsx

"use client";
import "./globals.css";
import { HeaderSection } from "@/app/ui/HeaderSection";
import { LogoSection } from "@/app/ui/LogoSection";
import HeaderVisibility from "@/components/ui/HeaderVisibility";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";

function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client") || pathname?.startsWith("/admin") || pathname?.startsWith("/profile"); // halaman sidebar + profile

  const wrapperCls = isApp
    ? "w-full h-full max-w-none" 
    : "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  return <main className={wrapperCls}>{children}</main>;
}

function Header() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client") || pathname?.startsWith("/admin") || pathname?.startsWith("/profile"); // halaman dengan sidebar

  if (isApp) return null; // sembunyikan header di halaman app

  return (
    <HeaderVisibility>
      <header className="sticky top-0 inset-x-0 z-50 bg-defaultwhite dark:bg-gray-900 border-b border-[var(--border)] dark:border-gray-700">
        <div className="mx-auto w-full max-w-screen-xl">
          <HeaderSection />
        </div>
      </header>
    </HeaderVisibility>
  );
}

function ThemeToggleWrapper() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client") || pathname?.startsWith("/admin") || pathname?.startsWith("/profile"); // halaman dengan sidebar

  if (isApp) return null; // sembunyikan theme toggle di halaman app

  return <ThemeToggle />;
}

function Footer() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client") || pathname?.startsWith("/admin") || pathname?.startsWith("/profile"); // halaman sidebar + profile

  if (isApp) return null; // sembunyikan footer di halaman app
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
      <body className="bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemeToggleWrapper />
          <Header />
          <MainContainer>{children}</MainContainer>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
