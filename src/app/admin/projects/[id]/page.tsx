// src/app/admin/projects/[id]/page.tsx
"use client";

import { motion, Variants } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

import type {
  ProjectSummary,
  TabKey,
  TeamMember,
  StaffRole,
  TeamRoleOptions,
  CurrentAssignments
} from "../../../ui/panel/projects/types";

import HeroSection from "@/app/ui/panel/projects/components/HeroSection";
import TeamAssignmentSection from "@/app/ui/panel/projects/components/TeamAssignmentSection";
import ProjectControlsSection from "@/app/ui/panel/projects/components/ProjectControlsSection";
import { hasAccess, UserAccess, ACCESS_RULES } from "@/app/ui/panel/projects/components/access-control";

import OverviewTab from "@/app/ui/panel/projects/components/tabs/OverviewTab";
import DraftsTab from "@/app/ui/panel/projects/components/tabs/DraftsTab";
import ReferencesTab from "@/app/ui/panel/projects/components/tabs/ReferencesTab";
import DiscussionTab from "@/app/ui/panel/projects/components/tabs/DiscussionTab";
import MeetingsTab from "@/app/ui/panel/projects/components/tabs/MeetingsTab";
import PublishingTab from "@/app/ui/panel/projects/components/tabs/PublishingTab";

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
const ASSIGNABLE_ROLES = ["anr", "composer", "producer", "engineer", "publisher"] as const;

