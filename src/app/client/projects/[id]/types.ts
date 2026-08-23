// src/app/admin/projects/[id]/types.ts

export type ProjectStatus = 
  | "pending"
  | "in_progress" 
  | "revision"
  | "approved"
  | "published"
  | "on_hold"
  | "archived"
  | "cancelled";

export type ProjectStage = 
  | "request_review"
  | "awaiting_payment"
  | "assign_team"
  | "draft1_work"
  | "draft1_review"
  | "finalization"
  | "metadata"
  | "agreement"
  | "publishing"
  | "post_release";

export interface ProjectSummary {
  project_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  stage: ProjectStage | string | null;
  updated_at: string;
  client_id: string | null;
  client_name: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  artist_name: string | null;
  genre: string | null;
  progress_percent: number | null;
  composer_id: string | null;
  producer_id: string | null;
  anr_id: string | null;
  engineer_id: string | null;
  publisher_id: string | null;
}

export type StaffRole = "composer" | "producer" | "anr" | "engineer" | "publisher";

export interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  staff_role: StaffRole[];
  main_role: string | null;
}

export interface TeamRoleOptions {
  anr: TeamMember[];
  composer: TeamMember[];
  producer: TeamMember[];
  engineer: TeamMember[];
  publisher: TeamMember[];
}

export interface CurrentAssignments {
  anr: string;
  composer: string;
  producer: string;
  engineer: string;
  publisher: string;
}

export type TabKey = "overview" | "drafts" | "references" | "discussion" | "meetings" | "publishing";

export interface DraftRow {
  draft_id: string;
  project_id: string;
  file_path: string;
  uploaded_by: string | null;
  version: number;
  created_at: string | null;
}

export interface RevisionRow {
  revision_id: string;
  draft_id: string;
  requested_by: string | null;
  reason: string | null;
  created_at: string | null;
}

export interface ReferenceLinkRow {
  id: string;
  project_id: string;
  url: string;
  created_at: string | null;
}

export interface DiscussionMessage {
  id: string;
  project_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
}

export interface MeetingRow {
  id: string;
  project_id: string;
  title: string;
  start_at: string;
  duration_min: number;
  link: string | null;
  notes: string | null;
  created_by?: string | null;
  created_at?: string;
}
