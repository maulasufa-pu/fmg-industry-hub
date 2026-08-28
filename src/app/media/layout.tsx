import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Media, PR & Content",
  description:
    "FMG Media develops music content, PR campaigns, podcasts, media partnerships, and digital distribution for artists, labels, and brands.",
  alternates: { canonical: "/media" },
  openGraph: {
    title: "Music Media, PR & Content | FMG Universe",
    description:
      "Music content, PR campaigns, podcasts, media partnerships, and digital distribution from FMG Media.",
    url: "/media",
    type: "website",
  },
};

export default function MediaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
