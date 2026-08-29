import type { Metadata } from "next";
import { Suspense } from "react";
import PortfolioClient from "@/app/portfolio/PortfolioClient";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portofolio Aransemen dan Produksi Musik",
  description: "Dengarkan pilihan project aransemen, produksi, mixing, mastering, publishing, dan rilisan yang dikerjakan FMG Universe.",
  alternates: {
    canonical: "/id/portofolio",
    languages: { "id-ID": "/id/portofolio", "en-US": "/portfolio", "x-default": "/portfolio" },
  },
  openGraph: {
    title: "Portofolio Aransemen dan Produksi Musik | FMG Universe",
    description: "Pilihan hasil kerja aransemen dan produksi musik FMG Universe.",
    url: "/id/portofolio",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/portfolio/opengraph-image", width: 1200, height: 630, alt: "Portofolio FMG Universe" }],
  },
};

export default function IndonesianPortfolioPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white dark:bg-black" />}>
      <PortfolioClient />
      <JsonLd id="portfolio-collection-id" data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Portofolio aransemen dan produksi musik FMG Universe", url: `${siteConfig.url}/id/portofolio`, inLanguage: "id-ID" }} />
    </Suspense>
  );
}
