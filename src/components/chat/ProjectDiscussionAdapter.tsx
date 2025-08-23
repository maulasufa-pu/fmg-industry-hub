// src/components/chat/ProjectDiscussionAdapter.tsx

"use client";

import React from "react";
import type { ProjectSummary, DiscussionMessage } from "@/app/ui/panel/projects/types";
import DiscussionTab from "@/app/ui/panel/projects/components/tabs/DiscussionTab";

export default function ProjectDiscussionAdapter({ project }: { project: ProjectSummary }) {
  const [messages, setMessages] = React.useState<(DiscussionMessage & {
    author_display_name?: string | null;
    deleted_at?: string | null;
    updated_at?: string | null;
  })[] | null>(null);

  return (
    <div className="h-full flex flex-col">
      <DiscussionTab project={project} messages={messages} setMessages={setMessages} />
    </div>
  );
}