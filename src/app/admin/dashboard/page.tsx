
import type { Metadata } from "next";

export const metadata: Metadata = seoFromDB("/admin/dashboard");
import { seoFromDB } from "@/lib/seo-loader";
export { default } from "@/app/ui/panel/dashboard/page";