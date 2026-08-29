import type { Metadata } from "next";

import SalesHome from "@/components/public/SalesHome";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Jasa Aransemen dan Produksi Musik Profesional",
  description: "Ubah lirik, melodi, chord, atau rekaman sederhana menjadi lagu siap rilis melalui jasa aransemen, produksi musik, editing vokal, mixing, dan mastering.",
  alternates: { canonical: "/id", languages: { "en-US": "/", "id-ID": "/id", "x-default": "/" } },
  openGraph: { title: "Jasa Aransemen dan Produksi Musik | FMG Universe", description: "Punya ide lagu? FMG Universe membantu menggarapnya menjadi aransemen dan produksi yang utuh hingga siap dirilis.", url: "/id", locale: "id_ID", alternateLocale: ["en_US"], type: "website" },
  twitter: { card: "summary_large_image", title: "Jasa Aransemen dan Produksi Musik | FMG Universe", description: "Punya ide lagu? Kami bantu menggarapnya menjadi produksi yang utuh hingga siap dirilis.", images: ["/opengraph-image"] },
};

export default function IndonesianSalesHub() {
  return <SalesHome language="id" />;
}
