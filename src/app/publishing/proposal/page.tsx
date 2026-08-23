import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Publishing Proposal" };
export default function Page() { return <InquiryPage eyebrow="Publishing proposal" title="Submit a catalog proposal—not an arrangement order." description="Use this only for publishing administration, licensing, or catalog opportunities. To buy arrangement services, use the arrangement service page." reason="publishing" subject="Publishing catalog proposal" highlights={["List the rights you control", "Include catalog size and representative private/public links", "State the deal or administration support requested"]} backHref="/publishing" backLabel="Back to Publishing" />; }
