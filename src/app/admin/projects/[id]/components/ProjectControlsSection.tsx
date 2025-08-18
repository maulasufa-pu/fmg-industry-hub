// src/app/admin/projects/[id]/components/ProjectControlsSection.tsx
"use client";

import { motion, Variants } from "framer-motion";
import { useState, useMemo } from "react";
import type { ProjectSummary, TabKey } from "../types";
import { hasAccess, UserAccess, ACCESS_RULES } from "./access-control";

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
  { key: "overview", label: "Overview & Details", icon: "📊", color: "from-blue-500 to-indigo-600", accessRule: ACCESS_RULES.OVERVIEW_DETAILS },
  { key: "references", label: "References", icon: "🔗", color: "from-green-500 to-emerald-600", accessRule: ACCESS_RULES.REFERENCES },
  { key: "discussion", label: "Discussion", icon: "💬", color: "from-orange-500 to-red-600", accessRule: ACCESS_RULES.DISCUSSION },
  { key: "meetings", label: "Meetings", icon: "📅", color: "from-teal-500 to-cyan-600", accessRule: ACCESS_RULES.MEETINGS },
  { key: "drafts", label: "Drafts", icon: "🎵", color: "from-purple-500 to-pink-600", accessRule: ACCESS_RULES.DRAFTS },
  { key: "publishing", label: "Publishing & Distribution", icon: "📚", color: "from-indigo-500 to-purple-600", accessRule: ACCESS_RULES.PUBLISHING_DISTRIBUTION },
];

const tabVariants: Variants = {
  inactive: {
    scale: 1,
    backgroundColor: "transparent",
  },
  active: {
    scale: 1.05,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
};

export default function ProjectControlsSection({
  project,
  userAccess,
  activeTab,
  setActiveTab,
  children,
}: ProjectControlsSectionProps) {
  // Filter tabs based on user access
  const availableTabs = useMemo(() => {
    return TABS.filter((tab) => hasAccess(userAccess, tab.accessRule));
  }, [userAccess]);

  // If user has no access to any tabs, return null
  if (availableTabs.length === 0) {
    return null;
  }

  // Ensure active tab is available to user
  const validActiveTab = availableTabs.find(tab => tab.key === activeTab) ? activeTab : availableTabs[0].key;
  
  // Update active tab if it's not valid
  if (validActiveTab !== activeTab) {
    setActiveTab(validActiveTab);
  }

  return (
    <motion.div 
      className="relative" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.4 }}
    >
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-t-2xl border border-white/30 dark:border-slate-700/30 shadow-xl p-4">
        {/* Enhanced Tab Navigation */}
        <div className="relative">
          {/* Left fade overlay */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-20 bg-gradient-to-r from-white/80 dark:from-slate-900/80 to-transparent" />
          {/* Right fade overlay */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-20 bg-gradient-to-l from-white/80 dark:from-slate-900/80 to-transparent" />
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
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-6 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 min-w-fit whitespace-nowrap ${
                    isActive
                      ? `text-white bg-gradient-to-r ${tab.color} shadow-2xl scale-105 floating-element`
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-700/50 backdrop-blur-sm"
                  }`}
                  variants={tabVariants}
                  initial="inactive"
                  animate={isActive ? "active" : "inactive"}
                  whileHover={{
                    scale: isActive ? 1.08 : 1.05,
                    y: -2,
                    boxShadow: isActive ? "0 20px 25px -5px rgba(59, 130, 246, 0.4)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ zIndex: 30 }}
                >
                {/* Background glow effect for active tab */}
                {isActive && (
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
                )}

                <motion.span 
                  className="relative z-10 flex items-center gap-2" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <motion.span
                    animate={
                      isActive
                        ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                  >
                    {tab.icon}
                  </motion.span>
                  {tab.label}
                </motion.span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/80 rounded-full"
                    layoutId="activeTabIndicator"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Morphing background for hover effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0"
                  style={{
                    background: `linear-gradient(135deg, ${tab.color.split(" ")[1]}, ${tab.color.split(" ")[3]})`,
                  }}
                  whileHover={{ opacity: isActive ? 0 : 0.1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            );
          })}
          </motion.div>
        </div>

        {/* Tab content area with smooth transitions */}
        <motion.div
          className="mt-6 min-h-[400px]"
          key={activeTab}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Add a gradient border effect */}
          <div className="relative rounded-2xl bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 p-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
