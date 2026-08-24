import type { Metadata } from "next";
import PageClient from "../PageClient";

export const metadata: Metadata = {
  title: "Jasa Aransemen Musik Profesional | FMG Universe",
  description:
    "Jasa aransemen musik profesional dengan scope, timeline, revisi, dan hasil akhir yang dikonfirmasi sebelum produksi dimulai.",
  alternates: { canonical: "/arrangement" },
  openGraph: {
    title: "Jasa Aransemen Musik Profesional | FMG Universe",
    description:
      "Ubah ide, melodi, chord, atau panduan vokal menjadi aransemen musik yang siap diproduksi.",
    url: "/arrangement",
    type: "website",
  },
};

export default function ArrangementPage() {
  return <PageClient mode="sales" />;
}
