import { ARRANGEMENT_ORDER_PATH, ARRANGEMENT_PORTFOLIO_PATH, ARRANGEMENT_SERVICE_KEY } from "@/lib/arrangement";

test("arrangement CTAs share one explicit service key", () => {
  expect(ARRANGEMENT_SERVICE_KEY).toBe("arrangement");
  expect(ARRANGEMENT_ORDER_PATH).toContain("service=arrangement");
  expect(ARRANGEMENT_PORTFOLIO_PATH).toContain("work=arrangement");
});
