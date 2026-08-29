import Link from "next/link";
import { ArrowRight, CheckCircle2, Headphones, MessageSquareText, Music2, SlidersHorizontal } from "lucide-react";

import { JsonLd } from "@/components/JsonLd";
import NewCustomerPromoCard from "@/components/public/NewCustomerPromoCard";
import HomePromoPopup from "@/components/public/HomePromoPopup";
import { siteConfig } from "@/lib/site";
import { CompanyPortfolioShowcase, CompanyPricingSection, CompanyReleasedWorks } from "@/app/CompanyPageClient";

export default function SalesHome({ language }: { language: "en" | "id" }) {
  const isId = language === "id";
  const paths = {
    arrangement: isId ? "/id/jasa-aransemen-lagu" : "/arrangement",
    songCreation: isId ? "/id/jasa-pembuatan-lagu" : "/song-creation-service",
    services: isId ? "/id/layanan" : "/services",
    portfolio: isId ? "/id/portofolio?work=arrangement" : "/portfolio?work=arrangement",
    contact: isId ? "/id/kontak?reason=project" : "/contact?reason=project",
  };

  const services = isId ? [
    { href: paths.arrangement, title: "Jasa aransemen lagu", text: "Kami menyusun struktur, dinamika, pilihan instrumen, dan karakter musik agar sesuai dengan lagumu.", icon: Music2 },
    { href: paths.songCreation, title: "Jasa pembuatan lagu", text: "Punya lirik, melodi, atau ide yang belum selesai? Kami bantu mengembangkannya menjadi lagu yang siap diproduksi.", icon: MessageSquareText },
    { href: paths.services, title: "Produksi hingga mastering", text: "Pilih layanan mulai dari produksi musik dan editing vokal hingga mixing, mastering, dan vocal directing.", icon: SlidersHorizontal },
    { href: paths.portfolio, title: "Dengarkan hasil kerja kami", text: "Temukan aransemen dan produksi yang sudah kami kerjakan untuk berbagai karakter musik.", icon: Headphones },
  ] : [
    { href: paths.arrangement, title: "Music arrangement", text: "We shape structure, dynamics, instrumentation, and musical character around your song and direction.", icon: Music2 },
    { href: paths.songCreation, title: "Song creation", text: "Bring your lyrics, melody, or unfinished idea. We help develop it into a song ready for production.", icon: MessageSquareText },
    { href: paths.services, title: "Production to mastering", text: "Choose the support you need, from music production and vocal editing to mixing, mastering, and vocal direction.", icon: SlidersHorizontal },
    { href: paths.portfolio, title: "Hear our work", text: "Explore released arrangement and production work across different musical styles.", icon: Headphones },
  ];

  const process = isId ? [
    ["01", "Kirim bahan lagumu", "Kirim lirik, melodi, rekaman sederhana, referensi musik, dan gambaran hasil yang kamu inginkan."],
    ["02", "Bahas kebutuhanmu", "Kami menjelaskan scope, biaya, waktu pengerjaan, jumlah revisi, file akhir, dan hak penggunaan."],
    ["03", "Mulai pengerjaan", "Setelah order dikonfirmasi, komunikasi dan perkembangan project berlanjut melalui dashboard."],
  ] : [
    ["01", "Send your song materials", "Share your lyrics, melody, simple recording, references, and the result you want to achieve."],
    ["02", "Confirm the project scope", "We clarify the cost, timeline, revisions, final files, and usage rights before production begins."],
    ["03", "Start production", "Once the order is confirmed, communication and project progress continue in your dashboard."],
  ];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isId ? "Jasa aransemen dan produksi musik FMG Universe" : "FMG Universe music arrangement and production services",
    serviceType: "Music arrangement and production",
    url: `${siteConfig.url}${isId ? "/id" : ""}`,
    areaServed: "Worldwide",
    provider: { "@id": `${siteConfig.url}/#organization` },
    availableLanguage: ["English", "Indonesian"],
  };

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <JsonLd id={`${language}-sales-home`} data={serviceSchema} />
      <section className="relative overflow-hidden px-5 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.18),transparent_36%),radial-gradient(circle_at_85%_35%,rgba(244,63,94,0.13),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)] xl:gap-16">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">{isId ? "Aransemen dan produksi musik" : "Music arrangement & production"}</p>
            <h1 className="mt-5 max-w-5xl text-balance text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl">{isId ? "Punya ide lagu? Kami bantu menggarapnya sampai siap dirilis." : "Bring your song idea. We will help shape it into a release-ready production."}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{isId ? "Kirim lirik, melodi, chord, atau rekaman sederhana yang sudah kamu punya. FMG Universe membantu mengembangkannya menjadi aransemen dan produksi yang utuh. Semua scope dijelaskan sebelum pengerjaan dimulai." : "Send the lyrics, melody, chords, or simple recording you already have. FMG Universe develops your material into a complete arrangement and production, with the scope confirmed before work begins."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/order/arrangement" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700">{isId ? "Mulai project-mu" : "Start your project"}<ArrowRight className="h-4 w-4" /></Link>
              <Link href={paths.portfolio} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-white/20">{isId ? "Dengarkan portofolio" : "Listen to our work"}</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300">
              {(isId ? ["Alur kerja jelas", "Revisi sesuai paket", "File akhir siap digunakan", "Hak penggunaan dijelaskan sejak awal"] : ["Clear workflow", "Package-based revisions", "Ready-to-use final files", "Usage rights clarified upfront"]).map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{item}</span>)}
            </div>
          </div>
          <div className="mx-auto w-full max-w-xl xl:max-w-none">
            <HomePromoPopup />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">{isId ? "Layanan kami" : "Our services"}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{isId ? "Pilih layanan sesuai kebutuhan lagumu." : "Choose what your song actually needs."}</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">{isId ? "Belum paham istilah teknis musik? Tidak masalah. Ceritakan hasil yang kamu inginkan dan kami akan membantu menentukan layanan yang sesuai." : "You do not need to speak in technical terms. Tell us what you want the song to feel and sound like, and we will help define the right service."}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {services.map(({ href, title, text, icon: Icon }) => <Link key={href} href={href} className="group rounded-3xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
            <Icon className="h-7 w-7 text-violet-600 dark:text-violet-300" /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{text}</p><span className="mt-5 inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">{isId ? "Lihat detail" : "View details"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby={`${language}-process-heading`}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">{isId ? "Cara order" : "How it works"}</p>
        <h2 id={`${language}-process-heading`} className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{isId ? "Tiga langkah, tanpa proses yang berbelit." : "Three steps. No complicated process."}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">{process.map(([number, title, text]) => <article key={number} className="rounded-3xl border border-slate-200 p-6 dark:border-white/10"><p className="text-sm font-bold text-violet-600 dark:text-violet-300">{number}</p><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div>
      </section>

      <CompanyPortfolioShowcase />
      <CompanyPricingSection />
      <NewCustomerPromoCard />
      <CompanyReleasedWorks />

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{isId ? "Masih bingung memilih layanan?" : "Not sure which service fits?"}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{isId ? "Kirim bahan lagumu dan ceritakan hasil yang ingin kamu capai. Kami akan membantu menentukan langkah yang paling sesuai." : "Share your song materials and the result you want. We will help you choose the most suitable next step."}</p>
        <Link href={paths.contact} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700">{isId ? "Konsultasikan lagumu" : "Talk about your song"}<ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
