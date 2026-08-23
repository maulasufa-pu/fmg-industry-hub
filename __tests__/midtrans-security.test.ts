import { midtransAmountMatches, midtransInvoiceStatus, midtransSignature, verifyMidtransSignature } from "@/lib/payments/midtrans";

test("verifies an authentic Midtrans signature and rejects tampering", () => {
  const input = { orderId: "INV-2026-001", statusCode: "200", grossAmount: "1500000.00" };
  const signature = midtransSignature(input, "server-secret");
  expect(verifyMidtransSignature({ ...input, signature }, "server-secret")).toBe(true);
  expect(verifyMidtransSignature({ ...input, grossAmount: "1.00", signature }, "server-secret")).toBe(false);
});

test.each([
  ["settlement", undefined, "paid"],
  ["capture", "accept", "paid"],
  ["capture", "challenge", "unpaid"],
  ["pending", undefined, "unpaid"],
  ["refund", undefined, "cancelled"],
] as const)("maps %s transaction status", (status, fraud, expected) => {
  expect(midtransInvoiceStatus(status, fraud)).toBe(expected);
});

test("requires exact invoice-owned IDR amount", () => {
  expect(midtransAmountMatches("1500000.00", 1_500_000, "IDR")).toBe(true);
  expect(midtransAmountMatches("100.00", 1_500_000, "IDR")).toBe(false);
  expect(midtransAmountMatches("1500000.00", 1_500_000, "USD")).toBe(false);
});
