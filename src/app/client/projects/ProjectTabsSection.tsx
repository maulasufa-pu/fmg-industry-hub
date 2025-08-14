"use client";
import { useEffect, useRef, useLayoutEffect, useState, useCallback } from "react";
import { Search } from "@/icons";

// Types
export type TabBase = "All Project" | "Active" | "Finished" | "Pending" | "Requested";

type Tab = {
  name: TabBase;
  count: number | null;
  isDisabled?: boolean;
};

type Props = {
  activeTab?: TabBase;               // optional controlled prop
  initialTab?: TabBase;              // default tab when uncontrolled
  onTabChange?: (tab: TabBase) => void;
  onSearchChange?: (q: string) => void;
  onCreateClick?: () => void;
  externalCounts?: Record<TabBase, number | null>;
};

export const ProjectTabsSection = ({
  activeTab: activeTabProp,
  initialTab = "All Project",
  onTabChange,
  onSearchChange,
  onCreateClick,
  externalCounts,
}: Props): React.JSX.Element => {
  // Static tab list (counts are provided from parent via externalCounts)
  const [tabs] = useState<Tab[]>([
    { name: "All Project", count: null },
    { name: "Active", count: null },
    { name: "Finished", count: null },
    { name: "Pending", count: null },
    { name: "Requested", count: null },
  ]);

  // Local active tab if component is uncontrolled
  const [activeTabInner, setActiveTabInner] = useState<TabBase>(initialTab);
  useEffect(() => {
    if (activeTabProp) setActiveTabInner(activeTabProp);
  }, [activeTabProp]);
  useEffect(() => {
    if (!activeTabProp) setActiveTabInner(initialTab);
  }, [initialTab, activeTabProp]);
  const activeTab = activeTabProp ?? activeTabInner;

  // Search (debounced)
  const [searchValue, setSearchValue] = useState("");
  useEffect(() => {
    const id: number = window.setTimeout(() => onSearchChange?.(searchValue), 300);
    return () => window.clearTimeout(id);
  }, [searchValue, onSearchChange]);

  // Underline indicator
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const updateIndicator = useCallback(() => {
    const container = listRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("[data-tab-btn='true']")
    );
    const activeBtn = buttons.find((b) => b.dataset.tabName === activeTab);
    if (!activeBtn) return;

    const cRect = container.getBoundingClientRect();
    const aRect = activeBtn.getBoundingClientRect();
    const x = aRect.left - cRect.left;

    // smooth + layout-safe
    window.requestAnimationFrame(() => {
      indicator.style.width = `${aRect.width}px`;
      indicator.style.transform = `translateX(${x}px)`;
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();

    // Guard untuk environment yang belum support ResizeObserver
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateIndicator());
      if (listRef.current) ro.observe(listRef.current);
    }
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [activeTab, tabs.length, updateIndicator]);

  const handleTabClick = (tab: Tab) => {
    if (tab.isDisabled) return;
    if (!activeTabProp) setActiveTabInner(tab.name); // local state only if uncontrolled
    onTabChange?.(tab.name);
  };

  // Keyboard navigation
  const onKeyNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = tabs.findIndex((t) => t.name === activeTab);
    const dir = e.key === "ArrowRight" ? 1 : -1;

    let next = idx;
    for (let i = 0; i < tabs.length; i++) {
      next = (next + dir + tabs.length) % tabs.length;
      if (!tabs[next].isDisabled) break;
    }
    if (!activeTabProp) setActiveTabInner(tabs[next].name);
    onTabChange?.(tabs[next].name);
  };

  const safeId = (name: string) => `panel-${name.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <nav
      className="flex w-full items-center justify-between border-b border-gray-200"
      role="navigation"
      aria-label="Project tabs"
    >
      {/* Tabs */}
      <div
        className="relative flex items-center gap-1"
        role="tablist"
        aria-orientation="horizontal"
        ref={listRef}
        onKeyDown={onKeyNav}
      >
        {tabs.map((tab) => {
          const isActive = tab.name === activeTab;
          const displayCount =
            externalCounts && typeof externalCounts[tab.name] === "number"
              ? (externalCounts[tab.name] as number)
              : null;

          return (
            <button
              key={tab.name}
              type="button"
              data-tab-btn="true"
              data-tab-name={tab.name}
              onClick={() => handleTabClick(tab)}
              disabled={!!tab.isDisabled}
              role="tab"
              aria-selected={isActive}
              aria-controls={safeId(tab.name)}
              tabIndex={tab.isDisabled ? -1 : 0}
              className={[
                "relative inline-flex h-12 items-center gap-2 px-4 py-2",
                "text-sm font-medium",
                "transition-colors",
                tab.isDisabled
                  ? "cursor-not-allowed text-gray-400"
                  : isActive
                  ? "text-blue-600"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
              ].join(" ")}
            >
              <span>{tab.name}</span>
              {typeof displayCount === "number" && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {displayCount}
                </span>
              )}
            </button>
          );
        })}

        {/* underline indicator */}
        <span
          ref={indicatorRef}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-blue-600 transition-transform duration-300"
          style={{ width: 0, transform: "translateX(0)" }}
        />
      </div>

      {/* Search + New Project */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="rounded-lg border px-3 py-1.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-60"
          />
        </div>

        <button
          type="button"
          onClick={onCreateClick}
          className="ml-2 inline-flex items-center gap-2 rounded-lg bg-primary-60 px-3 py-1.5 text-sm font-medium text-white shadow-sm
                     hover:brightness-95 active:scale-[0.98] focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-primary-60 focus-visible:ring-offset-2"
        >
          <span className="text-base leading-none">＋</span>
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>
    </nav>
  );
};
