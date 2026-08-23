import type { Metadata } from "next";
import { Suspense } from "react";
import PortfolioClient from "@/app/portfolio/PortfolioClient";

export const metadata: Metadata = { title: "Music Catalog", description: "Browse explicitly classified FMG releases and publishing catalog work." };

export default function Page(){return <Suspense fallback={<main className="min-h-screen bg-white dark:bg-black"/>}><PortfolioClient initialWorkType="release" lockedWorkType title="FMG release catalog" description="Browse releases represented in the public FMG catalog. Service credits and arrangement case studies are classified separately."/></Suspense>}
