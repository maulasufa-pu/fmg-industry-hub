import type { Metadata } from "next";
import { Suspense } from "react";
import PortfolioClient from "@/app/portfolio/PortfolioClient";

export const metadata: Metadata = {
  title: "Music Catalog",
  description: "Browse explicitly classified FMG releases and publishing catalog work.",
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: "Music Catalog | FMG Universe",
    description: "Browse explicitly classified FMG releases and publishing catalog work.",
    url: "/catalog",
    type: "website",
  },
};

export default function Page(){return <Suspense fallback={<main className="min-h-screen bg-white dark:bg-black"/>}><PortfolioClient /></Suspense>}
