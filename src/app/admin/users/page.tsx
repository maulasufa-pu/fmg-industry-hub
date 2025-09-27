
import type { Metadata } from "next";

export const metadata: Metadata = seoFromDB("/admin/users");
import { seoFromDB } from "@/lib/seo-loader";
export { default } from "@/app/ui/panel/users/page";