// src/app/client/layout.tsx (SERVER)
import "@/app/globals.css";
import React from "react";

import RequireAuth from "@/app/auth/RequireAuth";
import ClientShell from "./client_shell";
import { getEffectiveRole } from "@/lib/roles/effective";
import GlobalChatPopover from "@/components/chat/GlobalChatPopover";
import ProjectDiscussionAdapter from "@/components/chat/ProjectDiscussionAdapter";
import { ProjectSummary } from "../ui/panel/projects/types";
import { ChatTopic } from "@/lib/chatBus";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const role = await getEffectiveRole();  // ← role sudah akurat di server
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

  // Otorisasi area client (punya RequireAuth mu sendiri)
  return (
    <RequireAuth area="client">
      <ClientShell role={role}>{children}
         <GlobalChatPopover renderContent={renderContent} />
      </ClientShell>
    </RequireAuth>
  );
}