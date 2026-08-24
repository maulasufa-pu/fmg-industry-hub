import { formatIdrAnchoredPrice } from "@/lib/currency";

const rates = { USD: 1, IDR: 16000, EUR: 0.9, SGD: 1.35 };

test("new-customer promotion stays fixed at six million rupiah", () => {
  expect(formatIdrAnchoredPrice(6_000_000, "IDR", rates)).toContain("6,000,000");
});

test("other currencies derive from the IDR-anchored promotion", () => {
  expect(formatIdrAnchoredPrice(6_000_000, "USD", rates)).toBe("$375");
  expect(formatIdrAnchoredPrice(6_000_000, "EUR", rates)).toBe("€337.50");
});
