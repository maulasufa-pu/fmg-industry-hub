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
  onRemove: (role: StaffRole) => Promise<void>;
  disabled?: boolean; 
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
      className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-slate-800/25 ${
        gradient
          ? "bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/90 dark:from-slate-900/95 dark:via-blue-900/30 dark:to-purple-900/30"
          : "bg-white/95 dark:bg-slate-900/95"
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 bg-gradient-to-r from-slate-800 to-blue-600 dark:from-slate-100 dark:to-blue-400 bg-clip-text text-transparent">
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
  role,
  onRemove,
  disabled = false, 
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
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
        <span className="inline-block px-2 py-1 rounded-lg bg-gradient-to-r from-blue-100/90 to-purple-100/90 dark:from-blue-900/40 dark:to-purple-900/40 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm">
          {label}
        </span>
        {disabled && (
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            Assigned — remove to change
          </span>
        )}
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
        disabled={disabled} 
        className={
          "w-full rounded-xl border px-4 py-3 text-sm font-medium transition-all shadow-sm text-slate-900 dark:text-slate-100 " +
          "border-blue-200 dark:border-blue-600 bg-white/90 dark:bg-slate-800/90 " +
          (disabled ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60" : "")
        }
        placeholder={
          disabled
            ? "Already assigned. Click Remove above to change"
            : `Search ${label.replace(/[🎭🎵🎧🔊📘]/g, "").trim()}...`
        }
        whileFocus={disabled ? undefined : { scale: 1.02 }}
      />

      {!disabled && open && filtered.length > 0 && (
        <motion.ul
          className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-lg border border-blue-200 dark:border-blue-600 bg-white/95 dark:bg-slate-800/95 shadow-xl backdrop-blur-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {filtered.map((option) => (
            <motion.li
              key={option.id}
              className="cursor-pointer px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(option)}
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
            >
              <span className="font-medium text-slate-700 dark:text-slate-200">
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
        <motion.div
          className="mb-6 p-4 bg-gradient-to-br from-blue-50/90 to-purple-50/90 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-600/60 shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
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
                    ? "bg-white/95 dark:bg-slate-900/90 border-blue-200 dark:border-blue-600"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={assignment.value ? { scale: 1.03 } : {}}
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                    <span className="inline-block px-2 py-1 rounded-lg bg-gradient-to-r from-blue-100/90 to-purple-100/90 dark:from-blue-900/40 dark:to-purple-900/40 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm">
                      {assignment.label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {assignment.value ? assignment.value : <span className="text-slate-400 dark:text-slate-500 italic">Not assigned</span>}
                  </div>
                </div>
                {assignment.value && (
                  <motion.button
                    onClick={() => onRemoveAssignment(assignment.role as StaffRole)}
                    className="ml-3 px-3 py-1 bg-gradient-to-r from-red-100/90 to-pink-100/90 dark:from-red-900/40 dark:to-pink-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200/80 dark:hover:bg-red-900/60 transition-colors shadow-sm"
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

        <motion.div className="grid grid-cols-2 gap-4 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="col-span-2 mb-2">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">✏️ Assign New Team Members</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search and assign team members to this project</p>
          </div>

          <TeamAssignmentField label="🎭 A&R" value={anrName} setValue={setAnrName} options={getAvailableTeamOptions("anr")} getFullName={getFullName} index={0} role="anr" onRemove={onRemoveAssignment} disabled={Boolean(currentAssignments.anr)}/>
          <TeamAssignmentField label="🎵 Composer" value={composerName} setValue={setComposerName} options={getAvailableTeamOptions("composer")} getFullName={getFullName} index={1} role="composer" onRemove={onRemoveAssignment} disabled={Boolean(currentAssignments.composer)}/>
          <TeamAssignmentField label="🎧 Producer" value={producerName} setValue={setProducerName} options={getAvailableTeamOptions("producer")} getFullName={getFullName} index={2} role="producer" onRemove={onRemoveAssignment} disabled={Boolean(currentAssignments.producer)}/>
          <TeamAssignmentField label="🔊 Audio Engineer" value={engineerName} setValue={setEngineerName} options={getAvailableTeamOptions("engineer")} getFullName={getFullName} index={3} role="engineer" onRemove={onRemoveAssignment} disabled={Boolean(currentAssignments.engineer)}/>
          <TeamAssignmentField label="📘 Publisher" value={publisherName} setValue={setPublisherName} options={getAvailableTeamOptions("publisher")} getFullName={getFullName} index={4} role="publisher" onRemove={onRemoveAssignment} disabled={Boolean(currentAssignments.publisher)}/>
        </motion.div>

        <motion.div className="mt-6 flex justify-end" initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <motion.button
            onClick={handleSaveAssignments}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 px-6 py-3 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200"
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
