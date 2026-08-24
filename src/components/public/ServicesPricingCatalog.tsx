import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ARRANGEMENT_ORDER_PATH, ARRANGEMENT_PORTFOLIO_PATH } from "@/lib/arrangement";
import type { BundleItemRow, BundleRow, ServiceRow } from "@/components/catalog";
import GlobalPrice from "@/components/public/GlobalPrice";

async function loadCatalog() {
  const admin = getSupabaseAdminClient();
  if (!admin) return { services: [] as ServiceRow[], bundles: [] as Array<BundleRow & { items: string[] }> };

  const [serviceResult, bundleResult] = await Promise.all([
    admin.from("services").select("id,service_key,label,group_name,price,is_subscription,is_active,sort_order").eq("is_active", true).order("sort_order").returns<ServiceRow[]>(),
    admin.from("bundles").select("id,bundle_key,label,bundle_price,note,is_active,sort_order").eq("is_active", true).order("sort_order").returns<BundleRow[]>(),
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

export default async function ServicesPricingCatalog() {
  const { services, bundles } = await loadCatalog();

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Services &amp; pricing</p>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">Choose the service that fits your project.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">The cards below use the same active catalog as the order form. Select Order New Arrangement to open the form directly.</p>
          </div>
          <Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700">Order New Arrangement <ArrowRight className="h-4 w-4" /></Link>
        </div>

        {bundles.length > 0 && <section className="mt-14">
          <h2 className="text-2xl font-bold">Bundles</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {bundles.map((bundle) => <article key={bundle.id} className="flex flex-col rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-xl font-bold">{bundle.label}</h3>
              <p className="mt-2 text-3xl font-bold"><GlobalPrice usd={Number(bundle.bundle_price)} /></p>
              {bundle.note && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{bundle.note}</p>}
              <ul className="mt-5 flex-1 space-y-2">{bundle.items.map((item) => <li key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul>
              <Link href={ARRANGEMENT_ORDER_PATH} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-violet-700 dark:bg-white dark:text-black dark:hover:bg-violet-500 dark:hover:text-white">Order New Arrangement <ArrowRight className="h-4 w-4" /></Link>
            </article>)}
          </div>
        </section>}

        {services.length > 0 && <section className="mt-16">
          <h2 className="text-2xl font-bold">Individual services</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <article key={service.id} className="rounded-2xl border-2 border-slate-200 p-5 transition hover:border-violet-400 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{service.label}</h3>{service.is_subscription && <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Monthly</span>}</div><p className="shrink-0 text-lg font-bold"><GlobalPrice usd={Number(service.price)} /></p></div>
            </article>)}
          </div>
        </section>}

        {services.length === 0 && bundles.length === 0 && <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">The service catalog is temporarily unavailable. Please try again shortly.</div>}

        <div className="mt-14 flex flex-wrap gap-3"><Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700">Order New Arrangement <ArrowRight className="h-4 w-4" /></Link><Link href={ARRANGEMENT_PORTFOLIO_PATH} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-white/20">View arrangement work</Link><Link href="/services/inquiry" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-white/20">Ask before ordering</Link></div>
      </section>
    </main>
  );
}
