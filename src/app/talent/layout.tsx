import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist Development & Talent Management",
  description:
    "FMG Talent helps artists grow through scouting, A&R, creative development, release operations, career strategy, and collaboration support.",
  alternates: { canonical: "/talent" },
  openGraph: {
    title: "Artist Development & Talent Management | FMG Universe",
    description:
      "Scouting, A&R, artist development, release operations, career strategy, and collaboration support from FMG Talent.",
    url: "/talent",
    type: "website",
  },
};

export default function TalentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
