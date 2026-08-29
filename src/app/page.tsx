import type { Metadata } from "next";
import SalesHome from "@/components/public/SalesHome";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Professional Music Arrangement & Song Production",
  description: "Turn lyrics, melodies, chords, or a simple recording into a release-ready song with professional arrangement, production, vocal editing, mixing, and mastering.",
  alternates: { canonical: "/", languages: { "en-US": "/", "id-ID": "/id", "x-default": "/" } },
  openGraph: { title: "Music Arrangement & Song Production | FMG Universe", description: "Bring your song idea. FMG Universe will help shape it into a complete, release-ready production.", url: "/", locale: "en_US", alternateLocale: ["id_ID"], type: "website" },
  twitter: { card: "summary_large_image", title: "Music Arrangement & Song Production | FMG Universe", description: "Bring your song idea. We will help shape it into a complete, release-ready production.", images: ["/opengraph-image"] },
};

export default function Page() {
  return <SalesHome language="en" />;
}
