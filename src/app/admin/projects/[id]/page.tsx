// src/app/admin/projects/[id]/page.tsx
"use client";

import { motion, Variants } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

// Shared types
import type {
  ProjectSummary,
  TabKey,
  TeamMember,
  StaffRole,
  TeamRoleOptions,
  CurrentAssignments
} from "./types";

import HeroSection from "./components/HeroSection";
import TeamAssignmentSection from "./components/TeamAssignmentSection";
import ProjectControlsSection from "./components/ProjectControlsSection";
import { hasAccess, UserAccess, ACCESS_RULES } from "./components/access-control";

import OverviewTab from "./components/tabs/OverviewTab";
import DraftsTab from "./components/tabs/DraftsTab";
import ReferencesTab from "./components/tabs/ReferencesTab";
import DiscussionTab from "./components/tabs/DiscussionTab";
import MeetingsTab from "./components/tabs/MeetingsTab";
import PublishingTab from "./components/tabs/PublishingTab";

const pageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: "easeOut" as const,
      staggerChildren: 0.1 
    }
  }
};

const ROLES = ["anr", "composer", "producer", "engineer", "publisher"] as const;
const orFilter = ROLES.map((r) => `staff_role.cs.{${r}}`).join(",");

type RoleKey = "anr" | "composer" | "producer" | "engineer" | "publisher";
const ASSIGNABLE_ROLES: ReadonlyArray<Exclude<RoleKey, "publisher">> = ["anr", "composer", "producer", "engineer"] as const;

