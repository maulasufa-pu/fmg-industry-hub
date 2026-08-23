import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "FMG Labs Beta" };
export default function Page() { return <InquiryPage eyebrow="FMG Labs beta" title="Apply to test a focused workflow." description="Describe your role, current workflow, the problem you want solved, and how often you can provide structured feedback." reason="other" subject="FMG Labs beta application" highlights={["Real workflow and repeatable use case", "Availability for structured feedback", "No confidential audio unless a test explicitly permits it"]} backHref="/labs" backLabel="Back to Labs" />; }
