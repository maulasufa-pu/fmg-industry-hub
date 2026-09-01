import {
  TUNEXPERT_CREDIT_PACKAGES,
  tuneXpertCreditsForSeconds,
  tuneXpertPackage,
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
});
