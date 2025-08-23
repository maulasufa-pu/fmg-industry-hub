import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About FMG Universe",
  description:
    "Our mission, values, and the team powering FMG Universe. Beyond Sound. Built-in Intelligence.",
  alternates: {
    canonical: "/about",
    languages: { "en-US": "/about", "id-ID": "/id/tentang" },
  },
  openGraph: { url: "/about" },
};

export default function AboutPage() {
  return <AboutClient />;
}
