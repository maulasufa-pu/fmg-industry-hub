"use client";

import { motion } from "framer-motion";
import { useState, useCallback, useMemo, useRef } from "react";
import type { ProjectSummary, StaffRole, TeamMember } from "../types";

type TeamRoleOptions = {
  anr: TeamMember[];
  composer: TeamMember[];
  producer: TeamMember[];
  engineer: TeamMember[];
  publisher: TeamMember[];
};

interface CurrentAssignments {
  anr: string;
  composer: string;
  producer: string;
  engineer: string;
  publisher: string;
}

interface TeamAssignmentSectionProps {
  project: ProjectSummary;
  currentAssignments: CurrentAssignments;
  teamRoleOptions: TeamRoleOptions;
  /** 🔄 sekarang menerima draft input agar page.tsx bisa jalankan algoritma */
  onSaveAssignments: (draft: CurrentAssignments) => Promise<void>;
  onRemoveAssignment: (role: StaffRole) => Promise<void>;
}

interface TeamAssignmentFieldProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: TeamMember[];
  getFullName: (member: TeamMember) => string;
  index: number;
  role: StaffRole;
}

const AnimatedCard = ({
  title,
  children,
  className = "",
  gradient = false,
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
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
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

function TeamAssignmentField({
  label,
  value,
  setValue,
  options,
  getFullName,
  index,
}: TeamAssignmentFieldProps) {
  const [open, setOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 8);
    return options
      .filter((opt) => getFullName(opt).toLowerCase().includes(q) || (opt.email ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, value, getFullName]);

  const handleSelect = (member: TeamMember) => {
    setValue(getFullName(member));
    setOpen(false);
  };

  return (
    <motion.div
      className="space-y-2 relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
        <span className="inline-block px-2 py-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm">
          {label}
        </span>
      </label>

      <motion.input
        ref={inputRef}
        type="text"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setValue(e.target.value);
          if (!open) setOpen(true);
        }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-xl border border-blue-200 dark:border-blue-700 bg-white/80 dark:bg-gray-800/80 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        placeholder={`Search ${label.replace(/[🎭🎵🎧🔊📘]/g, "").trim()}...`}
        whileFocus={{ scale: 1.02 }}
      />

      {open && filtered.length > 0 && (
        <motion.ul
          className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-lg border border-blue-200 dark:border-blue-700 bg-white/95 dark:bg-gray-800/95 shadow-xl backdrop-blur-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {filtered.map((option) => (
            <motion.li
              key={option.id}
              className="cursor-pointer px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(option)}
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
            >
              <span className="inline-block w-7 h-7 rounded-full bg-gradient-to-br from-blue-300 to-purple-300 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-xs font-bold text-white mr-2 shadow-md">
                {(option.first_name?.charAt(0) ?? "").toUpperCase()}
                {(option.last_name?.charAt(0) ?? "").toUpperCase()}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {getFullName(option)}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}

export default function TeamAssignmentSection({
  project,
  currentAssignments,
  teamRoleOptions,
  onSaveAssignments,
  onRemoveAssignment,
}: TeamAssignmentSectionProps) {
  const [anrName, setAnrName] = useState<string>("");
  const [composerName, setComposerName] = useState<string>("");
  const [producerName, setProducerName] = useState<string>("");
  const [engineerName, setEngineerName] = useState<string>("");
  const [publisherName, setPublisherName] = useState<string>("");

  const getFullName = useCallback((member: TeamMember): string => {
    const firstName = member.first_name?.trim() ?? "";
    const lastName = member.last_name?.trim() ?? "";
    const full = [firstName, lastName].filter(Boolean).join(" ");
    return full || member.email || "Unknown";
  }, []);

  const getAvailableTeamOptions = useCallback(
    (role: keyof TeamRoleOptions): TeamMember[] => {
      const all = teamRoleOptions[role] ?? [];
      // biarkan pilihan penuh (filter & uniq ditangani algoritma saat save)
      return all;
    },
    [teamRoleOptions]
  );

  const handleSaveAssignments = async () => {
    await onSaveAssignments({
      anr: anrName,
      composer: composerName,
      producer: producerName,
      engineer: engineerName,
      publisher: publisherName,
    });
    setAnrName("");
    setComposerName("");
    setProducerName("");
    setEngineerName("");
    setPublisherName("");
  };

  return (
    <motion.div className="grid grid-cols-1 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <AnimatedCard title="👥 Team Assignment" className="w-full" gradient>
        {/* Current Assignments */}
        <motion.div
          className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50 shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            📋 Currently Assigned Team Members
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { role: "anr", label: "🎭 A&R", value: currentAssignments.anr },
              { role: "composer", label: "🎵 Composer", value: currentAssignments.composer },
              { role: "producer", label: "🎧 Producer", value: currentAssignments.producer },
              { role: "engineer", label: "🔊 Audio Engineer", value: currentAssignments.engineer },
              { role: "publisher", label: "📘 Publisher", value: currentAssignments.publisher },
            ].map((assignment, index) => (
              <motion.div
                key={assignment.role}
                className={`p-4 rounded-2xl border shadow-lg flex items-center gap-4 ${
                  assignment.value
                    ? "bg-white/90 dark:bg-gray-900/80 border-blue-200 dark:border-blue-700"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-600"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={assignment.value ? { scale: 1.03 } : {}}
              >
                {/* <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-base font-bold text-white shadow-md">
                  {assignment.value ? assignment.value.split(" ").map((n) => n[0]).join("") : "?"}
                </span> */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                    <span className="inline-block px-2 py-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm">
                      {assignment.label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {assignment.value ? assignment.value : <span className="text-gray-400 italic">Not assigned</span>}
                  </div>
                </div>
                {assignment.value && (
                  <motion.button
                    onClick={() => onRemoveAssignment(assignment.role as StaffRole)}
                    className="ml-3 px-3 py-1 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-sm"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Remove
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Assignment Form */}
        <motion.div className="grid grid-cols-2 gap-4 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="col-span-2 mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">✏️ Assign New Team Members</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Search and assign team members to this project</p>
          </div>

          <TeamAssignmentField label="🎭 A&R" value={anrName} setValue={setAnrName} options={getAvailableTeamOptions("anr")} getFullName={getFullName} index={0} role="anr" />
          <TeamAssignmentField label="🎵 Composer" value={composerName} setValue={setComposerName} options={getAvailableTeamOptions("composer")} getFullName={getFullName} index={1} role="composer" />
          <TeamAssignmentField label="🎧 Producer" value={producerName} setValue={setProducerName} options={getAvailableTeamOptions("producer")} getFullName={getFullName} index={2} role="producer" />
          <TeamAssignmentField label="🔊 Audio Engineer" value={engineerName} setValue={setEngineerName} options={getAvailableTeamOptions("engineer")} getFullName={getFullName} index={3} role="engineer" />
          <TeamAssignmentField label="📘 Publisher" value={publisherName} setValue={setPublisherName} options={getAvailableTeamOptions("publisher")} getFullName={getFullName} index={4} role="publisher" />
        </motion.div>

        <motion.div className="mt-6 flex justify-end" initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <motion.button
            onClick={handleSaveAssignments}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow hover:from-blue-700 hover:to-indigo-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💾 Save Assignments
          </motion.button>
        </motion.div>
      </AnimatedCard>
    </motion.div>
  );
}
