// E:\FMGIH\fmg-industry-hub\src\app\ui\panel\invoices\page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { NewInvoiceDialog } from "./components/NewInvoiceDialog";
import { formatIDRCurrency, isOverdue, nextStatusColor } from "@/lib/invoices/utils";

type InvoiceStatus = "draft" | "unpaid" | "paid" | "cancelled";

type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_name: string | null;
  client_email?: string | null;
  amount_total: number | null;
  currency: string | null;
  status: InvoiceStatus;
  created_at: string | null;
  due_date: string | null; // DATE
  payment_url?: string | null;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  position: number;
};

type InvoiceWithItems = InvoiceRow & { invoice_items: InvoiceItemRow[] };

// --- constants
const COLS_INVOICES =
  "id,invoice_no,client_name,client_email,amount_total,currency,status,created_at,due_date,payment_url";

/**
 * Kalau ada lebih dari 1 FK dari invoice_items ke invoices,
 * pakai sintaks yang eksplisit: invoice_items!<fk_name>(...)
 * Contoh FK umum: invoice_items_invoice_id_fkey
 * Kalau embed kamu masih kosong, UNCOMMENT baris yang pakai !invoice_items_invoice_id_fkey
 */
const COLS_ITEMS =
  "invoice_items(id,invoice_id,service_id,description,qty,unit_price,position)";
// const COLS_ITEMS =
//   "invoice_items!invoice_items_invoice_id_fkey(id,invoice_id,service_id,description,qty,unit_price,position)";

const SELECT_INVOICES = `${COLS_INVOICES},${COLS_ITEMS}`;

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

export default function AdminInvoicesPage(): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InvoiceStatus | "all">("unpaid");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<InvoiceWithItems[]>([]);
  const [openNew, setOpenNew] = useState(false);

  const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const MIDTRANS_IS_PRODUCTION =
    (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";
  useSnapLoader(MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION);

  const load = async (): Promise<void> => {
    setLoading(true);

    let qb = sb.from("invoices").select(SELECT_INVOICES);

    if (tab !== "all") {
      qb = qb.eq("status", tab);
    }

    if (q.trim()) {
      const like = `%${q.trim()}%`;
      qb = qb.or(`invoice_no.ilike.${like},client_name.ilike.${like}`);
    }

    const { data, error } = await qb
      .order("created_at", { ascending: false })
      // urutkan nested invoice_items by position di server
      .order("position", { ascending: true, foreignTable: "invoice_items" })
      .returns<InvoiceWithItems[]>();

    if (!error) {
      setRows(data ?? []);
    }
    setLoading(false);
  };

  // initial + re-run saat tab/q berubah
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q]);

  // Realtime: reload saat invoices ATAU invoice_items berubah
  useEffect(() => {
    const ch = sb
      .channel("invoices-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => void load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice_items" },
        () => void load()
      )
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, tab, q]);

  const markPaid = async (id: string): Promise<void> => {
    const { error } = await sb.from("invoices").update({ status: "paid" }).eq("id", id);
    if (!error) void load();
  };

  const cancelInvoice = async (id: string): Promise<void> => {
    const { error } = await sb.from("invoices").update({ status: "cancelled" }).eq("id", id);
    if (!error) void load();
  };

  const createSnapAndPay = async (inv: InvoiceRow): Promise<void> => {
    const res = await fetch("/api/payments/midtrans/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: inv.id }),
    });
    if (!res.ok) return;
    const json: { token: string; redirect_url: string } = await res.json();
    if (window.snap) {
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

  const sendReminder = async (id: string): Promise<void> => {
    // TODO: Edge Function / API route utk email/WA
    // eslint-disable-next-line no-console
    console.log("send reminder -> invoice:", id);
  };

  const Tabs: Array<{ key: InvoiceStatus | "all"; label: string }> = [
    { key: "unpaid", label: "Unpaid" },
    { key: "paid", label: "Paid" },
    { key: "draft", label: "Draft" },
    { key: "cancelled", label: "Cancelled" },
    { key: "all", label: "All" },
  ];

  // Stats
  const totalUnpaid = rows
    .filter((r) => r.status === "unpaid")
    .reduce((acc, r) => acc + (Number(r.amount_total) || 0), 0);
  const overdueCount = rows.filter((r) => isOverdue(r.status, r.due_date)).length;
  const paidCount = rows.filter((r) => r.status === "paid").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tagihan, kirim pembayaran via Midtrans, dan pantau status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              placeholder="Search invoice/client…"
              className="h-9 w-[220px] rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setOpenNew(true)}
            className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Unpaid</div>
          <div className="mt-1 text-xl font-semibold">{formatIDRCurrency(totalUnpaid)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className="mt-1 text-xl font-semibold">{overdueCount}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Paid</div>
          <div className="mt-1 text-xl font-semibold">{paidCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {Tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "px-3 py-1.5 text-sm rounded-full border",
                active ? "bg-blue-600 text-white border-blue-600" : "hover:bg-muted",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Table / Empty / Loading */}
      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-muted-foreground shadow-sm">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-muted-foreground shadow-sm">
          No invoices found.
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">Client</th>
                <th className="p-3">Items</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3">Due</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const overdue = isOverdue(r.status, r.due_date);
                const statusClass = nextStatusColor(r.status, overdue);
                // sort nested items by position sebelum render
                const items = [...(r.invoice_items ?? [])].sort(
                  (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0)
                );
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{r.invoice_no}</td>
                    <td className="p-3">{r.client_name ?? "-"}</td>

                    {/* Items preview */}
                    <td className="p-3">
                      {items.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {items.slice(0, 2).map((it) => (
                            <span
                              key={it.id}
                              className="rounded-full border px-2 py-0.5 text-xs"
                              title={`${it.description} × ${it.qty} @ ${formatIDRCurrency(Number(it.unit_price) || 0)}`}
                            >
                              {it.description}
                            </span>
                          ))}
                          {items.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{items.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="p-3">
                      {r.amount_total != null
                        ? `${(r.currency ?? "IDR").toUpperCase()} ${Number(r.amount_total).toLocaleString(
                            "id-ID"
                          )}`
                        : "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          statusClass +
                          " inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize"
                        }
                      >
                        {overdue && r.status === "unpaid" ? "overdue" : r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="p-3">
                      {r.due_date ? new Date(r.due_date).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {r.status === "unpaid" && (
                          <>
                            <button
                              onClick={() => void sendReminder(r.id)}
                              className="rounded border px-2 py-1 text-xs hover:bg-muted"
                            >
                              Reminder
                            </button>
                            <button
                              onClick={() => void createSnapAndPay(r)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => void markPaid(r.id)}
                              className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => void cancelInvoice(r.id)}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {r.payment_url ? (
                          <a
                            href={r.payment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border px-2 py-1 text-xs hover:bg-muted"
                          >
                            Payment Link
                          </a>
                        ) : null}
                        <Link
                          href={`/admin/invoices/${r.id}`}
                          className="rounded border px-2 py-1 text-xs hover:bg-muted"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Invoice Dialog */}
      {openNew && (
        <NewInvoiceDialog
          onClose={() => setOpenNew(false)}
          onCreated={() => {
            setOpenNew(false);
            void load();
          }}
        />
      )}
    </div>
  );
}
