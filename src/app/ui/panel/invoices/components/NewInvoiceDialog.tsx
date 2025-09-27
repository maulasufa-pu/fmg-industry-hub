// E:\FMGIH\fmg-industry-hub\src\app\ui\panel\invoices\components\NewInvoiceDialog.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import { calcTotals, clientSideNextInvoiceNo, defaultDueDate } from "@/lib/invoices/utils";
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  CalendarDays,
  BadgeCheck,
  Loader2,
  Wallet,
  Percent,
  Coins,
} from "lucide-react";

type Props = { onClose: () => void; onCreated: () => void };

type LineItem = {
  service_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
};

type ServiceRow = {
  id: string;
  service_key: string;
  label: string;
  group_name: "core" | "additional" | "business";
  price: number;
  is_subscription: boolean;
  is_active: boolean;
  sort_order: number;
};

type ClientOption = { id: string; name: string; email: string | null; is_active: boolean };

function ChipToggle({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-xl border bg-background/60 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              "px-3 py-1.5 text-sm rounded-lg transition-all",
              active
                ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow"
                : "text-foreground/80 hover:bg-muted",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  icon,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <label className="font-medium">{label}</label>
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NewInvoiceDialog({ onClose, onCreated }: Props): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);

  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const [status, setStatus] = useState<"draft" | "unpaid">("unpaid");
  const [dueDays, setDueDays] = useState<number>(14);
  const [ppnPercent, setPpnPercent] = useState<number>(11);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [quickServiceId, setQuickServiceId] = useState<string>("");

  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(items, ppnPercent);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClientsLoading(true);
      const { data, error } = await sb
        .from("clients")
        .select("id,name,email,is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (!cancelled) {
        if (!error) setClients((data ?? []) as ClientOption[]);
        setClientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

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
        if (!error) setServices((data ?? []).map((s) => ({ ...s, price: Number(s.price) })));
        setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const removeItem = (idx: number): void => setItems((prev) => prev.filter((_, i) => i !== idx));

  const onQuickAdd = (): void => {
    const svc = services.find((s) => s.id === quickServiceId);
    if (svc) {
      addItemFromService(svc);
      setQuickServiceId("");
    }
  };

  const submit = async (): Promise<void> => {
    if (!selectedClientId) return;
    if (items.length === 0) return;
    setSaving(true);

    let invoiceNo = clientSideNextInvoiceNo();
    try {
      const rpc = await sb.rpc("next_invoice_no");
      if (!rpc.error && typeof rpc.data === "string") invoiceNo = rpc.data;

      const client = clients.find((c) => c.id === selectedClientId) || null;

      const due = defaultDueDate(dueDays);
      const dueDate = due.toISOString().slice(0, 10);
      const issueDate = new Date().toISOString().slice(0, 10);

      const { data: inv, error: e1 } = await sb
        .from("invoices")
        .insert({
          invoice_no: invoiceNo,
          client_id: selectedClientId,
          client_name: client?.name ?? null,
          client_email: client?.email ?? null,
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

      const invoiceId = inv.id;

      const payloads = items.map((it, idx) => ({
        invoice_id: invoiceId,
        service_id: it.service_id ?? null,
        description: it.description,
        qty: it.qty,
        unit_price: it.unit_price,
        position: idx,
      }));
      const { error: e2 } = await sb.from("invoice_items").insert(payloads).select("id");
      if (e2) {
        console.error("[insert invoice_items] failed:", e2);
        setSaving(false);
        return;
      }

      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/20 to-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-cyan-400/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/70 to-white/40 p-0 shadow-2xl backdrop-blur dark:from-slate-900/70 dark:to-slate-900/40"
        role="dialog"
        aria-modal="true"
        aria-label="Create a new invoice"
      >
        <div className="relative px-5 py-4 sm:px-6">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-400/15 to-amber-300/15 blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400">
                New Invoice
              </h2>
              <p className="text-sm text-foreground/80">Create, stage, and send with FMG polish.</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/40 text-foreground backdrop-blur hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15"
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Client">
              <div className="relative">
                <select
                  disabled={clientsLoading}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.currentTarget.value)}
                  className="w-full appearance-none rounded-xl border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{clientsLoading ? "Loading…" : "— Select client —"}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.email ? ` — ${c.email}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              </div>
            </Field>

            <Field label="Currency" icon={<Coins className="h-4 w-4 opacity-70" />}>
              <ChipToggle
                ariaLabel="Currency"
                value={currency}
                onChange={(v) => setCurrency(v as "IDR" | "USD")}
                options={[
                  { label: "IDR", value: "IDR" },
                  { label: "USD", value: "USD" },
                ]}
              />
            </Field>

            <Field label="Status" icon={<BadgeCheck className="h-4 w-4 opacity-70" />}>
              <ChipToggle
                ariaLabel="Status"
                value={status}
                onChange={(v) => setStatus(v as "draft" | "unpaid")}
                options={[
                  { label: "Unpaid", value: "unpaid" },
                  { label: "Draft", value: "draft" },
                ]}
              />
            </Field>

            <Field label="Due in (days)" icon={<CalendarDays className="h-4 w-4 opacity-70" />}>
              <input
                type="number"
                min={1}
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.currentTarget.value || "1", 10))}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="14"
              />
            </Field>

            <Field label="PPN (%)" icon={<Percent className="h-4 w-4 opacity-70" />}>
              <input
                type="number"
                min={0}
                step={0.5}
                value={ppnPercent}
                onChange={(e) => setPpnPercent(parseFloat(e.currentTarget.value || "0"))}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="11"
              />
            </Field>

            <Field label="Quick add from Services">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <select
                    disabled={servicesLoading}
                    value={quickServiceId}
                    onChange={(e) => setQuickServiceId(e.currentTarget.value)}
                    className="mt-0 w-full appearance-none rounded-xl border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— Choose service —</option>
                    <optgroup label="Core">
                      {services
                        .filter((s) => s.group_name === "core")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} — {Number(s.price).toLocaleString("id-ID")}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Additional">
                      {services
                        .filter((s) => s.group_name === "additional")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} — {Number(s.price).toLocaleString("id-ID")}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Business">
                      {services
                        .filter((s) => s.group_name === "business")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} — {Number(s.price).toLocaleString("id-ID")}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                </div>
                <button
                  disabled={!quickServiceId}
                  onClick={onQuickAdd}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                  title="Add service"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border bg-card/70 p-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide">Line Items</h3>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:opacity-95 active:translate-y-[1px]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {items.length === 0 ? (
                <div className="grid place-items-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No items yet. Add from services or create custom lines.
                </div>
              ) : null}

              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-start gap-2 rounded-xl border bg-background/60 p-2 sm:p-3"
                >
                  <input
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(idx, { description: e.currentTarget.value })}
                    className="col-span-12 sm:col-span-6 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => updateItem(idx, { qty: parseInt(e.currentTarget.value || "1", 10) })}
                    className="col-span-6 sm:col-span-2 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Unit Price"
                    value={it.unit_price}
                    onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.currentTarget.value || "0") })}
                    className="col-span-6 sm:col-span-3 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    onClick={() => removeItem(idx)}
                    className="col-span-12 sm:col-span-1 inline-flex items-center justify-center rounded-lg border px-2 py-2 text-xs hover:bg-muted"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
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

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card/80 p-4 shadow-sm ring-1 ring-black/5">
              <div className="text-xs uppercase text-muted-foreground">Subtotal</div>
              <div className="mt-1 text-lg font-semibold">
                {totals.subtotal.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="rounded-2xl border bg-card/80 p-4 shadow-sm ring-1 ring-black/5">
              <div className="text-xs uppercase text-muted-foreground">Tax ({ppnPercent}%)</div>
              <div className="mt-1 text-lg font-semibold">
                {totals.tax.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="rounded-2xl border bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> Grand Total
              </div>
              <div className="mt-1 text-xl font-extrabold tracking-tight">
                {totals.grand_total.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={saving || !selectedClientId || items.length === 0}
            onClick={() => void submit()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60 active:translate-y-[1px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Invoice
          </button>
        </div>
      </motion.div>
    </div>
  );
}
