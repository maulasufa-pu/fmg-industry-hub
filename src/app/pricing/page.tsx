
import type { Metadata } from "next";
import ServicesPricingCatalog from "@/components/public/ServicesPricingCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Arrangement Pricing & Process",
  description: "Review how arrangement pricing, scope, timeline, revisions, deliverables, and payment are confirmed before production.",
};

export default function PricingPage() {
  return <ServicesPricingCatalog />;
}
