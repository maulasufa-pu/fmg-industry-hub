import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { seoFromDB } from "@/lib/seo-loader";
export const metadata: Metadata = seoFromDB("/about");

export default function AboutPage() {
  return <AboutClient />;
}
