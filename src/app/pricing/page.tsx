
import type { Metadata } from "next";
import ArrangementOffer from "@/components/public/ArrangementOffer";

export const metadata: Metadata = {
  title: "Music Arrangement Pricing",
  description: "Arrangement starts at USD 350, with scope, timeline, revisions, deliverables, and payment confirmed before production.",
};

export default function PricingPage() {
  return <ArrangementOffer />;
}
