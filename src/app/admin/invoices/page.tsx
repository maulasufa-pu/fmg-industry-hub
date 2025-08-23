
import type { Metadata } from "next";

// @seo-injected
export const metadata: Metadata = seoFromDB("/admin/invoices");
import { seoFromDB } from "@/lib/seo-loader";// src/app/admin/invoices/page.tsx
export { default } from "@/app/ui/panel/invoices/page";