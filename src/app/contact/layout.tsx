import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact FMG Universe",
  description:
    "Contact FMG Universe about music projects, partnerships, publishing, press, support, or other business inquiries.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact FMG Universe",
    description:
      "Talk with FMG Universe about music projects, partnerships, publishing, press, and support.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
