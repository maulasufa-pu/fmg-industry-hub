import type { Metadata } from "next";
import ContactPage from "@/app/contact/page";

export const metadata: Metadata = {
  title: "Hubungi FMG Universe",
  description: "Ceritakan kebutuhan aransemen, produksi musik, partnership, Publishing, media, atau dukungan yang kamu perlukan.",
  alternates: {
    canonical: "/id/kontak",
    languages: { "id-ID": "/id/kontak", "en-US": "/contact", "x-default": "/contact" },
  },
  openGraph: {
    title: "Hubungi FMG Universe",
    description: "Mulai percakapan tentang project musikmu bersama FMG Universe.",
    url: "/id/kontak",
    locale: "id_ID",
    type: "website",
  },
};

export default function IndonesianContactPage() {
  return <ContactPage />;
}
