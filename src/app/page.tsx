import type { Metadata } from "next";
import PageClient from "./PageClient";
import { seoFromDB } from "@/lib/seo-loader";

export const metadata: Metadata = seoFromDB("/");

export default function Page() {
  return <PageClient mode="company" />;
}
