import { INVOICE_REMINDER_TEMPLATE_VERSION, renderInvoiceReminder } from "@/lib/invoices/reminder-template";

test("invoice reminder escapes user content and includes a version", () => {
  const reminder = renderInvoiceReminder({ invoiceNo: "INV-1", clientName: "<script>alert(1)</script>", amount: "IDR 1,000", dueDate: "2026-09-01", paymentUrl: "https://pay.example/invoice/1", trackingPixelUrl: "https://app.example/pixel" });
  expect(INVOICE_REMINDER_TEMPLATE_VERSION).toMatch(/^invoice-reminder-v/);
  expect(reminder.html).not.toContain("<script>");
  expect(reminder.html).toContain("&lt;script&gt;");
  expect(reminder.html).toContain("https://pay.example/invoice/1");
  expect(reminder.subject).toContain("INV-1");
});
