// src/app/admin/projects/[id]/components/tabs/ReferencesTab.tsx
"use client";

import { motion } from "framer-motion";
import type { ReferenceLinkRow, ProjectSummary } from "../../types";

interface ReferencesTabProps {
  project: ProjectSummary;
  links: ReferenceLinkRow[] | null;
  setLinks: React.Dispatch<React.SetStateAction<ReferenceLinkRow[] | null>>;
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

function DeleteReferenceButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  return (
    <motion.button
      onClick={onDeleted}
      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      🗑️ Delete
    </motion.button>
  );
}

export default function ReferencesTab({ 
  project,
  links, 
  setLinks 
}: ReferencesTabProps) {
  const handleDeleteReference = (id: string) => {
    setLinks(prev => prev ? prev.filter(link => link.id !== id) : prev);
  };
  return (
    <motion.div 
      className="grid grid-cols-1 gap-6 lg:grid-cols-2" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <AnimatedCard title="🔗 References Feed" gradient>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
        >
          {links === null ? (
            <motion.div 
              className="text-sm text-gray-500 dark:text-gray-400" 
              animate={{ opacity: [0.5, 1, 0.5] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Loading…
            </motion.div>
          ) : links.length === 0 ? (
            <motion.div 
              className="text-sm text-gray-500 dark:text-gray-400 text-center py-8" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.3 }}
            >
              🔗 Belum ada link.
            </motion.div>
          ) : (
            <motion.ul className="space-y-3 text-sm">
              {links.map((l, index) => (
                <motion.li
                  key={l.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 shadow"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                      {l.created_at ? new Date(l.created_at).toLocaleString("id-ID") : ""}
                    </span>
                    <DeleteReferenceButton 
                      id={l.id} 
                      onDeleted={() => handleDeleteReference(l.id)} 
                    />
                  </div>
                  <motion.a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-600 hover:text-purple-600 dark:text-blue-400 dark:hover:text-purple-400 font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg block transition-all"
                    whileHover={{ scale: 1.01, y: -2 }}
                  >
                    🌐 {l.url}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </AnimatedCard>

      <AnimatedCard title="➕ Add Reference (Admin)" gradient>
        <motion.div
          className="text-sm text-gray-600 dark:text-gray-300 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          📎 Reference adder component would go here. Users can add reference links for inspiration or project requirements.
        </motion.div>
      </AnimatedCard>
    </motion.div>
  );
}
