"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatIDRCurrency, isOverdue, nextStatusColor } from "@/lib/invoices/utils";
import { notify } from "@/components/ui/FeedbackHost";

type InvoiceStatus = "draft" | "unpaid" | "paid" | "cancelled";

type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_name: string | null;
  client_email: string | null;
  amount_total: number | null;
  currency: string | null;
  status: InvoiceStatus;
  created_at: string | null;
  due_date: string | null;
  payment_url: string | null;
};

export type ServiceRow = {
  id: string;
  service_key: string;
  label: string;
  group_name: "core" | "additional" | "business";
  price: number;
  is_subscription: boolean;
  is_active: boolean;
  sort_order: number;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  position: number;
};

type UserRole = "owner" | "admin" | "client" | "engineer" | "staff" | "guest"; // sesuaikan jika perlu
type DeliveryLog = { id: string; recipient_email: string; delivery_type: string; status: string; template_version: string; attempt_count: number; error_message: string | null; sent_at: string | null; opened_at: string | null; created_at: string };

const INVOICE_COLS =
  "id,invoice_no,client_name,client_email,amount_total,currency,status,created_at,issue_date,due_date,notes,payment_url";
const ITEM_COLS = "id,invoice_id,service_id,description,qty,unit_price,position";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void;
    };
  }
}

