export type VerifiedCatalogRow = { id: string; price: number | string };

export function catalogMoney(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Catalog contains an invalid price");
  return Math.round(parsed * 100) / 100;
}

export function catalogTotalFromVerifiedRows(
  bundlePrice: number | string | null,
  selectedRows: VerifiedCatalogRow[],
  bundledServiceIds: ReadonlySet<string>,
): number {
  const services = selectedRows
    .filter((service) => !bundledServiceIds.has(service.id))
    .reduce((sum, service) => sum + catalogMoney(service.price), 0);
  return catalogMoney(bundlePrice ?? 0) + services;
}
