// E:\FMGIH\fmg-industry-hub\src\app\ui\panel\invoices\components\ProductServicesPage.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Layers, Package2, Search, X, CheckCircle2, CircleSlash2,
  Percent, Tag, Sparkles, ChevronDown, AlertCircle, Wand2
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getEffectiveRole } from "@/lib/roles/effective";

/****************************************
 * Types (fallbacks if no generated types)
 ****************************************/

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
  promo_value: number;
  promo_start: string | null;
  promo_end: string | null;
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

type FMGButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
  busy?: boolean;
};

/***************************************
 * Helpers
 ***************************************/
const scrollIntoViewSmooth = (el: HTMLElement | null) => {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
};
// Import currency utilities
import { formatPrice, Currency } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyDropdown } from '@/components/CurrencyDropdown';

function formatCurrencyPrice(usdPrice: number, currency: Currency, rates: Record<string, number>): string {
  return formatPrice(usdPrice, currency, rates);
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

/***************************************
 * Theming atoms — FMG Universe vibe
 ***************************************/

const glassWrap =
  "rounded-3xl p-[1px] bg-[linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06)_35%,transparent)] " +
  "shadow-[0_1px_0_rgba(255,255,255,.05),0_18px_50px_rgba(2,6,23,.55)]";

const glassInner =
  "rounded-[calc(theme(borderRadius.3xl)-1px)] bg-neutral-900/55 backdrop-blur ring-1 ring-white/10";

const chip =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs " +
  "border border-white/15 bg-white/5 text-white/90 backdrop-blur";

const inputBase =
  "w-full rounded-2xl border border-white/10 bg-neutral-900/60 " +
  "px-3.5 py-2.5 text-sm text-white placeholder:text-white/60 outline-none " +
  "focus:ring-2 focus:ring-fuchsia-400/60";

const labelBase = "text-xs text-white/80";

/** Status pill (Active/Inactive) **/
function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/85">
      <CircleSlash2 className="h-3.5 w-3.5" /> Inactive
    </span>
  );
}

/** Group chip with color **/
function GroupChip({ g }: { g: ServiceGroup }) {
  const map: Record<ServiceGroup, string> = {
    core: "from-indigo-400 via-fuchsia-400 to-sky-400",
    additional: "from-amber-300 via-rose-300 to-fuchsia-300",
    business: "from-emerald-400 via-teal-400 to-cyan-300",
  };
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs border border-white/10 bg-white/5 backdrop-blur">
      <span className={`h-3 w-7 rounded-full bg-gradient-to-r ${map[g]}`} />
      <span className="text-white/90 capitalize">{g}</span>
    </span>
  );
}

/** Promo badge **/
function PromoBadge({ type, value }: { type: PromoType; value: number }) {
  const { currency, rates } = useCurrency();
  
  if (type === "none") return <span className="text-xs text-white/70">—</span>;
  
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-0.5 text-xs text-fuchsia-200">
      {type === "percentage" ? <Percent className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
      {type === "percentage" ? `${value}% OFF` : `-${formatCurrencyPrice(value, currency, rates)}`}
    </span>
  );
}

