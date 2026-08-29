import type { Metadata } from "next";
import { Suspense } from "react";
import PortfolioClient from "@/app/portfolio/PortfolioClient";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Explore our portfolio of successful music projects, artist collaborations, and creative productions. Discover the quality and creativity that defines Flemmo Music Global.",
  alternates: { canonical: "/portfolio", languages: { "en-US": "/portfolio", "id-ID": "/id/portofolio", "x-default": "/portfolio" } },
  openGraph: {
    title: "Portfolio aransemen dan produksi musik — FMG Universe",
    description: "Explore our portfolio of successful music projects, artist collaborations, and creative productions.",
    images: [
      {
        url: "/portfolio/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FMG Universe Portfolio"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio aransemen dan produksi musik — FMG Universe",
    description: "Explore our portfolio of successful music projects, artist collaborations, and creative productions.",
    images: ["/portfolio/opengraph-image"],
  },
};

export default function PortfolioPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white dark:bg-black" />}>
      <PortfolioClient />
      <JsonLd id="portfolio-collection" data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "FMG music arrangement portfolio", url: `${siteConfig.url}/portfolio`, description: "Selected music arrangement, production, mixing, publishing, and release work by FMG." }} />
    </Suspense>
  );
}
