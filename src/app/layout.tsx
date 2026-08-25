//E:\FMGIH\fmg-industry-hub\src\app\layout.tsx
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/site";
import "./globals.css";
import AppShell from "./AppShell";
import { ThemeProvider } from "next-themes";
import { ClientCurrencyProvider } from "@/components/ClientCurrencyProvider";
import ConsentManager from "@/components/privacy/ConsentManager";
import FeedbackHost from "@/components/ui/FeedbackHost";
import { JsonLd } from "@/components/JsonLd";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    locale: siteConfig.localeDefault,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.social.twitter,
    creator: siteConfig.social.twitter,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "music",
  creator: siteConfig.name,
  publisher: siteConfig.name,
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  verification: googleVerification || bingVerification ? {
    google: googleVerification,
    other: bingVerification ? { "msvalidate.01": bingVerification } : undefined,
  } : undefined,
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: "FMG Universe",
    legalName: "PT. Flemmo Music Global",
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    sameAs: [siteConfig.social.instagram, siteConfig.social.youtube].filter((value): value is string => Boolean(value)),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: "FMG Universe",
    alternateName: "Flemmo Music Global",
    url: siteConfig.url,
    inLanguage: ["en-US", "id-ID"],
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd id="organization-schema" data={organization} />
        <JsonLd id="website-schema" data={website} />
        <ConsentManager>
          <FeedbackHost />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
            storageKey="fmg-theme"
          >
            <ClientCurrencyProvider defaultCurrency="USD">
              <AppShell>{children}</AppShell>
            </ClientCurrencyProvider>
          </ThemeProvider>
        </ConsentManager>
      </body>
    </html>
  );
}
