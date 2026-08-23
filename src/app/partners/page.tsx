import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Partnerships" };
export default function Page() { return <InquiryPage eyebrow="Partnerships" title="Build a specific partnership." description="Share the opportunity, what each party contributes, the intended audience, and the outcome you want to create." reason="partnership" subject="Partnership proposal" highlights={["Clear value exchange", "Named decision makers and timeline", "Measurable audience or business outcome"]} />; }
