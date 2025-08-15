"use client";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function acceptProject(projectId: string) {
  const sb = getSupabaseClient();
  const { error } = await sb.from("projects").update({
    status: "waiting_payment", is_active: false, is_finished: false
  }).eq("id", projectId);
  if (error) throw error;
}

export async function assignTeam(projectId: string, roles: Partial<{
  anr_name: string; engineer_name: string; composer_name: string; producer_name: string; sound_designer_name: string;
}>) {
  const sb = getSupabaseClient();
  const { error } = await sb.from("projects").update(roles).eq("id", projectId);
  if (error) throw error;
}

export async function markFinished(projectId: string) {
  const sb = getSupabaseClient();
  const { error } = await sb.from("projects").update({
    status: "finished", is_active: false, is_finished: true
  }).eq("id", projectId);
  if (error) throw error;
}
