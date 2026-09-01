import type { Metadata } from "next";
import TuneXpertClient from "./TuneXpertClient";

export const metadata: Metadata = {
  title: "tuneXpert — AI Music Generation & Voice Isolation",
  description: "Create original music from a creative brief and isolate clean voice from noisy audio with tuneXpert by FMG Universe.",
  alternates: { canonical: "/tuneXpert" },
  openGraph: {
    title: "tuneXpert — Shape sound beyond the prompt",
    description: "AI music generation and voice isolation inside FMG Universe.",
    url: "/tuneXpert",
    type: "website",
  },
};

export default function TuneXpertPage() {
  return <TuneXpertClient />;
}
