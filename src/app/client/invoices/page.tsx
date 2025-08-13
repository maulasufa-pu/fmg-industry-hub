"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient, withSignal } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";

type TabKey = "All" | "Unpaid" | "Paid" | "Draft";

type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_name: string | null;
  project_id: string | null;
  issue_date: string | null; // ISO
  due_date: string | null;   // ISO
  currency: string | null;
  amount_total: number | null;
  status: "draft" | "unpaid" | "paid" | "cancelled";
  notes: string | null;
  created_at: string | null;
};

const QUERY_COLS =
  "id,invoice_no,client_name,project_id,issue_date,due_date,currency,amount_total,status,notes,created_at";

const Card: React.FC<React.PropsWithChildren<{ title: string; right?: React.ReactNode }>> = ({ title, right, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

export default function InvoicesPage(): React.JSX.Element {
  useFocusWarmAuth();

  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  // === URL state (persist) ===
  const validTabs: TabKey[] = ["All", "Unpaid", "Paid", "Draft"];
  const initialTabRaw = (params.get("tab") as TabKey) || "All";
  const initialTab = validTabs.includes(initialTabRaw) ? initialTabRaw : "All";
  const initialQ = params.get("q") || "";
  const initialPage = Number(params.get("p") || "1") || 1;

  // === UI state ===
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [search, setSearch] = useState(initialQ);
  const [page, setPage] = useState(Math.max(1, initialPage));

  // Debounce search
  const [q, setQ] = useState(initialQ.trim());
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const pageSize = 10;

  // === Data state ===
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Realtime guard + abort
  const realtimeBoundRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // === Sync to URL (no extra history) ===
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    url.searchParams.set("p", String(page));
    router.replace(url.pathname + "?" + url.searchParams.toString());
  }, [activeTab, q, page, router]);

  // === Fetch helpers ===
  const fetchPage = useCallback(
    async (isInitial = false) => {
      // Selalu buat AbortController baru
      abortRef.current = new AbortController();
      const ac = abortRef.current;

      if (isInitial) setLoadingInitial(true);
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let qb = supabase
          .from("invoices")
          .select(QUERY_COLS, { count: "exact", head: false });

        if (activeTab === "Unpaid") qb = qb.eq("status", "unpaid");
        else if (activeTab === "Paid") qb = qb.eq("status", "paid");
        else if (activeTab === "Draft") qb = qb.eq("status", "draft");

        if (q) {
          const like = `%${q}%`;
          qb = qb.or(`invoice_no.ilike.${like},client_name.ilike.${like}`);
        }

        qb = qb.order("created_at", { ascending: false }).range(from, to);

        const { data, count, error } =
          await withSignal(qb, ac.signal).returns<InvoiceRow[]>();
        if (error) throw error;

        setRows(data ?? []);
        setTotalCount(count ?? 0);
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
        if (isInitial) setLoadingInitial(false);
      }
    },
    [activeTab, page, pageSize, q, supabase]
  );

  // Initial load
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession().catch(() => {});
      await fetchPage(true);
    })();
  }, [fetchPage, supabase]);

  // Refetch on tab/search/page change (no spinner)
  useEffect(() => {
    fetchPage(false);
  }, [activeTab, q, page, fetchPage]);

  // === Realtime inserts (dedup) ===
  useEffect(() => {
    if (realtimeBoundRef.current) return;
    realtimeBoundRef.current = true;

    const ch = supabase.channel("realtime:invoices");

    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "invoices" },
      (payload) => {
        const row = payload.new as InvoiceRow;
        // Apply same filters as current view; if match, prepend (dedup)
        const passTab =
          activeTab === "All" ||
          (activeTab === "Unpaid" && row.status === "unpaid") ||
          (activeTab === "Paid" && row.status === "paid") ||
          (activeTab === "Draft" && row.status === "draft");
        const passSearch =
          !q ||
          `${row.invoice_no ?? ""} ${row.client_name ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase());

        if (passTab && passSearch) {
          setRows((prev) => {
            const list = prev ?? [];
            if (list.some((x) => x.id === row.id)) return list;
            const next = [row, ...list];
            return next.slice(0, pageSize);
          });
          setTotalCount((c) => c + 1);
        }
      }
    );

    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
      realtimeBoundRef.current = false;
    };
  }, [activeTab, pageSize, q, supabase]);

  // === Derived ===
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const setTab = (t: TabKey) => {
    setPage(1);
    setActiveTab(t);
  };

  const openInvoice = (id: string) => {
    router.push(`/client/invoices/${id}`);
  };

  useEffect(() => {
    const onClientRefresh = () => {
      fetchPage(true);
    };
    window.addEventListener('client-refresh', onClientRefresh);
    return () => {
      window.removeEventListener('client-refresh', onClientRefresh);
    };
  }, [fetchPage]);

  return (
    <div className="p-6 space-y-6">
      {/* Header / Search only (no create) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search invoice no / client…"
            className="h-9 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {(["All", "Unpaid", "Paid", "Draft"] as TabKey[]).map((t) => {
          const active = activeTab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm ${
                active
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loadingInitial ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500 shadow">
          Loading invoices…
        </div>
      ) : (
        <Card
          title="Invoices"
          right={
            <span className="text-xs text-gray-500">
              {totalCount.toLocaleString("id-ID")} total
            </span>
          }
        >
          {rows.length === 0 ? (
            <div className="text-sm text-gray-500">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2">Invoice No</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Issue</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2 font-medium text-gray-800">{r.invoice_no}</td>
                      <td className="px-3 py-2">{r.client_name ?? "-"}</td>
                      <td className="px-3 py-2">{r.issue_date ? new Date(r.issue_date).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-3 py-2">{r.due_date ? new Date(r.due_date).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-3 py-2">
                        {r.amount_total != null
                          ? `${(r.currency ?? "IDR").toUpperCase()} ${Number(r.amount_total).toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 capitalize">{r.status}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openInvoice(r.id)}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Page {pageSafe} / {Math.max(1, Math.ceil(totalCount / pageSize))}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
              >
                Prev
              </button>
              <button
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
