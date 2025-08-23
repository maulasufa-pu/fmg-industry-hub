// =============================================
// 1) lib/chatBus.ts — tiny typed event bus you can call from anywhere
// =============================================

// Place at: src/lib/chatBus.ts

export type ChatTopic = {
  id: string;                 // typically project_id
  title?: string | null;      // project title for header
  subtitle?: string | null;   // optional client / extra context
};

export type ChatBusState = {
  isOpen: boolean;
  isMinimized: boolean;
  topic: ChatTopic | null;
};

export type ChatBusListener = (s: ChatBusState) => void;

class ChatBus {
  private state: ChatBusState = { isOpen: false, isMinimized: true, topic: null };
  private listeners = new Set<ChatBusListener>();

  subscribe(fn: ChatBusListener): () => void {
    this.listeners.add(fn);
    fn(this.state); // emit current state immediately
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  open(topic: ChatTopic, opts?: { focus?: boolean; minimized?: boolean }) {
    const minimized = opts?.minimized ?? false;
    this.state = { isOpen: true, isMinimized: minimized, topic };
    this.emit();
  }

  toggle(topic?: ChatTopic) {
    if (this.state.isOpen) {
      this.state = { ...this.state, isMinimized: !this.state.isMinimized };
    } else {
      this.state = { isOpen: true, isMinimized: false, topic: topic ?? this.state.topic };
    }
    this.emit();
  }

  minimize(val: boolean) {
    if (!this.state.isOpen) return;
    this.state = { ...this.state, isMinimized: val };
    this.emit();
  }

  close() {
    this.state = { isOpen: false, isMinimized: true, topic: null };
    this.emit();
  }
}

export const chatBus = new ChatBus();

// Convenience fns — import from anywhere
export const openChat = (topic: ChatTopic, opts?: { focus?: boolean; minimized?: boolean }) => chatBus.open(topic, opts);
export const toggleChat = (topic?: ChatTopic) => chatBus.toggle(topic);
export const minimizeChat = (val: boolean) => chatBus.minimize(val);
export const closeChat = () => chatBus.close();


// =============================================
// 2) components/chat/GlobalChatPopover.tsx — floating popover (bottom-right)
//    Responsive on mobile (bottom-sheet style), supports minimize
// =============================================

// Place at: src/components/chat/GlobalChatPopover.tsx

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, MessageCircle, Square } from "lucide-react";
import { chatBus, type ChatTopic, minimizeChat, closeChat } from "@/lib/chatBus";

export type GlobalChatPopoverProps = {
  /**
   * Render your actual chat UI.
   * You receive the current topic, must return a React node (e.g., your DiscussionTab adapter).
   */
  renderContent: (topic: ChatTopic) => React.ReactNode;
  /** Keep state in localStorage (per topic.id) so minimize/open survives route change */
  persistKey?: string; // default "global-chat"
};

export default function GlobalChatPopover({ renderContent, persistKey = "global-chat" }: GlobalChatPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(true);
  const [topic, setTopic] = React.useState<ChatTopic | null>(null);

  // Restore minimized per-topic
  React.useEffect(() => {
    const unsub = chatBus.subscribe((s) => {
      setIsOpen(s.isOpen);
      setIsMinimized(s.isMinimized);
      setTopic(s.topic);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (!topic) return;
    const key = `${persistKey}:${topic.id}:min`;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(key);
      if (stored === "0" || stored === "1") setIsMinimized(stored === "1");
    }
  }, [topic, persistKey]);

  React.useEffect(() => {
    if (!topic) return;
    const key = `${persistKey}:${topic.id}:min`;
    if (typeof window !== "undefined") window.localStorage.setItem(key, isMinimized ? "1" : "0");
  }, [isMinimized, topic, persistKey]);

  const headerTitle = topic?.title ?? "Discussion";
  const headerSubtitle = topic?.subtitle ?? undefined;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* Minimized FAB */}
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

      {/* Popover */}
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

              {/* Body */}
              <div className="flex-1 min-h-0">
                {renderContent(topic)}
              </div>

              {/* Edge grip for mobile */}
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


// =============================================
// 3) components/chat/ProjectDiscussionAdapter.tsx — reuse your DiscussionTab in the popover
//    Keeps strict types + own messages state
// =============================================

// Place at: src/components/chat/ProjectDiscussionAdapter.tsx

"use client";

import React from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ProjectSummary } from "@/app/ui/panel/projects/components/types"; // <- adjust if needed
import DiscussionTab from "@/app/ui/panel/projects/components/tabs/DiscussionTab";

