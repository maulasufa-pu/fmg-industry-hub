import { catalogMoney, catalogTotalFromVerifiedRows } from "@/lib/projects/catalog-pricing";

test("derives order total only from verified catalog rows", () => {
  const untrustedRequest = { total: 1, selectedServices: ["arrangement", "mixing"] };
  const verifiedRows = [{ id: "arrangement", price: 700 }, { id: "mixing", price: "250" }];
  expect(untrustedRequest.total).toBe(1);
  expect(catalogTotalFromVerifiedRows(null, verifiedRows, new Set())).toBe(950);
});

test("does not double-charge services included in a verified bundle", () => {
  const rows = [{ id: "arrangement", price: 700 }, { id: "mixing", price: 250 }];
  expect(catalogTotalFromVerifiedRows(800, rows, new Set(["arrangement"]))).toBe(1050);
});

test("rejects negative or non-finite catalog prices", () => {
  expect(() => catalogMoney(-1)).toThrow(/invalid price/i);
  expect(() => catalogMoney("not-a-price")).toThrow(/invalid price/i);
});
