// E:\FMGIH\fmg-industry-hub\src\app\client\projects\ProjectPaginationSection.tsx
"use client";
import React, { useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "@/icons";

type Props = {
  /** 1-based */
  currentPage: number;
  /** >= 1 (akan di-clamp minimal 1) */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** jumlah tetangga kiri/kanan dari halaman aktif (default 1) */
  siblingCount?: number;
};

type PageItem =
  | { type: "previous"; label: string }
  | { type: "next"; label: string }
  | { type: "ellipsis"; label: string }
  | { type: "page"; label: string; page: number; active?: boolean };

export const ProjectPaginationSection = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: Props): React.JSX.Element => {
  const clamp = useCallback(
    (n: number) => Math.min(Math.max(n, 1), Math.max(totalPages, 1)),
    [totalPages]
  );

  const items: PageItem[] = useMemo(() => {
    const out: PageItem[] = [];
    const first = 1;
    const last = Math.max(totalPages, 1);
    const start = Math.max(first, currentPage - siblingCount);
    const end = Math.min(last, currentPage + siblingCount);

    // prev
    out.push({ type: "previous", label: "Previous" });

    // first
    out.push({ type: "page", label: String(first), page: first, active: currentPage === first });

    // left ellipsis
    if (start > first + 1) out.push({ type: "ellipsis", label: "…" });

    // middle pages
    for (let p = start; p <= end; p++) {
      if (p !== first && p !== last) {
        out.push({ type: "page", label: String(p), page: p, active: p === currentPage });
      }
    }

    // right ellipsis
    if (end < last - 1) out.push({ type: "ellipsis", label: "…" });

    // last
    if (last > 1) out.push({ type: "page", label: String(last), page: last, active: currentPage === last });

    // next
    out.push({ type: "next", label: "Next" });

    return out;
  }, [currentPage, totalPages, siblingCount]);

  const handlePrev = useCallback(() => onPageChange(clamp(currentPage - 1)), [clamp, currentPage, onPageChange]);
  const handleNext = useCallback(() => onPageChange(clamp(currentPage + 1)), [clamp, currentPage, onPageChange]);

  const lastPage = Math.max(totalPages, 1);
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= lastPage;

  return (
    <nav className="flex w-full items-center justify-center py-4" role="navigation" aria-label="Pagination">
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-1.5 py-1 shadow-sm backdrop-blur-sm">
        {items.map((item, idx) => {
          if (item.type === "previous") {
            return (
              <button
                key={`prev-${idx}`}
                type="button"
                onClick={handlePrev}
                disabled={isPrevDisabled}
                aria-disabled={isPrevDisabled}
                aria-label="Go to previous page"
                rel="prev"
                className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm
                  ${isPrevDisabled
                    ? "cursor-not-allowed text-gray-400"
                    : "text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"}`}
              >
                <ChevronLeft />
                <span className="hidden font-medium sm:inline">Previous</span>
              </button>
            );
          }

          if (item.type === "next") {
            return (
              <button
                key={`next-${idx}`}
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled}
                aria-disabled={isNextDisabled}
                aria-label="Go to next page"
                rel="next"
                className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm
                  ${isNextDisabled
                    ? "cursor-not-allowed text-gray-400"
                    : "text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"}`}
              >
                <span className="hidden font-medium sm:inline">Next</span>
                <ChevronRight />
              </button>
            );
          }

          if (item.type === "ellipsis") {
            return (
              <span
                key={`dots-${idx}`}
                className="inline-flex select-none items-center justify-center px-2 py-1.5 text-sm text-gray-500"
              >
                {item.label}
              </span>
            );
          }

          // page
          const isActive = !!item.active;
          return (
            <button
              key={`p-${item.page}-${idx}`}
              type="button"
              onClick={() => onPageChange(item.page)}
              aria-label={`Go to page ${item.page}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60",
                isActive
                  ? "bg-primary-60 text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              <span className="font-medium tabular-nums">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
