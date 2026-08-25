import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";

export const metadata: Metadata = { title: "Ask About Music Arrangement", description: "Ask FMG about arrangement scope before creating an account.", robots: { index: false, follow: true } };

export default function Page() {
  return <InquiryPage eyebrow="No account required" title="Ask about your arrangement first." description="Not ready to place an order? Send the song context and your questions. This is a service inquiry—not a song-sale submission." reason="project" subject="Music arrangement inquiry" highlights={["Tell us what material you already have", "Share links that are accessible without requesting permission", "FMG replies with the next practical step"]} backHref="/services" backLabel="Back to arrangement service" />;
}
