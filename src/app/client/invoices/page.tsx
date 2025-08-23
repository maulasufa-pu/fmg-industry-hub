
import type { Metadata } from "next";

// @seo-injected
export const metadata: Metadata = seoFromDB("/client/invoices");
import { seoFromDB } from "@/lib/seo-loader";// src/app/client/invoices/page.tsx
export { default } from "@/app/ui/panel/invoices/page";