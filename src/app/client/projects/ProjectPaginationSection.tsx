"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "@/icons";

type Props = {
  currentPage: number;      // 1-based
  totalPages: number;       // >= 1
  onPageChange: (page: number) => void;
  siblingCount?: number;    // default 1
};

export const ProjectPaginationSection = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: Props): React.JSX.Element => {
  const clamp = (n: number) => Math.min(Math.max(n, 1), Math.max(totalPages, 1));

  const createItems = () => {
    const items: Array<
      | { type: "previous"; label: string }
      | { type: "next"; label: string }
      | { type: "page"; label: string; page: number; active?: boolean }
      | { type: "ellipsis"; label: string }
    > = [];

    // previous
    items.push({ type: "previous", label: "Previous" });

    const first = 1;
    const last = Math.max(totalPages, 1);
    const start = Math.max(first, currentPage - siblingCount);
    const end   = Math.min(last,  currentPage + siblingCount);

    // always show first
    items.push({ type: "page", label: String(first), page: first, active: currentPage === first });

    // left ellipsis
    if (start > first + 1) items.push({ type: "ellipsis", label: "…" });

    // middle
    for (let p = start; p <= end; p++) {
      if (p !== first && p !== last) {
        items.push({ type: "page", label: String(p), page: p, active: p === currentPage });
      }
    }

    // right ellipsis
    if (end < last - 1) items.push({ type: "ellipsis", label: "…" });

    // always show last
    if (last > 1) items.push({ type: "page", label: String(last), page: last, active: currentPage === last });

    // next
    items.push({ type: "next", label: "Next" });

    return items;
  };

  const items = createItems();
  const handlePrev = () => onPageChange(clamp(currentPage - 1));
  const handleNext = () => onPageChange(clamp(currentPage + 1));

  return (
    <nav
      className="w-full flex items-center justify-center py-4"
      role="navigation"
      aria-label="Pagination"
    >
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-1.5 py-1 shadow-sm">
        {items.map((item, idx) => {
          if (item.type === "previous") {
            const disabled = currentPage === 1;
            return (
              <button
                key={`prev-${idx}`}
                onClick={handlePrev}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm border border-transparent
                  ${disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"}`}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="" />
                <span className="hidden sm:inline font-medium">Previous</span>
              </button>
            );
          }

          if (item.type === "next") {
            const disabled = currentPage === Math.max(totalPages, 1);
            return (
              <button
                key={`next-${idx}`}
                onClick={handleNext}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm border border-transparent
                  ${disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"}`}
                aria-label="Go to next page"
              >
                <span className="hidden sm:inline font-medium">Next</span>
                <ChevronRight className="" />
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
              onClick={() => onPageChange(item.page)}
              className={[
                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60",
                isActive
                  ? "bg-primary-60 text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
              aria-label={`Go to page ${item.page}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="font-medium tabular-nums">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
