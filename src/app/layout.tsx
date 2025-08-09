// src/app/layout.tsx
import "./globals.css";
import { HeaderSection } from "@/components/HeaderSection";
import { LogoSection } from "@/components/LogoSection";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Sticky header */}
        <header className="sticky top-0 inset-x-0 z-50 bg-defaultwhite border-b border-[var(--border)]">
          <div className="mx-auto w-full max-w-screen-xl">
            <HeaderSection />
          </div>
        </header>


        {/* Konten */}
        <main className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Logo strip */}
        <section
          aria-label="Trusted by"
          className="border-b border-[var(--border)] bg-[var(--card)]"
        >
          <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <LogoSection />
          </div>
        </section>
      </body>
    </html>
  );
}