/** Gradient primary button **/
const PrimaryBtn = forwardRef<HTMLButtonElement, FMGButtonProps>(
  ({ className = "", busy, children, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={[
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white",
          "bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_12px_40px_rgba(99,102,241,.35)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
          busy ? "opacity-70 cursor-wait" : "hover:opacity-95",
          className,
        ].join(" ")}
        disabled={busy}
        {...rest}
      >
        {busy ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" opacity={0.3} />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        ) : null}
        {children /* ✅ sekarang pasti ReactNode */}
      </motion.button>
    );
  }
);
PrimaryBtn.displayName = "PrimaryBtn";

/** Subtle button **/
const SubtleBtn = forwardRef<HTMLButtonElement, FMGButtonProps>(
  ({ className = "", children, ...rest }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={[
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs",
        "border border-white/10 bg-white/5 text-white/90 backdrop-blur hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </motion.button>
  )
);
SubtleBtn.displayName = "SubtleBtn";

/** Popover (headless, animated) — fixed + viewport aware **/
function Popover({
  open,
  onClose,
  anchorRef,
  children,
  width = 360,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  width?: number;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);

  // Hitung posisi berdasar bounding rect + jaga tetap di dalam viewport
  const position = React.useCallback(() => {
    const anchorEl = anchorRef.current as HTMLElement | null;
    const popEl = popRef.current as HTMLDivElement | null;
    if (!anchorEl || !popEl) return;

    console.log('🔧 Positioning popover...', { anchorEl, popEl });

    const rect = anchorEl.getBoundingClientRect();
    const gap = 8; // jarak dari trigger
    const maxW = Math.min(width, window.innerWidth - 16);
    
    console.log('📍 Anchor rect:', rect);
    console.log('📐 Window dimensions:', { width: window.innerWidth, height: window.innerHeight, scrollY: window.scrollY });

    // Set width first
    popEl.style.width = `${maxW}px`;
    popEl.style.position = 'fixed'; // Use fixed positioning instead of absolute
    
    // Posisi default: di bawah & rata kiri
    let top = rect.bottom + gap;
    // rata tengah ke tombol
    let left = rect.left + rect.width / 2 - maxW / 2;

    // clamp biar gak keluar layar
    const maxLeft = window.innerWidth - maxW - 8;
    const minLeft = 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));


    // Jika tinggi popover melebihi bawah layar, geser ke atas jika memungkinkan
    const popH = popEl.offsetHeight || 200; // fallback height
    const bottomOverflow = top + popH - window.innerHeight + 8;
    if (bottomOverflow > 0) {
      const flipTop = rect.top - gap - popH;
      if (flipTop >= 8) {
        top = flipTop; // flip ke atas
        console.log('🔄 Flipped to top:', flipTop);
      } else {
        // Jika tetap tidak muat, pakai maxHeight dan tetap di bawah
        const maxHeight = window.innerHeight - rect.bottom - gap - 16;
        popEl.style.maxHeight = `${Math.max(200, maxHeight)}px`;
        popEl.style.overflow = "auto";
        console.log('📏 Using maxHeight:', maxHeight);
      }
    } else {
      popEl.style.maxHeight = "";
      popEl.style.overflow = "";
    }

    console.log('📍 Final position:', { top, left });
    popEl.style.top = `${top}px`;
    popEl.style.left = `${left}px`;
  }, [anchorRef, width]);

  // Tutup saat klik luar / Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current && popRef.current.contains(t)) return;
      if (anchorRef.current && anchorRef.current.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onScrollOrResize = () => position();

    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    // posisikan awal
    requestAnimationFrame(position);

    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, onClose, anchorRef, position]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          // gunakan posisi fixed agar tidak kena clip/overflow parent
          className="fixed z-[1000] rounded-2xl border border-white/10 bg-neutral-950/90 p-3 backdrop-blur shadow-2xl"
          style={{ width }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/***************************************
 * Main Page
 ***************************************/

export default function ProductServicesPage(): React.JSX.Element {
  const [role, setRole] = useState<UserRole | null>(null);
  const { currency, rates, loading: ratesLoading } = useCurrency();

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await getEffectiveRole();
      if (alive) setRole(r);
    })();
    return () => { alive = false; };
  }, []);

  const allowed = role === "owner" || role === "admin";

  if (role === null) {
    return (
      <div className="relative min-h-screen bg-neutral-950 text-white p-6">
        <div className="animate-pulse text-white/80">Loading…</div>
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="relative min-h-screen bg-neutral-950 text-white p-6">
        <div className={[glassWrap, "max-w-xl"].join(" ")}>
          <div className={[glassInner, "p-6"].join(" ")}>
            <h1 className="text-2xl font-semibold">Access restricted</h1>
            <p className="mt-2 text-sm text-white/85">
              Halaman ini hanya untuk Owner & Admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-neutral-950 text-white p-4 sm:p-6 overflow-x-hidden">
      {/* FMG ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-28 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-indigo-600/20 via-fuchsia-500/15 to-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-400/15 to-cyan-400/10 blur-3xl" />
      </div>

      <header className={[glassWrap].join(" ")}>
        <div className={[glassInner, "px-5 sm:px-6 py-5"].join(" ")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400">
                  Products & Services
                </span>
              </h1>
              <p className="text-sm text-white/85">
                Kelola layanan, paket (bundles), promo, dan diskon.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/70">Display Currency</span>
                <CurrencyDropdown compact showStatus={false} />
              </div>

              <SubtleBtn onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
                <Sparkles className="h-4 w-4" />
                Tips pricing
              </SubtleBtn>
            </div>
          </div>
        </div>
      </header>

      {/* Overview/Summary Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard title="Total Services" value="12" description="Active services available" />
        <SummaryCard title="Active Bundles" value="4" description="Bundle packages created" />
        <SummaryCard title="Revenue This Month" value="$24,500" description="From services & bundles" />
      </div>

      {/* Quick Actions Section */}
      <div className={[glassWrap, "mb-8"].join(" ")}>
        <div className={[glassInner, "p-4 sm:p-6"].join(" ")}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard 
              icon={Plus} 
              title="New Service" 
              description="Add a new service"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            />
            <QuickActionCard 
              icon={Layers} 
              title="New Bundle" 
              description="Create service bundle"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            />
            <QuickActionCard 
              icon={Percent} 
              title="Promo Manager" 
              description="Manage discounts"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            />
            <QuickActionCard 
              icon={Tag} 
              title="Pricing Review" 
              description="Review all pricing"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            />
          </div>
        </div>
      </div>

      {/* Services & Bundles Management - Moved to Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ServicesPanel />
        <BundlesPanel />
      </div>
    </main>
  );
}

/***************************************
 * Summary Card Component
 ***************************************/

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className={glassWrap}>
      <div className={[glassInner, "p-4 text-center"].join(" ")}>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm font-medium text-white/90 mb-1">{title}</div>
        <div className="text-xs text-white/70">{description}</div>
      </div>
    </div>
  );
}

/***************************************
 * Quick Action Card Component
 ***************************************/

function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-400/20 to-sky-400/20 border border-fuchsia-400/30">
          <Icon className="h-4 w-4 text-fuchsia-300" />
        </div>
      </div>
      <div className="text-sm font-medium text-white group-hover:text-fuchsia-300 transition-colors">{title}</div>
      <div className="text-xs text-white/70">{description}</div>
    </motion.button>
  );
}

