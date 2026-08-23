import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Publishing Inquiry" };
export default function Page() { return <InquiryPage eyebrow="Publishing" title="Ask about rights, administration, or distribution." description="Describe the catalog, current rights position, territories, release status, and the publishing support you need." reason="publishing" subject="Publishing inquiry" highlights={["Catalog and rights overview", "Territories and release status", "Administration, licensing, or distribution need"]} backHref="/publishing" backLabel="Back to Publishing" />; }
