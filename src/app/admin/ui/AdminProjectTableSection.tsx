"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ChevronDown, User } from "@/icons";

export type AdminProjectRow = {
  id: string;
  project_name: string;
  artist_name: string | null;
  genre: string | null;
  stage: string | null;
  status: string | null;
  latest_update: string | null;
  assigned_pic: string | null;
  progress_percent: number | null;
  budget_amount: number | null;
  budget_currency: string | null;
  engineer_name: string | null;
  anr_name: string | null;
};

type Props = {
  rows: AdminProjectRow[];
  onOpen: (id: string) => void;
  onBulkAssignPIC: (ids: string[], pic: string | null) => Promise<void> | void;
  onBulkMarkFinished: (ids: string[]) => Promise<void> | void;
};

const headers: Array<{ key: keyof AdminProjectRow | "author" | "budget"; label: string; sortable?: boolean }> = [
  { key: "author", label: "Project", sortable: true },
  { key: "genre", label: "Genre" },
  { key: "stage", label: "Stage" },
  { key: "status", label: "Status" },
  { key: "latest_update", label: "Latest Update" },
  { key: "assigned_pic", label: "PIC" },
  { key: "budget", label: "Budget" },
];

export default function AdminProjectTableSection({
  rows,
  onOpen,
  onBulkAssignPIC,
  onBulkMarkFinished,
}: Props): React.JSX.Element {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignPIC, setAssignPIC] = useState<string>("");

  const selectAll = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(selectAll ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleRow = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));
  const toggleExpand = (id: string) => setExpanded((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));

  const anySelected = selected.size > 0;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow">
      {/* Bulk bar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-3">
        <div className="text-sm text-gray-700">
          {anySelected ? `${selected.size} selected` : "No selection"}
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <input
            className="h-8 rounded-md border px-2 text-sm"
            placeholder="Assign PIC (name/email)"
            value={assignPIC}
            onChange={(e) => setAssignPIC(e.target.value)}
          />
          <button
            type="button"
            disabled={!anySelected}
            onClick={() => onBulkAssignPIC(selectedIds, assignPIC || null)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Assign PIC
          </button>

          <button
            type="button"
            disabled={!anySelected}
            onClick={() => onBulkMarkFinished(selectedIds)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Mark Finished
          </button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="p-10 text-center text-gray-500">No projects found.</div>
      ) : (
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr className="h-12 text-left text-gray-700">
              <th className="w-12 p-3 text-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleAll}
                  className="h-5 w-5 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                  aria-label="Select all rows"
                />
              </th>
              {headers.map((h) => (
                <th key={h.key as string} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{h.label}</span>
                    {h.sortable && <ArrowDown className="text-gray-600" />}
                  </div>
                </th>
              ))}
              <th className="w-10 p-3" />
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const isExpanded = expanded.has(r.id);
              return (
                <React.Fragment key={r.id}>
                  <tr
                    className="group cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => onOpen(r.id)}
                    onClick={() => toggleExpand(r.id)}
                    aria-expanded={isExpanded}
                  >
                    <td className="border-t p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={(e) => { e.stopPropagation(); toggleRow(r.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                        aria-label={`Select ${r.project_name}`}
                      />
                    </td>

                    {/* Project */}
                    <td className="border-t px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gray-200">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-800">{r.project_name}</div>
                          <div className="truncate text-sm text-gray-500">{r.artist_name ?? "-"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="border-t px-4 py-3 text-gray-700">{r.genre ?? "-"}</td>
                    <td className="border-t px-4 py-3 text-gray-700">{r.stage ?? "-"}</td>
                    <td className="border-t px-4 py-3 text-gray-700">{r.status ?? "-"}</td>
                    <td className="border-t px-4 py-3 text-gray-700">{r.assigned_pic ?? "-"}</td>
                    <td className="border-t px-4 py-3 text-gray-700">
                      {r.budget_amount != null
                        ? `${(r.budget_currency ?? "IDR").toUpperCase()} ${Number(r.budget_amount).toLocaleString("id-ID")}`
                        : "-"}
                    </td>

                    <td className="border-t p-3 text-center">
                      <button
                        className={`h-6 w-6 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleExpand(r.id); }}
                        aria-label="Toggle details"
                      >
                        <ChevronDown />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded */}
                  <tr
                    className={`bg-gray-50 transition-[opacity,transform] duration-300 ease-in-out ${
                      isExpanded ? "scale-y-100 opacity-100" : "scale-y-95 opacity-0"
                    }`}
                    style={{ visibility: isExpanded ? "visible" : "collapse" }}
                  >
                    <td colSpan={9} className="p-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-md border border-gray-200 bg-white p-4">
                          <div className="mb-2 text-sm font-medium text-gray-700">Overview</div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                            <div className="text-gray-500">Engineer:</div>
                            <div className="text-gray-800">{r.engineer_name ?? "-"}</div>

                            <div className="text-gray-500">A&R:</div>
                            <div className="text-gray-800">{r.anr_name ?? "-"}</div>

                            <div className="text-gray-500">Latest Update:</div>
                            <div className="text-gray-800">
                              {r.latest_update ? new Date(r.latest_update).toLocaleString("id-ID") : "-"}
                            </div>

                            <div className="text-gray-500">Progress:</div>
                            <div className="text-gray-800">{r.progress_percent ?? 0}%</div>
                          </div>

                          <div className="mt-4">
                            <button
                              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
                              onClick={(e) => { e.stopPropagation(); onOpen(r.id); }}
                            >
                              Open Project
                            </button>
                          </div>
                        </div>

                        <div className="rounded-md border border-gray-200 bg-white p-4">
                          <div className="mb-2 text-sm font-medium text-gray-700">Admin Notes</div>
                          <div className="text-sm text-gray-500">
                            (Tempatkan ringkasan internal, flags, atau action log khusus admin di sini.)
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
