// src/app/admin/projects/[id]/components/ProjectControlsSection.tsx
"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import type { ProjectSummary, TabKey } from "../types";
import { hasAccess, UserAccess, ACCESS_RULES } from "./access-control";
import type { UserRole } from "@/lib/roles";
import { getEffectiveRole } from "@/lib/roles/effective";

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  color: string;              
  accessRule: readonly string[];
}

interface ProjectControlsSectionProps {
  project: ProjectSummary;
  userAccess: UserAccess | null;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  children: React.ReactNode;
}

const TABS: Tab[] = [
  { key: "overview",   label: "Overview & Details",        icon: "📊", color: "from-blue-500 to-indigo-600",  accessRule: ACCESS_RULES.OVERVIEW_DETAILS },
  { key: "references", label: "References",                icon: "🔗", color: "from-green-500 to-emerald-600", accessRule: ACCESS_RULES.REFERENCES },
  { key: "discussion", label: "Discussion",                icon: "💬", color: "from-orange-500 to-red-600",    accessRule: ACCESS_RULES.DISCUSSION },
  { key: "meetings",   label: "Meetings",                  icon: "📅", color: "from-teal-500 to-cyan-600",     accessRule: ACCESS_RULES.MEETINGS },
  { key: "drafts",     label: "Drafts",                    icon: "🎵", color: "from-purple-500 to-pink-600",   accessRule: ACCESS_RULES.DRAFTS },
  { key: "publishing", label: "Publishing & Distribution", icon: "📚", color: "from-indigo-500 to-purple-600", accessRule: ACCESS_RULES.PUBLISHING_DISTRIBUTION },
];

const tabVariants: Variants = {
  inactive: { scale: 1, backgroundColor: "transparent" },
  active:   { scale: 1.05, backgroundColor: "rgba(59,130,246,0.1)" },
};

export default function ProjectControlsSection({
  project,
  userAccess,
  activeTab,
  setActiveTab,
  children,
}: ProjectControlsSectionProps) {
  const [roleStatus, setRoleStatus] = useState<UserRole>("guest");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const role = await getEffectiveRole();
        if (mounted) setRoleStatus(role);
      } catch {
        if (mounted) setRoleStatus("guest");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);
  const tabBtnRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    overview: null,
    references: null,
    discussion: null,
    meetings: null,
    drafts: null,
    publishing: null,
  });

  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;

    const el = contentRef.current;
    if (!el) return;

    const HEADER_OFFSET = 16;
    const rect = el.getBoundingClientRect();
    const targetTop = window.scrollY + rect.top - HEADER_OFFSET;

    window.scrollTo({ top: targetTop, behavior: "smooth" });

    const btn = tabBtnRefs.current[activeTab];
    btn?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  const availableTabs = useMemo(() => {
    if (!userAccess) return [];
    const isClient = userAccess.main_role === "client";
    return isClient ? TABS : TABS.filter((tab) => hasAccess(userAccess, tab.accessRule));
  }, [userAccess]);

  if (availableTabs.length === 0) return null;

  const validActiveTab =
    availableTabs.find((t) => t.key === activeTab)?.key ?? availableTabs[0].key;

  if (validActiveTab !== activeTab) {
    setActiveTab(validActiveTab);
  }

  const onTabClick = (key: TabKey) => {
    if (key === activeTab) return;
    shouldScrollRef.current = true;

    try {
      window.dispatchEvent(new CustomEvent("project:tab_click", {
        detail: { tab: key, role: roleStatus },
      }));
    } catch { }

    setActiveTab(key);
  };

  const content =
    React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          roleStatus,
          "data-role": roleStatus,
        })
      : children;

  return (
    <motion.div
      className="relative backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-t-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-20 bg-gradient-to-r from-white/90 dark:from-slate-900/90 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-20 bg-gradient-to-l from-white/90 dark:from-slate-900/90 to-transparent" />
        <motion.div
          className="flex flex-row items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide px-4 md:px-8"
          whileHover={{ scale: 1.01 }}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
            {availableTabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  ref={(el) => { tabBtnRefs.current[tab.key] = el; }}
                  onClick={() => onTabClick(tab.key)}
                  data-role={roleStatus}
                  title={`role: ${roleStatus}`}
                  className={`relative px-6 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 min-w-fit whitespace-nowrap ${
                    isActive
                      ? `text-white bg-gradient-to-r ${tab.color} shadow-2xl scale-105 floating-element`
                      : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-700/70 backdrop-blur-sm"
                  }`}
                  variants={tabVariants}
                  initial="inactive"
                  animate={isActive ? "active" : "inactive"}
                  whileHover={{
                    scale: isActive ? 1.08 : 1.05,
                    y: -2,
                    boxShadow: isActive
                      ? "0 20px 25px -5px rgba(59,130,246,0.5)"
                      : "0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ zIndex: 30 }}
                >
                  <motion.span
                    className="relative z-10 flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <motion.span
                      animate={isActive ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {tab.icon}
                    </motion.span>
                    {tab.label}
                  </motion.span>

                  {isActive && (
                    <>
                      <motion.div
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/90 rounded-full shadow-lg"
                        layoutId="activeTabIndicator"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-2xl opacity-30"
                        style={{
                          background: `linear-gradient(45deg, ${
                            tab.color.includes("blue")
                              ? "#3B82F6"
                              : tab.color.includes("purple")
                              ? "#A855F7"
                              : tab.color.includes("green")
                              ? "#10B981"
                              : tab.color.includes("orange")
                              ? "#F97316"
                              : tab.color.includes("teal")
                              ? "#14B8A6"
                              : "#6366F1"
                          }, transparent)`,
                        }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.5 }}
                      />
                    </>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

      <motion.div
        ref={contentRef}
        className="mt-6 min-h-[400px] bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 border border-slate-200/40 dark:border-slate-700/40"
        data-role={roleStatus}
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}
