"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  const [showForm, setShowForm] = useState(false);

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
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

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
            // keep pagination head fresh; if full page, drop last
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

  // === Create invoice form state ===
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    invoice_no: "",
    client_name: "",
    project_id: "",
    issue_date: "",
    due_date: "",
    currency: "IDR",
    amount_total: "" as number | string,
    status: "unpaid" as InvoiceRow["status"],
    notes: "",
  });

  const resetForm = () =>
    setForm({
      invoice_no: "",
      client_name: "",
      project_id: "",
      issue_date: "",
      due_date: "",
      currency: "IDR",
      amount_total: "",
      status: "unpaid",
      notes: "",
    });

  const createInvoice = async () => {
    const amt = Number(form.amount_total);
    if (!form.invoice_no.trim() || !form.client_name.trim() || !amt) {
      alert("Invoice No, Client, dan Amount wajib diisi.");
      return;
    }
    setIsCreating(true);
    try {
      const { error } = await supabase.from("invoices").insert({
        invoice_no: form.invoice_no.trim(),
        client_name: form.client_name.trim(),
        project_id: form.project_id || null,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        currency: (form.currency || "IDR").toUpperCase(),
        amount_total: amt,
        status: form.status,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;

      // no optimistic push → realtime INSERT akan menambah 1x (dedup)
      resetForm();
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat invoice.");
    } finally {
      setIsCreating(false);
    }
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="text-sm text-gray-500">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/client/projects" className="hover:underline">
                Projects
              </Link>
            </li>
            <li>›</li>
            <li className="text-gray-800">Invoices</li>
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search invoice no / client…"
            className="h-9 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={() => setShowForm((s) => !s)}
            className="h-9 rounded-md border px-3 text-sm hover:bg-gray-50"
          >
            {showForm ? "Close" : "New Invoice"}
          </button>
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

      {/* Form (toggle) */}
      {showForm && (
        <Card title="Create Invoice">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={form.invoice_no}
              onChange={(e) => setForm((p) => ({ ...p, invoice_no: e.target.value }))}
              placeholder="Invoice No *"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              value={form.client_name}
              onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
              placeholder="Client *"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              value={form.project_id}
              onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}
              placeholder="Project ID (optional)"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
                placeholder="Currency"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="number"
                min={0}
                value={form.amount_total}
                onChange={(e) => setForm((p) => ({ ...p, amount_total: e.target.value }))}
                placeholder="Amount *"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as InvoiceRow["status"] }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="unpaid">Unpaid</option>
              <option value="draft">Draft</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Notes"
              rows={2}
              className="col-span-1 md:col-span-2 w-full resize-none rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              type="button"
            >
              Reset
            </button>
            <button
              onClick={createInvoice}
              disabled={isCreating}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isCreating ? "Creating…" : "Create"}
            </button>
          </div>
        </Card>
      )}

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
