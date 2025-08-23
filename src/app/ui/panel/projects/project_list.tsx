"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  UserCircle,
  Target,
  BarChart3,
  Check,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  Music,
  Briefcase,
  Award,
  Settings,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Pause
} from "lucide-react";
import { getEffectiveRole } from "@/lib/roles/effective";
import type { UserRole } from "@/lib/roles";
import { Plus } from "lucide-react";
import CreateProjectPopover from "./CreateProjectPopover"; 


export type TabKey = "All" | "Active" | "Finished" | "Pending" | "Unassigned" | "Requested";

// Professional status and stage formatting
const formatStatus = (status: string | null): { text: string; color: string; icon: React.ElementType } => {
  if (!status) return { text: "No Status", color: "black", icon: AlertCircle };

  const statusLower = status.toLowerCase().trim();

  switch (statusLower) {
    case "active":
    case "in_progress":
    case "in progress":
      return { text: "In Progress", color: "blue", icon: PlayCircle };
    case "completed":
    case "finished":
    case "done":
      return { text: "Completed", color: "green", icon: CheckCircle };
    case "pending":
    case "waiting":
      return { text: "Pending Review", color: "yellow", icon: Clock };
    case "paused":
    case "on_hold":
    case "on hold":
      return { text: "On Hold", color: "orange", icon: Pause };
    case "cancelled":
    case "canceled":
      return { text: "Cancelled", color: "red", icon: AlertCircle };
    case "draft":
      return { text: "Draft", color: "gray-900", icon: Settings };
    case "drafting":
      return { text: "Drafting", color: "gray-900", icon: Settings };
    default:
      return { text: status.charAt(0).toUpperCase() + status.slice(1), color: "purple", icon: AlertCircle };
  }
};

const formatStage = (stage: string | null): { text: string; color: string; icon: React.ElementType } => {
  if (!stage) return { text: "Not Set", color: "black", icon: AlertCircle };

  const stageLower = stage.toLowerCase().trim();

  switch (stageLower) {
    case "pre_production":
    case "pre-production":
    case "preproduction":
      return { text: "Pre-Production", color: "blue", icon: Briefcase };
    case "production":
    case "recording":
      return { text: "Production", color: "green", icon: Music };
    case "post_production":
    case "post-production":
    case "postproduction":
    case "editing":
      return { text: "Post-Production", color: "purple", icon: Settings };
    case "mixing":
      return { text: "Mixing", color: "indigo", icon: TrendingUp };
    case "mastering":
      return { text: "Mastering", color: "violet", icon: Award };
    case "review":
    case "quality_check":
    case "quality check":
      return { text: "Quality Review", color: "yellow", icon: CheckCircle };
    case "delivery":
    case "final":
    case "completed":
      return { text: "Final Delivery", color: "emerald", icon: Check };
    case "drafting":
    case "draft":
      return { text: "Drafting", color: "gray-900", icon: Settings };
    default:
      return { text: stage.charAt(0).toUpperCase() + stage.slice(1), color: "slate", icon: Target };
  }
};

// Dinamis dari DB, tapi selalu sediakan sentinel "any"
export type PicOption = "any" | string;
export type StageOption = "any" | string;
export type StatusOption = "any" | string;

// === Row UI ===
export type ProjectRow = {
  project_id: string;
  title: string;
  status: string | null;
  stage: string | null;
  updated_at: string;
  client_id: string | null;
  client_name?: string | null;
  artist_name: string | null;
  genre: string | null;
  progress_percent: number | null;
  composer_id: string | null;
  composer_name?: string | null;
  producer_id: string | null;
  producer_name?: string | null;
  anr_id: string | null;
  anr_name?: string | null;
  engineer_id: string | null;
  engineer_name?: string | null;
  publisher_id: string | null;
  publisher_name?: string | null;
};

type FilterOptions = {
  picOptions: PicOption[];
  stageOptions: StageOption[];
  statusOptions: StatusOption[];
};

