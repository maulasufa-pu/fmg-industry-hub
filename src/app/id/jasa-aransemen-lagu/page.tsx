import type { Metadata } from "next";
import { JsonLd, type Json } from "@/components/JsonLd";
import ArrangementServiceLanding from "@/components/seo/ArrangementServiceLanding";
import { NEW_CUSTOMER_PROMO_IDR } from "@/lib/arrangement";
import { siteConfig } from "@/lib/site";

const path = "/id/jasa-aransemen-lagu";
const pageUrl = `${siteConfig.url}${path}`;

const description =
  "Jasa aransemen lagu profesional secara online, mulai dari pengembangan demo, produksi, dan vocal directing hingga mixing dan mastering. Paket proyek pertama Rp6 juta.";

export const metadata: Metadata = {
  title: {
    absolute: "Jasa Aransemen Lagu Profesional Online | FMG Universe",
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
    title: "Jasa Aransemen Lagu Profesional Online | FMG Universe",
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
  [
    "Apa yang perlu saya kirim untuk memulai?",
    "Tidak harus berupa demo yang sudah rapi. Kirim saja materi yang kamu punya, seperti voice note, rekaman vokal, melodi, chord, lirik, atau gambaran struktur lagunya. Dua atau tiga lagu referensi juga akan membantu kami memahami karakter musik yang kamu inginkan.",
  ],
  [
    "Apakah FMG akan membeli atau mengambil lagu saya?",
    "Tidak. FMG membantu mengaransemen dan memproduksi lagumu, bukan mengambil alih karya tersebut. Ketentuan mengenai credit, kepemilikan, file sesi produksi, lisensi, atau pengalihan hak hanya berlaku jika tertulis dalam dokumen proyek yang kamu setujui.",
  ],
  [
    "Berapa biaya jasa aransemen lagu?",
    "Untuk klien baru, Paket Proyek Pertama tersedia dengan harga Rp6.000.000 sesuai layanan yang tercantum di dalam paket. Jika lagumu membutuhkan pengerjaan tambahan di luar paket, kami akan membicarakannya terlebih dahulu sebelum proses dimulai.",
  ],
  [
    "Berapa lama proses pengerjaannya?",
    "Setiap lagu memiliki kebutuhan dan tingkat kerumitan yang berbeda. Setelah materimu kami pelajari, kamu akan mendapatkan informasi mengenai jadwal mulai, tahapan review, dan perkiraan waktu penyelesaian sebelum produksi berjalan.",
  ],
  [
    "Apakah seluruh proses bisa dilakukan secara online?",
    "Bisa. Kamu dapat mengirim materi, mendiskusikan arah musik, memantau perkembangan proyek, memberikan revisi, dan menerima hasil akhirnya secara online melalui sistem FMG.",
  ],
  [
    "Apakah mixing dan mastering sudah termasuk?",
    "Sudah. Editing, mixing, dan mastering termasuk dalam Paket Proyek Pertama. Format serta jenis file akhir yang kamu terima akan mengikuti kebutuhan dan kesepakatan proyek.",
  ],
] as const;

const schema: Json = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: siteConfig.url,
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
    name: "Jasa Aransemen dan Produksi Lagu Profesional",
    alternateName: [
      "Jasa aransemen musik",
      "Jasa produksi lagu",
      "Music arrangement service",
    ],
    serviceType: "Jasa aransemen dan produksi musik",
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