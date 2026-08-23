import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Media Inquiry" };
export default function Page() { return <InquiryPage eyebrow="FMG Media" title="Plan media work with FMG." description="Tell us about the campaign, content, audience, channels, and intended launch date." reason="project" subject="Media project inquiry" highlights={["Content and campaign scope", "Audience, channels, and launch timing", "Budget range and required deliverables"]} backHref="/media" backLabel="Back to Media" />; }
