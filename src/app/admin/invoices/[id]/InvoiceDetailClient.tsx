"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatIDRCurrency, isOverdue, nextStatusColor } from "@/lib/invoices/utils";

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
  due_at: string | null;
  payment_url: string | null;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  unit_price: number;
  // optional columns (abaikan jika tidak ada di DB)
  position?: number | null;
};

const INVOICE_COLS =
  "id,invoice_no,client_name,client_email,amount_total,currency,status,created_at,due_at,payment_url";
const ITEM_COLS =
  "id,invoice_id,description,qty,unit_price,position";

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

export default function InvoiceDetailClient({
  invoiceId,
}: {
  invoiceId: string;
}): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<InvoiceItemRow[] | null>(null);

  const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const MIDTRANS_IS_PRODUCTION =
    (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";
  useSnapLoader(MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const [{ data: invData }, { data: itemsData }] = await Promise.all([
      sb.from("invoices").select(INVOICE_COLS).eq("id", invoiceId).maybeSingle<InvoiceRow>(),
      sb.from("invoice_items").select(ITEM_COLS).eq("invoice_id", invoiceId).order("position", { ascending: true }),
    ]);
    setInv(invData ?? null);
    setItems(itemsData ?? null);
    setLoading(false);
  }, [sb, invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

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
    // TODO: panggil Edge Function / API route untuk email/WA.
    // eslint-disable-next-line no-console
    console.log("send reminder -> invoice:", inv.id);
  };

  const createSnapAndPay = async (): Promise<void> => {
    if (!inv) return;
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

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="h-24 rounded-lg border bg-card animate-pulse" />
          <div className="h-24 rounded-lg border bg-card animate-pulse" />
          <div className="h-24 rounded-lg border bg-card animate-pulse" />
        </div>
        <div className="h-64 rounded-xl border bg-card animate-pulse" />
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Invoice not found.
        </div>
      </div>
    );
  }

  const overdue = isOverdue(inv.status, inv.due_at);
  const badgeClass = nextStatusColor(inv.status, overdue);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Invoice {inv.invoice_no}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>
              Created:{" "}
              {inv.created_at
                ? new Date(inv.created_at).toLocaleDateString("id-ID")
                : "-"}
            </span>
            <span>•</span>
            <span>
              Due:{" "}
              {inv.due_at
                ? new Date(inv.due_at).toLocaleDateString("id-ID")
                : "-"}
            </span>
            <span>•</span>
            <span className={badgeClass + " inline-flex items-center rounded-full px-2 py-0.5 capitalize"}>
              {overdue && inv.status === "unpaid" ? "overdue" : inv.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {inv.status === "unpaid" && (
            <>
              <button
                onClick={() => void sendReminder()}
                className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
              >
                Reminder
              </button>
              <button
                onClick={() => void createSnapAndPay()}
                className="h-9 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Pay
              </button>
              <button
                onClick={() => void markPaid()}
                className="h-9 rounded-md bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700"
              >
                Mark Paid
              </button>
              <button
                onClick={() => void cancelInvoice()}
                className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Cancel
              </button>
            </>
          )}
          <Link
            href="/admin/invoices"
            className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Client</div>
          <div className="mt-1 text-base font-medium">
            {inv.client_name ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground">
            {inv.client_email ?? ""}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Amount</div>
          <div className="mt-1 text-xl font-semibold">
            {inv.amount_total != null
              ? `${(inv.currency ?? "IDR").toUpperCase()} ${Number(
                  inv.amount_total
                ).toLocaleString("id-ID")}`
              : "-"}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Payment Link</div>
          <div className="mt-1">
            {inv.payment_url ? (
              <a
                href={inv.payment_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open in new tab
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b bg-muted/40 px-4 py-3 font-medium">
          Items
        </div>
        {items && items.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it) => {
                const total = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
                return (
                  <tr key={it.id}>
                    <td className="p-3">{it.description}</td>
                    <td className="p-3">{it.qty}</td>
                    <td className="p-3">
                      {formatIDRCurrency(Number(it.unit_price) || 0)}
                    </td>
                    <td className="p-3">
                      {formatIDRCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No items.
          </div>
        )}
      </div>
    </div>
  );
}
