import type { BundleItemRow, BundleRow, ServiceRow } from "@/components/catalog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PublicBundle = BundleRow & { items: string[] };

export async function loadPublicCatalog(): Promise<{
  services: ServiceRow[];
  bundles: PublicBundle[];
}> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { services: [], bundles: [] };

  const [serviceResult, bundleResult] = await Promise.all([
    admin
      .from("services")
      .select("id,service_key,label,group_name,price,is_subscription,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .returns<ServiceRow[]>(),
    admin
      .from("bundles")
      .select("id,bundle_key,label,bundle_price,note,description,is_active,sort_order,promo_type,promo_value,promo_start,promo_end")
      .eq("is_active", true)
      .order("sort_order")
      .returns<BundleRow[]>(),
  ]);

  const services = serviceResult.data ?? [];
  const bundleRows = bundleResult.data ?? [];
  if (!bundleRows.length) return { services, bundles: [] };

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
      items: (itemRows ?? [])
        .filter((item) => item.bundle_id === bundle.id)
        .map((item) => labels.get(item.service_id))
        .filter((label): label is string => Boolean(label)),
    })),
  };
}
