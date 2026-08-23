// E:\FMGIH\fmg-industry-hub\src\app\ui\panel\invoices\page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import { NewInvoiceDialog } from "./components/NewInvoiceDialog";
import { formatIDRCurrency, isOverdue, nextStatusColor } from "@/lib/invoices/utils";
import type { User } from "@supabase/supabase-js";
import { notify } from "@/components/ui/FeedbackHost";
import {
  Search, X, Loader2, BellRing, CheckCircle2, XCircle, CreditCard,
  Link2, RefreshCw, ExternalLink, Wallet, AlertTriangle
} from "lucide-react";

type InvoiceStatus = "draft" | "unpaid" | "paid" | "cancelled";

type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_id: string | null;
  client_name: string | null;
  client_email?: string | null;
  amount_total: number | null;
  currency: string | null;
  status: InvoiceStatus;
  created_at: string | null;
  due_date: string | null;
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

const COLS_INVOICES =
  "id,invoice_no,client_id,client_name,client_email,amount_total,currency,status,created_at,due_date,payment_url";
const COLS_ITEMS =
  "invoice_items!invoice_items_invoice_id_fkey(id,invoice_id,service_id,description,qty,unit_price,position)";
const SELECT_INVOICES = `${COLS_INVOICES},${COLS_ITEMS}`;

declare global {
  interface Window { snap?: { pay: (token: string, options?: Record<string, unknown>) => void }; }
}

function useSnapLoader(clientKey: string | undefined, isProduction: boolean) {
  useEffect(() => {
    if (!clientKey) return;
    const existing = document.getElementById("midtrans-snap-script");
    if (existing) existing.remove();

    const host = isProduction ? "app.midtrans.com" : "app.sandbox.midtrans.com";
    const s = document.createElement("script");
    s.id = "midtrans-snap-script";
    s.src = `https://${host}/snap/snap.js`;
    s.async = true;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => //console.info("[Midtrans] snap.js loaded");
    s.onerror = (e) => //console.error("[Midtrans] failed to load snap.js", e);

    document.body.appendChild(s);
    return () => { s.remove(); };
  }, [clientKey, isProduction]);
}

const PillTab = ({ children, active=false, onClick }:{
  children: React.ReactNode; active?: boolean; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={[
      "relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
      active
        ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_2px_28px_rgba(99,102,241,0.35)]"
        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/85 hover:bg-slate-200 dark:hover:bg-white/10 border-2 border-slate-200/50 dark:border-white/10 backdrop-blur"
    ].join(" ")}
  >
    {children}
  </button>
);

const GlassButton = ({
  onClick, children, tone="neutral", busying=false, title
}:{
  onClick?: () => void; children: React.ReactNode;
  tone?: "neutral"|"primary"|"emerald"|"danger"|"outline"|"ink";
  busying?: boolean; title?: string;
}) => {
  const toneMap: Record<string, string> = {
    primary: "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_6px_32px_rgba(99,102,241,0.35)] hover:opacity-95",
    emerald: "bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-[0_6px_32px_rgba(16,185,129,0.35)] hover:opacity-95",
    danger: "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_6px_32px_rgba(244,63,94,0.35)] hover:opacity-95",
    outline: "bg-slate-100/80 dark:bg-white/5 border-2 border-slate-300/60 dark:border-white/15 text-slate-700 dark:text-white/90 hover:bg-slate-200/90 dark:hover:bg-white/10",
    ink: "bg-slate-100/90 dark:bg-slate-900/60 border-2 border-slate-300/50 dark:border-white/10 text-slate-800 dark:text-white/90 hover:bg-slate-200 dark:hover:bg-slate-800/70",
    neutral: "bg-slate-100/70 dark:bg-white/8 border-2 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/12",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition-all",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-fuchsia-400/60",
        toneMap[tone]
      ].join(" ")}
      disabled={busying}
    >
      {busying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
};

