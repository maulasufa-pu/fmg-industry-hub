import "server-only";

export const INVOICE_REMINDER_TEMPLATE_VERSION = "invoice-reminder-v1.0.0";

type ReminderTemplateInput = {
  clientName: string;
  invoiceNo: string;
  amount: string;
  dueDate: string;
  invoiceUrl: string;
  paymentUrl: string | null;
  trackingPixelUrl: string;
  overdue: boolean;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));

export function renderInvoiceReminder(input: ReminderTemplateInput) {
  const name = escapeHtml(input.clientName || "there");
  const invoiceNo = escapeHtml(input.invoiceNo);
  const amount = escapeHtml(input.amount);
  const dueDate = escapeHtml(input.dueDate);
  const headline = input.overdue ? `Invoice ${invoiceNo} is overdue` : `Reminder for invoice ${invoiceNo}`;
  const actionUrl = input.paymentUrl || input.invoiceUrl;
  return {
    subject: headline,
    text: [`Hi ${input.clientName || "there"},`, "", `${headline}.`, `Amount: ${input.amount}`, `Due date: ${input.dueDate}`, "", `View invoice: ${input.invoiceUrl}`, input.paymentUrl ? `Payment link: ${input.paymentUrl}` : "", "", "If payment has already been completed, you can ignore this reminder.", "FMG Universe"].filter(Boolean).join("\n"),
    html: `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e4e4e7"><p style="margin:0 0 16px">Hi ${name},</p><h1 style="font-size:24px;margin:0 0 16px">${headline}</h1><p style="line-height:1.6;color:#52525b">This is a reminder for your FMG invoice.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr><td style="padding:10px 0;color:#71717a">Invoice</td><td style="padding:10px 0;text-align:right;font-weight:bold">${invoiceNo}</td></tr><tr><td style="padding:10px 0;color:#71717a">Amount</td><td style="padding:10px 0;text-align:right;font-weight:bold">${amount}</td></tr><tr><td style="padding:10px 0;color:#71717a">Due date</td><td style="padding:10px 0;text-align:right;font-weight:bold">${dueDate}</td></tr></table><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:bold">${input.paymentUrl ? "Pay invoice" : "View invoice"}</a><p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a">If payment has already been completed, you can ignore this reminder.</p></div></div><img src="${escapeHtml(input.trackingPixelUrl)}" width="1" height="1" alt="" style="display:block;border:0" /></body></html>`,
  };
}
