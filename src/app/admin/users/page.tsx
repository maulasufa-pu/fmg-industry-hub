
import type { Metadata } from "next";

// @seo-injected
export const metadata: Metadata = seoFromDB("/admin/users");
import { seoFromDB } from "@/lib/seo-loader";// src/app/admin/users/page.tsx
export { default } from "@/app/ui/panel/users/page";