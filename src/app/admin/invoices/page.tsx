"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

type InvoiceStatus = "draft" | "unpaid" | "paid" | "cancelled";

type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_name: string | null;
  amount_total: number | null;
  currency: string | null;
  status: InvoiceStatus;
  created_at: string | null;
  due_at: string | null;
};

const COLS = "id,invoice_no,client_name,amount_total,currency,status,created_at,due_at";

export default function AdminInvoicesPage(): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InvoiceStatus | "all">("unpaid");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<InvoiceRow[]>([]);

  const load = async () => {
    setLoading(true);
    let qb = sb.from("invoices").select(COLS).order("created_at", { ascending: false });
    if (tab !== "all") qb = qb.eq("status", tab);
    if (q.trim()) {
      const like = `%${q.trim()}%`;
      qb = qb.or(`invoice_no.ilike.${like},client_name.ilike.${like}`);
    }
    const { data, error } = await qb;
    if (!error) setRows(((data ?? []) as unknown) as InvoiceRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [tab, q]);

  const markPaid = async (id: string) => {
    const { error } = await sb.from("invoices").update({ status: "paid" }).eq("id", id);
    if (!error) void load();
  };
  const cancelInvoice = async (id: string) => {
    const { error } = await sb.from("invoices").update({ status: "cancelled" }).eq("id", id);
    if (!error) void load();
  };
  const sendReminder = async (id: string) => {
    // tempatkan logic kirim email/notification via edge function/API route jika ada
    console.log("send reminder to invoice:", id);
  };

  const Tabs: Array<{ key: InvoiceStatus | "all"; label: string }> = [
    { key: "unpaid", label: "Unpaid" },
    { key: "paid", label: "Paid" },
    { key: "draft", label: "Draft" },
    { key: "cancelled", label: "Cancelled" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Invoices</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder="Search invoice/client…"
            className="h-9 rounded-lg border px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-1 border-b pb-2">
        {Tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-3 py-1.5 text-sm rounded-md",
              tab === t.key ? "bg-blue-600 text-white" : "hover:bg-gray-100"
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-gray-500 shadow">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-gray-500 shadow">No invoices found.</div>
      ) : (
        <table className="w-full rounded-lg border bg-white shadow">
          <thead className="bg-gray-50 text-left text-sm">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Client</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Due</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.invoice_no}</td>
                <td className="p-3">{r.client_name ?? "-"}</td>
                <td className="p-3">
                  {(r.amount_total != null)
                    ? `${(r.currency ?? "IDR").toUpperCase()} ${Number(r.amount_total).toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "-"}</td>
                <td className="p-3">{r.due_at ? new Date(r.due_at).toLocaleDateString("id-ID") : "-"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    {r.status === "unpaid" && (
                      <>
                        <button onClick={() => sendReminder(r.id)} className="rounded border px-2 py-1 text-xs">
                          Send Reminder
                        </button>
                        <button onClick={() => markPaid(r.id)} className="rounded bg-green-600 px-2 py-1 text-xs text-white">
                          Mark Paid
                        </button>
                        <button onClick={() => cancelInvoice(r.id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                          Cancel
                        </button>
                      </>
                    )}
                    <Link href={`/admin/invoices/${r.id}`} className="rounded border px-2 py-1 text-xs">
                      Open
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
