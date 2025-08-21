"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Layers, Package2, Search, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getEffectiveRole } from "@/lib/roles/effective";

/***************************************
 * Types (fallbacks if no generated types)
 ***************************************/

// tambah (di atas): fallback type biar strict, hapus kalau kamu sudah punya import type UserRole
type UserRole =
  | "owner" | "admin" | "client" | "composer"
  | "producer" | "engineer" | "anr" | "publisher" | "guest";

type ServiceGroup = "core" | "additional" | "business";

type PromoType = "none" | "percentage" | "flat";

type ServiceRow = {
  id: string;
  service_key: string;
  label: string;
  group_name: ServiceGroup;
  price: number;
  description: string | null;
  is_subscription: boolean;
  is_active: boolean;
  sort_order: number;
  promo_type: PromoType;
  promo_value: number; // percentage or flat amount depending on promo_type
  promo_start: string | null; // ISO
  promo_end: string | null; // ISO
  created_at: string;
  updated_at: string;
};

type BundleRow = {
  id: string;
  bundle_key: string;
  label: string;
  bundle_price: number;
  description: string | null;
  note: string | null;
  is_active: boolean;
  sort_order: number;
  promo_type: PromoType;
  promo_value: number;
  promo_start: string | null;
  promo_end: string | null;
  created_at: string;
  updated_at: string;
};

type BundleItemRow = {
  id: string;
  bundle_id: string;
  service_id: string;
};

/***************************************
 * Helpers
 ***************************************/

function currencyIDR(value: number): string {
  if (!Number.isFinite(value)) return "Rp 0";
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
  }
}

function effectivePrice(
  basePrice: number,
  promoType: PromoType,
  promoValue: number,
  startISO: string | null,
  endISO: string | null,
  now = new Date()
): number {
  const active = (() => {
    if (promoType === "none") return false;
    if (!startISO && !endISO) return true;
    const start = startISO ? new Date(startISO) : null;
    const end = endISO ? new Date(endISO) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  })();
  if (!active) return basePrice;
  if (promoType === "percentage") {
    const cut = (basePrice * promoValue) / 100;
    return Math.max(0, basePrice - cut);
  }
  if (promoType === "flat") {
    return Math.max(0, basePrice - promoValue);
  }
  return basePrice;
}

const Badge: React.FC<{ children: React.ReactNode; tone?: "ok" | "warn" | "muted" }>
  = ({ children, tone = "muted" }) => (
  <span className={
    [
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      tone === "ok" && "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
      tone === "warn" && "bg-amber-600/10 text-amber-700 dark:text-amber-300",
      tone === "muted" && "bg-zinc-600/10 text-zinc-700 dark:text-zinc-300",
    ].filter(Boolean).join(" ")
  }>
    {children}
  </span>
);

/***************************************
 * Main Page
 ***************************************/

export default function ProductServicesPage(): React.JSX.Element {
  // Guard: only Owner/Admin
  const [role, setRole] = useState<UserRole | null>(null);

    useEffect(() => {
    let alive = true;
    (async () => {
        const r = await getEffectiveRole(); // <- async
        if (alive) setRole(r);
    })();
    return () => { alive = false; };
    }, []);

    const allowed = role === "owner" || role === "admin";

    if (role === null) {
    return <div className="mx-auto max-w-xl p-6">Loading…</div>;
    }
    if (!allowed) {
    return (
        <div className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm text-zinc-600">Halaman ini hanya untuk Owner & Admin.</p>
        </div>
    );
    }


  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-sm text-zinc-600">Kelola layanan, paket (bundles), promo, dan diskon.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ServicesPanel />
        <BundlesPanel />
      </div>
    </div>
  );
}

/***************************************
 * Services Panel
 ***************************************/

