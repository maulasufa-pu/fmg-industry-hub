import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Help & Support" };
export default function Page() { return <InquiryPage eyebrow="Help center" title="Tell us what is blocking you." description="For faster support, include the affected project or invoice number, what you expected, and what happened. Never send passwords or payment-card details." reason="support" subject="Support request" highlights={["Project or invoice number when relevant", "Steps that produced the problem", "Screenshot link with sensitive details removed"]} />; }