type Props = {
  /** Tabs + counters */
  activeTab: TabKey;
  counts: Record<TabKey, number | null>;
  onTabChange: (tab: TabKey) => void;

  /** Controls */
  search: string;
  onSearchChange: (v: string) => void;
  filterPIC: PicOption;
  filterStage: StageOption;
  filterStatus: StatusOption;
  onFilterPIC: (v: PicOption) => void;
  onFilterStage: (v: StageOption) => void;
  onFilterStatus: (v: StatusOption) => void;
  filterOptions: {
    picOptions: PicOption[];
    stageOptions: StageOption[];
    statusOptions: StatusOption[];
  };

  /** Data & paging (semua sudah dari page.tsx) */
  loading: boolean;
  rows: ProjectRow[];
  totalCount: number;
  currentPage: number; // 1-based
  pageSize: number;
  onPageChange: (page: number) => void;

  /** Actions */
  onOpen: (id: string) => void;
  onBulkAssignPIC: (ids: string[], pic: string | null) => Promise<void>;
  onBulkMarkFinished: (ids: string[]) => Promise<void>;
};

/** ===== Helpers terkait role ===== */
const buildHeaders = (
  mode: "client" | "admin"
): Array<{ key: keyof ProjectRow | "client" | "song" | "album" | "assignments"; label: string; sortable?: boolean }> => {
  const base: Array<{ key: keyof ProjectRow | "client" | "song" | "album" | "assignments"; label: string; sortable?: boolean }> = [
    { key: "client_name", label: "Client", sortable: true },
    { key: "title", label: "Project Title" },
    { key: "artist_name", label: "Artist Name" },
    { key: "genre", label: "Genre" },
    // assignments akan disembunyikan saat client
    { key: "assignments", label: "Assignments" },
    { key: "progress_percent", label: "Progress" },
  ];
  return mode === "client" ? base.filter((h) => h.key !== "assignments") : base;
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const expandedRowVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    scaleY: 0.7,
    y: -20,
    originY: 0,
  },
  visible: {
    opacity: 1,
    height: "auto",
    scaleY: 1,
    y: 0,
    originY: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      opacity: { duration: 0.4, ease: "easeOut" },
      height: { duration: 0.5, ease: "easeOut" },
      scaleY: { duration: 0.3, ease: "backOut" },
      y: { duration: 0.4, ease: "easeOut" },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    scaleY: 0,
    y: 0,
    originY: 0,
    transition: {
      duration: 0,
    },
  },
};

