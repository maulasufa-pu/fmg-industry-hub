// src/app/layout.tsx

"use client";
import "./globals.css";
import { HeaderSection } from "@/app/ui/page_section/HeaderSection";
import HeaderVisibility from "@/components/ui/HeaderVisibility";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import GlobalSpotlight from "@/app/ui/GlobalSpotlight";
import Footer from "@/app/ui/page_section/FooterSection"; // default import


function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp =
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/profile");

  // daftar halaman yang ingin full-bleed
  const FULL_BLEED = ["/"]; // tambah path lain jika perlu
  const isFullBleed = FULL_BLEED.some(p => pathname === p || pathname?.startsWith(`${p}`));

  const wrapperCls = (isApp || isFullBleed)
    ? "w-full"                               // ⬅️ tidak ada max-w
    : "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  return <main className={wrapperCls}>{children}</main>;
}


// layout.tsx
function Header() {
  const pathname = usePathname();
  const isApp =
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/profile");

  if (isApp) return null;

  // langsung render, tanpa header/container tambahan
  return <HeaderSection />;
}

function ThemeToggleWrapper() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/client") || pathname?.startsWith("/admin") || pathname?.startsWith("/profile"); // halaman dengan sidebar

  if (isApp) return null; // sembunyikan theme toggle di halaman app

  return <ThemeToggle />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-background text-foreground transition-colors duration-300">
        <GlobalSpotlight />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Header/>
          {/* <Header /> */}
          <MainContainer>{children}</MainContainer>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
