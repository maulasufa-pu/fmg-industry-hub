import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Press Room" };
export default function Page() { return <InquiryPage eyebrow="Press room" title="Request facts, assets, or an interview." description="Include your publication, deadline, topic, intended format, and the FMG person or project you are covering." reason="press" subject="Press request" highlights={["Publication and commissioning editor", "Deadline, format, and topic", "Requested spokesperson or assets"]} backHref="/about" backLabel="About FMG" />; }
