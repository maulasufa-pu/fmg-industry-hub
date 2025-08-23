
import type { Metadata } from "next";

// @seo-injected
export const metadata: Metadata = seoFromDB("/client/dashboard");
import { seoFromDB } from "@/lib/seo-loader";// src/app/client/dashboard/page.tsx
export { default } from "@/app/ui/panel/dashboard/page";