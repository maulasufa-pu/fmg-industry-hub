"use client";

import React, { useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { calcTotals, clientSideNextInvoiceNo, defaultDueDate } from "@/lib/invoices/utils";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

type LineItem = {
  description: string;
  qty: number;
  unit_price: number;
};

export function NewInvoiceDialog({ onClose, onCreated }: Props): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const [status, setStatus] = useState<"draft" | "unpaid">("unpaid");
  const [dueDays, setDueDays] = useState<number>(14);
  const [ppnPercent, setPpnPercent] = useState<number>(11); // contoh PPN 11%
  const [items, setItems] = useState<LineItem[]>([
    { description: "Service Fee", qty: 1, unit_price: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(items, ppnPercent);

  const addItem = (): void => setItems((prev) => [...prev, { description: "", qty: 1, unit_price: 0 }]);
  const updateItem = (idx: number, patch: Partial<LineItem>): void =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number): void => setItems((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (): Promise<void> => {
    setSaving(true);
    // Jika punya RPC di DB (next_invoice_no), pakai itu untuk menghindari race.
    // Fallback ke clientSideNextInvoiceNo jika RPC tidak tersedia.
    let invoiceNo = clientSideNextInvoiceNo();

    try {
      const rpc = await sb.rpc("next_invoice_no");
      if (!rpc.error && typeof rpc.data === "string") {
        invoiceNo = rpc.data;
      }
      // simpan invoice
      const due = defaultDueDate(dueDays);
      const { error } = await sb.from("invoices").insert({
        invoice_no: invoiceNo,
        client_name: clientName || null,
        client_email: clientEmail || null,
        currency,
        status,
        amount_total: totals.grand_total,
        created_at: new Date().toISOString(),
        due_at: due.toISOString(),
      });
      if (!error) onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">New Invoice</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm hover:bg-muted">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm">Client Name</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.currentTarget.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Client Email</label>
            <input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.currentTarget.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.currentTarget.value as "IDR" | "USD")}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.currentTarget.value as "draft" | "unpaid")}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="unpaid">Unpaid</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Due in (days)</label>
            <input
              type="number"
              min={1}
              value={dueDays}
              onChange={(e) => setDueDays(parseInt(e.currentTarget.value || "1", 10))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">PPN (%)</label>
            <input
              type="number"
              min={0}
              value={ppnPercent}
              onChange={(e) => setPpnPercent(parseFloat(e.currentTarget.value || "0"))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Line Items</h3>
            <button onClick={addItem} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">+ Add Item</button>
          </div>
          <div className="mt-3 space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-2">
                <input
                  placeholder="Description"
                  value={it.description}
                  onChange={(e) => updateItem(idx, { description: e.currentTarget.value })}
                  className="col-span-6 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={it.qty}
                  onChange={(e) => updateItem(idx, { qty: parseInt(e.currentTarget.value || "1", 10) })}
                  className="col-span-2 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Unit Price"
                  value={it.unit_price}
                  onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.currentTarget.value || "0") })}
                  className="col-span-3 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="col-span-1 rounded-md border px-2 py-2 text-xs hover:bg-muted"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Subtotal</div>
            <div className="text-sm font-medium">{totals.subtotal.toLocaleString("id-ID")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Tax ({ppnPercent}%)</div>
            <div className="text-sm font-medium">{totals.tax.toLocaleString("id-ID")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Grand Total</div>
            <div className="text-sm font-semibold">{totals.grand_total.toLocaleString("id-ID")}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button
            disabled={saving}
            onClick={() => void submit()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
