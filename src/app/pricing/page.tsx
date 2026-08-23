
import type { Metadata } from "next";
import ArrangementOffer from "@/components/public/ArrangementOffer";

export const metadata: Metadata = {
  title: "Music Arrangement Pricing & Process",
  description: "Review how arrangement pricing, scope, timeline, revisions, deliverables, and payment are confirmed before production.",
};

export default function PricingPage() {
  return <ArrangementOffer />;
}
