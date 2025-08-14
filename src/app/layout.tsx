// src/app/layout.tsx
import "./globals.css";
import HeaderVisibility from "@/components/ui/HeaderVisibility"; // ini client, aman dipakai dari server layout
import { HeaderSection } from "@/components/HeaderSection";
import MainContainerClient from "@/components/shell/MainContainerClient";
import FooterClient from "@/components/shell/FooterClient";

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

        <MainContainerClient>{children}</MainContainerClient>
        <FooterClient />
      </body>
    </html>
  );
}
