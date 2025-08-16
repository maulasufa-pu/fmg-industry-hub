// src/lib/roles/effective.ts
import type { UserRole } from "@/lib/roles";
import { getSupabaseClient, ensureFreshSession } from "@/lib/supabase/client";

const PRIORITY: UserRole[] = [
  "owner","admin","anr","producer","composer","audio_engineer","publishing","client","guest",
];

export async function getEffectiveRole(): Promise<UserRole> {
  const supabase = getSupabaseClient();

  // optional tapi bagus: pastikan token masih fresh sebelum hit DB penting
  await ensureFreshSession().catch(() => {});

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "guest";

  const { data, error } = await supabase
    .from("app_user_roles")
    .select("role")
    .eq("auth_user_id", user.id);

  if (error || !data?.length) return "client";

  const roles = data.map(r => r.role as UserRole);
  for (const r of PRIORITY) if (roles.includes(r)) return r;
  return "client";
}
