
import type { Metadata } from "next";

export const metadata: Metadata = seoFromDB("/client/invoices");
import { seoFromDB } from "@/lib/seo-loader";
export { default } from "@/app/ui/panel/invoices/page";