export default function AdminProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(true); // ← optional
  
  const [accessChecked, setAccessChecked] = useState(false);
  const [projectChecked, setProjectChecked] = useState(false);

  const refetchProject = useCallback(async () => {
    const { data, error } = await supabase
      .from("project_summary")
      .select("*")
      .eq("project_id", params.id)
      .single();

    if (error) {
      console.warn("[Refetch project] error:", error);
      return;
    }
    if (data) setProject(data as ProjectSummary);
  }, [params.id, supabase]);

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

  const [drafts, setDrafts] = useState<any[] | null>(null);
  const [revisions, setRevisions] = useState<any[] | null>(null);
  const [links, setLinks] = useState<any[] | null>(null);
  const [messages, setMessages] = useState<any[] | null>(null);
  const [meetings, setMeetings] = useState<any[] | null>(null);

  const loadCurrentAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
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
      setAssignmentsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadCurrentAssignments();
  }, [loadCurrentAssignments]);

  const getFullName = (member: TeamMember): string => {
    const firstName = member.first_name || "";
    const lastName = member.last_name || "";
    return [firstName, lastName].filter(Boolean).join(" ") || member.email || "Unknown";
  };

  const getTeamOptionsForRole = (role: keyof TeamRoleOptions): TeamMember[] => {
    return teamRoleOptions[role] || [];
  };

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

  const raceWithTimeout = <T,>(promise: PromiseLike<T>, ms = 8000, errorMessage = "Request timed out"): Promise<T> =>
    Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${errorMessage} (${ms}ms)`)), ms)),
    ]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAccessChecked(true);
          setProjectChecked(true);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("main_role, staff_role")
          .eq("id", user.id)
          .single();

        if (!profile) {
          setAccessChecked(true);
          setProjectChecked(true);
          setLoading(false);
          return;
        }

        const access: UserAccess = {
          main_role: profile.main_role,
          staff_role: profile.staff_role || [],
        };
        setUserAccess(access);
        setAccessChecked(true); 

        const { data: projectData } = await supabase
          .from("project_summary")
          .select("*")
          .eq("project_id", params.id)
          .single();

        setProject(projectData ?? null);
        setProjectChecked(true); 

        if (projectData && mounted) setProject(projectData);

        type StaffListRow = {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          main_role: string | null;
          staff_role: string[]; 
          full_name: string | null;
          is_anr: boolean;
          is_composer: boolean;
          is_producer: boolean;
          is_engineer: boolean;
          is_publisher: boolean;
        };

        try {
          const res = await fetch("/api/staff-list", {
            signal: AbortSignal.timeout(8000),
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`staff-list HTTP ${res.status}`);
          const json = (await res.json()) as { success: boolean; data?: StaffListRow[]; error?: string };
          if (!json.success || !json.data) throw new Error(json.error || "staff_list failed");

          const staff = json.data;

          if (mounted) {
            const toMember = (s: StaffListRow) =>
              ({
                id: s.id,
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                staff_role: s.staff_role,
                main_role: s.main_role,
              } as TeamMember);

            const options: TeamRoleOptions = {
              anr:       staff.filter(s => s.is_anr).map(toMember),
              composer:  staff.filter(s => s.is_composer).map(toMember),
              producer:  staff.filter(s => s.is_producer).map(toMember),
              engineer:  staff.filter(s => s.is_engineer).map(toMember),
              publisher: staff.filter(s => s.is_publisher).map(toMember),
            };
            setTeamRoleOptions(options);
          }
        } catch (e) {
          console.error("Error fetching staff_list:", e);
        }
        } catch (error) {
          console.error("Error loading project data:", error);
          setAccessChecked(true);
          setProjectChecked(true);
        } finally {
          setLoading(false);
        }
      };

    loadData();
    return () => { mounted = false; };
  }, [params.id, supabase, loadCurrentAssignments]);

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

  const handleSaveAssignmentsAlgo = async (draft: CurrentAssignments) => {
    if (!project) return;

    const assignmentsPayload: Partial<Record<(typeof ASSIGNABLE_ROLES)[number], string>> = {};

    ASSIGNABLE_ROLES.forEach((role) => {
      const display = draft[role];               
      const userId = findProfileIdByDisplay(display, role); 
      if (userId) {
        assignmentsPayload[role] = userId;
      }
    });

    if (Object.keys(assignmentsPayload).length === 0) {
      await loadCurrentAssignments();
      return;
    }

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        project_id: project.project_id,
        assignments: assignmentsPayload,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Save assignments failed:", err?.error || `HTTP ${res.status}`);
      return;
    }

    await loadCurrentAssignments(); 
  };

  const handleRemoveAssignment = async (role: StaffRole) => {
    if (!project) return;
    try {
      if ((ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
        const qs = new URLSearchParams({ project_id: project.project_id, role });
        const res = await fetch(`/api/assignments?${qs.toString()}`, {
          method: "DELETE",
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(`Failed to remove ${role}:`, err?.error || `HTTP ${res.status}`);
        }
      }
      await loadCurrentAssignments();
    } catch (err) {
      console.error("Failed to remove assignment:", err);
    }
  };

  const handleAcceptProject = async (): Promise<void> => {
    if (!project) return;
    const prev = { status: project.status, stage: project.stage };

    setProject(p => (p ? { ...p, status: "in_progress", stage: "awaiting_payment" } : p));

    const { data, error } = await supabase.rpc("accept_project", {
      p_project_id: project.project_id,
    });

    if (error) {
      setProject(p => (p ? { ...p, ...prev } : p));
      console.error("[Accept] RPC error:", error);
      alert(`Accept gagal: ${error.message}`);
      return;
    }

    await refetchProject();
  };

  const handlePutOnHold = async (): Promise<void> => {
    if (!project) return;
    const prev = { status: project.status, stage: project.stage };

    setProject(p => (p ? { ...p, status: "on_hold" } : p));

    const { data, error } = await supabase.rpc("put_project_on_hold", {
      p_project_id: project.project_id,
    });

    if (error) {
      setProject(p => (p ? { ...p, ...prev } : p));
      console.error("[Hold] RPC error:", error);
      alert(`Put on Hold gagal: ${error.message}`);
      return;
    }

    await refetchProject();
  };

  const handleContinueProject = async (): Promise<void> => {
    if (!project) return;
    const prev = { status: project.status, stage: project.stage };

    setProject(p => (p ? { ...p, status: "in_progress" } : p));

    const { data, error } = await supabase.rpc("resume_project", {
      p_project_id: project.project_id,
    });

    if (error) {
      setProject(p => (p ? { ...p, ...prev } : p));
      console.error("[Continue] RPC error:", error);
      alert(`Continue gagal: ${error.message}`);
      return;
    }

    await refetchProject();
  };

  const teamMemberCount = useMemo(() => {
    return Object.values(currentAssignments).filter(Boolean).length;
  }, [currentAssignments]);

  const daysActive = useMemo(() => {
    const ts =
      (project as any)?.created_at ??
      (project as any)?.updated_at ??
      null;
    if (!ts) return undefined;
    const ms = Date.now() - new Date(ts).getTime();
    const days = Math.max(1, Math.ceil(ms / 86_400_000)); 
    return days;
  }, [project]);

    if (loading || !accessChecked || !projectChecked) {
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
          onContinueProject={handleContinueProject}   // ✅ tambah ini
          teamMemberCount={teamMemberCount}
          daysActive={daysActive}
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
