
import type { Metadata } from "next";
import ArrangementOffer from "@/components/public/ArrangementOffer";

export const metadata: Metadata = {
  title: "Music Arrangement Service",
  description: "Professional music arrangement with a clear scope, timeline, revisions, deliverables, ownership, and payment flow.",
};

export default function ServicesPage() {
  return <ArrangementOffer />;
}