function useSnapLoader(clientKey: string | undefined, isProduction: boolean) {
  useEffect(() => {
    if (!clientKey) return;
    const s = document.createElement("script");
    s.src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://sandbox.midtrans.com/snap/snap.js";
    s.async = true;
    s.setAttribute("data-client-key", clientKey);
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, [clientKey, isProduction]);
}

export default function InvoiceDetailClient({ invoiceId }: { invoiceId: string }): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<InvoiceItemRow[] | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const [role, setRole] = useState<UserRole>("client");
  const isAdminOwner = role === "admin" || role === "owner";
  const backHref = isAdminOwner ? "/admin/invoices" : "/client/invoices";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: u } = await sb.auth.getUser();
        const uid = u.user?.id;
        if (!uid) return;
        const { data: prof } = await sb
          .from("profiles")
          .select("main_role")
          .eq("id", uid)
          .maybeSingle<{ main_role: string | null }>();
        if (!cancelled) {
          const main = (prof?.main_role || "").toLowerCase();
          if (main === "admin" || main === "owner") setRole(main as UserRole);
          else setRole("client");
        }
      } catch {
        if (!cancelled) setRole("client");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  const loadDeliveryLogs = useCallback(async () => {
    const response = await fetch(`/api/invoices/${invoiceId}/reminders`, { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setDeliveryLogs(Array.isArray(body.logs) ? body.logs : []);
  }, [invoiceId]);

  useEffect(() => { if (isAdminOwner) void loadDeliveryLogs(); }, [isAdminOwner, loadDeliveryLogs]);

  const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const MIDTRANS_IS_PRODUCTION =
    (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";
  useSnapLoader(MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);

    const invQ = sb.from("invoices").select(INVOICE_COLS).eq("id", invoiceId).maybeSingle<InvoiceRow>();
    const itemsQ = sb
      .from("invoice_items")
      .select(ITEM_COLS)
      .eq("invoice_id", invoiceId)
      .order("position", { ascending: true })
      .returns<InvoiceItemRow[]>();

    const [{ data: invData }, { data: itemsData }] = await Promise.all([invQ, itemsQ]);

    setInv(invData ?? null);
    setItems(itemsData ?? null);
    setLoading(false);
  }, [sb, invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const ch = sb
      .channel(`inv-${invoiceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice_items", filter: `invoice_id=eq.${invoiceId}` },
        () => { void load(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices", filter: `id=eq.${invoiceId}` },
        () => { void load(); }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(ch);
    };
  }, [sb, invoiceId, load]);

  const markPaid = async (): Promise<void> => {
    if (!inv) return;
    const { error } = await sb.from("invoices").update({ status: "paid" }).eq("id", inv.id);
    if (!error) void load();
  };

  const cancelInvoice = async (): Promise<void> => {
    if (!inv) return;
    const { error } = await sb.from("invoices").update({ status: "cancelled" }).eq("id", inv.id);
    if (!error) void load();
  };

  const sendReminder = async (): Promise<void> => {
    if (!inv) return;
    setReminderStatus("Sending reminder…");
    const response = await fetch(`/api/invoices/${inv.id}/reminders`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setReminderStatus(response.ok ? `Reminder delivered${body.attempts > 1 ? ` after ${body.attempts} attempts` : ""}.` : (typeof body.error === "string" ? body.error : "Reminder delivery failed."));
    void loadDeliveryLogs();
  };

  const createSnapAndPay = async (): Promise<void> => {
    if (!inv) return;

    const res = await fetch("/api/payments/midtrans/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: inv.id }),
    });

    if (!res.ok) {await res.text().catch(() => "");
      //console.error("payment create error:", text || res.statusText);
      notify("Failed to start payment.", "error");
      return;
    }

    const json: { token: string | null; redirect_url: string } = await res.json();

    if (json.token && window.snap) {
      window.snap.pay(json.token, {
        onSuccess: async () => await load(),
        onPending: async () => await load(),
        onError: async () => await load(),
        onClose: () => void 0,
      });
    } else {
      window.location.href = json.redirect_url;
    }
  };

  const refreshPaymentLink = async (): Promise<void> => {
    if (!inv) return;
    try {
      const res = await fetch("/api/payments/midtrans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: inv.id, mode: "link" }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json: { redirect_url?: string | null } = await res.json();
      const redirectUrl = json?.redirect_url ?? null;
      if (redirectUrl) {
        const { error } = await sb.from("invoices").update({ payment_url: redirectUrl }).eq("id", inv.id);
        if (error) throw error;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      //console.error("refresh payment link failed:", err);
      notify("Failed to refresh payment.", "error");
    } finally {
      await load();
    }
  };

  const printInvoice = (): void => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="h-24 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse shadow-sm" />
          <div className="h-24 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse shadow-sm" />
          <div className="h-24 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse shadow-sm" />
        </div>
        <div className="h-64 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse shadow-sm" />
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="p-6">
        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
          Invoice not found.
        </div>
      </div>
    );
  }

  const overdue = isOverdue(inv.status, inv.due_date);
  const badgeClass = nextStatusColor(inv.status, overdue);

  return (
    <div className="p-6 space-y-6">
      {reminderStatus && <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200">{reminderStatus}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Invoice {inv.invoice_no}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>
              Created: {inv.created_at ? new Date(inv.created_at).toLocaleDateString("id-ID") : "-"}
            </span>
            <span>•</span>
            <span>Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID") : "-"}</span>
            <span>•</span>
            <span className={badgeClass + " inline-flex items-center rounded-full px-2.5 py-0.5 text-xs capitalize border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 font-medium"}>
              {overdue && inv.status === "unpaid" ? "overdue" : inv.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {inv.status === "unpaid" && (
            <>
              {isAdminOwner && (
                <button
                  onClick={() => void sendReminder()}
                  className="h-9 rounded-md border-2 border-slate-300 dark:border-slate-600 px-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  Reminder
                </button>
              )}

              <button
                onClick={() => void createSnapAndPay()}
                className="h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 text-sm font-medium text-white transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                Pay
              </button>

              {isAdminOwner && (
                <>
                  <button
                    onClick={() => void markPaid()}
                    className="h-9 rounded-md bg-green-600 hover:bg-green-700 px-3 text-sm font-medium text-white transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => void cancelInvoice()}
                    className="h-9 rounded-md bg-red-600 hover:bg-red-700 px-3 text-sm font-medium text-white transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                onClick={() => void refreshPaymentLink()}
                className="h-9 rounded-md border-2 border-slate-300 dark:border-slate-600 px-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                title="Regenerate & save Midtrans payment link"
              >
                Refresh Payment Link
              </button>
            </>
          )}

          <button
            onClick={printInvoice}
            className="h-9 rounded-md border-2 border-slate-300 dark:border-slate-600 px-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            Print
          </button>

          <Link href={backHref} className="inline-flex items-center h-9 rounded-md border-2 border-slate-300 dark:border-slate-600 px-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">Client</div>
          <div className="mt-1 text-base font-medium text-slate-900 dark:text-white">{inv.client_name ?? "-"}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{inv.client_email ?? ""}</div>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">Amount</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {inv.amount_total != null
              ? `${(inv.currency ?? "IDR").toUpperCase()} ${Number(inv.amount_total).toLocaleString("id-ID")}`
              : "-"}
          </div>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">Payment Link</div>
          <div className="mt-1">
            {inv.payment_url ? (
              <a href={inv.payment_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                Open in new tab
              </a>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
            )}
          </div>
        </div>
      </div>

      {isAdminOwner && <section className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"><h2 className="font-semibold text-slate-900 dark:text-white">Reminder delivery</h2>{deliveryLogs.length === 0 ? <p className="mt-2 text-sm text-slate-500">No reminder sent yet.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Sent</th><th className="p-2">Recipient</th><th className="p-2">Status</th><th className="p-2">Attempts</th><th className="p-2">Opened</th><th className="p-2">Template</th></tr></thead><tbody>{deliveryLogs.map((log) => <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700"><td className="p-2">{new Date(log.created_at).toLocaleString("id-ID")}</td><td className="p-2">{log.recipient_email}</td><td className="p-2">{log.status}{log.error_message ? ` — ${log.error_message}` : ""}</td><td className="p-2">{log.attempt_count}</td><td className="p-2">{log.opened_at ? new Date(log.opened_at).toLocaleString("id-ID") : "Not yet"}</td><td className="p-2">{log.template_version}</td></tr>)}</tbody></table></div>}</section>}

      <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 px-4 py-3 font-medium text-slate-900 dark:text-white">Items</div>
        {items && items.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700 text-left">
              <tr className="text-slate-700 dark:text-slate-300">
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Qty</th>
                <th className="p-3 font-medium">Unit Price</th>
                <th className="p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((it) => {
                const total = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
                return (
                  <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 text-slate-900 dark:text-white">{it.description}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{it.qty}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{formatIDRCurrency(Number(it.unit_price) || 0)}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{formatIDRCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-6 text-sm text-slate-600 dark:text-slate-400">No items.</div>
        )}
      </div>
    </div>
  );
}
