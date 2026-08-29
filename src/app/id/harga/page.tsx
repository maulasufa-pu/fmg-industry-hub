import type { Metadata } from "next";
import ServicesPricingCatalog from "@/components/public/ServicesPricingCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Harga Jasa Aransemen dan Produksi Musik",
  description: "Lihat harga dan paket jasa aransemen lagu, layanan yang termasuk, timeline, revisi, serta alur pembayaran FMG Universe.",
  alternates: {
    canonical: "/id/harga",
    languages: { "id-ID": "/id/harga", "en-US": "/pricing", "x-default": "/pricing" },
  },
  openGraph: {
    title: "Harga Jasa Aransemen Musik | FMG Universe",
    description: "Bandingkan paket dan layanan aransemen musik dengan harga serta scope yang transparan.",
    url: "/id/harga",
    locale: "id_ID",
    type: "website",
  },
};

export default function IndonesianPricingPage() {
  return <ServicesPricingCatalog view="pricing" language="id" />;
}
