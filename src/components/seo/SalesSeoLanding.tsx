import Link from "next/link";
import { serviceWhatsApp } from "@/lib/service-whatsapp";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import type { Json } from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";
import PaymentMethodsShowcase from "@/components/payments/PaymentMethodsShowcase";

type Faq = { question: string; answer: string };
type Step = { title: string; text: string };

type Props = {
  lang: "id" | "en";
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; paragraphs: string[]; links?: Array<{ href: string; label: string }> }>;
  benefits: string[];
  steps: Step[];
  faqs: Faq[];
  primaryCta: string;
  primaryHref?: string;
  secondaryCta: string;
  secondaryHref: string;
  related: Array<{ href: string; label: string }>;
  serviceName?: string;
};

export default function SalesSeoLanding({ lang, path, eyebrow, title, intro, sections, benefits, steps, faqs, primaryCta, primaryHref = "/order/arrangement", secondaryCta, secondaryHref, related, serviceName }: Props) {
  const isId = lang === "id";
  const absoluteUrl = `${siteConfig.url}${path}`;
  const mainEntity: Json = serviceName ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    description: intro,
    url: absoluteUrl,
    inLanguage: lang === "id" ? "id-ID" : "en-US",
    provider: { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: "FMG Universe", url: siteConfig.url },
    areaServed: ["Indonesia", "Worldwide"],
    availableChannel: { "@type": "ServiceChannel", serviceUrl: `${siteConfig.url}${primaryHref}` },
  } : {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: intro,
    url: absoluteUrl,
    inLanguage: lang === "id" ? "id-ID" : "en-US",
    author: { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: "FMG Universe" },
    mainEntityOfPage: absoluteUrl,
  };
  const schema: Json = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: isId ? "Beranda" : "Home", item: `${siteConfig.url}${isId ? "/id" : ""}` },
        { "@type": "ListItem", position: 2, name: title, item: absoluteUrl },
      ],
    },
    mainEntity,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
    },
  ];

  return (
    <main data-no-translate lang={lang} className="bg-white text-slate-950 dark:bg-black dark:text-white">
      <JsonLd id={`seo-${path.replace(/[^a-z0-9]+/gi, "-")}`} data={schema} />
      <section className="border-b border-black/10 bg-gradient-to-br from-violet-50 via-white to-rose-50 dark:border-white/10 dark:from-violet-950/30 dark:via-black dark:to-rose-950/20">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600 dark:text-slate-400"><Link href={isId ? "/id" : "/"}>{isId ? "Beranda" : "Home"}</Link><span className="mx-2">/</span><span aria-current="page">{title}</span></nav>
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">{eyebrow}</p>
          <h1 className="mt-4 max-w-5xl text-balance text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 dark:text-slate-300">{intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-bold text-white hover:bg-violet-800">{primaryCta}<ArrowRight className="h-4 w-4" /></Link>
            {isId && serviceName && <a href={serviceWhatsApp(serviceName)} className="inline-flex min-h-12 items-center rounded-xl border border-violet-300 px-6 py-3 font-bold text-violet-700 dark:text-violet-300">Chat via WhatsApp</a>}
            <Link href={secondaryHref} className="rounded-xl border border-slate-300 px-6 py-3 font-bold dark:border-white/20">{secondaryCta}</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        {serviceName && <section className="mb-12 rounded-2xl border border-violet-200 p-6 dark:border-white/15" aria-labelledby="work-title"><h2 id="work-title" className="text-2xl font-bold">{isId ? "Dengarkan hasil karya sebelum memulai" : "Listen to the work before you start"}</h2><p className="mt-3 leading-7">{isId ? "Bandingkan karakter instrumen, dinamika, dan ruang vokal pada karya yang tersedia. Sebutkan contoh yang mendekati arah proyekmu saat konsultasi." : "Explore the instrumentation, dynamics, and vocal character in our available work. Share the examples closest to your project direction."}</p><Link href={isId ? "/id/portofolio" : "/portfolio"} className="mt-4 inline-flex min-h-12 items-center font-bold text-violet-700 dark:text-violet-300">{isId ? "Dengarkan portofolio Flemmo Music" : "Hear our portfolio"}</Link></section>}
        <section aria-labelledby="benefits-title">
          <h2 id="benefits-title" className="text-3xl font-bold">{isId ? "Yang akan kamu dapatkan" : "What you receive"}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">{benefits.map((benefit) => <li key={benefit} className="flex gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>{benefit}</span></li>)}</ul>
        </section>

        {sections.map((section) => <section key={section.title} className="mt-16"><h2 className="text-3xl font-bold">{section.title}</h2><div className="mt-5 space-y-4 text-lg leading-8 text-slate-700 dark:text-slate-300">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.links?.map((link) => <p key={link.href} className="mt-4"><Link href={link.href} className="font-semibold text-violet-700 underline underline-offset-4 dark:text-violet-300">{link.label}</Link></p>)}</section>)}

        <section className="mt-16" aria-labelledby="process-title"><h2 id="process-title" className="text-3xl font-bold">{isId ? "Proses kerja" : "How it works"}</h2><ol className="mt-6 grid gap-4 md:grid-cols-3">{steps.map((step, index) => <li key={step.title} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10"><span className="text-sm font-bold text-violet-700 dark:text-violet-300">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 text-xl font-bold">{step.title}</h3><p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{step.text}</p></li>)}</ol></section>

        <PaymentMethodsShowcase className="mt-16" compact />

        <section className="mt-16" aria-labelledby="faq-title"><h2 id="faq-title" className="text-3xl font-bold">FAQ</h2><div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-5 dark:divide-white/10 dark:border-white/10">{faqs.map((faq) => <details key={faq.question} className="py-5"><summary className="cursor-pointer font-bold">{faq.question}</summary><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p></details>)}</div></section>

        {serviceName && <section className="mt-16 rounded-2xl border border-violet-200 p-6 dark:border-white/15"><h2 className="text-2xl font-bold">{isId ? "Siap membahas kebutuhan lagumu?" : "Ready to discuss your song?"}</h2><p className="mt-3 leading-7">{isId ? "Kirim materi dan referensi yang tersedia. Biaya, jadwal, revisi, format file, serta hak penggunaan dikonfirmasi sebelum pengerjaan." : "Share your materials and references. Cost, timeline, revisions, final files, and usage rights are confirmed before work begins."}</p><Link href={primaryHref} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-violet-700 px-6 py-3 font-bold text-white">{primaryCta}</Link></section>}
        <aside className="mt-16 rounded-3xl bg-slate-950 p-7 text-white dark:bg-white dark:text-black"><h2 className="text-2xl font-bold">{isId ? "Lanjutkan dari sini" : "Continue from here"}</h2><div className="mt-5 flex flex-wrap gap-3">{related.map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-white/20 px-4 py-2 font-semibold dark:border-black/20">{item.label}</Link>)}</div></aside>
      </div>
    </main>
  );
}
