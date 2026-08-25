
import type { Metadata } from "next";
import ServicesPricingCatalog from "@/components/public/ServicesPricingCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Arrangement Service",
  description: "Professional music arrangement with a clear scope, timeline, revisions, deliverables, ownership, and payment flow.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Music Arrangement Service | FMG Universe",
    description: "Professional music arrangement with a clear scope, timeline, revisions, deliverables, ownership, and payment flow.",
    url: "/services",
    type: "website",
  },
};

export default function ServicesPage() {
  return <ServicesPricingCatalog view="services" />;
}
