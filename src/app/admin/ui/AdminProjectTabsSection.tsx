//E:\FMGIH\fmg-industry-hub\src\app\admin\ui\AdminProjectTabsSection.tsx
"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search } from "@/icons";

export type AdminTabKey = "All" | "Active" | "Finished" | "Pending" | "Unassigned";

const PIC_OPTIONS = ["any", "John", "Jane", "Adi", "Sari"] as const;
const STAGE_OPTIONS = ["any", "ideation", "recording", "mixing", "mastering", "release"] as const;
const STATUS_OPTIONS = ["any", "requested", "active", "onhold", "finished", "cancelled"] as const;

// Turunkan union type dari konstanta:
export type PicOption = typeof PIC_OPTIONS[number];
export type StageOption = typeof STAGE_OPTIONS[number];
export type StatusOption = typeof STATUS_OPTIONS[number];

type Props = {
  activeTab: AdminTabKey;
  counts: Record<AdminTabKey, number | null>;
  search: string;
  onSearchChange: (v: string) => void;

  filterPIC: PicOption;
  filterStage: StageOption;
  filterStatus: StatusOption;
  onFilterPIC: (v: PicOption) => void;
  onFilterStage: (v: StageOption) => void;
  onFilterStatus: (v: StatusOption) => void;

  onTabChange: (tab: AdminTabKey) => void;
  onCreate: () => void;
};

export default function AdminProjectTabsSection({
  activeTab, counts, search, onSearchChange,
  filterPIC, filterStage, filterStatus,
  onFilterPIC, onFilterStage, onFilterStatus,
  onTabChange, onCreate,
}: Props): React.JSX.Element {
  const tabs: { name: AdminTabKey }[] = useMemo(
    () => [{ name: "All" }, { name: "Active" }, { name: "Finished" }, { name: "Pending" }, { name: "Unassigned" }],
    []
  );

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

  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 pb-3">
      {/* Tabs */}
      <div className="relative flex items-center gap-1" ref={listRef}>
        {tabs.map((t) => {
          const isActive = t.name === activeTab;
          const cnt = counts[t.name];
          return (
            <button
              key={t.name}
              type="button"
              data-tab-btn="true"
              data-tab-name={t.name}
              onClick={() => onTabChange(t.name)}
              className={[
                "relative inline-flex items-center gap-2 px-4 py-2 h-12 text-sm font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
              ].join(" ")}
              aria-selected={isActive}
            >
              <span>{t.name}</span>
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
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search project/artist/genre"
            className="h-9 rounded-lg border px-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-60"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-lg border px-3 text-sm"
            value={filterPIC}
            onChange={(e) => onFilterPIC(e.currentTarget.value as PicOption)}
          >
            {PIC_OPTIONS.map((o) => (
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
            {STAGE_OPTIONS.map((o) => (
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
            {STATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === "any" ? "Status: Any" : `Status: ${o}`}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-60 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"
          >
            <span className="text-base leading-none">＋</span>
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}
