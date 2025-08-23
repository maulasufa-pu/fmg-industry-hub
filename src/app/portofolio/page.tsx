
import type { Metadata } from "next";
import { seoFromDB } from "@/lib/seo-loader";

export const metadata: Metadata = seoFromDB("/portofolio");

export default function PageName() {
  return (
    <div>
      {/* isi halaman */}
    </div>
  );
}