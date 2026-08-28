import type { Metadata } from "next";
import { JsonLd, type Json } from "@/components/JsonLd";
import ArrangementServiceLanding from "@/components/seo/ArrangementServiceLanding";
import { NEW_CUSTOMER_PROMO_IDR } from "@/lib/arrangement";
import { siteConfig } from "@/lib/site";

const path = "/id/jasa-aransemen-lagu";
const pageUrl = `${siteConfig.url}${path}`;
const description = "Jasa aransemen lagu profesional online: aransemen, produksi, editing, mixing, mastering, dan vocal directing. Paket project pertama Rp6 juta.";

export const metadata: Metadata = {
  title: { absolute: "Jasa Aransemen Lagu Profesional | FMG Universe" },
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
    title: "Jasa Aransemen Lagu Profesional",
    description,
    url: pageUrl,
    locale: "id_ID",
    alternateLocale: ["en_US"],
    type: "website",
    siteName: "FMG Universe",
    images: [{ url: `${pageUrl}/opengraph-image`, width: 1200, height: 630, alt: "Jasa aransemen lagu profesional dari FMG Universe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jasa Aransemen Lagu Profesional | FMG Universe",
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

const faqs = [
  ["Apa yang perlu saya kirim untuk memulai?", "Kirim voice note, vokal, melodi, chord, lirik, struktur kasar, serta dua atau tiga referensi yang membantu menjelaskan arah lagu."],
  ["Apakah lagu saya akan dibeli atau diambil FMG?", "Tidak. Kamu membeli jasa aransemen dan produksi. Credit, ownership, session assets, lisensi, serta pengalihan hak hanya berlaku jika tertulis dalam dokumen project yang kamu setujui."],
  ["Berapa harga jasa aransemen lagu?", "Paket project pertama tersedia seharga Rp6.000.000 untuk scope yang tercantum. Kebutuhan di luar scope dikonfirmasi sebelum dikerjakan."],
  ["Berapa lama proses aransemen lagu?", "Timeline ditentukan setelah materi dan kompleksitas lagu diperiksa. Tanggal mulai, milestone review, dan target delivery ditulis sebelum produksi."],
  ["Apakah bisa dikerjakan sepenuhnya online?", "Bisa. Brief, file, komunikasi, review, revisi, status project, dan delivery dapat dikelola melalui flow online FMG."],
  ["Apakah mixing dan mastering termasuk?", "Ya. Editing, mixing, dan mastering termasuk dalam Paket Project Pertama. Detail format file akhir mengikuti scope yang disetujui."],
] as const;

const schema: Json = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Jasa Aransemen Lagu", item: pageUrl },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}/#service`,
    name: "Jasa Aransemen Lagu Profesional",
    alternateName: ["Jasa aransemen musik", "Music arrangement service"],
    serviceType: "Music arrangement and production",
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
      { "@type": "Country", name: "Indonesia" },
      { "@type": "Place", name: "Worldwide" },
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.url}/order/arrangement`,
      availableLanguage: ["Indonesian", "English"],
    },
    offers: {
      "@type": "Offer",
      name: "Paket Project Pertama",
      price: NEW_CUSTOMER_PROMO_IDR,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/order/arrangement`,
      category: "New customer music arrangement package",
      eligibleCustomerType: "New customer",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
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
