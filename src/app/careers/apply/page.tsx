import type { Metadata } from "next";
import InquiryPage from "@/components/public/InquiryPage";
export const metadata: Metadata = { title: "Apply to FMG" };
export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const selectedRole = role?.trim() || "General application";
  return <InquiryPage eyebrow="Careers" title={`Apply: ${selectedRole.replace(/-/g, " ")}`} description="Share relevant experience, your working location and availability, plus links to work that demonstrate the role." reason="other" subject={`Career application — ${selectedRole}`} highlights={["One concise introduction", "Relevant portfolio, credits, or work samples", "Availability, timezone, and preferred work arrangement"]} backHref="/careers" backLabel="Back to Careers" />;
}
