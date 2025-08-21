// E:\FMGIH\fmg-industry-hub\src\app\ui\panel\invoices\components\NewInvoiceDialog.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { calcTotals, clientSideNextInvoiceNo, defaultDueDate } from "@/lib/invoices/utils";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

type LineItem = {
  service_id: string | null;      // null = custom item
  description: string;
  qty: number;
  unit_price: number;
};

type ServiceRow = {
  id: string;
  service_key: string;
  label: string;
  group_name: "core" | "additional" | "business";
  price: number;                  // cast to number on fetch
  is_subscription: boolean;
  is_active: boolean;
  sort_order: number;
};

type ClientOption = { id: string; name: string; email: string | null; is_active: boolean };

export function NewInvoiceDialog({ onClose, onCreated }: Props): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);

  // ===== Client dropdown (manual, TANPA project) =====
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // ===== Meta invoice =====
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const [status, setStatus] = useState<"draft" | "unpaid">("unpaid");
  const [dueDays, setDueDays] = useState<number>(14);
  const [ppnPercent, setPpnPercent] = useState<number>(11);

  // ===== Services katalog =====
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [quickServiceId, setQuickServiceId] = useState<string>("");

  // ===== Items =====
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(items, ppnPercent);

  // --- Load clients (fleksibel: coba 'clients' dulu, kalau ga ada jatuh ke 'profiles') ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClientsLoading(true);
      const { data, error } = await sb
        .from("clients")                        // <-- VIEW baru
        .select("id,name,email,is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!cancelled) {
        if (!error) setClients((data ?? []) as ClientOption[]);
        setClientsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sb]);

  // --- Load services aktif ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setServicesLoading(true);
      const { data, error } = await sb
        .from("services")
        .select("id,service_key,label,group_name,price,is_subscription,is_active,sort_order")
        .eq("is_active", true)
        .order("group_name", { ascending: true })
        .order("sort_order", { ascending: true })
        .returns<Array<Omit<ServiceRow, "price"> & { price: number | string }>>();
      if (!cancelled) {
        if (!error) {
          setServices((data ?? []).map((s) => ({ ...s, price: Number(s.price) })));
        }
        setServicesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sb]);

  const addItem = (): void =>
    setItems((prev) => [...prev, { service_id: null, description: "", qty: 1, unit_price: 0 }]);

  const addItemFromService = (svc: ServiceRow): void =>
    setItems((prev) => [
      ...prev,
      { service_id: svc.id, description: svc.label, qty: 1, unit_price: Number(svc.price) },
    ]);

  const updateItem = (idx: number, patch: Partial<LineItem>): void =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeItem = (idx: number): void =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const onQuickAdd = (): void => {
    const svc = services.find((s) => s.id === quickServiceId);
    if (svc) {
      addItemFromService(svc);
      setQuickServiceId("");
    }
  };

  const submit = async (): Promise<void> => {
    if (!selectedClientId) return; // wajib pilih client
    if (items.length === 0) return; // minimal 1 item
    setSaving(true);

    // Snapshot nama & email client dari pilihan
    const client = clients.find((c) => c.id === selectedClientId) || null;
    const clientName = client?.name ?? null;
    const clientEmail = client?.email ?? null;

    let invoiceNo = clientSideNextInvoiceNo();

    try {
      // pakai generator server kalau ada
      const rpc = await sb.rpc("next_invoice_no");
      if (!rpc.error && typeof rpc.data === "string") invoiceNo = rpc.data;

      // tanggal (YYYY-MM-DD)
      const due = defaultDueDate(dueDays);
      const dueDate = due.toISOString().slice(0, 10);
      const issueDate = new Date().toISOString().slice(0, 10);

      // 1) Insert invoices (TANPA project_id)
      const { data: inv, error: e1 } = await sb
        .from("invoices")
        .insert({
          invoice_no: invoiceNo,
          client_name: client?.name ?? null,     // snapshot
          client_email: client?.email ?? null,   // snapshot
          currency,
          status,
          issue_date: issueDate,
          due_date: dueDate,
        })
        .select("id")
        .single<{ id: string }>();


      if (e1 || !inv?.id) {
        console.error("[create invoice] failed:", e1);
        setSaving(false);
        return;
      }

      // 2) Bulk insert invoice_items
      const payloads = items.map((it, idx) => ({
        invoice_id: inv.id,
        service_id: it.service_id ?? null,
        description: it.description,
        qty: it.qty,
        unit_price: it.unit_price,
        position: idx,
      }));

      const { error: e2 } = await sb.from("invoice_items").insert(payloads).select("id");
      if (e2) {
        console.error("[insert invoice_items] failed:", e2);
        // opsional: rollback invoice
        // await sb.from("invoices").delete().eq("id", inv.id);
        setSaving(false);
        return;
      }

      onCreated();
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">New Invoice</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm hover:bg-muted">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Client dropdown */}
          <div className="space-y-2">
            <label className="text-sm">Client</label>
            <select
              disabled={clientsLoading}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.currentTarget.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">{clientsLoading ? "Loading…" : "— pilih client —"}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.email ? ` — ${c.email}` : ""}
                </option>
              ))}
            </select>
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

        {/* Quick add dari Services */}
        <div className="mt-6 rounded-lg border p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm block">Quick add from Services</label>
              <select
                disabled={servicesLoading}
                value={quickServiceId}
                onChange={(e) => setQuickServiceId(e.currentTarget.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">— pilih service —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} — {Number(s.price).toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
            </div>
            <button
              disabled={!quickServiceId}
              onClick={onQuickAdd}
              className="h-9 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-50"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Line Items</h3>
            <button onClick={addItem} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
              + Add Item
            </button>
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
                  onChange={(e) =>
                    updateItem(idx, { qty: parseInt(e.currentTarget.value || "1", 10) })
                  }
                  className="col-span-2 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Unit Price"
                  value={it.unit_price}
                  onChange={(e) =>
                    updateItem(idx, { unit_price: parseFloat(e.currentTarget.value || "0") })
                  }
                  className="col-span-3 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="col-span-1 rounded-md border px-2 py-2 text-xs hover:bg-muted"
                >
                  ✕
                </button>
                {it.service_id ? (
                  <div className="col-span-12 text-[11px] text-muted-foreground">
                    linked service: {it.service_id}
                  </div>
                ) : null}
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
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            disabled={saving || !selectedClientId || items.length === 0}
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