function ServicesPanel(): React.JSX.Element {
  const sb = getSupabaseClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [query, setQuery] = useState<string>("");
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await sb
      .from("services")
      .select("*")
      .order("is_active", { ascending: false })
      .order("group_name", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });
    if (err) setError(err.message);
    else setRows((data ?? []).map(normalizeService));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.service_key.toLowerCase().includes(q) ||
      r.group_name.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Package2 className="h-5 w-5"/> Services</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500"/>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari service..."
              className="pl-8 pr-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
          </div>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-3 py-2 text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4"/> New
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/40">
            <tr className="text-left">
              <th className="p-3">Service</th>
              <th className="p-3">Group</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Promo</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={6}>Loading…</td></tr>
            ) : (
              filtered.map((r) => {
                const now = new Date();
                const eff = effectivePrice(r.price, r.promo_type, r.promo_value, r.promo_start, r.promo_end, now);
                const hasPromo = eff !== r.price;
                return (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="p-3">
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-zinc-500">{r.service_key}</div>
                    </td>
                    <td className="p-3"><Badge>{r.group_name}</Badge></td>
                    <td className="p-3">
                      <div className="font-medium">{currencyIDR(eff)}</div>
                      {hasPromo && (
                        <div className="text-xs text-zinc-500 line-through">{currencyIDR(r.price)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {r.promo_type === "none" ? (
                        <span className="text-xs text-zinc-500">—</span>
                      ) : (
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">
                          {r.promo_type === "percentage" ? `${r.promo_value}%` : currencyIDR(r.promo_value)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {r.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="warn">Inactive</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditing(r); setCreating(false); }}
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <ServiceEditor
            key={editing ? editing.id : "new"}
            initial={editing ?? null}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => { setCreating(false); setEditing(null); void load(); }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function normalizeService(row: Record<string, unknown>): ServiceRow {
  const obj = row as unknown as ServiceRow;
  return {
    ...obj,
    description: (obj.description ?? null) as string | null,
    promo_type: (obj.promo_type ?? "none") as PromoType,
    promo_value: Number(obj.promo_value ?? 0),
    promo_start: (obj.promo_start ?? null) as string | null,
    promo_end: (obj.promo_end ?? null) as string | null,
    price: Number(obj.price ?? 0),
    sort_order: Number(obj.sort_order ?? 0),
  };
}

const PANEL_BG = "fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4";

function ServiceEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: ServiceRow | null;
  onClose: () => void;
  onSaved: () => void;
}): React.JSX.Element {
  const sb = getSupabaseClient();
  const [draft, setDraft] = useState<Omit<ServiceRow, "id" | "created_at" | "updated_at">>(
    initial ?? {
      service_key: "",
      label: "",
      group_name: "core",
      price: 0,
      description: null,
      is_subscription: false,
      is_active: true,
      sort_order: 0,
      promo_type: "none",
      promo_value: 0,
      promo_start: null,
      promo_end: null,
    }
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErr(null);

    const payload = { ...draft } as const;
    if (initial) {
      const { error } = await sb.from("services").update(payload).eq("id", initial.id);
      if (error) setErr(error.message); else onSaved();
    } else {
      const { error } = await sb.from("services").insert(payload);
      if (error) setErr(error.message); else onSaved();
    }

    setSaving(false);
  }

  return (
    <motion.div className={PANEL_BG} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-950 p-5 shadow-xl border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{initial ? "Edit Service" : "New Service"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close"><X className="h-4 w-4"/></button>
        </div>

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Service Key</label>
              <input
                value={draft.service_key}
                onChange={(e) => set("service_key", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                placeholder="unique_key"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Label</label>
              <input
                value={draft.label}
                onChange={(e) => set("label", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                placeholder="Nama layanan"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Group</label>
              <select
                value={draft.group_name}
                onChange={(e) => set("group_name", e.target.value as ServiceGroup)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              >
                <option value="core">core</option>
                <option value="additional">additional</option>
                <option value="business">business</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600">Harga (IDR)</label>
              <input
                type="number"
                min={0}
                value={Number.isFinite(draft.price) ? draft.price : 0}
                onChange={(e) => set("price", Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-600">Deskripsi</label>
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              rows={3}
              placeholder="Opsional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input id="is_subs" type="checkbox" checked={draft.is_subscription} onChange={(e) => set("is_subscription", e.target.checked)} />
              <label htmlFor="is_subs" className="text-sm">Subscription</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="is_active" type="checkbox" checked={draft.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              <label htmlFor="is_active" className="text-sm">Active</label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Promo Type</label>
              <select
                value={draft.promo_type}
                onChange={(e) => set("promo_type", e.target.value as PromoType)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              >
                <option value="none">none</option>
                <option value="percentage">percentage</option>
                <option value="flat">flat</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600">Promo Value</label>
              <input
                type="number"
                min={0}
                value={Number.isFinite(draft.promo_value) ? draft.promo_value : 0}
                onChange={(e) => set("promo_value", Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Promo Start</label>
              <input
                type="datetime-local"
                value={toLocalDT(draft.promo_start)}
                onChange={(e) => set("promo_start", fromLocalDT(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Promo End</label>
              <input
                type="datetime-local"
                value={toLocalDT(draft.promo_end)}
                onChange={(e) => set("promo_end", fromLocalDT(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-600">Sort Order</label>
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/***************************************
 * Bundles Panel
 ***************************************/

function BundlesPanel(): React.JSX.Element {
  const sb = getSupabaseClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItemRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [query, setQuery] = useState<string>("");
  const [editing, setEditing] = useState<BundleRow | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  async function load() {
    setLoading(true);
    setError(null);
    const [b, bi, s] = await Promise.all([
      sb.from("bundles").select("*").order("is_active", { ascending: false }).order("sort_order", { ascending: true }).order("label", { ascending: true }),
      sb.from("bundle_items").select("*"),
      sb.from("services").select("*").order("label"),
    ]);
    if (b.error) setError(b.error.message);
    if (bi.error) setError((prev) => prev ?? bi.error?.message ?? null);
    if (s.error) setError((prev) => prev ?? s.error?.message ?? null);

    setBundles((b.data ?? []).map(normalizeBundle));
    setBundleItems((bi.data ?? []) as BundleItemRow[]);
    setServices((s.data ?? []).map(normalizeService));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bundles;
    return bundles.filter(r => r.label.toLowerCase().includes(q) || r.bundle_key.toLowerCase().includes(q));
  }, [bundles, query]);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5"/> Bundles</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500"/>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bundle..."
              className="pl-8 pr-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
          </div>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-3 py-2 text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4"/> New
          </button>
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/40">
            <tr className="text-left">
              <th className="p-3">Bundle</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Promo</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={5}>Loading…</td></tr>
            ) : (
              filtered.map((r) => {
                const eff = effectivePrice(r.bundle_price, r.promo_type, r.promo_value, r.promo_start, r.promo_end);
                const hasPromo = eff !== r.bundle_price;
                const count = bundleItems.filter(bi => bi.bundle_id === r.id).length;
                return (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="p-3">
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-zinc-500">{r.bundle_key} • {count} item</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{currencyIDR(eff)}</div>
                      {hasPromo && (
                        <div className="text-xs text-zinc-500 line-through">{currencyIDR(r.bundle_price)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {r.promo_type === "none" ? (
                        <span className="text-xs text-zinc-500">—</span>
                      ) : (
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">
                          {r.promo_type === "percentage" ? `${r.promo_value}%` : currencyIDR(r.promo_value)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">{r.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="warn">Inactive</Badge>}</td>
                    <td className="p-3">
                      <button
                        onClick={() => { setEditing(r); setCreating(false); }}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4"/>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <BundleEditor
            key={editing ? editing.id : "new"}
            initial={editing ?? null}
            services={services}
            items={bundleItems}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => { setCreating(false); setEditing(null); void load(); }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function normalizeBundle(row: Record<string, unknown>): BundleRow {
  const obj = row as unknown as BundleRow;
  return {
    ...obj,
    description: (obj.description ?? null) as string | null,
    note: (obj.note ?? null) as string | null,
    promo_type: (obj.promo_type ?? "none") as PromoType,
    promo_value: Number(obj.promo_value ?? 0),
    promo_start: (obj.promo_start ?? null) as string | null,
    promo_end: (obj.promo_end ?? null) as string | null,
    bundle_price: Number(obj.bundle_price ?? 0),
    sort_order: Number(obj.sort_order ?? 0),
  };
}

function toLocalDT(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromLocalDT(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return d.toISOString();
}

function BundleEditor({
  initial,
  services,
  items,
  onClose,
  onSaved,
}: {
  initial: BundleRow | null;
  services: ServiceRow[];
  items: BundleItemRow[];
  onClose: () => void;
  onSaved: () => void;
}): React.JSX.Element {
  const sb = getSupabaseClient();
  const [draft, setDraft] = useState<Omit<BundleRow, "id" | "created_at" | "updated_at">>(
    initial ?? {
      bundle_key: "",
      label: "",
      bundle_price: 0,
      description: null,
      note: null,
      is_active: true,
      sort_order: 0,
      promo_type: "none",
      promo_value: 0,
      promo_start: null,
      promo_end: null,
    }
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const [attached, setAttached] = useState<string[]>(() => {
    if (!initial) return [];
    return items.filter(i => i.bundle_id === initial.id).map(i => i.service_id);
  });

  const attachable = useMemo(() => {
    const set = new Set(attached);
    return services.filter(s => !set.has(s.id) && s.is_active);
  }, [services, attached]);

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErr(null);

    let bundleId: string | null = initial?.id ?? null;

    if (bundleId) {
        // update
        const { error } = await sb.from("bundles").update(draft).eq("id", bundleId);
        if (error) { setErr(error.message); setSaving(false); return; }
    } else {
        // insert
        const { error, data } = await sb.from("bundles")
        .insert(draft)
        .select("id")
        .single();
        if (error) { setErr(error.message); setSaving(false); return; }
        bundleId = data!.id;
    }

    // sinkronisasi item bundle
    if (!bundleId) { // seharusnya tidak terjadi, guard ekstra
        setErr("Bundle ID missing after save.");
        setSaving(false);
        return;
    }

    const currentSet = new Set(items.filter(i => i.bundle_id === bundleId).map(i => i.service_id));
    const nextSet = new Set(attached);

    const toAdd: string[] = [];
    nextSet.forEach(id => { if (!currentSet.has(id)) toAdd.push(id); });

    const toRemove: string[] = [];
    currentSet.forEach(id => { if (!nextSet.has(id)) toRemove.push(id); });

    if (toAdd.length > 0) {
        const payload = toAdd.map(sid => ({ bundle_id: bundleId as string, service_id: sid }));
        const { error } = await sb.from("bundle_items").insert(payload);
        if (error) { setErr(error.message); setSaving(false); return; }
    }
    if (toRemove.length > 0) {
        for (const sid of toRemove) {
        const { error } = await sb.from("bundle_items")
            .delete()
            .eq("bundle_id", bundleId)
            .eq("service_id", sid);
        if (error) { setErr(error.message); setSaving(false); return; }
        }
    }

    setSaving(false);
    onSaved();
    }


  return (
    <motion.div className={PANEL_BG} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-950 p-5 shadow-xl border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{initial ? "Edit Bundle" : "New Bundle"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close"><X className="h-4 w-4"/></button>
        </div>

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Bundle Key</label>
              <input
                value={draft.bundle_key}
                onChange={(e) => set("bundle_key", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                placeholder="unique_key"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Label</label>
              <input
                value={draft.label}
                onChange={(e) => set("label", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                placeholder="Nama bundle"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Harga Bundle (IDR)</label>
              <input
                type="number"
                min={0}
                value={Number.isFinite(draft.bundle_price) ? draft.bundle_price : 0}
                onChange={(e) => set("bundle_price", Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input id="b_active" type="checkbox" checked={draft.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              <label htmlFor="b_active" className="text-sm">Active</label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Deskripsi</label>
              <textarea
                value={draft.description ?? ""}
                onChange={(e) => set("description", e.target.value || null)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                rows={3}
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Note internal</label>
              <textarea
                value={draft.note ?? ""}
                onChange={(e) => set("note", e.target.value || null)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                rows={3}
                placeholder="Internal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Promo Type</label>
              <select
                value={draft.promo_type}
                onChange={(e) => set("promo_type", e.target.value as PromoType)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              >
                <option value="none">none</option>
                <option value="percentage">percentage</option>
                <option value="flat">flat</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600">Promo Value</label>
              <input
                type="number"
                min={0}
                value={Number.isFinite(draft.promo_value) ? draft.promo_value : 0}
                onChange={(e) => set("promo_value", Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Promo Start</label>
              <input
                type="datetime-local"
                value={toLocalDT(draft.promo_start)}
                onChange={(e) => set("promo_start", fromLocalDT(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Promo End</label>
              <input
                type="datetime-local"
                value={toLocalDT(draft.promo_end)}
                onChange={(e) => set("promo_end", fromLocalDT(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
              />
            </div>
          </div>

          {/* Attach services to bundle */}
          {initial && (
            <div className="mt-2">
              <div className="mb-2 text-sm font-medium">Services in this bundle</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {services.filter(s => attached.includes(s.id)).map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs">
                    {s.label}
                    <button
                      type="button"
                      onClick={() => setAttached(prev => prev.filter(id => id !== s.id))}
                      className="ml-1 rounded p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3"/>
                    </button>
                  </span>
                ))}
                {services.filter(s => attached.includes(s.id)).length === 0 && (
                  <span className="text-xs text-zinc-500">Belum ada service yang ditambahkan.</span>
                )}
              </div>

              {attachable.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      setAttached(prev => prev.includes(id) ? prev : [...prev, id]);
                      e.currentTarget.selectedIndex = 0;
                    }}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2"
                    defaultValue=""
                  >
                    <option value="" disabled>Tambah service…</option>
                    {attachable.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
