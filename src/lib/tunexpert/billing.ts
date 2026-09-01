export const TUNEXPERT_SECONDS_PER_CREDIT = 10;

export const TUNEXPERT_CREDIT_PACKAGES = [
  { code: "starter", name: "Starter", credits: 30, amountIdr: 39_000, featured: false },
  { code: "creator", name: "Creator", credits: 100, amountIdr: 109_000, featured: true },
  { code: "studio", name: "Studio", credits: 250, amountIdr: 249_000, featured: false },
] as const;

export type TuneXpertPackageCode = (typeof TUNEXPERT_CREDIT_PACKAGES)[number]["code"];

export const TUNEXPERT_SUBSCRIPTION_PLANS = [
  { code: "essential", name: "Essential", credits: 90, amountIdr: 99_000, featured: false },
  { code: "pro", name: "Pro", credits: 240, amountIdr: 239_000, featured: true },
  { code: "studio", name: "Studio", credits: 500, amountIdr: 499_000, featured: false },
] as const;

export type TuneXpertSubscriptionPlanCode = (typeof TUNEXPERT_SUBSCRIPTION_PLANS)[number]["code"];

export function tuneXpertCreditsForSeconds(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / TUNEXPERT_SECONDS_PER_CREDIT));
}

export function tuneXpertPackage(code: string) {
  return TUNEXPERT_CREDIT_PACKAGES.find((item) => item.code === code) ?? null;
}

export function tuneXpertSubscriptionPlan(code: string) {
  return TUNEXPERT_SUBSCRIPTION_PLANS.find((item) => item.code === code) ?? null;
}
