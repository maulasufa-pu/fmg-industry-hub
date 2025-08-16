"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Search, User } from "@/icons";

export type AdminTabKey = "All" | "Active" | "Finished" | "Pending" | "Unassigned";

// Dinamis dari DB, tapi selalu sediakan sentinel "any"
export type PicOption = "any" | string;
export type StageOption = "any" | string;
export type StatusOption = "any" | string;

// === Row UI utk Admin ===
export type AdminProjectRow = {
  id: string;

  // Info utama (tabel)
  artist_name: string | null;           // Nama client (COALESCE dari view)
  project_name: string;
  album_title: string | null;
  genre: string | null;
  assigned_pic: string | null;
  budget_amount: number | null;
  budget_currency: string | null;

  // Info tambahan (search/expanded)
  sub_genre: string | null;
  description: string | null;
  payment_plan: string | null;
  start_date: string | null;
  deadline: string | null;
  delivery_format: string | null;
  nda_required: boolean | null;
  preferred_engineer_id: string | null;
  preferred_engineer_name: string | null;

  stage: string | null;
  status: string | null;
  latest_update: string | null;
  progress_percent: number | null;
  engineer_name: string | null;
  anr_name: string | null;
};

type FilterOptions = {
  picOptions: PicOption[];
  stageOptions: StageOption[];
  statusOptions: StatusOption[];
};

type Props = {
  /** Tabs + counters */
  activeTab: AdminTabKey;
  counts: Record<AdminTabKey, number | null>;
  onTabChange: (tab: AdminTabKey) => void;

  /** Controls */
  search: string;
  onSearchChange: (v: string) => void;
  filterPIC: PicOption;
  filterStage: StageOption;
  filterStatus: StatusOption;
  onFilterPIC: (v: PicOption) => void;
  onFilterStage: (v: StageOption) => void;
  onFilterStatus: (v: StatusOption) => void;
  filterOptions: FilterOptions;

  /** Data & paging (semua sudah dari page.tsx) */
  loading: boolean;
  rows: AdminProjectRow[];
  totalCount: number;
  currentPage: number; // 1-based
  pageSize: number;
  onPageChange: (page: number) => void;

  /** Actions */
  onOpen: (id: string) => void;
  onBulkAssignPIC: (ids: string[], pic: string | null) => Promise<void>;
  onBulkMarkFinished: (ids: string[]) => Promise<void>;
};

const headers: Array<{ key: keyof AdminProjectRow | "client" | "song" | "album" | "budget"; label: string; sortable?: boolean }> = [
  { key: "client", label: "Nama Client", sortable: true },
  { key: "song",   label: "Judul Lagu"  },
  { key: "album",  label: "Judul Album" },
  { key: "genre",  label: "Genre"       },
  { key: "assigned_pic", label: "PIC"   },
  { key: "budget", label: "Budget"      },
];