export default function AdminProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Core state
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(true); // ← optional


  // Team assignment state
  const [currentAssignments, setCurrentAssignments] = useState<CurrentAssignments>({
    anr: "",
    composer: "",
    producer: "",
    engineer: "",
    publisher: "",
  });
  const [teamRoleOptions, setTeamRoleOptions] = useState<TeamRoleOptions>({
    anr: [],
    composer: [],
    producer: [],
    engineer: [],
    publisher: [],
  });

  // Tab data state
  const [drafts, setDrafts] = useState<any[] | null>(null);
  const [revisions, setRevisions] = useState<any[] | null>(null);
  const [links, setLinks] = useState<any[] | null>(null);
  const [messages, setMessages] = useState<any[] | null>(null);
  const [meetings, setMeetings] = useState<any[] | null>(null);

  // ====== ALGORTIMA (helpers) ======

  // Load current assignments dari database (shared function)
  const loadCurrentAssignments = useCallback(async () => {
    setAssignmentsLoading(true); // ← optional
    try {
      const response = await fetch(`/api/assignments?project_id=${params.id}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: { success: boolean; assignments?: CurrentAssignments; error?: string } = await response.json();
      if (result.success && result.assignments) {
        setCurrentAssignments(result.assignments);
      } else {
        throw new Error(result.error || "Failed to load assignments");
      }
    } catch (e) {
      console.warn("Load current assignments failed:", e);
      setCurrentAssignments({ anr: "", composer: "", producer: "", engineer: "", publisher: "" });
    } finally {
      setAssignmentsLoading(false); // ← optional
    }
  }, [params.id]);

  useEffect(() => {
    void loadCurrentAssignments();
  }, [loadCurrentAssignments]);


  // Helper untuk mendapatkan nama lengkap
  const getFullName = (member: TeamMember): string => {
    const firstName = member.first_name || "";
    const lastName = member.last_name || "";
    return [firstName, lastName].filter(Boolean).join(" ") || member.email || "Unknown";
  };

  // Helper untuk opsi dropdown per role
  const getTeamOptionsForRole = (role: keyof TeamRoleOptions): TeamMember[] => {
    return teamRoleOptions[role] || [];
  };

  // cari profile.id berdasarkan teks input (nama/email) + role option
  const findProfileIdByDisplay = (display: string, roleKey: keyof TeamRoleOptions): string | null => {
    if (!display?.trim()) return null;
    const list = getTeamOptionsForRole(roleKey);
    const lower = display.trim().toLowerCase();

    const exact = list.find((m) => getFullName(m).toLowerCase() === lower);
    if (exact) return exact.id;

    const byEmail = list.find((m) => (m.email ?? "").toLowerCase() === lower);
    if (byEmail) return byEmail.id;

    const contains = list.filter(
      (m) => getFullName(m).toLowerCase().includes(lower) || (m.email ?? "").toLowerCase().includes(lower)
    );
    if (contains.length === 1) return contains[0].id;

    return null;
  };

  // non-upsert: matikan yang aktif lalu insert baris baru (aman dengan partial unique index)
  const assignOne = async (projectId: string, role: "anr" | "composer" | "producer" | "engineer", userId: string) => {
    const { error: e1 } = await supabase
      .from("assignments")
      .update({ active: false, unassigned_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("role", role)
      .eq("active", true);
    if (e1) throw e1;

    const { error: e2 } = await supabase.from("assignments").insert({
      assignment_id: (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ?? undefined,
      project_id: projectId,
      role,
      user_id: userId,
      assigned_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      assigned_at: new Date().toISOString(),
      active: true,
    });
    if (e2) throw e2;
  };

  // ambil nama tampilan dari profiles.id (tidak dipakai kalau API sudah balikin display)
  const getDisplayNameById = (
    profiles: Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>,
    id: string | null
  ) => {
    if (!id) return "";
    const p = profiles.find((x) => x.id === id);
    if (!p) return "";
    const full = [p.first_name ?? "", p.last_name ?? ""].filter(Boolean).join(" ");
    return full || p.email || "";
  };

  // Improved timeout handler
  const raceWithTimeout = <T,>(promise: PromiseLike<T>, ms = 8000, errorMessage = "Request timed out"): Promise<T> =>
    Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${errorMessage} (${ms}ms)`)), ms)),
    ]);

  // ====== LOAD ALL DATA ======
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("main_role, staff_role")
          .eq("id", user.id)
          .single();

        if (!profile || !mounted) { setLoading(false); return; }

        const access: UserAccess = {
          main_role: profile.main_role,
          staff_role: profile.staff_role || [],
        };
        setUserAccess(access);

        const { data: projectData } = await supabase
          .from("project_summary")
          .select("*")
          .eq("project_id", params.id)
          .single();

        if (projectData && mounted) setProject(projectData);

        type StaffListRow = {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          main_role: string | null;
          staff_role: string[];         // enum[] di-serialize sebagai string[]
          full_name: string | null;
          is_anr: boolean;
          is_composer: boolean;
          is_producer: boolean;
          is_engineer: boolean;
          is_publisher: boolean;
        };

        const { data: staff, error: staffErr } = await raceWithTimeout(
          supabase
            .from("staff_list")
            .select("id, first_name, last_name, email, main_role, staff_role, full_name, is_anr, is_composer, is_producer, is_engineer, is_publisher"),
          8000,
          "Fetch staff_list"
        );

        if (staffErr) {
          console.error("Error fetching staff_list:", staffErr.message ?? staffErr);
        }

        if (staff && mounted) {
          const toMember = (s: StaffListRow) => ({
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            staff_role: s.staff_role,
            main_role: s.main_role,
          }) as TeamMember;

          const options: TeamRoleOptions = {
            anr:       staff.filter(s => s.is_anr).map(toMember),
            composer:  staff.filter(s => s.is_composer).map(toMember),
            producer:  staff.filter(s => s.is_producer).map(toMember),
            engineer:  staff.filter(s => s.is_engineer).map(toMember),
            publisher: staff.filter(s => s.is_publisher).map(toMember),
          };
          setTeamRoleOptions(options);
        }

        // ⬇️ setelah options siap, load assignments dari API
        } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [params.id, supabase, loadCurrentAssignments]);

  // ====== LAZY TAB LOAD (biarkan sesuai punyamu) ======
  useEffect(() => {
    if (!project || !userAccess) return;
    let mounted = true;
    const loadTabData = async () => {
      try {
        switch (activeTab) {
          case "drafts":
            if (hasAccess(userAccess, ACCESS_RULES.DRAFTS) && !drafts) {
              const { data } = await supabase
                .from("drafts")
                .select("*")
                .eq("project_id", params.id)
                .order("created_at", { ascending: false });
              if (mounted) setDrafts(data || []);
            }
            break;
          case "references":
            if (hasAccess(userAccess, ACCESS_RULES.REFERENCES) && !links) {
              const { data } = await supabase
                .from("reference_links")
                .select("*")
                .eq("project_id", params.id)
                .order("created_at", { ascending: false });
              if (mounted) setLinks(data || []);
            }
            break;
          case "discussion":
            if (hasAccess(userAccess, ACCESS_RULES.DISCUSSION) && !messages) {
              const { data } = await supabase
                .from("discussion_messages")
                .select("*")
                .eq("project_id", params.id)
                .order("created_at", { ascending: false });
              if (mounted) setMessages(data || []);
            }
            break;
          case "meetings":
            if (hasAccess(userAccess, ACCESS_RULES.MEETINGS) && !meetings) {
              const { data } = await supabase
                .from("meetings")
                .select("*")
                .eq("project_id", params.id)
                .order("start_at", { ascending: false });
              if (mounted) setMeetings(data || []);
            }
            break;
        }
      } catch (error) {
        console.error("Error loading tab data:", error);
      }
    };
    loadTabData();
    return () => { mounted = false; };
  }, [activeTab, project, userAccess, params.id, supabase, drafts, links, messages, meetings]);

  // ====== ACTIONS ======

  // Simpan assignment sesuai algoritma (non-upsert -> deactivate + insert)
  const handleSaveAssignmentsAlgo = async (draft: CurrentAssignments) => {
    if (!project) return;

    const projectId = project.project_id;
    const ops: Array<Promise<unknown>> = [];

    ASSIGNABLE_ROLES.forEach((role) => {
      const display = draft[role];
      const userId = findProfileIdByDisplay(display, role);
      if (userId) {
        ops.push(raceWithTimeout(assignOne(projectId, role, userId), 8000, `Assign ${role} timeout`));
      }
    });

    // NOTE: publisher sengaja tidak diproses sesuai definisi assignOne yang kamu berikan

    await Promise.all(ops);
    await loadCurrentAssignments();
  };

  const handleRemoveAssignment = async (role: StaffRole) => {
    if (!project) return;
    try {
      // hanya proses role yang ada di table assignments
      if ((ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
        const { error } = await supabase
          .from("assignments")
          .update({ active: false, unassigned_at: new Date().toISOString() })
          .eq("project_id", project.project_id)
          .eq("role", role)
          .eq("active", true);
        if (error) throw error;
      }
      await loadCurrentAssignments();
    } catch (err) {
      console.error("Failed to remove assignment:", err);
    }
  };

  const handleAcceptProject = async () => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "in_progress", stage: "awaiting_payment" })
        .eq("project_id", project.project_id);
      if (error) throw error;
      setProject(prev => prev ? { ...prev, status: "in_progress", stage: "awaiting_payment" } : prev);
    } catch (err) {
      console.error("Failed to accept project:", err);
    }
  };

  const handlePutOnHold = async () => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "pending" })
        .eq("project_id", project.project_id);
      if (error) throw error;
      setProject(prev => prev ? { ...prev, status: "pending" } : prev);
    } catch (err) {
      console.error("Failed to put project on hold:", err);
    }
  };

  // ====== RENDER ======
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl mb-4">🎵</div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Loading project details...
          </div>
        </motion.div>
      </div>
    );
  }

  if (!project || !userAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <motion.div
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center shadow dark:shadow-gray-800/25"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Project Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            The requested project could not be found or you don&apos;t have access to it.
          </p>
        </motion.div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab project={project} />;
      case "drafts":
        return <DraftsTab drafts={drafts} revisions={revisions} />;
      case "references":
        return <ReferencesTab project={project} links={links} setLinks={setLinks} />;
      case "discussion":
        return <DiscussionTab project={project} messages={messages} setMessages={setMessages} />;
      case "meetings":
        return <MeetingsTab project={project} meetings={meetings} setMeetings={setMeetings} />;
      case "publishing":
        return <PublishingTab project={project} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 lg:p-8 space-y-8"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {hasAccess(userAccess, ACCESS_RULES.HERO_SECTION) && (
        <HeroSection
          project={project}
          showRightActions={hasAccess(userAccess, ACCESS_RULES.RIGHT_ACTIONS)}
          onAcceptProject={handleAcceptProject}
          onPutOnHold={handlePutOnHold}
        />
      )}

      {hasAccess(userAccess, ACCESS_RULES.TEAM_ASSIGNMENTS) && (
        <TeamAssignmentSection
          project={project}
          currentAssignments={currentAssignments}
          teamRoleOptions={teamRoleOptions}
          onSaveAssignments={handleSaveAssignmentsAlgo} 
          onRemoveAssignment={handleRemoveAssignment}
        />
      )}

      <ProjectControlsSection
        project={project}
        userAccess={userAccess}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        {renderTabContent()}
      </ProjectControlsSection>
    </motion.div>
  );
}
