import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { INVOICE_REMINDER_TEMPLATE_VERSION, renderInvoiceReminder } from "@/lib/invoices/reminder-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const { id } = await params;
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Invoice service is not configured");
    const { data, error } = await admin.from("invoice_delivery_logs").select("id,recipient_email,delivery_type,status,template_version,provider_message_id,attempt_count,error_message,last_attempt_at,next_retry_at,sent_at,opened_at,created_at").eq("invoice_id", id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ logs: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    return auth ?? NextResponse.json({ error: "Unable to load reminder delivery logs" }, { status: 500 });
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const auth = await requireAdminRequest(request);
    const rate = consumeRateLimit(request, "invoice-reminder", 15, 60_000, auth.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many reminder requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const { id } = await params;
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error("Invoice service is not configured");
    const { data: invoice, error: invoiceError } = await admin.from("invoices").select("id,invoice_no,client_name,client_email,amount_total,currency,status,due_date,payment_url").eq("id", id).maybeSingle();
    if (invoiceError) throw invoiceError;
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status !== "unpaid") return NextResponse.json({ error: "Only unpaid invoices can receive reminders" }, { status: 409 });
    if (!invoice.client_email) return NextResponse.json({ error: "Invoice has no client email" }, { status: 422 });
    const overdue = !!invoice.due_date && new Date(`${invoice.due_date}T23:59:59Z`).getTime() < Date.now();
    const { data: log, error: logError } = await admin.from("invoice_delivery_logs").insert({ invoice_id: id, recipient_email: invoice.client_email.toLowerCase(), delivery_type: overdue ? "overdue" : "reminder", status: "queued", template_version: INVOICE_REMINDER_TEMPLATE_VERSION, created_by: auth.user.id }).select("id,tracking_token").single();
    if (logError) throw logError;

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
    const amount = `${String(invoice.currency || "IDR").toUpperCase()} ${Number(invoice.amount_total || 0).toLocaleString("id-ID")}`;
    const template = renderInvoiceReminder({ clientName: invoice.client_name || "", invoiceNo: invoice.invoice_no, amount, dueDate: invoice.due_date ? new Date(`${invoice.due_date}T00:00:00Z`).toLocaleDateString("id-ID") : "Not specified", invoiceUrl: `${baseUrl}/client/invoices/${invoice.id}`, paymentUrl: invoice.payment_url || null, trackingPixelUrl: `${baseUrl}/api/invoices/open/${log.tracking_token}`, overdue });
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.INVOICE_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || "FMG Billing <billing@flemmomusic.com>";
    if (!apiKey) {
      await admin.from("invoice_delivery_logs").update({ status: "failed", attempt_count: 0, error_message: "Email provider is not configured", next_retry_at: new Date(Date.now() + 15 * 60_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", log.id);
      return NextResponse.json({ error: "Invoice email provider is not configured" }, { status: 503 });
    }

    let providerMessageId: string | null = null;
    let lastError = "Email delivery failed";
    let attempts = 0;
    for (attempts = 1; attempts <= 3; attempts += 1) {
      try {
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `invoice-reminder-${log.id}` }, body: JSON.stringify({ from, to: [invoice.client_email], reply_to: process.env.CONTACT_TO_EMAIL || undefined, subject: template.subject, text: template.text, html: template.html }) });
        const body = await response.json().catch(() => ({}));
        if (response.ok) { providerMessageId = typeof body.id === "string" ? body.id : null; break; }
        lastError = typeof body.message === "string" ? body.message.slice(0, 500) : `Provider returned HTTP ${response.status}`;
      } catch (error) { lastError = error instanceof Error ? error.message.slice(0, 500) : "Email request failed"; }
    }
    const now = new Date().toISOString();
    if (!providerMessageId) {
      await admin.from("invoice_delivery_logs").update({ status: "failed", attempt_count: 3, error_message: lastError, last_attempt_at: now, next_retry_at: new Date(Date.now() + 15 * 60_000).toISOString(), updated_at: now }).eq("id", log.id);
      return NextResponse.json({ error: "Reminder failed after three delivery attempts" }, { status: 502 });
    }
    await admin.from("invoice_delivery_logs").update({ status: "sent", attempt_count: attempts, provider_message_id: providerMessageId, error_message: null, last_attempt_at: now, sent_at: now, next_retry_at: null, updated_at: now }).eq("id", log.id);
    return NextResponse.json({ ok: true, logId: log.id, attempts });
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    return auth ?? NextResponse.json({ error: "Unable to send invoice reminder" }, { status: 500 });
  }
}
