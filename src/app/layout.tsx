// src/app/layout.tsx
"use client";
import "./globals.css";
import { HeaderSection } from "@/app/ui/page_section/HeaderSection";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import GlobalSpotlight from "@/app/ui/GlobalSpotlight";
import Footer from "@/app/ui/page_section/FooterSection";

function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp =
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/profile");

  const FULL_BLEED = ["/"];
  const isFullBleed = FULL_BLEED.some(p => pathname === p || pathname?.startsWith(`${p}`));

  const wrapperCls = (isApp || isFullBleed)
    ? "w-full"
    : "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  return <main className={wrapperCls}>{children}</main>;
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

function ThemeToggleWrapper() {
  const pathname = usePathname();
  const isApp =
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/profile");

  if (isApp) return null;
  return <ThemeToggle />;
}

// ⬇️ HANYA sembunyikan footer di /admin dan /client
function FooterWrapper() {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith("/admin") || pathname?.startsWith("/client");
  if (hideFooter) return null;
  return <Footer />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-background text-foreground transition-colors duration-300">
        <GlobalSpotlight />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Header />
          <MainContainer>{children}</MainContainer>
          <FooterWrapper /> {/* ← ganti dari <Footer /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
