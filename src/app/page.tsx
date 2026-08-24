import type { Metadata } from "next";
import CompanyPageClient from "./CompanyPageClient";
import { seoFromDB } from "@/lib/seo-loader";

export const metadata: Metadata = seoFromDB("/");

export default function Page() {
  return <CompanyPageClient />;
}
