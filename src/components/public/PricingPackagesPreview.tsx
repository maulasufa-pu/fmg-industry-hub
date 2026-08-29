import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import GlobalPrice from "@/components/public/GlobalPrice";
import { ARRANGEMENT_ORDER_PATH, NEW_CUSTOMER_PROMO_BUNDLE_KEY } from "@/lib/arrangement";
import { loadPublicCatalog } from "@/lib/public-sales-data";

export default async function PricingPackagesPreview({ language }: { language: "en" | "id" }) {
  const { bundles, services } = await loadPublicCatalog();
  const standardBundles = bundles.filter((bundle) => bundle.bundle_key !== NEW_CUSTOMER_PROMO_BUNDLE_KEY).slice(0, 3);
  const pricingHref = language === "id" ? "/id/harga" : "/pricing";
  const isId = language === "id";

  return (
    <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby={`${language}-pricing-heading`}>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            {isId ? "Harga & paket" : "Pricing & packages"}
          </p>
          <h2 id={`${language}-pricing-heading`} className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {isId ? "Pilih scope yang paling pas untuk lagumu." : "Choose the right scope for your song."}
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {isId
              ? "Harga di sini memakai katalog yang sama dengan halaman order. Detail layanan yang termasuk akan terlihat sebelum kamu memesan."
              : "These prices come from the same catalog used by the order flow. You will see exactly what is included before you place an order."}
          </p>
        </div>
        <Link href={pricingHref} className="inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
          {isId ? "Lihat semua harga" : "View all pricing"} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {standardBundles.length ? (
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {standardBundles.map((bundle) => (
            <article key={bundle.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
              <h3 className="text-xl font-bold">{bundle.label}</h3>
              <p className="mt-3 text-3xl font-black"><GlobalPrice usd={Number(bundle.bundle_price)} /></p>
              {bundle.description && <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{bundle.description}</p>}
              <ul className="mt-5 flex-1 space-y-2">
                {bundle.items.slice(0, 5).map((item) => (
                  <li key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>
                ))}
              </ul>
              <Link href={ARRANGEMENT_ORDER_PATH} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-violet-700 dark:bg-white dark:text-black dark:hover:bg-violet-500 dark:hover:text-white">
                {isId ? "Pilih paket" : "Choose package"} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-slate-200 p-7 dark:border-white/10">
          <p className="text-lg font-semibold">
            {services.length
              ? (isId ? `${services.length} layanan tersedia dan dapat dipilih sesuai kebutuhan project.` : `${services.length} services are available to match your project needs.`)
              : (isId ? "Katalog harga sedang dimuat ulang." : "The pricing catalog is being refreshed.")}
          </p>
          <Link href={pricingHref} className="mt-4 inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
            {isId ? "Buka halaman harga" : "Open pricing"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
