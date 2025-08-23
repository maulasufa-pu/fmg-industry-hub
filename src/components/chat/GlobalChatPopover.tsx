// src/components/chat/GlobalChatPopover.tsx

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, MessageCircle } from "lucide-react";
import { chatBus, type ChatTopic, minimizeChat, closeChat } from "@/lib/chatBus";
import ProjectDiscussionAdapter from "@/components/chat/ProjectDiscussionAdapter";
import type { ProjectSummary } from "@/app/ui/panel/projects/types";

function isProjectSummary(x: unknown): x is ProjectSummary {
  if (!x || typeof x !== "object") return false;
  const rec = x as Record<string, unknown>;
  return typeof rec["project_id"] === "string";
}

export type GlobalChatPopoverProps = {
  /**
   * Optional: custom renderer kalau mau override default.
   * Kalau tidak diberikan, akan render ProjectDiscussionAdapter bila topic.project ada.
   */
  renderContent?: (topic: ChatTopic) => React.ReactNode;
  persistKey?: string; // default "global-chat"
};

export default function GlobalChatPopover({ renderContent, persistKey = "global-chat" }: GlobalChatPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(true);
  const [topic, setTopic] = React.useState<ChatTopic | null>(null);

  // Sync dari bus
  React.useEffect(() => chatBus.subscribe((s) => { setIsOpen(s.isOpen); setIsMinimized(s.isMinimized); setTopic(s.topic); }), []);

  // Persist minimized per topic
  React.useEffect(() => {
    if (!topic) return;
    const key = `${persistKey}:${topic.id}:min`;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (stored === "0" || stored === "1") setIsMinimized(stored === "1");
  }, [topic, persistKey]);

  React.useEffect(() => {
    if (!topic) return;
    const key = `${persistKey}:${topic.id}:min`;
    if (typeof window !== "undefined") window.localStorage.setItem(key, isMinimized ? "1" : "0");
  }, [isMinimized, topic, persistKey]);

  const headerTitle = topic?.title ?? "Discussion";
  const headerSubtitle = topic?.subtitle ?? undefined;

  const defaultRender = React.useCallback((t: ChatTopic) => {
    const proj = isProjectSummary(t.project) ? t.project : null;
    if (!proj) {
      return (
        <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 p-6">
          No project bound to chat. Pass <code>project</code> when calling <code>openChat()</code>.
        </div>
      );
    }
    return <ProjectDiscussionAdapter project={proj} />;
  }, []);

  const content = topic ? (renderContent ? renderContent(topic) : defaultRender(topic)) : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* FAB (muncul saat minimized/closed) */}
      <AnimatePresence>
        {(!isOpen || isMinimized) && (
          <motion.button
            key="chat-fab"
            aria-label="Open chat"
            onClick={() => minimizeChat(false)}
            className="pointer-events-auto fixed right-3 bottom-3 sm:right-4 sm:bottom-4 rounded-full shadow-lg border border-black/5 dark:border-white/10 bg-blue-600 text-white p-3 sm:p-4"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            whileTap={{ scale: 0.96 }}
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel popover */}
      <AnimatePresence>
        {isOpen && !isMinimized && topic && (
          <motion.aside
            key="chat-popover"
            className="pointer-events-auto fixed right-2 bottom-2 sm:right-4 sm:bottom-5"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div
              className="
                w-[min(92vw,420px)] sm:w-[420px]
                h-[min(70dvh,560px)] sm:h-[560px]
                md:w-[480px] md:h-[600px]
                bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80
                border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{headerTitle}</div>
                  {headerSubtitle && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{headerSubtitle}</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Minimize"
                    onClick={() => minimizeChat(true)}
                    className="rounded-lg px-2 py-1.5 text-xs bg-gray-200/70 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Close"
                    onClick={() => closeChat()}
                    className="rounded-lg px-2 py-1.5 text-xs bg-gray-200/70 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body (fill) */}
              <div className="flex-1 min-h-0">{content}</div>

              {/* Grip untuk HP */}
              <div className="sm:hidden px-6 pb-[env(safe-area-inset-bottom)] pt-2">
                <div className="mx-auto h-1 w-10 rounded-full bg-gray-300/70 dark:bg-gray-700/70" />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}