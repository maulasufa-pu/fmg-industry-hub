import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ARRANGEMENT_ORDER_PATH, ARRANGEMENT_PORTFOLIO_PATH, NEW_CUSTOMER_PROMO_BUNDLE_KEY } from "@/lib/arrangement";
import type { BundleItemRow, BundleRow, ServiceRow } from "@/components/catalog";
import GlobalPrice from "@/components/public/GlobalPrice";
import LocalizedText from "@/components/LocalizedText";
import PaymentMethodsShowcase from "@/components/payments/PaymentMethodsShowcase";

async function loadCatalog() {
  const admin = getSupabaseAdminClient();
  if (!admin) return { services: [] as ServiceRow[], bundles: [] as Array<BundleRow & { items: string[] }> };

  const [serviceResult, bundleResult] = await Promise.all([
    admin.from("services").select("id,service_key,label,group_name,price,is_subscription,is_active,sort_order").eq("is_active", true).order("sort_order").returns<ServiceRow[]>(),
    admin.from("bundles").select("id,bundle_key,label,bundle_price,note,description,is_active,sort_order,promo_type,promo_value,promo_start,promo_end").eq("is_active", true).order("sort_order").returns<BundleRow[]>(),
  ]);
  const services = serviceResult.data ?? [];
  const bundleRows = bundleResult.data ?? [];
  if (!bundleRows.length) return { services, bundles: [] as Array<BundleRow & { items: string[] }> };

  const { data: itemRows } = await admin
    .from("bundle_items")
    .select("id,bundle_id,service_id")
    .in("bundle_id", bundleRows.map((bundle) => bundle.id))
    .returns<BundleItemRow[]>();
  const labels = new Map(services.map((service) => [service.id, service.label]));
  return {
    services,
    bundles: bundleRows.map((bundle) => ({
      ...bundle,
      items: (itemRows ?? []).filter((item) => item.bundle_id === bundle.id).map((item) => labels.get(item.service_id)).filter((label): label is string => Boolean(label)),
    })),
  };
}

type CatalogView = "services" | "pricing";

export default async function ServicesPricingCatalog({ view = "services", language = "en" }: { view?: CatalogView; language?: "id" | "en" }) {
  const { services, bundles } = await loadCatalog();
  const isPricing = view === "pricing";
  const portfolioHref = language === "id" ? "/id/portofolio?work=arrangement" : ARRANGEMENT_PORTFOLIO_PATH;
  const inquiryHref = language === "id" ? "/services/inquiry?lang=id" : "/services/inquiry";

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300"><LocalizedText id={isPricing ? "Harga aransemen" : "Jasa aransemen musik"} en={isPricing ? "Arrangement pricing" : "Music arrangement services"} /></p>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl"><LocalizedText id={isPricing ? "Harga dan paket jasa aransemen lagu." : "Jasa aransemen musik profesional untuk project-mu."} en={isPricing ? "Music arrangement pricing and packages." : "Professional music arrangement services for your project."} /></h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300"><LocalizedText id={isPricing ? "Bandingkan paket, layanan individual, dan harga yang sama dengan form order aktif." : "Pilih aransemen, produksi, editing, mixing, mastering, atau vocal directing dalam scope project yang jelas."} en={isPricing ? "Compare bundles, individual services, and the same live prices used in the order form." : "Choose arrangement, production, editing, mixing, mastering, or vocal direction within a clearly confirmed project scope."} /></p>
          </div>
          <Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"><LocalizedText id="Order Aransemen Baru" en="Order New Arrangement" /> <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <section className="mt-10 grid gap-4 rounded-2xl border border-slate-200 p-6 md:grid-cols-3 dark:border-white/10" aria-label={isPricing ? "Pricing information" : "Service process"}>
          {(isPricing ? [
            { id: "Harga mengikuti mata uang yang dipilih di header.", en: "Prices follow the currency selected in the header." },
            { id: "Paket menampilkan layanan yang sudah termasuk.", en: "Each bundle shows the services already included." },
            { id: "Kebutuhan di luar scope dikonfirmasi sebelum produksi.", en: "Requirements outside the scope are confirmed before production." },
          ] : [
            { id: "Brief dan referensi menentukan arah kreatif.", en: "Your brief and references define the creative direction." },
            { id: "Scope, timeline, revisi, dan ownership dikonfirmasi.", en: "Scope, timeline, revisions, and ownership are confirmed." },
            { id: "Project dilanjutkan di dashboard setelah order.", en: "The project continues in your dashboard after ordering." },
          ]).map((item) => <p key={item.en} className="flex gap-3 leading-7 text-slate-600 dark:text-slate-300"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" /><LocalizedText id={item.id} en={item.en} /></p>)}
        </section>

        {bundles.length > 0 && <section className="mt-14">
          <h2 className="text-2xl font-bold"><LocalizedText id="Paket" en="Bundles" /></h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {bundles.map((bundle) => <article key={bundle.id} className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold">{bundle.label}</h3>{bundle.bundle_key === NEW_CUSTOMER_PROMO_BUNDLE_KEY && <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white"><LocalizedText id="CUSTOMER BARU" en="NEW CUSTOMER" /></span>}</div>
              <p className="mt-2 text-3xl font-bold"><GlobalPrice usd={Number(bundle.bundle_price)} idr={bundle.bundle_key === NEW_CUSTOMER_PROMO_BUNDLE_KEY ? Number(bundle.promo_value) : undefined} /></p>
              {bundle.bundle_key === NEW_CUSTOMER_PROMO_BUNDLE_KEY && <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-300"><LocalizedText id="Harga spesial untuk project pertamamu." en="A special offer for your first project." /></p>}
              {bundle.note && bundle.bundle_key !== NEW_CUSTOMER_PROMO_BUNDLE_KEY && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{bundle.note}</p>}
              <ul className="mt-5 flex-1 space-y-2">{bundle.items.map((item) => <li key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul>
              <Link href={ARRANGEMENT_ORDER_PATH} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-violet-700 dark:bg-white dark:text-black dark:hover:bg-violet-500 dark:hover:text-white"><LocalizedText id="Pesan Aransemen Baru" en="Order New Arrangement" /> <ArrowRight className="h-4 w-4" /></Link>
            </article>)}
          </div>
        </section>}

        {services.length > 0 && <section className="mt-16">
          <h2 className="text-2xl font-bold"><LocalizedText id="Layanan satuan" en="Individual services" /></h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <article key={service.id} className="rounded-2xl border-2 border-slate-200 p-5 transition hover:border-violet-400 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{service.label}</h3>{service.is_subscription && <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><LocalizedText id="Bulanan" en="Monthly" /></span>}</div><p className="shrink-0 text-lg font-bold"><GlobalPrice usd={Number(service.price)} /></p></div>
            </article>)}
          </div>
        </section>}

        {services.length === 0 && bundles.length === 0 && <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><LocalizedText id="Katalog layanan sedang tidak tersedia. Coba lagi sebentar lagi." en="The service catalog is temporarily unavailable. Please try again shortly." /></div>}

        <PaymentMethodsShowcase className="mt-16" compact={!isPricing} />

        <div className="mt-14 flex flex-wrap gap-3"><Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"><LocalizedText id="Pesan Aransemen Baru" en="Order New Arrangement" /> <ArrowRight className="h-4 w-4" /></Link><Link href={portfolioHref} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-white/20"><LocalizedText id="Lihat hasil aransemen" en="View arrangement work" /></Link><Link href={inquiryHref} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-white/20"><LocalizedText id="Tanya sebelum order" en="Ask before ordering" /></Link></div>
      </section>
    </main>
  );
}
