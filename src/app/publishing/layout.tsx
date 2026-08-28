import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Publishing & Rights Management",
  description:
    "FMG Publishing supports songwriters and catalog owners with rights management, publishing administration, sync licensing, claims, and reporting.",
  alternates: { canonical: "/publishing" },
  openGraph: {
    title: "Music Publishing & Rights Management | FMG Universe",
    description:
      "Rights management, publishing administration, sync licensing, claims, and transparent reporting from FMG Publishing.",
    url: "/publishing",
    type: "website",
  },
};

export default function PublishingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
