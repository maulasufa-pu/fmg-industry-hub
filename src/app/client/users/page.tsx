
import type { Metadata } from "next";

// @seo-injected
export const metadata: Metadata = seoFromDB("/client/users");
import { seoFromDB } from "@/lib/seo-loader";// src/app/client/users/page.tsx
export { default } from "@/app/ui/panel/users/page";