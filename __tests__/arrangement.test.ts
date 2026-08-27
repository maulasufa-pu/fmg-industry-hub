import { ARRANGEMENT_ORDER_PATH, ARRANGEMENT_PORTFOLIO_PATH, ARRANGEMENT_SERVICE_KEY, NEW_CUSTOMER_PROMO_BUNDLE_KEY, NEW_CUSTOMER_PROMO_IDR } from "@/lib/arrangement";

test("arrangement CTAs share one explicit service key", () => {
  expect(ARRANGEMENT_SERVICE_KEY).toBe("arrangement");
  expect(ARRANGEMENT_ORDER_PATH).toBe("/order/arrangement");
  expect(ARRANGEMENT_PORTFOLIO_PATH).toContain("work=arrangement");
  expect(NEW_CUSTOMER_PROMO_BUNDLE_KEY).toBe("new_customer_arrangement_promo");
  expect(NEW_CUSTOMER_PROMO_IDR).toBe(6_000_000);
});
