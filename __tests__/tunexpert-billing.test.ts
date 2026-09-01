import {
  TUNEXPERT_CREDIT_PACKAGES,
  TUNEXPERT_SUBSCRIPTION_PLANS,
  tuneXpertCreditsForSeconds,
  tuneXpertPackage,
  tuneXpertSubscriptionPlan,
} from "@/lib/tunexpert/billing";

describe("tuneXpert billing", () => {
  it("rounds processing time up to complete 10-second credits", () => {
    expect(tuneXpertCreditsForSeconds(1)).toBe(1);
    expect(tuneXpertCreditsForSeconds(10)).toBe(1);
    expect(tuneXpertCreditsForSeconds(11)).toBe(2);
    expect(tuneXpertCreditsForSeconds(45)).toBe(5);
    expect(tuneXpertCreditsForSeconds(60)).toBe(6);
  });

  it("only resolves server-approved package codes", () => {
    expect(tuneXpertPackage("creator")).toEqual(TUNEXPERT_CREDIT_PACKAGES[1]);
    expect(tuneXpertPackage("free")).toBeNull();
    expect(TUNEXPERT_CREDIT_PACKAGES.every((item) => item.amountIdr > 0 && item.credits > 0)).toBe(true);
  });

  it("keeps every paid plan profitable after conservative provider and Midtrans costs", () => {
    const bufferedProviderCostPerCredit = 510;
    const allPlans = [...TUNEXPERT_CREDIT_PACKAGES, ...TUNEXPERT_SUBSCRIPTION_PLANS];
    for (const plan of allPlans) {
      const cardFeeWithVat = (plan.amountIdr * 0.029 + 2_000) * 1.11;
      const netRevenue = plan.amountIdr - Math.max(5_000, cardFeeWithVat);
      const grossMargin = (netRevenue - plan.credits * bufferedProviderCostPerCredit) / netRevenue;
      expect(grossMargin).toBeGreaterThanOrEqual(0.4);
    }
  });

  it("only resolves server-approved subscription plan codes", () => {
    expect(tuneXpertSubscriptionPlan("pro")).toEqual(TUNEXPERT_SUBSCRIPTION_PLANS[1]);
    expect(tuneXpertSubscriptionPlan("unlimited")).toBeNull();
  });
});
