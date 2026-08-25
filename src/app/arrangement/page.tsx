import type { Metadata } from "next";
import PageClient from "../PageClient";

export const metadata: Metadata = {
  title: "Professional Music Arrangement Service",
  description:
    "Online music arrangement service for artists and songwriters. Turn your melody, chords, lyrics, or voice note into a release-ready song with clear scope and revisions.",
  alternates: { canonical: "/arrangement", languages: { "en-US": "/arrangement", "id-ID": "/id/jasa-aransemen-lagu", "x-default": "/arrangement" } },
  openGraph: {
    title: "Professional Music Arrangement Service | FMG Universe",
    description:
      "Turn your musical idea into a structured, production-ready arrangement built around your genre, references, and release goals.",
    url: "/arrangement",
    type: "website",
  },
};

export default function ArrangementPage() {
  return <PageClient mode="sales" />;
}