export default function ProjectList(props: Props): React.JSX.Element {
  const {
    activeTab, counts, onTabChange,
    search, onSearchChange,
    filterPIC, filterStage, filterStatus,
    onFilterPIC, onFilterStage, onFilterStatus,
    filterOptions,
    loading, rows, totalCount, currentPage, pageSize, onPageChange,
    onOpen, onBulkAssignPIC, onBulkMarkFinished,
  } = props;

  /** ====== Dapatkan role efektif (client-side) ====== */
  const [role, setRole] = useState<UserRole>("guest");
  const [roleLoaded, setRoleLoaded] = useState(false);

  const [openRequest, setOpenRequest] = useState(false);
  const requestBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getEffectiveRole();
        if (mounted) setRole(r);
      } finally {
        if (mounted) setRoleLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isClient = role === "client";

  // headers sesuai mode
  const headers = useMemo(() => buildHeaders(isClient ? "client" : "admin"), [isClient]);

  // tabs sesuai mode
  const tabs: TabKey[] = useMemo(
    () =>
      isClient
        ? ["All", "Active", "Finished", "Pending"] // sembunyikan Unassigned & Requested untuk client
        : ["All", "Active", "Finished", "Pending", "Unassigned", "Requested"],
    [isClient]
  );

  // === underline indicator untuk tabs ===
  const listRef = useRef<HTMLDivElement>(null);

  // === tab scroll navigation ===
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position
  const checkScrollPosition = () => {
    if (listRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;

      const threshold = 1;
      const canLeft = scrollLeft > threshold;
      const canRight = scrollLeft < (maxScrollLeft - threshold);

      setCanScrollLeft(canLeft);
      setCanScrollRight(canRight);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Monitor scroll position
  useEffect(() => {
    const tabContainer = listRef.current;
    if (tabContainer) {
      const initialCheck = () => {
        setTimeout(checkScrollPosition, 100);
      };
      initialCheck();

      tabContainer.addEventListener('scroll', checkScrollPosition, { passive: true });

      const handleResize = () => {
        setTimeout(checkScrollPosition, 150);
      };
      window.addEventListener('resize', handleResize);

      const resizeObserver = new ResizeObserver(() => {
        setTimeout(checkScrollPosition, 100);
      });
      resizeObserver.observe(tabContainer);

      return () => {
        tabContainer.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Recheck when tabs content changes
  useEffect(() => {
    setTimeout(checkScrollPosition, 300);
  }, [counts]);

  // Force initial check after component mounts
  useEffect(() => {
    const forceCheck = () => {
      if (listRef.current) {
        checkScrollPosition();
      }
    };
    setTimeout(forceCheck, 50);
    setTimeout(forceCheck, 200);
    setTimeout(forceCheck, 500);
  }, []);

  // === selection/expand UI state (local only) ===
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignPIC, setAssignPIC] = useState<string>("");

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const anySelected = selected.size > 0;
  const selectAll = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => setSelected(selectAll ? new Set() : new Set(rows.map((r) => r.project_id)));
  const toggleRow = (id: string) =>
    setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));
  const toggleExpand = (id: string) =>
    setExpanded((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const prev = () => onPageChange(Math.max(1, currentPage - 1));
  const next = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <motion.div
      className="flex flex-col gap-4 sm:gap-6 lg:gap-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 dark:from-black dark:via-slate-950 dark:to-blue-950 w-full max-w-none px-5 sm:px-7 lg:px-9 py-7 sm:py-9 scroll-smooth"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Modern Header Section */}
      <motion.div
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0 mb-4 sm:mb-6"
        variants={itemVariants}
      >
        <div className="space-y-2 min-w-0 flex-1 w-full lg:w-auto">
          <motion.h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 dark:from-purple-300 dark:to-violet-300 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ wordBreak: 'keep-all' }}
          >
            Project Management
          </motion.h1>
          <motion.p
            className="text-slate-300 dark:text-slate-100 text-sm sm:text-base lg:text-lg leading-relaxed"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Manage your projects with modern workflow
          </motion.p>
        </div>
      </motion.div>

      {/* Tabs + Controls */}
      <motion.div
        className="flex flex-col gap-6 border-b border-purple-400/20 dark:border-purple-500/20 pb-6"
        variants={itemVariants}
      >
        {/* Modern Tabs with Navigation Arrows */}
        <div className="relative">
          {/* Left Arrow */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                className="absolute left-0 top-1/2 -translate-y-4.5 -mt-1 z-10 bg-gradient-to-r from-slate-800/95 to-slate-800/20 backdrop-blur-sm border border-slate-600/40 rounded-l-lg h-10 sm:h-11 lg:h-12 w-8 sm:w-10 grid place-items-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200 shadow-lg"
                onClick={scrollLeft}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Scroll left"
              >
                <ChevronLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Right Arrow */}
          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                className="absolute right-0 top-1/2 -translate-y-4.5 -mt-1 z-10 bg-gradient-to-l from-slate-800/95 to-slate-800/20 backdrop-blur-sm border border-slate-600/40 rounded-r-lg h-10 sm:h-11 lg:h-12 w-8 sm:w-10 grid place-items-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200 shadow-lg"
                onClick={scrollRight}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Scroll right"
              >
                <ChevronRight size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Tab Container */}
          <div
            className={`relative flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 transition-all duration-200 ${
              canScrollLeft ? 'pl-8 sm:pl-10' : ''
            } ${canScrollRight ? 'pr-8 sm:pr-10' : ''}`}
            ref={listRef}
            onScroll={checkScrollPosition}
          >
            {tabs.map((t) => {
              const cnt = counts[t];
              const isActive = t === activeTab;
              return (
                <motion.button
                  key={t}
                  type="button"
                  data-tab-btn="true"
                  data-tab-name={t}
                  onClick={() => onTabChange(t)}
                  className={[
                    "relative inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 h-10 sm:h-11 lg:h-12 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-lg sm:rounded-xl border backdrop-blur-sm whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "text-white bg-gradient-to-r from-purple-600 to-violet-600 border-purple-400/50 shadow-lg shadow-purple-500/25"
                      : "text-slate-300 bg-slate-800/60 border-slate-600/40 hover:bg-gradient-to-r hover:from-purple-700/30 hover:to-violet-700/30 hover:border-purple-400/30 hover:text-white hover:shadow-md hover:shadow-purple-500/10",
                  ].join(" ")}
                  aria-selected={isActive}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{t}</span>
                  {cnt !== null ? (
                    <motion.span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold min-w-[1.75rem] text-center backdrop-blur-sm ${
                        cnt > 0
                          ? isActive
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-purple-500/80 text-purple-100 border border-purple-400/50"
                          : isActive
                            ? "bg-slate-400/30 text-slate-200 border border-slate-300/30"
                            : "bg-slate-700/60 text-slate-400 border border-slate-600/40"
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      {cnt}
                    </motion.span>
                  ) : (
                    <motion.span
                      className="rounded-full bg-slate-700/60 border border-slate-600/40 px-2.5 py-1 text-xs text-slate-400 font-bold min-w-[1.75rem] text-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      •
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
            {/* Modern active indicator */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-purple-400 to-violet-500 rounded-full shadow-lg shadow-purple-500/50"
              style={{ width: 0, transform: "translateX(0)" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Modern Controls */}
        <motion.div
          className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 justify-between"
          variants={itemVariants}
        >
          {/* Kiri: Search + Filters dibungkus supaya fleksibel */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Search */}
            <motion.div
              className="relative w-full sm:w-auto"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-purple-400 w-4 sm:w-5 h-4 sm:h-5" />
              <motion.input
                value={search}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                placeholder="Search projects, clients, artists..."
                className="h-10 sm:h-12 w-full sm:w-64 lg:w-80 rounded-lg sm:rounded-xl border border-purple-400/30 bg-slate-800/60 backdrop-blur-sm pl-10 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 shadow-lg hover:bg-slate-800/80"
                whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)" }}
              />
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {[
                { value: filterPIC, onChange: onFilterPIC, options: filterOptions.picOptions, prefix: "PIC", icon: UserCircle },
                { value: filterStage, onChange: onFilterStage, options: filterOptions.stageOptions, prefix: "Stage", icon: Target },
                { value: filterStatus, onChange: onFilterStatus, options: filterOptions.statusOptions, prefix: "Status", icon: BarChart3 },
              ].map((filter, index) => {
                const IconComponent = filter.icon;
                return (
                  <motion.div key={index} className="relative" whileHover={{ scale: 1.01 }}>
                    <motion.select
                      className="h-10 sm:h-12 rounded-lg sm:rounded-xl border border-purple-400/30 bg-slate-800/60 backdrop-blur-sm px-3 sm:px-4 pr-8 sm:pr-10 text-xs sm:text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 shadow-lg hover:bg-slate-800/80 appearance-none"
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.currentTarget.value as PicOption | StageOption | StatusOption)}
                      whileTap={{ scale: 0.98 }}
                    >
                      {filter.options.map((o) => (
                        <option key={o} value={o} className="bg-slate-800 text-white">
                          {o === "any" ? `${filter.prefix}: All` : `${filter.prefix}: ${o}`}
                        </option>
                      ))}
                    </motion.select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 text-purple-400 pointer-events-none" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Kanan: tombol Request New Project (responsive) */}
          <motion.button
            ref={requestBtnRef}
            type="button"
            onClick={() => setOpenRequest(true)}
            className="
              h-10 sm:h-12 w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              rounded-xl px-4 sm:px-5 font-semibold
              text-white
              bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500
              shadow-[0_12px_40px_rgba(139,92,246,0.35)]
              hover:opacity-95 active:opacity-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60
              transition-all
            "
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm sm:text-base">Request New Project</span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Modern Bulk Action Bar */}
      <AnimatePresence>
        {anySelected && (
          <motion.div
            className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-purple-400/30 bg-gradient-to-r from-slate-800/80 via-purple-900/20 to-violet-900/20 backdrop-blur-sm p-3 sm:p-4 shadow-lg"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
          >
            <motion.div
              className="text-xs sm:text-sm font-semibold text-purple-200"
              animate={{ color: anySelected ? "#c4b5fd" : "#94a3b8" }}
            >
              {anySelected ? `${selected.size} projects selected` : "No selection"}
            </motion.div>
            <div className="hidden sm:block h-4 w-px bg-purple-400/30" />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <motion.input
                className="h-9 sm:h-10 rounded-lg border border-purple-400/30 bg-slate-700/60 backdrop-blur-sm px-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 w-full sm:w-auto"
                placeholder="Assign PIC (name/email)"
                value={assignPIC}
                onChange={(e) => setAssignPIC(e.target.value)}
                whileFocus={{ scale: 1.02 }}
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <motion.button
                  type="button"
                  disabled={!anySelected}
                  onClick={() => onBulkAssignPIC(selectedIds, assignPIC || null)}
                  className="rounded-lg border border-purple-400/30 bg-purple-600/80 backdrop-blur-sm px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-purple-600 hover:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                  whileHover={!anySelected ? {} : { scale: 1.05, y: -1 }}
                  whileTap={!anySelected ? {} : { scale: 0.95 }}
                >
                  Assign PIC
                </motion.button>

                <motion.button
                  type="button"
                  disabled={!anySelected}
                  onClick={() => onBulkMarkFinished(selectedIds)}
                  className="rounded-lg border border-green-400/30 bg-green-600/80 backdrop-blur-sm px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-green-600 hover:border-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                  whileHover={!anySelected ? {} : { scale: 1.05, y: -1 }}
                  whileTap={!anySelected ? {} : { scale: 0.95 }}
                >
                  Mark Finished
                </motion.button>
              </div>
            </div>

            <motion.div
              className="ml-auto text-sm text-purple-200 font-medium"
              animate={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Loading…
                </motion.span>
              ) : (
                `${totalCount.toLocaleString("id-ID")} total projects`
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Table */}
      <motion.div
        className="rounded-xl border border-purple-400/30 bg-slate-900/60 backdrop-blur-sm shadow-2xl overflow-hidden overflow-x-auto"
        variants={itemVariants}
        whileHover={{ boxShadow: "0 20px 40px rgba(139, 92, 246, 0.1)" }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <motion.div
            className="p-12 text-center text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div>Loading projects…</div>
          </motion.div>
        ) : rows.length === 0 ? (
          <motion.div
            className="p-12 text-center text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-4xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              📊
            </motion.div>
            No projects found.
          </motion.div>
        ) : (
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-purple-400/20">
              <tr className="h-12 md:h-16 text-left">
                <th className="w-8 md:w-12 p-2 md:p-4 text-center">
                  <div className="flex justify-center">
                    <div
                      onClick={toggleAll}
                      className={`
                        w-4 h-4 md:w-5 md:h-5 rounded cursor-pointer border-2 flex items-center justify-center transition-all duration-200
                        ${selectAll 
                          ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/25' 
                          : 'bg-slate-700/50 border-slate-400/50 hover:border-slate-400/70'
                        }
                      `}
                      aria-label="Select all rows"
                    >
                      {selectAll && (
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white stroke-[3]" />
                      )}
                    </div>
                  </div>
                </th>

                {/* Header Columns */}
                {headers.map((h) => (
                  <th key={h.key as string} className="px-3 md:px-6 py-2 md:py-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="font-semibold text-white text-xs md:text-sm">{h.label}</span>
                      {h.sortable && (
                        <ArrowDown className="text-purple-400 w-3 h-3 md:w-4 md:h-4 hover:text-purple-300 transition-colors cursor-pointer" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-8 md:w-12 p-2 md:p-4" />
              </tr>
            </thead>

            <tbody>
              {rows.map((r, index) => {
                const isExpanded = expanded.has(r.project_id);
                const expandedColSpan = headers.length + 2; // checkbox + headers + action toggle
                return (
                  <React.Fragment key={r.project_id}>
                    <motion.tr
                      className={`
                        group cursor-pointer border-t transition-all duration-200
                        ${selected.has(r.project_id) 
                          ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 hover:bg-green-100/70 dark:hover:bg-green-900/20' 
                          : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/40 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 border-gray-100 dark:border-gray-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }
                      `}
                      onClick={() => toggleExpand(r.project_id)}
                      aria-expanded={isExpanded}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ 
                        scale: 1.001, 
                        y: -1,
                        transition: { duration: 0.15, ease: "easeOut" }
                      }}
                      whileTap={{ 
                        scale: 0.999,
                        transition: { duration: 0.1 }
                      }}
                    >
                      <td className="p-2 md:p-4 text-center">
                        <div className="flex justify-center">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(r.project_id);
                            }}
                            className={`
                              w-4 h-4 md:w-5 md:h-5 rounded cursor-pointer border-2 flex items-center justify-center transition-all duration-200
                              ${selected.has(r.project_id)
                                ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/25' 
                                : 'bg-slate-800/50 border-slate-500/50 hover:border-slate-400/70'
                              }
                            `}
                            aria-label={`Select ${r.title}`}
                          >
                            {selected.has(r.project_id) && (
                              <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white stroke-[3]" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Client Name */}
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="grid h-8 w-8 md:h-10 md:w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-800/50 dark:to-indigo-800/50 shadow dark:shadow-gray-800/25 border dark:border-blue-700/30">
                            <User className="h-4 w-4 md:h-5 md:w-5 text-sky-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="truncate font-semibold text-gray-800 dark:text-gray-100 text-xs md:text-sm"
                              title={r.client_name?.endsWith('...') ? `Full name: ${r.client_name.replace('...', '')}` : r.client_name ?? r.client_id ?? "-"}
                            >
                              {r.client_name ?? r.client_id ?? "-"}
                            </div>
                            {r.client_name && r.client_id && (
                              <div className="truncate text-xs text-gray-500 dark:text-gray-400 hidden md:block">ID: {r.client_id}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project Title */}
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <div className="font-medium text-gray-700 dark:text-gray-200 text-xs md:text-sm truncate">
                          {r.title ?? "-"}
                        </div>
                      </td>

                      {/* Artist Name */}
                      <td className="px-3 md:px-6 py-2 md:py-4 text-gray-700 dark:text-gray-200 text-xs md:text-sm truncate">{r.artist_name ?? "-"}</td>

                      {/* Genre */}
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                          {r.genre ?? "-"}
                        </span>
                      </td>

                      {/* Assignments (hidden for client) */}
                      {!isClient && (
                        <td className="px-3 md:px-6 py-2 md:py-4">
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {r.composer_id && <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-800/60 dark:to-green-800/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/50">Composer</span>}
                            {r.producer_id && <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-800/60 dark:to-indigo-800/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50">Producer</span>}
                            {r.anr_id && <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-800/60 dark:to-yellow-800/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50">A&R</span>}
                            {r.engineer_id && <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-800/60 dark:to-violet-800/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700/50">Engineer</span>}
                            {!r.composer_id && !r.producer_id && !r.anr_id && !r.engineer_id && <span className="text-gray-500 dark:text-gray-400">-</span>}
                          </div>
                        </td>
                      )}

                      {/* Progress */}
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <div className="flex items-center gap-1 md:gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(0, Math.min(100, r.progress_percent ?? 0))}%` }}
                            />
                          </div>
                          <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-200 min-w-[3ch]">
                            {r.progress_percent ?? 0}%
                          </span>
                        </div>
                      </td>

                      <td className="p-2 md:p-4 text-center">
                        <button
                          className={`h-6 w-6 md:h-8 md:w-8 rounded-full text-neutral-600 dark:text-neutral-200 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-sky-600 dark:text-sky-200 transition-all duration-200 flex items-center justify-center ${isExpanded ? "rotate-180" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(r.project_id);
                          }}
                          aria-label="Toggle details"
                        >
                          <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </td>
                    </motion.tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <motion.tr
                        key={`expanded-${r.project_id}`}
                        className="bg-gradient-to-r from-slate-50/50 to-gray-50/80 dark:from-slate-800/50 dark:to-gray-800/80 border-t border-slate-200 dark:border-slate-700"
                        variants={expandedRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        style={{ overflow: 'hidden' }}
                      >
                        <td colSpan={expandedColSpan} className="p-0" style={{ overflow: 'hidden' }}>
                          <motion.div
                            className="p-3 md:p-6"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 0 }}
                            transition={{
                              duration: isExpanded ? 0.25 : 0,
                              delay: isExpanded ? 0.1 : 0,
                              ease: isExpanded ? "easeOut" : "linear"
                            }}
                          >
                            <div className="space-y-4">
                              {/* Header with Open Project Button */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-200/20 dark:border-blue-700/30">
                                    <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Details</h3>
                                </div>

                                <motion.button
                                  className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen(r.project_id);
                                  }}
                                  whileHover={{ scale: 1.02, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <PlayCircle className="h-4 w-4" />
                                    Open Project
                                  </div>
                                </motion.button>
                              </div>

                              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                                {/* Status & Progress Section */}
                                <div className="xl:col-span-2 space-y-4">
                                  {/* Status & Stage Row */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Status Card */}
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-4 shadow-sm">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10">
                                          {(() => {
                                            const statusData = formatStatus(r.status);
                                            const StatusIcon = statusData.icon;
                                            return <StatusIcon className={`h-4 w-4 text-${statusData.color}-500`} />;
                                          })()}
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Current Status</div>
                                          <div className="mt-1">
                                            {(() => {
                                              const statusData = formatStatus(r.status);
                                              const getStatusBadgeClasses = (color: string) => {
                                                switch (color) {
                                                  case "blue":
                                                    return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/30";
                                                  case "green":
                                                    return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/30";
                                                  case "yellow":
                                                    return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/30";
                                                  case "orange":
                                                    return "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/30";
                                                  case "red":
                                                    return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/30";
                                                  case "gray":
                                                    return "bg-gray-100 dark:bg-gray-900/20 text-black dark:text-gray-700 border-gray-200 dark:border-gray-700/30";
                                                  case "gray-900":
                                                    return "bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 border-gray-700 dark:border-gray-600";
                                                  case "purple":
                                                  default:
                                                    return "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/30";
                                                }
                                              };
                                              return (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(statusData.color)}`}>
                                                  {statusData.text}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Stage Card */}
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-4 shadow-sm">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                                          {(() => {
                                            const stageData = formatStage(r.stage);
                                            const StageIcon = stageData.icon;
                                            return <StageIcon className={`h-4 w-4 text-${stageData.color}-500`} />;
                                          })()}
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Production Stage</div>
                                          <div className="mt-1">
                                            {(() => {
                                              const stageData = formatStage(r.stage);
                                              const getStageBadgeClasses = (color: string) => {
                                                switch (color) {
                                                  case "blue":
                                                    return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/30";
                                                  case "green":
                                                    return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/30";
                                                  case "purple":
                                                    return "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/30";
                                                  case "indigo":
                                                    return "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/30";
                                                  case "violet":
                                                    return "bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/30";
                                                  case "yellow":
                                                    return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/30";
                                                  case "emerald":
                                                    return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/30";
                                                  case "gray-900":
                                                    return "bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 border-gray-700 dark:border-gray-600";
                                                  case "slate":
                                                  default:
                                                    return "bg-slate-100 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/30";
                                                }
                                              };
                                              return (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageBadgeClasses(stageData.color)}`}>
                                                  {stageData.text}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress Card */}
                                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">Project Progress</span>
                                          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {r.progress_percent || 0}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                      <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 rounded-full shadow-inner"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, Math.min(100, r.progress_percent ?? 0))}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                      />
                                    </div>
                                  </div>

                                  {/* Project Info Card */}
                                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                        <Music className="h-4 w-4 text-purple-500" />
                                      </div>
                                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Project Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="flex flex-col sm:flex-row sm:justify-between">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Artist</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 sm:mt-0">
                                          {r.artist_name || "Unknown"}
                                        </span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:justify-between">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Genre</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 sm:mt-0">
                                          {r.genre || "Unspecified"}
                                        </span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:col-span-2">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Last Updated</span>
                                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                          <Calendar className="h-3 w-3 text-slate-500" />
                                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {new Date(r.updated_at).toLocaleDateString("en-US", {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Team Assignments Sidebar */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-5 shadow-sm">
                                  <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Team</h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Project Assignments</p>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    {[
                                      { role: "Composer", id: r.composer_id, name: r.composer_name, color: "emerald", icon: Music },
                                      { role: "Producer", id: r.producer_id, name: r.producer_name, color: "blue", icon: PlayCircle },
                                      { role: "A&R", id: r.anr_id, name: r.anr_name, color: "amber", icon: Award },
                                      { role: "Engineer", id: r.engineer_id, name: r.engineer_name, color: "purple", icon: Settings },
                                      { role: "Publisher", id: r.publisher_id, name: r.publisher_name, color: "indigo", icon: Briefcase }
                                    ].map((member) => {
                                      const MemberIcon = member.icon;
                                      return (
                                        <motion.div
                                          key={member.role}
                                          className="group"
                                          whileHover={{ x: 2 }}
                                          transition={{ type: "spring", stiffness: 300 }}
                                        >
                                          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                              <div className={`p-2 rounded-lg bg-${member.color}-100 dark:bg-${member.color}-900/20 flex-shrink-0`}>
                                                <MemberIcon className={`h-4 w-4 text-${member.color}-600 dark:text-${member.color}-400`} />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-100 truncate">
                                                  {member.role}
                                                </div>
                                                {member.id ? (
                                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {member.name || `User ${member.id}`}
                                                  </div>
                                                ) : (
                                                  <div className="text-xs text-slate-400 dark:text-slate-500">
                                                    Not assigned
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                              {member.id ? (
                                                <motion.div
                                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${member.color}-100 dark:bg-${member.color}-900/20 border border-${member.color}-200 dark:border-${member.color}-700/30`}
                                                  whileHover={{ scale: 1.05 }}
                                                >
                                                  <CheckCircle className={`h-3 w-3 text-${member.color}-600 dark:text-${member.color}-400`} />
                                                  <span className={`text-xs font-bold text-${member.color}-700 dark:text-${member.color}-300`}>
                                                    Assigned
                                                  </span>
                                                </motion.div>
                                              ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                  <AlertCircle className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    Pending
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>

                                  {/* Team Stats */}
                                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-500 dark:text-slate-400 font-medium">Team Complete</span>
                                      <div className="flex items-center gap-2">
                                        {(() => {
                                          const assigned = [r.composer_id, r.producer_id, r.anr_id, r.engineer_id, r.publisher_id].filter(Boolean).length;
                                          const total = 5;
                                          const percentage = Math.round((assigned / total) * 100);
                                          return (
                                            <>
                                              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                <motion.div
                                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                                  initial={{ width: 0 }}
                                                  animate={{ width: `${percentage}%` }}
                                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                                />
                                              </div>
                                              <span className="font-bold text-slate-700 dark:text-slate-100 min-w-[3ch]">
                                                {percentage}%
                                              </span>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Pagination */}
      <motion.nav
        className="flex w-full items-center justify-center py-4 md:py-6"
        aria-label="Pagination"
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center gap-1 md:gap-2 rounded-xl md:rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/90 px-1 md:px-2 py-1 md:py-2 shadow-lg dark:shadow-slate-900/25"
          whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.button
            onClick={prev}
            disabled={isPrevDisabled}
            className={`inline-flex items-center gap-1 md:gap-2 rounded-lg md:rounded-xl border border-transparent px-2 md:px-4 py-2 text-xs md:text-sm font-medium ${
              isPrevDisabled
                ? "cursor-not-allowed text-gray-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-sky-600 dark:text-sky-200"
            }`}
            whileHover={!isPrevDisabled ? { scale: 1.05, x: -2 } : {}}
            whileTap={!isPrevDisabled ? { scale: 0.95 } : {}}
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden font-medium sm:inline">Previous</span>
          </motion.button>

          <motion.span
            className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-700 dark:text-gray-200 font-medium bg-gray-50 dark:bg-gray-800 rounded-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <span className="hidden sm:inline">Page </span>
            <span className="tabular-nums font-bold text-sky-600 dark:text-sky-200">{currentPage}</span>
            <span className="hidden sm:inline"> of </span>
            <span className="sm:hidden">/</span>
            <span className="tabular-nums font-bold text-sky-600 dark:text-sky-200">{Math.max(1, Math.ceil(totalCount / pageSize))}</span>
          </motion.span>

          <motion.button
            onClick={next}
            disabled={isNextDisabled}
            className={`inline-flex items-center gap-1 md:gap-2 rounded-lg md:rounded-2xl border border-transparent px-2 md:px-4 py-2 text-xs md:text-sm font-medium ${
              isNextDisabled
                ? "cursor-not-allowed text-gray-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-sky-600 dark:text-sky-200"
            }`}
            whileHover={!isNextDisabled ? { scale: 1.05, x: 2 } : {}}
            whileTap={!isNextDisabled ? { scale: 0.95 } : {}}
          >
            <span className="hidden font-medium sm:inline">Next</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </motion.button>
        </motion.div>
      </motion.nav>
      <CreateProjectPopover
        open={openRequest}
        onClose={() => setOpenRequest(false)}
        anchorRef={requestBtnRef as unknown as React.RefObject<HTMLElement>} // nempel ke tombol
        width={520}
      />
    </motion.div>
  );
}