export type ProjectDiscussionAdapterProps = {
  project: ProjectSummary;
};

export default function ProjectDiscussionAdapter({ project }: ProjectDiscussionAdapterProps) {
  const _supabase = React.useMemo(() => getSupabaseClient(), []);
  const [messages, setMessages] = React.useState<Parameters<typeof DiscussionTab>[0]["messages"]>(null);

  // Let the DiscussionTab do the heavy lifting (fetch, realtime, etc.).
  // We just hand it a state bucket.
  return (
    <div className="h-full flex flex-col">
      <DiscussionTab project={project} messages={messages} setMessages={setMessages} />
    </div>
  );
}


// =============================================
// 4) App-level mount — put this once in app/layout.tsx (or a root layout)
// =============================================

// Example insertion into: src/app/layout.tsx
// (Keep only one instance globally)

/*
import GlobalChatPopover from "@/components/chat/GlobalChatPopover";
import ProjectDiscussionAdapter from "@/components/chat/ProjectDiscussionAdapter";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const renderContent = React.useCallback((topic: ChatTopic) => {
    // You can map topic.id -> full ProjectSummary here if needed.
    // If you already have the ProjectSummary object when calling openChat, 
    // you can store it in a client-side cache or extend ChatTopic shape.
    // For simplicity, we assume you pass enough fields via topic to build a minimal ProjectSummary.

    // Minimal ProjectSummary shim (adjust fields to your exact ProjectSummary type):
    const project = {
      project_id: topic.id,
      title: topic.title ?? "Untitled",
      status: "Requested",
      stage: "Drafting",
      updated_at: new Date().toISOString(),
      client_id: null,
      artist_name: null,
      genre: null,
      progress_percent: 0,
    } as ProjectSummary;

    return <ProjectDiscussionAdapter project={project} />;
  }, []);

  return (
    <html lang="en">
      <body>
        {children}
        <GlobalChatPopover renderContent={renderContent} />
      </body>
    </html>
  );
}
*/


// =============================================
// 5) Usage — call from anywhere
// =============================================

// Example: in any client component
/*
"use client";
import React from "react";
import { openChat, toggleChat } from "@/lib/chatBus";

export function OpenChatButton({ projectId, title }: { projectId: string; title?: string }) {
  return (
    <button
      onClick={() => openChat({ id: projectId, title }, { minimized: false })}
      className="rounded-xl bg-blue-600 text-white px-4 py-2"
    >
      Open Chat
    </button>
  );
}

export function ToggleChatFab({ projectId, title }: { projectId: string; title?: string }) {
  return (
    <button
      onClick={() => toggleChat({ id: projectId, title })}
      className="fixed right-4 bottom-24 rounded-full shadow-lg bg-indigo-600 text-white p-3"
      aria-label="Toggle Chat"
    >
      Toggle Chat
    </button>
  );
}
*/


// =============================================
// 6) Mobile responsiveness notes
// =============================================
// - On phones, the popover behaves like a compact bottom sheet (70dvh) with full-width up to safe area.
// - The message list inside your existing DiscussionTab already uses responsive widths; 
//   if you want tighter bubbles on small screens, ensure these utilities are present:
//   max-w-[92%] sm:max-w-[85%] md:max-w-[70%]  and  break-words/anywhere.
// - The popover uses pointer-events layering so it never blocks the page when minimized.
// - State is persisted per topic.id, so minimizing survives navigation.
