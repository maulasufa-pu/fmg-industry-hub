// src/app/admin/projects/[id]/components/tabs/DiscussionTab.tsx
"use client";

import { motion } from "framer-motion";
import type { DiscussionMessage, ProjectSummary } from "../../types";

interface DiscussionTabProps {
  project: ProjectSummary;
  messages: DiscussionMessage[] | null;
  setMessages: React.Dispatch<React.SetStateAction<DiscussionMessage[] | null>>;
}

const AnimatedCard = ({ 
  title, 
  children, 
  className = "", 
  gradient = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string; 
  gradient?: boolean; 
}) => {
  return (
    <motion.section
      className={`relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-800/25 ${
        gradient
          ? "bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"
          : "bg-white dark:bg-gray-900"
      } ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
    >
      <div className="relative z-10 p-8">
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
};

function DeleteMessageButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  return (
    <motion.button
      onClick={onDeleted}
      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      🗑️ Delete
    </motion.button>
  );
}

export default function DiscussionTab({ 
  project,
  messages, 
  setMessages 
}: DiscussionTabProps) {
  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev ? prev.filter(msg => msg.id !== id) : prev);
  };
  return (
    <AnimatedCard title="💬 Discussion (Admin moderation)" gradient>
      <motion.div 
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {messages === null ? (
          <motion.div 
            className="text-sm text-gray-500 dark:text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Loading…
          </motion.div>
        ) : messages.length === 0 ? (
          <motion.div 
            className="text-sm text-gray-500 dark:text-gray-400 text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            💬 Belum ada pesan.
          </motion.div>
        ) : (
          <motion.ul className="space-y-3">
            {messages.map((m, index) => (
              <motion.li 
                key={m.id} 
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 shadow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <motion.span 
                    className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg font-medium text-green-700 dark:text-green-400"
                    whileHover={{ scale: 1.1 }}
                  >
                    👤 {m.author_id ?? "Anon"}
                  </motion.span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(m.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700/50">
                  {m.content}
                </div>
                <div className="mt-3 flex gap-2">
                  <DeleteMessageButton
                    id={m.id}
                    onDeleted={() => handleDeleteMessage(m.id)}
                  />
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </AnimatedCard>
  );
}
