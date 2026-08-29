import type { Metadata } from "next";
import ServicesPricingCatalog from "@/components/public/ServicesPricingCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Layanan Aransemen dan Produksi Musik",
  description: "Pilih jasa aransemen, produksi musik, editing, mixing, mastering, dan vocal directing dengan scope project yang jelas.",
  alternates: {
    canonical: "/id/layanan",
    languages: { "id-ID": "/id/layanan", "en-US": "/services", "x-default": "/services" },
  },
  openGraph: {
    title: "Layanan Aransemen dan Produksi Musik | FMG Universe",
    description: "Layanan musik profesional dengan scope, timeline, revisi, deliverable, dan ownership yang jelas.",
    url: "/id/layanan",
    locale: "id_ID",
    type: "website",
  },
};

export default function IndonesianServicesPage() {
  return <ServicesPricingCatalog view="services" language="id" />;
}
