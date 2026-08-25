import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Apply to FMG Academy", robots: { index: false, follow: true } };
export default function Page() { return <InquiryPage eyebrow="FMG Academy" title="Apply with a clear learning goal." description="Tell us your current level, the skill you want to develop, your availability, and a link to relevant work if you have one." reason="other" subject="FMG Academy application" highlights={["Current experience and learning goal", "Preferred program or discipline", "Portfolio link is helpful, not mandatory"]} backHref="/academy" backLabel="Back to Academy" />; }
