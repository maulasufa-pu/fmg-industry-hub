
import type { Metadata } from "next";
import ServicesPricingCatalog from "@/components/public/ServicesPricingCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Arrangement Pricing & Process",
  description: "Review how arrangement pricing, scope, timeline, revisions, deliverables, and payment are confirmed before production.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Music Arrangement Pricing & Process | FMG Universe",
    description: "Compare arrangement packages and confirm scope, timeline, revisions, deliverables, ownership, and payment before production.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return <ServicesPricingCatalog view="pricing" />;
}
