import crypto from "node:crypto";

export type MidtransTransactionStatus =
  | "capture"
  | "settlement"
  | "pending"
  | "deny"
  | "expire"
  | "cancel"
  | "refund"
  | "partial_refund";

export function midtransSignature(
  input: { orderId: string; statusCode: string; grossAmount: string },
  serverKey: string,
): string {
  return crypto
    .createHash("sha512")
    .update(input.orderId + input.statusCode + input.grossAmount + serverKey)
    .digest("hex");
}

export function verifyMidtransSignature(
  input: { orderId: string; statusCode: string; grossAmount: string; signature: string },
  serverKey: string,
): boolean {
  const expected = Buffer.from(midtransSignature(input, serverKey), "utf8");
  const received = Buffer.from(input.signature, "utf8");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function midtransInvoiceStatus(
  transactionStatus: MidtransTransactionStatus,
  fraudStatus?: "accept" | "deny" | "challenge",
): "paid" | "unpaid" | "cancelled" {
  if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) return "paid";
  if (transactionStatus === "pending" || transactionStatus === "capture") return "unpaid";
  return "cancelled";
}

export function midtransAmountMatches(notifiedAmount: string, invoiceAmount: number | string | null, currency: string | null): boolean {
  const notified = Number(notifiedAmount);
  const expected = Number(invoiceAmount);
  return Number.isFinite(notified)
    && Number.isFinite(expected)
    && Math.round(notified) === Math.round(expected)
    && String(currency).toUpperCase() === "IDR";
}
