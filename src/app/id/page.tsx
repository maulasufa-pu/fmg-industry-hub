import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  MessageSquareText,
  Music2,
  SlidersHorizontal,
} from "lucide-react";

import { JsonLd } from "@/components/JsonLd";
import PaymentMethodsShowcase from "@/components/payments/PaymentMethodsShowcase";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jasa Aransemen dan Produksi Musik Profesional",
  description:
    "Ubah lirik, melodi, chord, atau rekaman sederhana menjadi lagu yang siap dirilis melalui layanan aransemen, produksi musik, editing vokal, mixing, dan mastering.",
  alternates: { canonical: "/id" },
  openGraph: {
    title: "Jasa Aransemen dan Produksi Musik | FMG Universe",
    description:
      "Punya ide lagu yang belum selesai? FMG Universe membantu menggarapnya dari aransemen dan produksi hingga mixing dan mastering.",
    url: "/id",
    locale: "id_ID",
    type: "website",
  },
};

const services = [
  {
    href: "/id/jasa-aransemen-lagu",
    title: "Jasa aransemen lagu",
    text: "Kami menyusun struktur, dinamika, pilihan instrumen, dan karakter musik agar sesuai dengan lagumu.",
    icon: Music2,
  },
  {
    href: "/id/jasa-pembuatan-lagu",
    title: "Jasa pembuatan lagu",
    text: "Punya lirik, melodi, atau ide yang belum selesai? Kami bantu mengembangkannya menjadi lagu yang siap diproduksi.",
    icon: MessageSquareText,
  },
  {
    href: "/id/layanan",
    title: "Produksi hingga mastering",
    text: "Pilih layanan yang kamu butuhkan, mulai dari produksi musik dan editing vokal hingga mixing, mastering, dan vocal directing.",
    icon: SlidersHorizontal,
  },
  {
    href: "/id/portofolio?work=arrangement",
    title: "Dengarkan portofolio kami",
    text: "Dengarkan contoh aransemen dan produksi musik yang pernah kami kerjakan untuk berbagai kebutuhan.",
    icon: Headphones,
  },
] as const;

export default function IndonesianSalesHub() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Jasa aransemen dan produksi musik FMG Universe",
    serviceType: "Music arrangement and production",
    url: `${siteConfig.url}/id`,
    areaServed: "Worldwide",
    provider: {
      "@type": "Organization",
      name: "FMG Universe",
      url: siteConfig.url,
    },
    availableLanguage: ["Indonesian", "English"],
  };

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <JsonLd id="indonesian-sales-hub" data={serviceSchema} />

      <section className="relative overflow-hidden px-5 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.18),transparent_36%),radial-gradient(circle_at_85%_35%,rgba(244,63,94,0.13),transparent_32%)]" />

        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
            Aransemen dan produksi musik
          </p>

          <h1 className="mt-5 max-w-5xl text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Punya ide lagu? Kami bantu menggarapnya sampai siap dirilis.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Kirim bahan yang sudah kamu punya, seperti lirik, melodi,
            chord, atau rekaman sederhana. FMG Universe akan membantu
            mengembangkannya menjadi aransemen dan produksi yang utuh.
            Biaya, waktu pengerjaan, jumlah revisi, file akhir, dan hak
            penggunaan akan dijelaskan sebelum pengerjaan dimulai.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/order/arrangement"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
            >
              Mulai project-mu
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/id/portofolio?work=arrangement"
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-white/20"
            >
              Dengarkan portofolio
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300">
            {[
              "Alur kerja jelas",
              "Jumlah revisi sesuai paket",
              "File akhir siap digunakan",
              "Hak penggunaan dijelaskan sejak awal",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            Layanan kami
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Pilih layanan sesuai kebutuhan lagumu.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Belum memahami istilah teknis musik? Tidak masalah. Tunjukkan
            bahan yang kamu punya dan ceritakan hasil yang kamu inginkan.
            Kami akan membantu menentukan layanan yang sesuai.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {services.map(({ href, title, text, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-3xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]"
            >
              <Icon className="h-7 w-7 text-violet-600 dark:text-violet-300" />

              <h3 className="mt-5 text-xl font-bold">{title}</h3>

              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
                {text}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
                Lihat detail
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [
              "01",
              "Kirim bahan lagumu",
              "Kirim lirik, melodi, rekaman sederhana, referensi musik, dan penjelasan tentang hasil yang kamu inginkan.",
            ],
            [
              "02",
              "Bahas kebutuhanmu",
              "Kami akan menjelaskan layanan yang sesuai, biaya, waktu pengerjaan, jumlah revisi, dan file yang akan kamu terima.",
            ],
            [
              "03",
              "Mulai pengerjaan",
              "Setelah pesanan dikonfirmasi, perkembangan project dan komunikasi dapat dipantau melalui dashboard.",
            ],
          ].map(([number, title, text]) => (
            <article
              key={number}
              className="rounded-3xl border border-slate-200 p-6 dark:border-white/10"
            >
              <p className="text-sm font-bold text-violet-600 dark:text-violet-300">
                {number}
              </p>

              <h3 className="mt-4 text-xl font-bold">{title}</h3>

              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
                {text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-slate-950 p-7 text-white dark:bg-white dark:text-black">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300 dark:text-violet-700">
              Paket khusus pelanggan baru
            </p>

            <p className="mt-2 text-3xl font-bold">Rp6.000.000</p>

            <p className="mt-2 text-slate-300 dark:text-slate-700">
              Paket untuk menggarap lagu mulai dari pembahasan materi
              hingga penyerahan file akhir.
            </p>
          </div>

          <Link
            href="/id/harga"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black dark:bg-black dark:text-white"
          >
            Lihat harga dan paket
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <PaymentMethodsShowcase className="mt-12" compact />
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Masih bingung memilih layanan?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Kirim bahan lagumu dan ceritakan hasil yang ingin kamu capai.
          Kami akan membantu menentukan layanan yang paling sesuai.
        </p>

        <Link
          href="/id/kontak?reason=project"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
        >
          Konsultasikan lagumu
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
