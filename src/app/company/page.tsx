import type { Metadata } from "next";

import CompanyPageClient from "@/app/CompanyPageClient";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "FMG Universe Company",
  description: siteConfig.description,
  alternates: { canonical: "/company" },
  openGraph: { title: `${siteConfig.name} — ${siteConfig.tagline}`, description: siteConfig.description, url: "/company", type: "website" },
};

export default function CompanyPage() {
  return <CompanyPageClient />;
}
