import type { Metadata } from "next";
import PortfolioClient from "@/app/portfolio/PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio — FMG Universe",
  description: "Explore our portfolio of successful music projects, artist collaborations, and creative productions. Discover the quality and creativity that defines Flemmo Music Global.",
  keywords: [
    "music portfolio",
    "music production",
    "artist development", 
    "music projects",
    "flemmo music global",
    "music collaboration",
    "creative productions",
    "music showcase"
  ],
  openGraph: {
    title: "Portfolio — FMG Universe",
    description: "Explore our portfolio of successful music projects, artist collaborations, and creative productions.",
    images: [
      {
        url: "/img/portfolio-og.jpg",
        width: 1200,
        height: 630,
        alt: "FMG Universe Portfolio"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio — FMG Universe", 
    description: "Explore our portfolio of successful music projects, artist collaborations, and creative productions.",
    images: ["/img/portfolio-og.jpg"],
  },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}