/***************************************
 * Services Panel
 ***************************************/

function ServicesPanel(): React.JSX.Element {
  const sb = getSupabaseClient();
  const { currency, rates } = useCurrency();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [query, setQuery] = useState<string>("");
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  // Popover state (Quick Create)
  const [openPop, setOpenPop] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [quick, setQuick] = useState<{ label: string; price: number; group: ServiceGroup; key: string }>({
    label: "",
    price: 0,
    group: "core",
    key: "",
  });
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickErr, setQuickErr] = useState<string | null>(null);

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

  async function quickCreate() {
    setQuickErr(null);
    if (!quick.label.trim() || !quick.key.trim()) {
      setQuickErr("Label & Service Key wajib.");
      return;
    }
    setQuickBusy(true);
    const payload = {
      service_key: quick.key.trim(),
      label: quick.label.trim(),
      group_name: quick.group,
      price: Number(quick.price || 0),
      description: null,
      is_subscription: false,
      is_active: true,
      sort_order: 0,
      promo_type: "none" as PromoType,
      promo_value: 0,
      promo_start: null,
      promo_end: null,
    };
    const { error } = await sb.from("services").insert(payload);
    setQuickBusy(false);
    if (error) { setQuickErr(error.message); return; }
    setOpenPop(false);
    setQuick({ label: "", price: 0, group: "core", key: "" });
    await load();
    // langsung buka editor untuk lengkapi detail
    const created = (await sb.from("services").select("*").eq("service_key", payload.service_key).single()).data;
    if (created) setEditing(normalizeService(created));
  }

  return (
    <section className={glassWrap}>
      <div className={[glassInner, "p-4 sm:p-5"].join(" ")}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package2 className="h-5 w-5" /> Services
          </h2>

          <div className="relative flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari service…"
                className={[inputBase, "pl-9 w-[min(70vw,260px)]"].join(" ")}
              />
            </div>

            <div className="relative">
              <PrimaryBtn ref={btnRef} onClick={() => setOpenPop((v) => !v)}>
                <Plus className="h-4 w-4" /> New <ChevronDown className="h-4 w-4 opacity-80" />
              </PrimaryBtn>

              {/* Popover Quick Create Service */}
              <div className="relative">
                <Popover open={openPop} onClose={() => setOpenPop(false)} anchorRef={btnRef} width={380}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl bg-white/5 p-2 border border-white/10">
                      <Wand2 className="h-4 w-4 text-white/90" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Quick Create Service</div>
                      <div className="text-xs text-white/70">Buat jasa baru kilat — bisa di-edit detailnya nanti.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelBase}>Service Key</label>
                      <input
                        value={quick.key}
                        onChange={(e) => setQuick((p) => ({ ...p, key: e.target.value }))}
                        className={inputBase}
                        placeholder="unique_key"
                      />
                    </div>
                    <div>
                      <label className={labelBase}>Group</label>
                      <select
                        value={quick.group}
                        onChange={(e) => setQuick((p) => ({ ...p, group: e.target.value as ServiceGroup }))}
                        className={inputBase}
                      >
                        <option value="core">core</option>
                        <option value="additional">additional</option>
                        <option value="business">business</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelBase}>Label</label>
                      <input
                        value={quick.label}
                        onChange={(e) => setQuick((p) => ({ ...p, label: e.target.value }))}
                        className={inputBase}
                        placeholder="Nama layanan"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelBase}>Price (USD)</label>
                      <input
                        type="number"
                        min={0}
                        value={quick.price}
                        onChange={(e) => setQuick((p) => ({ ...p, price: Number(e.target.value || 0) }))}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {quickErr ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                      <AlertCircle className="h-3.5 w-3.5" /> {quickErr}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between">
                    <SubtleBtn onClick={() => { setOpenPop(false); setCreating(true); }}>
                      Advanced editor…
                    </SubtleBtn>
                    <PrimaryBtn busy={quickBusy} onClick={() => void quickCreate()}>
                      Create
                    </PrimaryBtn>
                  </div>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-white/80">
                <th className="p-3">Service</th>
                <th className="p-3">Group</th>
                <th className="p-3">Harga</th>
                <th className="p-3">Promo</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 w-full max-w-[180px] rounded bg-white/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-white/80">
                    Tidak ada service. Buat baru dengan tombol <b>New</b>.
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((r) => {
                    const now = new Date();
                    const eff = effectivePrice(r.price, r.promo_type, r.promo_value, r.promo_start, r.promo_end, now);
                    const hasPromo = eff !== r.price;
                    return (
                      <motion.tr
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="hover:bg-white/[0.06] transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-medium text-white">{r.label}</div>
                          <div className="text-[11px] text-white/70">{r.service_key}</div>
                        </td>
                        <td className="p-3"><GroupChip g={r.group_name} /></td>
                        <td className="p-3">
                          <div className="font-semibold text-white">
                            {formatCurrencyPrice(eff, currency, rates)}
                          </div>
                          {hasPromo && (
                            <div className="text-xs text-white/70 line-through">
                              {formatCurrencyPrice(r.price, currency, rates)}
                            </div>
                          )}
                          {currency !== 'USD' && (
                            <div className="text-xs text-white/50">
                              Base: ${eff.toFixed(eff < 100 ? 2 : 0)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <PromoBadge type={r.promo_type} value={r.promo_value} />
                        </td>
                        <td className="p-3">
                          <StatusPill active={r.is_active} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <SubtleBtn onClick={() => { setEditing(r); setCreating(false); }} aria-label="Edit">
                              <Pencil className="h-4 w-4" /> Edit
                            </SubtleBtn>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
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
      </div>
    </section>
  );
}

const PANEL_BG = "fixed inset-0 z-50 grid place-items-center bg-black/55 p-4";

function ServiceEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: ServiceRow | null;
  onClose: () => void;
  onSaved: () => void;
}): React.JSX.Element {

  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // sedikit delay agar sudah ter-render penuh
    const t = setTimeout(() => scrollIntoViewSmooth(panelRef.current), 50);
    return () => clearTimeout(t);
  }, []);

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
        ref={panelRef}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 18, opacity: 0 }}
        className={[glassWrap, "w-full max-w-2xl"].join(" ")}
      >
        <div className={[glassInner, "p-5"].join(" ")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">
              {initial ? "Edit Service" : "New Service"}
            </h3>
            <SubtleBtn onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></SubtleBtn>
          </div>

          {err && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4" /> {err}
            </div>
          )}

          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Service Key</label>
                <input
                  value={draft.service_key}
                  onChange={(e) => set("service_key", e.target.value)}
                  className={inputBase}
                  placeholder="unique_key"
                  required
                />
              </div>
              <div>
                <label className={labelBase}>Label</label>
                <input
                  value={draft.label}
                  onChange={(e) => set("label", e.target.value)}
                  className={inputBase}
                  placeholder="Nama layanan"
                  required
                />
              </div>
              <div>
                <label className={labelBase}>Group</label>
                <select
                  value={draft.group_name}
                  onChange={(e) => set("group_name", e.target.value as ServiceGroup)}
                  className={inputBase}
                >
                  <option value="core">core</option>
                  <option value="additional">additional</option>
                  <option value="business">business</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>Price (USD)</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(draft.price) ? draft.price : 0}
                  onChange={(e) => set("price", Number(e.target.value))}
                  className={inputBase}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Deskripsi</label>
              <textarea
                value={draft.description ?? ""}
                onChange={(e) => set("description", e.target.value || null)}
                className={inputBase}
                rows={3}
                placeholder="Opsional"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_subscription}
                  onChange={(e) => set("is_subscription", e.target.checked)}
                />
                Subscription
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
                Active
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Promo Type</label>
                <select
                  value={draft.promo_type}
                  onChange={(e) => set("promo_type", e.target.value as PromoType)}
                  className={inputBase}
                >
                  <option value="none">none</option>
                  <option value="percentage">percentage</option>
                  <option value="flat">flat</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>Promo Value</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(draft.promo_value) ? draft.promo_value : 0}
                  onChange={(e) => set("promo_value", Number(e.target.value))}
                  className={inputBase}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Promo Start</label>
                <input
                  type="datetime-local"
                  value={toLocalDT(draft.promo_start)}
                  onChange={(e) => set("promo_start", fromLocalDT(e.target.value))}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>Promo End</label>
                <input
                  type="datetime-local"
                  value={toLocalDT(draft.promo_end)}
                  onChange={(e) => set("promo_end", fromLocalDT(e.target.value))}
                  className={inputBase}
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Sort Order</label>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className={inputBase}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <SubtleBtn type="button" onClick={onClose}>Cancel</SubtleBtn>
              <PrimaryBtn type="submit" busy={saving}>{saving ? "Saving…" : "Save"}</PrimaryBtn>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/***************************************
 * Bundles Panel
 ***************************************/

