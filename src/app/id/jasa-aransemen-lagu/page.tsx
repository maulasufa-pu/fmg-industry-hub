import type { Metadata } from "next";
import { arrangementFaqs } from "@/lib/arrangement-faqs";
import { JsonLd, type Json } from "@/components/JsonLd";
import ArrangementServiceLanding from "@/components/seo/ArrangementServiceLanding";
import { NEW_CUSTOMER_PROMO_IDR } from "@/lib/arrangement";
import { siteConfig } from "@/lib/site";

const path = "/id/jasa-aransemen-lagu";
const pageUrl = `${siteConfig.url}${path}`;

const description =
  "Kirim voice note, demo, melodi, chord, atau vokal. Flemmo Music mengembangkan materi lagumu menjadi aransemen profesional. Konsultasikan kebutuhanmu via WhatsApp.";

export const metadata: Metadata = {
  title: {
    absolute: "Jasa Aransemen Lagu Profesional Online | Flemmo Music",
  },
  description,
  alternates: {
    canonical: pageUrl,
    languages: {
      "id-ID": pageUrl,
      "en-US": `${siteConfig.url}/arrangement`,
      "x-default": `${siteConfig.url}/arrangement`,
    },
  },
  openGraph: {
    title: "Jasa Aransemen Lagu Profesional Online",
    description,
    url: pageUrl,
    locale: "id_ID",
    alternateLocale: ["en_US"],
    type: "website",
    siteName: "FMG Universe",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Jasa aransemen dan produksi lagu profesional dari FMG Universe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jasa Aransemen Lagu Profesional Online | Flemmo Music",
    description,
    images: [`${pageUrl}/opengraph-image`],
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
};

const faqs = arrangementFaqs.map(({ q, a }) => [q.id, a.id] as const);

const schema: Json = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: `${siteConfig.url}/id`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Jasa Aransemen Lagu",
        item: pageUrl,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}/#service`,
    name: "Jasa Aransemen Lagu Profesional",
    alternateName: [
      "Jasa aransemen musik",
      "Jasa produksi lagu",
      "Music arrangement service",
    ],
    serviceType: "Jasa aransemen lagu",
    description,
    url: pageUrl,
    inLanguage: "id-ID",
    provider: {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: "FMG Universe",
      url: siteConfig.url,
    },
    areaServed: [
      {
        "@type": "Country",
        name: "Indonesia",
      },
      {
        "@type": "Place",
        name: "Worldwide",
      },
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.url}/order/arrangement`,
      availableLanguage: ["Indonesian", "English"],
    },
    offers: {
      "@type": "Offer",
      name: "Paket Proyek Pertama",
      price: NEW_CUSTOMER_PROMO_IDR,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/order/arrangement`,
      category: "Paket aransemen dan produksi lagu untuk klien baru",
      eligibleCustomerType: "Klien baru",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  },
];

export default function Page() {
  return (
    <>
      <JsonLd id="jasa-aransemen-lagu-schema" data={schema} />
      <ArrangementServiceLanding />
    </>
  );
}