const SkeletonTable = () => (
  <div className="rounded-3xl border-2 border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/40 backdrop-blur shadow-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full w-full text-sm">
        <thead className="bg-slate-100/80 dark:bg-white/5 text-left">
          <tr className="text-slate-600 dark:text-white/70">
            {["Invoice","Client","Items","Amount","Status","Created","Due","Actions"].map(h=>(
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
          {Array.from({length:6}).map((_,i)=>(
            <tr key={i} className="animate-pulse">
              {Array.from({length:8}).map((__,j)=>(
                <td key={j} className="p-3">
                  <div className="h-4 w-full max-w-[140px] rounded bg-slate-200/60 dark:bg-white/10" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const EmptyState = ({ isAdmin, onNew }: { isAdmin: boolean; onNew: () => void }) => (
  <div className="rounded-3xl border-2 border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/50 backdrop-blur p-10 shadow-xl text-center">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[conic-gradient(at_top_left,rgba(99,102,241,.25),rgba(236,72,153,.25),rgba(34,197,94,.2),rgba(99,102,241,.25))] dark:bg-[conic-gradient(at_top_left,rgba(99,102,241,.4),rgba(236,72,153,.4),rgba(34,197,94,.35),rgba(99,102,241,.4))] ring-1 ring-slate-300/30 dark:ring-white/10"
    >
      <Wallet className="h-7 w-7 text-slate-700 dark:text-white" />
    </motion.div>
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No invoices found</h3>
    <p className="mt-1 text-sm text-slate-600 dark:text-white/80">Start creating invoices or change your search filter.</p>
    <div className="mt-4 flex items-center justify-center gap-2">
      {isAdmin ? (
        <GlassButton tone="primary" onClick={onNew}>+ New Invoice</GlassButton>
      ) : (
        <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs bg-slate-100/80 dark:bg-white/8 border-2 border-slate-200/50 dark:border-white/10 hover:bg-slate-200/90 dark:hover:bg-white/12 backdrop-blur text-slate-700 dark:text-white/90">
          Need help?
        </Link>
      )}
    </div>
  </div>
);

const StatusPill: React.FC<{ status: InvoiceStatus; overdue: boolean }> = ({ status, overdue }) => {
  const label = overdue && status === "unpaid" ? "overdue" : status;
  const className =
    nextStatusColor(status, overdue) +
    " inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] capitalize border-2 border-slate-200/50 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 backdrop-blur";
  return <span className={className}>{label}</span>;
};

type InvoiceCardProps = {
  r: InvoiceWithItems;
  isAdmin: boolean;
  busy: { id: string; type: "remind" | "mark" | "cancel" | "pay" | "refresh" | null } | null;
  onPay: (inv: InvoiceRow) => Promise<void>;
  onRefresh: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onRemind: (id: string) => Promise<void>;
};

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  r, isAdmin, busy, onPay, onRefresh, onMarkPaid, onCancel, onRemind
}) => {
  const overdue = isOverdue(r.status, r.due_date);
  const items = [...(r.invoice_items ?? [])].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
  const isBusy = (t: NonNullable<NonNullable<typeof busy>["type"]>) => busy?.id === r.id && busy?.type === t;

  return (
    <li className="rounded-2xl border-2 border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/60 backdrop-blur p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`${isAdmin ? "/admin" : "/client"}/invoices/${r.id}`}
            className="font-semibold underline-offset-2 hover:underline block truncate text-slate-900 dark:text-white"
            title={r.invoice_no}
          >
            {r.invoice_no}
          </Link>
          <div className="mt-1 text-xs text-slate-600 dark:text-white/70 truncate">{r.client_name ?? "-"}</div>
        </div>
        <div className="text-right whitespace-nowrap tabular-nums font-bold text-slate-900 dark:text-white">
          {r.amount_total != null
            ? `${(r.currency ?? "IDR").toUpperCase()} ${Number(r.amount_total).toLocaleString("id-ID")}`
            : "-"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-white/80">
        <StatusPill status={r.status} overdue={overdue} />
        <span className="opacity-60">•</span>
        <span>Created: {r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"}</span>
        <span className="opacity-60">•</span>
        <span>Due: {r.due_date ? new Date(r.due_date).toLocaleDateString("id-ID") : "-"}</span>
      </div>

      <div className="mt-3 text-xs">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {items.slice(0, 3).map((it) => (
              <span
                key={it.id}
                className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/90"
                title={`${it.description} × ${it.qty} @ ${formatIDRCurrency(Number(it.unit_price) || 0)}`}
              >
                {it.description}
              </span>
            ))}
            {items.length > 3 && <span className="text-slate-600 dark:text-white/70">+{items.length - 3} more</span>}
          </div>
        ) : (
          <span className="text-slate-500 dark:text-white/60">No items</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {r.payment_url ? (
          <a
            href={r.payment_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs bg-white/8 border border-white/10 hover:bg-white/12"
            title="Open payment link"
          >
            <Link2 className="h-3.5 w-3.5" /> Payment Link <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}

        {!isAdmin && r.status === "unpaid" && (
          <GlassButton tone="primary" onClick={() => void onPay(r)} busying={isBusy("pay")} title="Pay now">
            <CreditCard className="h-3.5 w-3.5" /> Pay
          </GlassButton>
        )}

        {isAdmin && r.status === "unpaid" && (
          <>
            <GlassButton tone="outline" onClick={() => void onRemind(r.id)} busying={isBusy("remind")} title="Send reminder">
              <BellRing className="h-3.5 w-3.5" /> Reminder
            </GlassButton>
            <GlassButton tone="ink" onClick={() => void onRefresh(r.id)} busying={isBusy("refresh")} title="Refresh payment link">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </GlassButton>
            <GlassButton tone="emerald" onClick={() => void onMarkPaid(r.id)} busying={isBusy("mark")} title="Mark as paid">
              <CheckCircle2 className="h-3.5 w-3.5" /> Paid
            </GlassButton>
            <GlassButton tone="danger" onClick={() => void onCancel(r.id)} busying={isBusy("cancel")} title="Cancel invoice">
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </GlassButton>
          </>
        )}

        <Link
          href={`${isAdmin ? "/admin" : "/client"}/invoices/${r.id}`}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs bg-white/8 border border-white/10 hover:bg-white/12"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
};

export default function InvoicesPage(): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InvoiceStatus | "all">("unpaid");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<InvoiceWithItems[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [me, setMe] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [meReady, setMeReady] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const authReady = meReady && roleReady;

  const [busy, setBusy] = useState<{ id: string; type:
    "remind"|"mark"|"cancel"|"pay"|"refresh" | null } | null>(null);

  const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const MIDTRANS_IS_PRODUCTION = (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false") === "true";
  useSnapLoader(MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: u }, r] = await Promise.all([ sb.auth.getUser(), sb.rpc("is_admin") ]);
        if (!cancelled) {
          setMe(u.user ?? null);
          setMeReady(true);
          setIsAdmin(r.data === true && !r.error);
          setRoleReady(true);
        }
      } catch {
        if (!cancelled) {
          setMe(null); setMeReady(true);
          setIsAdmin(false); setRoleReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sb]);

  const load = useCallback(async (): Promise<void> => {
    if (!authReady) return;
    setLoading(true);

    let qb = sb.from("invoices").select(SELECT_INVOICES);
    if (tab !== "all") qb = qb.eq("status", tab);
    if (q.trim()) {
      const like = `%${q.trim()}%`;
      qb = qb.or(`invoice_no.ilike.${like},client_name.ilike.${like}`);
    }
    if (!isAdmin) {
      if (!me?.id) { setRows([]); setLoading(false); return; }
      qb = qb.eq("client_id", me.id);
    }

    const { data, error } = await qb
      .order("created_at", { ascending: false })
      .order("position", { ascending: true, foreignTable: "invoice_items" });

    if (!error) {
      const invoices = (data ?? []) as unknown as InvoiceWithItems[];
      setRows(invoices.filter((r) => isAdmin || r.client_id === me?.id));
    }
    setLoading(false);
  }, [authReady, isAdmin, me, q, sb, tab]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!authReady) return;
    const ch = sb.channel("invoices-list");
    if (isAdmin) {
      ch.on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => void load())
       .on("postgres_changes", { event: "*", schema: "public", table: "invoice_items" }, () => void load());
    } else if (me?.id) {
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices", filter: `client_id=eq.${me.id}` },
        () => void load()
      );
    }
    const sub = ch.subscribe();
    return () => { void sb.removeChannel(sub); };
  }, [sb, authReady, isAdmin, me?.id, load]);

  const markPaid = async (id: string): Promise<void> => {
    if (!isAdmin) return;
    setBusy({ id, type: "mark" });
    const { error } = await sb.from("invoices").update({ status: "paid" }).eq("id", id);
    setBusy(null);
    if (!error) void load();
  };

  const cancelInvoice = async (id: string): Promise<void> => {
    if (!isAdmin) return;
    setBusy({ id, type: "cancel" });
    const { error } = await sb.from("invoices").update({ status: "cancelled" }).eq("id", id);
    setBusy(null);
    if (!error) void load();
  };

  const createSnapAndPay = async (inv: InvoiceRow): Promise<void> => {
    setBusy({ id: inv.id, type: "pay" });
    const res = await fetch("/api/payments/midtrans/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: inv.id }),
    });
    setBusy(null);
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

  const refreshPaymentLink = async (id: string): Promise<void> => {
    if (!isAdmin) return;
    setBusy({ id, type: "refresh" });
    try {
      const res = await fetch("/api/payments/midtrans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id, refresh: true }),
      });
      if (!res.ok) throw new Error("failed to refresh link");
      const json: { redirect_url?: string } = await res.json();
      if (json.redirect_url) await sb.from("invoices").update({ payment_url: json.redirect_url }).eq("id", id);
      await load();
    } catch (e) {
      //console.error("refresh link error", e);
      notify("Failed to refresh payment link", "error");
    } finally {
      setBusy(null);
    }
  };

  const sendReminder = async (id: string): Promise<void> => {
    if (!isAdmin) return;
    setBusy({ id, type: "remind" });
    setNotice(null);
    const response = await fetch(`/api/invoices/${id}/reminders`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(null);
    setNotice(response.ok
      ? { tone: "ok", text: `Reminder delivered${body.attempts > 1 ? ` after ${body.attempts} attempts` : ""}.` }
      : { tone: "error", text: typeof body.error === "string" ? body.error : "Failed to send reminder." });
  };

  const Tabs: Array<{ key: InvoiceStatus | "all"; label: string }> = [
    { key: "unpaid", label: "Unpaid" },
    { key: "paid", label: "Paid" },
    { key: "draft", label: "Draft" },
    { key: "cancelled", label: "Cancelled" },
    { key: "all", label: "All" },
  ];

  const totalUnpaid = rows.filter(r => r.status === "unpaid")
    .reduce((acc, r) => acc + (Number(r.amount_total) || 0), 0);
  const overdueCount = rows.filter(r => isOverdue(r.status, r.due_date)).length;
  const paidCount = rows.filter(r => r.status === "paid").length;

  return (
    <div className="relative min-h-screen p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors overflow-hidden">
      {notice && <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${notice.tone === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"}`}>{notice.text}</div>}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-28 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-indigo-600/10 via-fuchsia-500/8 to-sky-500/6 dark:from-indigo-600/20 dark:via-fuchsia-500/15 dark:to-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-emerald-500/10 via-teal-400/8 to-cyan-400/6 dark:from-emerald-500/20 dark:via-teal-400/15 dark:to-cyan-400/10 blur-3xl" />
      </div>

      <div className="w-full max-w-none space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[28px] p-[1px] bg-gradient-to-b from-slate-200/20 via-slate-200/10 to-transparent dark:from-white/18 dark:via-white/6 dark:to-transparent shadow-xl shadow-slate-900/10 dark:shadow-black/45"
        >
          <div className="rounded-[27px] bg-white/95 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-white/10">
            <div className="relative p-5 sm:p-6">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5 dark:from-indigo-500/20 dark:to-fuchsia-500/10 blur-2xl" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between relative">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-sky-600 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-sky-400">
                      Invoices
                    </span>
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-white/90">
                    {isAdmin ? "Manage & send invoices" : "View and pay your invoices"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
                  {[
                    {
                      label: "Unpaid",
                      icon: <Wallet className="h-3.5 w-3.5" />,
                      value: formatIDRCurrency(totalUnpaid),
                      bg: "bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/20",
                    },
                    {
                      label: "Overdue",
                      icon: <AlertTriangle className="h-3.5 w-3.5" />,
                      value: overdueCount,
                      bg: "bg-rose-500/15 ring-1 ring-inset ring-rose-400/25",
                    },
                    {
                      label: "Paid",
                      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                      value: paidCount,
                      bg: "bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/25",
                    },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-2xl p-3 sm:p-4 ${s.bg} backdrop-blur shadow`}>
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-700 dark:text-white/85">
                        {s.icon} {s.label}
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{String(s.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky top-0 z-10 border-t border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/60 backdrop-blur rounded-b-[27px]">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {Tabs.map((t) => (
                    <PillTab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                      {t.label}
                    </PillTab>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-white/70" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.currentTarget.value)}
                      placeholder="Search invoice/client…"
                      className="h-10 w-[min(80vw,320px)] rounded-full border-2 border-slate-300/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/60 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/60 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-fuchsia-400/60 backdrop-blur"
                    />
                    {q && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setQ("")}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-slate-500 dark:text-white/70" />
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <GlassButton tone="primary" onClick={() => setOpenNew(true)}>
                      + New Invoice
                    </GlassButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <SkeletonTable />
        ) : rows.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onNew={() => setOpenNew(true)} />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="hidden md:block rounded-3xl p-[1px] bg-gradient-to-b from-slate-200/20 via-slate-200/10 to-transparent dark:from-white/18 dark:via-white/6 dark:to-transparent shadow-xl shadow-slate-900/10 dark:shadow-black/45 overflow-hidden"
            >
              <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white/95 dark:bg-slate-900/50 backdrop-blur border border-slate-200/50 dark:border-white/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full w-full text-sm">
                    <thead className="sticky top-0 z-[1] bg-slate-100/80 dark:bg-white/[0.06] text-left">
                      <tr className="text-slate-600 dark:text-white/75">
                        <th className="p-3">Invoice</th>
                        <th className="p-3">Client</th>
                        <th className="p-3 hidden lg:table-cell">Items</th>
                        <th className="p-3 w-[200px]">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 hidden xl:table-cell">Created</th>
                        <th className="p-3 hidden lg:table-cell">Due</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
                      {rows.map((r) => {
                        const overdue = isOverdue(r.status, r.due_date);
                        const items = [...(r.invoice_items ?? [])].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
                        const statusClass = nextStatusColor(r.status, overdue);
                        const isBusy = (t: NonNullable<typeof busy>["type"]) => busy?.id === r.id && busy?.type === t;

                        return (
                          <tr key={r.id} className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors text-slate-800 dark:text-white">
                            <td className="p-3 font-semibold truncate max-w-[220px]">
                              <Link
                                href={`${isAdmin ? "/admin" : "/client"}/invoices/${r.id}`}
                                className="underline-offset-2 hover:underline"
                                title={r.invoice_no}
                              >
                                {r.invoice_no}
                              </Link>
                            </td>
                            <td className="p-3 truncate max-w-[220px] text-slate-700 dark:text-white/90">{r.client_name ?? "-"}</td>
                            <td className="p-3 hidden lg:table-cell">
                              {items.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {items.slice(0, 2).map((it) => (
                                    <span
                                      key={it.id}
                                      className="rounded-full border-2 border-slate-300/50 dark:border-white/15 bg-slate-100/80 dark:bg-white/5 px-2 py-0.5 text-[11px] text-slate-700 dark:text-white/90"
                                      title={`${it.description} × ${it.qty} @ ${formatIDRCurrency(Number(it.unit_price) || 0)}`}
                                    >
                                      {it.description}
                                    </span>
                                  ))}
                                  {items.length > 2 && <span className="text-xs text-slate-600 dark:text-white/70">+{items.length - 2} more</span>}
                                </div>
                              ) : (
                                <span className="text-slate-500 dark:text-white/70">—</span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap tabular-nums">
                              {r.amount_total != null
                                ? `${(r.currency ?? "IDR").toUpperCase()} ${Number(r.amount_total).toLocaleString("id-ID")}`
                                : "-"}
                            </td>
                            <td className="p-3">
                              <span className={statusClass + " inline-flex items-center rounded-full px-2.5 py-0.5 text-xs capitalize border-2 border-slate-200/50 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 backdrop-blur"}>
                                {overdue && r.status === "unpaid" ? "overdue" : r.status}
                              </span>
                            </td>
                            <td className="p-3 hidden xl:table-cell">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"}
                            </td>
                            <td className="p-3 hidden lg:table-cell">
                              {r.due_date ? new Date(r.due_date).toLocaleDateString("id-ID") : "-"}
                            </td>
                            <td className="p-3">
                              <div className="flex justify-end gap-2 flex-wrap">
                                {isAdmin && r.status === "unpaid" && (
                                  <>
                                    <GlassButton tone="outline" onClick={() => void sendReminder(r.id)} busying={isBusy("remind")} title="Send reminder">
                                      <BellRing className="h-3.5 w-3.5" /> Reminder
                                    </GlassButton>
                                    <GlassButton tone="ink" onClick={() => void refreshPaymentLink(r.id)} busying={isBusy("refresh")} title="Refresh payment link">
                                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                                    </GlassButton>
                                    <GlassButton tone="emerald" onClick={() => void markPaid(r.id)} busying={isBusy("mark")} title="Mark as paid">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                                    </GlassButton>
                                    <GlassButton tone="danger" onClick={() => void cancelInvoice(r.id)} busying={isBusy("cancel")} title="Cancel invoice">
                                      <XCircle className="h-3.5 w-3.5" /> Cancel
                                    </GlassButton>
                                  </>
                                )}
                                {!isAdmin && r.status === "unpaid" && (
                                  <GlassButton tone="primary" onClick={() => void createSnapAndPay(r)} busying={isBusy("pay")} title="Pay now">
                                    <CreditCard className="h-3.5 w-3.5" /> Pay
                                  </GlassButton>
                                )}
                                {r.payment_url ? (
                                  <a
                                    href={r.payment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs bg-white/8 border border-white/10 hover:bg-white/12"
                                    title="Open payment link"
                                  >
                                    <Link2 className="h-3.5 w-3.5" /> Payment Link <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : null}
                                <Link
                                  href={`${isAdmin ? "/admin" : "/client"}/invoices/${r.id}`}
                                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs bg-white/8 border border-white/10 hover:bg-white/12"
                                  title="Open invoice"
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
              </div>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden space-y-3"
            >
              {rows.map((r) => (
                <InvoiceCard
                  key={r.id}
                  r={r}
                  isAdmin={isAdmin}
                  busy={busy}
                  onPay={createSnapAndPay}
                  onRefresh={refreshPaymentLink}
                  onMarkPaid={markPaid}
                  onCancel={cancelInvoice}
                  onRemind={sendReminder}
                />
              ))}
            </motion.ul>
          </>
        )}

        {isAdmin && openNew && (
          <NewInvoiceDialog
            onClose={() => setOpenNew(false)}
            onCreated={() => { setOpenNew(false); void load(); }}
          />
        )}
      </div>

      {isAdmin && (
        <button
          onClick={() => setOpenNew(true)}
          className="fixed md:hidden bottom-5 right-5 inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-fuchsia-400/60"
          aria-label="+ New Invoice"
          title="+ New Invoice"
        >
          +
        </button>
      )}
    </div>
  );
}
