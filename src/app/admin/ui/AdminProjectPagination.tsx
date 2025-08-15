"use client";

import React, { useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "@/icons";

type Props = {
  currentPage: number; // 1-based
  totalPages: number;  // >= 1
  onPageChange: (p: number) => void;
  siblingCount?: number;
};

type Item =
  | { t: "prev" }
  | { t: "next" }
  | { t: "dots" }
  | { t: "page"; p: number; active?: boolean };

export default function AdminProjectPagination({
  currentPage, totalPages, onPageChange, siblingCount = 1,
}: Props): React.JSX.Element {
  const clamp = useCallback((n: number) => Math.min(Math.max(n, 1), Math.max(totalPages, 1)), [totalPages]);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    const first = 1;
    const last = Math.max(totalPages, 1);
    const start = Math.max(first, currentPage - siblingCount);
    const end = Math.min(last, currentPage + siblingCount);

    out.push({ t: "prev" });
    out.push({ t: "page", p: first, active: currentPage === first });
    if (start > first + 1) out.push({ t: "dots" });
    for (let p = start; p <= end; p++) if (p !== first && p !== last) out.push({ t: "page", p, active: p === currentPage });
    if (end < last - 1) out.push({ t: "dots" });
    if (last > 1) out.push({ t: "page", p: last, active: currentPage === last });
    out.push({ t: "next" });
    return out;
  }, [currentPage, totalPages, siblingCount]);

  const prev = () => onPageChange(clamp(currentPage - 1));
  const next = () => onPageChange(clamp(currentPage + 1));
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= Math.max(totalPages, 1);

  return (
    <nav className="flex w-full items-center justify-center py-4" aria-label="Pagination">
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-1.5 py-1 shadow-sm backdrop-blur-sm">
        {items.map((it, idx) => {
          if (it.t === "prev") {
            return (
              <button key={`prev-${idx}`} onClick={prev} disabled={isPrevDisabled}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm ${
                  isPrevDisabled ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-50"
                }`}>
                <ChevronLeft /><span className="hidden font-medium sm:inline">Previous</span>
              </button>
            );
          }
          if (it.t === "next") {
            return (
              <button key={`next-${idx}`} onClick={next} disabled={isNextDisabled}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm ${
                  isNextDisabled ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-50"
                }`}>
                <span className="hidden font-medium sm:inline">Next</span><ChevronRight />
              </button>
            );
          }
          if (it.t === "dots") {
            return <span key={`dots-${idx}`} className="px-2 py-1.5 text-sm text-gray-500">…</span>;
          }
          return (
            <button key={`p-${it.p}-${idx}`} onClick={() => onPageChange(it.p)} aria-current={it.active ? "page" : undefined}
              className={[
                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm transition",
                it.active ? "bg-primary-60 text-white" : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}>
              <span className="font-medium tabular-nums">{it.p}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