export default function AdminPanel({
  activeTab, counts, onTabChange,
  search, onSearchChange,
  filterPIC, filterStage, filterStatus,
  onFilterPIC, onFilterStage, onFilterStatus,
  filterOptions,
  loading, rows, totalCount, currentPage, pageSize, onPageChange,
  onOpen, onBulkAssignPIC, onBulkMarkFinished,
}: Props): React.JSX.Element {

  // === underline indicator untuk tabs ===
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const updateIndicator = () => {
    const container = listRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const btns = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-tab-btn='true']"));
    const activeBtn = btns.find((b) => b.dataset.tabName === activeTab);
    if (!activeBtn) return;
    const c = container.getBoundingClientRect();
    const a = activeBtn.getBoundingClientRect();
    indicator.style.width = `${a.width}px`;
    indicator.style.transform = `translateX(${a.left - c.left}px)`;
  };

  useLayoutEffect(() => {
    updateIndicator();
    const ro = new ResizeObserver(updateIndicator);
    if (listRef.current) ro.observe(listRef.current);
    window.addEventListener("resize", updateIndicator);
    return () => { ro.disconnect(); window.removeEventListener("resize", updateIndicator); };
  }, [activeTab]);

  // === selection/expand UI state (local only) ===
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignPIC, setAssignPIC] = useState<string>("");

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const anySelected = selected.size > 0;
  const selectAll = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(selectAll ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleRow = (id: string) =>
    setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));
  const toggleExpand = (id: string) =>
    setExpanded((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const prev = () => onPageChange(Math.max(1, currentPage - 1));
  const next = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const tabs: AdminTabKey[] = ["All", "Active", "Finished", "Pending", "Unassigned"];

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs + Controls */}
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-3">
        {/* Tabs */}
        <div className="relative flex items-center gap-1" ref={listRef}>
          {tabs.map((t) => {
            const cnt = counts[t];
            const isActive = t === activeTab;
            return (
              <button
                key={t}
                type="button"
                data-tab-btn="true"
                data-tab-name={t}
                onClick={() => onTabChange(t)}
                className={[
                  "relative inline-flex items-center gap-2 px-4 py-2 h-12 text-sm font-medium transition-colors",
                  isActive ? "text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
                ].join(" ")}
                aria-selected={isActive}
              >
                <span>{t}</span>
                {typeof cnt === "number" && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{cnt}</span>
                )}
              </button>
            );
          })}
          <span
            ref={indicatorRef}
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-blue-600 transition-transform duration-300"
            style={{ width: 0, transform: "translateX(0)" }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              placeholder="Cari client/lagu/album/genre"
              className="h-9 rounded-lg border px-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-60"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-lg border px-3 text-sm"
              value={filterPIC}
              onChange={(e) => onFilterPIC(e.currentTarget.value as PicOption)}
            >
              {filterOptions.picOptions.map((o) => (
                <option key={o} value={o}>
                  {o === "any" ? "PIC: Any" : `PIC: ${o}`}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-lg border px-3 text-sm"
              value={filterStage}
              onChange={(e) => onFilterStage(e.currentTarget.value as StageOption)}
            >
              {filterOptions.stageOptions.map((o) => (
                <option key={o} value={o}>
                  {o === "any" ? "Stage: Any" : `Stage: ${o}`}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-lg border px-3 text-sm"
              value={filterStatus}
              onChange={(e) => onFilterStatus(e.currentTarget.value as StatusOption)}
            >
              {filterOptions.statusOptions.map((o) => (
                <option key={o} value={o}>
                  {o === "any" ? "Status: Any" : `Status: ${o}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-gray-50 p-3">
        <div className="text-sm text-gray-700">{anySelected ? `${selected.size} selected` : "No selection"}</div>
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

        <div className="ml-auto text-sm text-gray-600">
          {loading ? "Loading…" : `${totalCount.toLocaleString("id-ID")} total`}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading projects…</div>
        ) : rows.length === 0 ? (
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

                {/* === Kolom yang diminta admin === */}
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
                const budget =
                  r.budget_amount != null
                    ? `${(r.budget_currency ?? "IDR").toUpperCase()} ${Number(r.budget_amount).toLocaleString("id-ID")}`
                    : "-";
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
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRow(r.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                          aria-label={`Select ${r.project_name}`}
                        />
                      </td>

                      {/* Nama Client */}
                      <td className="border-t px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gray-200">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-800">{r.artist_name ?? "-"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Judul Album */}
                    <td className="border-t px-4 py-3 text-gray-700">{r.album_title ?? "-"}</td>

                    {/* Genre */}
                    <td className="border-t px-4 py-3 text-gray-700">{r.genre ?? "-"}</td>

                    {/* PIC */}
                    <td className="border-t px-4 py-3 text-gray-700">{r.assigned_pic ?? "-"}</td>

                    {/* Budget */}
                    <td className="border-t px-4 py-3 text-gray-700">{budget}</td>

                    <td className="border-t p-3 text-center">
                      <button
                        className={`h-6 w-6 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(r.id);
                        }}
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
                    <td colSpan={8} className="p-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-md border border-gray-200 bg-white p-4">
                          <div className="mb-2 text-sm font-medium text-gray-700">Detail Permintaan</div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                            <div className="text-gray-500">Sub-Genre:</div>
                            <div className="text-gray-800">{r.sub_genre ?? "-"}</div>

                            <div className="text-gray-500">Payment Plan:</div>
                            <div className="text-gray-800">{r.payment_plan ?? "-"}</div>

                            <div className="text-gray-500">Delivery Format:</div>
                            <div className="text-gray-800">{r.delivery_format ?? "-"}</div>

                            <div className="text-gray-500">NDA Required:</div>
                            <div className="text-gray-800">{r.nda_required ? "Yes" : r.nda_required === false ? "No" : "-"}</div>

                            <div className="text-gray-500">Preferred Engineer:</div>
                            <div className="text-gray-800">{r.preferred_engineer_name ?? "-"}</div>

                            <div className="text-gray-500">Start Date:</div>
                            <div className="text-gray-800">{r.start_date ? new Date(r.start_date).toLocaleString("id-ID") : "-"}</div>

                            <div className="text-gray-500">Deadline:</div>
                            <div className="text-gray-800">{r.deadline ? new Date(r.deadline).toLocaleString("id-ID") : "-"}</div>

                            <div className="text-gray-500">Latest Update:</div>
                            <div className="text-gray-800">{r.latest_update ? new Date(r.latest_update).toLocaleString("id-ID") : "-"}</div>

                            <div className="text-gray-500">Progress:</div>
                            <div className="text-gray-800">{r.progress_percent ?? 0}%</div>
                          </div>

                          <div className="mt-3">
                            <div className="text-gray-500 mb-1">Description / Synopsis:</div>
                            <div className="whitespace-pre-wrap rounded-md border p-3 text-sm text-gray-800 bg-gray-50">
                              {r.description?.trim() || "(no description)"}
                            </div>
                          </div>

                          <div className="mt-4">
                            <button
                              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen(r.id);
                              }}
                            >
                              Open Project
                            </button>
                          </div>
                        </div>

                        <div className="rounded-md border border-gray-200 bg-white p-4">
                          <div className="mb-2 text-sm font-medium text-gray-700">Assignment</div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                            <div className="text-gray-500">PIC:</div>
                            <div className="text-gray-800">{r.assigned_pic ?? "-"}</div>

                            <div className="text-gray-500">Engineer:</div>
                            <div className="text-gray-800">{r.engineer_name ?? "-"}</div>

                            <div className="text-gray-500">A&R:</div>
                            <div className="text-gray-800">{r.anr_name ?? "-"}</div>
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

      {/* Pagination */}
      <nav className="flex w-full items-center justify-center py-4" aria-label="Pagination">
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-1.5 py-1 shadow-sm backdrop-blur-sm">
          <button
            onClick={prev}
            disabled={isPrevDisabled}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm ${
              isPrevDisabled ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ChevronLeft /><span className="hidden font-medium sm:inline">Previous</span>
          </button>

          <span className="px-2 py-1.5 text-sm text-gray-700">
            Page <span className="tabular-nums">{currentPage}</span> of{" "}
            <span className="tabular-nums">{totalPages}</span>
          </span>

          <button
            onClick={next}
            disabled={isNextDisabled}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm ${
              isNextDisabled ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="hidden font-medium sm:inline">Next</span><ChevronRight />
          </button>
        </div>
      </nav>
    </div>
  );
}
