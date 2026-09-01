export const TUNEXPERT_SECONDS_PER_CREDIT = 10;

export const TUNEXPERT_CREDIT_PACKAGES = [
  { code: "starter", credits: 30, amountIdr: 29_000, featured: false },
  { code: "creator", credits: 100, amountIdr: 79_000, featured: true },
  { code: "studio", credits: 220, amountIdr: 149_000, featured: false },
] as const;

export type TuneXpertPackageCode = (typeof TUNEXPERT_CREDIT_PACKAGES)[number]["code"];

export function tuneXpertCreditsForSeconds(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / TUNEXPERT_SECONDS_PER_CREDIT));
}

export function tuneXpertPackage(code: string) {
  return TUNEXPERT_CREDIT_PACKAGES.find((item) => item.code === code) ?? null;
}

