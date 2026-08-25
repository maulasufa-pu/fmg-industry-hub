import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Event Inquiry", robots: { index: false, follow: true } };
export default function Page() { return <InquiryPage eyebrow="Events" title="Scope an event with FMG." description="Share the event format, city or remote setup, target date, audience, venue status, and the production or talent support required." reason="project" subject="Event project inquiry" highlights={["Date, location, and venue status", "Audience size and program format", "Production, talent, media, and sponsor needs"]} backHref="/event" backLabel="Back to Events" />; }