function BundlesPanel(): React.JSX.Element {
  const sb = getSupabaseClient();
  const { currency, rates } = useCurrency();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItemRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [query, setQuery] = useState<string>("");
  const [editing, setEditing] = useState<BundleRow | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  // Popover quick create bundle
  const [openPop, setOpenPop] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [quick, setQuick] = useState<{ label: string; key: string; price: number; active: boolean }>({
    label: "",
    key: "",
    price: 0,
    active: true,
  });
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickErr, setQuickErr] = useState<string | null>(null);

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

  async function quickCreate() {
    setQuickErr(null);
    if (!quick.label.trim() || !quick.key.trim()) {
      setQuickErr("Label & Bundle Key wajib.");
      return;
    }
    setQuickBusy(true);
    const payload = {
      bundle_key: quick.key.trim(),
      label: quick.label.trim(),
      bundle_price: Number(quick.price || 0),
      description: null,
      note: null,
      is_active: quick.active,
      sort_order: 0,
      promo_type: "none" as PromoType,
      promo_value: 0,
      promo_start: null,
      promo_end: null,
    };
    const { error } = await sb.from("bundles").insert(payload);
    setQuickBusy(false);
    if (error) { setQuickErr(error.message); return; }
    setOpenPop(false);
    setQuick({ label: "", key: "", price: 0, active: true });
    await load();
    const created = (await sb.from("bundles").select("*").eq("bundle_key", payload.bundle_key).single()).data;
    if (created) setEditing(normalizeBundle(created));
  }

  return (
    <section className={glassWrap}>
      <div className={[glassInner, "p-4 sm:p-5"].join(" ")}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" /> Bundles
          </h2>

          <div className="relative flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari bundle…"
                className={[inputBase, "pl-9 w-[min(70vw,260px)]"].join(" ")}
              />
            </div>

            <div className="relative">
              <PrimaryBtn ref={btnRef} onClick={() => setOpenPop((v) => !v)}>
                <Plus className="h-4 w-4" /> New <ChevronDown className="h-4 w-4 opacity-80" />
              </PrimaryBtn>

              {/* Popover Quick Create Bundle */}
              <Popover open={openPop} onClose={() => setOpenPop(false)} anchorRef={btnRef} width={380}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-xl bg-white/5 p-2 border border-white/10">
                    <Wand2 className="h-4 w-4 text-white/90" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Quick Create Bundle</div>
                    <div className="text-xs text-white/70">Buat paket cepat. Tambah services di editor setelahnya.</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelBase}>Bundle Key</label>
                    <input
                      value={quick.key}
                      onChange={(e) => setQuick((p) => ({ ...p, key: e.target.value }))}
                      className={inputBase}
                      placeholder="unique_key"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={quick.active}
                        onChange={(e) => setQuick((p) => ({ ...p, active: e.target.checked }))}
                      />
                      Active
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className={labelBase}>Label</label>
                    <input
                      value={quick.label}
                      onChange={(e) => setQuick((p) => ({ ...p, label: e.target.value }))}
                      className={inputBase}
                      placeholder="Nama bundle"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelBase}>Bundle Price (USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={quick.price}
                      onChange={(e) => setQuick((p) => ({ ...p, price: Number(e.target.value || 0) }))}
                      className={inputBase}
                    />
                  </div>
                </div>

                {quickErr ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                    <AlertCircle className="h-3.5 w-3.5" /> {quickErr}
                  </div>
                ) : null}

                <div className="mt-3 flex items-center justify-between">
                  <SubtleBtn onClick={() => { setOpenPop(false); setCreating(true); }}>
                    Advanced editor…
                  </SubtleBtn>
                  <PrimaryBtn busy={quickBusy} onClick={() => void quickCreate()}>
                    Create
                  </PrimaryBtn>
                </div>
              </Popover>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-white/80">
                <th className="p-3">Bundle</th>
                <th className="p-3">Harga</th>
                <th className="p-3">Promo</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 w-full max-w-[180px] rounded bg-white/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-white/80">
                    Tidak ada bundle. Buat baru dengan tombol <b>New</b>.
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((r) => {
                    const eff = effectivePrice(r.bundle_price, r.promo_type, r.promo_value, r.promo_start, r.promo_end);
                    const hasPromo = eff !== r.bundle_price;
                    const count = bundleItems.filter(bi => bi.bundle_id === r.id).length;
                    return (
                      <motion.tr
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="hover:bg-white/[0.06] transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-medium text-white">{r.label}</div>
                          <div className="text-[11px] text-white/70">{r.bundle_key} • {count} item</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white">
                            {formatCurrencyPrice(eff, currency, rates)}
                          </div>
                          {hasPromo && (
                            <div className="text-xs text-white/70 line-through">
                              {formatCurrencyPrice(r.bundle_price, currency, rates)}
                            </div>
                          )}
                          {currency !== 'USD' && (
                            <div className="text-xs text-white/50">
                              Base: ${eff.toFixed(eff < 100 ? 2 : 0)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <PromoBadge type={r.promo_type} value={r.promo_value} />
                        </td>
                        <td className="p-3"><StatusPill active={r.is_active} /></td>
                        <td className="p-3">
                          <SubtleBtn onClick={() => { setEditing(r); setCreating(false); }} aria-label="Edit">
                            <Pencil className="h-4 w-4" /> Edit
                          </SubtleBtn>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
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
      </div>
    </section>
  );
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => scrollIntoViewSmooth(panelRef.current), 0);
    return () => clearTimeout(t);
  }, []);
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
      const { error } = await sb.from("bundles").update(draft).eq("id", bundleId);
      if (error) { setErr(error.message); setSaving(false); return; }
    } else {
      const { error, data } = await sb.from("bundles").insert(draft).select("id").single();
      if (error) { setErr(error.message); setSaving(false); return; }
      bundleId = data!.id;
    }

    if (!bundleId) {
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
        const { error } = await sb.from("bundle_items").delete().eq("bundle_id", bundleId).eq("service_id", sid);
        if (error) { setErr(error.message); setSaving(false); return; }
      }
    }

    setSaving(false);
    onSaved();
  }

  return (
    <motion.div className={PANEL_BG} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        ref={panelRef}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 18, opacity: 0 }}
        className={[glassWrap, "w-full max-w-3xl"].join(" ")}
      >
        <div className={[glassInner, "p-5"].join(" ")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">
              {initial ? "Edit Bundle" : "New Bundle"}
            </h3>
            <SubtleBtn onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></SubtleBtn>
          </div>

          {err && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4" /> {err}
            </div>
          )}

          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Bundle Key</label>
                <input
                  value={draft.bundle_key}
                  onChange={(e) => set("bundle_key", e.target.value)}
                  className={inputBase}
                  placeholder="unique_key"
                  required
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                  />
                  Active
                </label>
              </div>
              <div>
                <label className={labelBase}>Label</label>
                <input
                  value={draft.label}
                  onChange={(e) => set("label", e.target.value)}
                  className={inputBase}
                  placeholder="Nama bundle"
                  required
                />
              </div>
              <div>
                <label className={labelBase}>Bundle Price (USD)</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(draft.bundle_price) ? draft.bundle_price : 0}
                  onChange={(e) => set("bundle_price", Number(e.target.value))}
                  className={inputBase}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Deskripsi</label>
                <textarea
                  value={draft.description ?? ""}
                  onChange={(e) => set("description", e.target.value || null)}
                  className={inputBase}
                  rows={3}
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className={labelBase}>Note internal</label>
                <textarea
                  value={draft.note ?? ""}
                  onChange={(e) => set("note", e.target.value || null)}
                  className={inputBase}
                  rows={3}
                  placeholder="Internal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Promo Type</label>
                <select
                  value={draft.promo_type}
                  onChange={(e) => set("promo_type", e.target.value as PromoType)}
                  className={inputBase}
                >
                  <option value="none">none</option>
                  <option value="percentage">percentage</option>
                  <option value="flat">flat</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>Promo Value</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isFinite(draft.promo_value) ? draft.promo_value : 0}
                  onChange={(e) => set("promo_value", Number(e.target.value))}
                  className={inputBase}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>Promo Start</label>
                <input
                  type="datetime-local"
                  value={toLocalDT(draft.promo_start)}
                  onChange={(e) => set("promo_start", fromLocalDT(e.target.value))}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>Promo End</label>
                <input
                  type="datetime-local"
                  value={toLocalDT(draft.promo_end)}
                  onChange={(e) => set("promo_end", fromLocalDT(e.target.value))}
                  className={inputBase}
                />
              </div>
            </div>

            {/* Attach services */}
            {initial && (
              <div className="mt-2">
                <div className="mb-2 text-sm font-medium">Services in this bundle</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {services.filter(s => attached.includes(s.id)).map(s => (
                    <span key={s.id} className={chip}>
                      {s.label}
                      <button
                        type="button"
                        onClick={() => setAttached(prev => prev.filter(id => id !== s.id))}
                        className="ml-1 rounded p-0.5 hover:bg-white/10"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {services.filter(s => attached.includes(s.id)).length === 0 && (
                    <span className="text-xs text-white/75">Belum ada service yang ditambahkan.</span>
                  )}
                </div>

                {services.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id) return;
                        setAttached(prev => prev.includes(id) ? prev : [...prev, id]);
                        e.currentTarget.selectedIndex = 0;
                      }}
                      className={inputBase}
                      defaultValue=""
                    >
                      <option value="" disabled>Tambah service…</option>
                      {services.filter(s => s.is_active).map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <SubtleBtn type="button" onClick={onClose}>Cancel</SubtleBtn>
              <PrimaryBtn type="submit" busy={saving}>{saving ? "Saving…" : "Save"}</PrimaryBtn>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
