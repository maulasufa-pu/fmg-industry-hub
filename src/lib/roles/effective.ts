// src/lib/roles/effective.ts
import type { UserRole } from "@/lib/roles";
import { getSupabaseClient, ensureFreshSession } from "@/lib/supabase/client";

const PRIORITY: UserRole[] = [
  "owner","admin","anr","producer","composer","engineer","publisher","client","guest",
];

export async function getEffectiveRole(): Promise<UserRole> {
  const supabase = getSupabaseClient();

  // optional tapi bagus: pastikan token masih fresh sebelum hit DB penting
  await ensureFreshSession().catch(() => {});

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "guest";

  try {
    // Get user profile with main_role and staff_role
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("main_role, staff_role")
      .eq("id", user.id)
      .single();

    if (error || !profile) return "client";

    // Combine main_role and staff_role for priority checking
    const allRoles: string[] = [];
    
    // Add main_role (global permission)
    if (profile.main_role) {
      allRoles.push(profile.main_role);
    }
    
    // Add staff_role array (functional roles)
    if (profile.staff_role && Array.isArray(profile.staff_role)) {
      allRoles.push(...profile.staff_role);
    }

    // Find highest priority role
    const roles = allRoles as UserRole[];
    for (const r of PRIORITY) {
      if (roles.includes(r)) return r;
    }
    
    return "client";
  } catch (err) {
    // console.warn('Failed to get effective role:', err);
    return "client";
  }
}

// // src/lib/roles/effective.ts
// import type { SupabaseClient } from "@supabase/supabase-js";
// import type { UserRole } from "@/lib/roles";

// const PRIORITY: UserRole[] = ["owner","admin","anr","producer","composer","engineer","publisher","client","guest"];

// export async function getEffectiveRole(supabase: SupabaseClient): Promise<UserRole> {
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return "guest";

//   const { data: profile } = await supabase
//     .from("profiles")
//     .select("main_role, staff_role")
//     .eq("id", user.id)
//     .maybeSingle();

//   if (!profile) return "client";

//   const allRoles: string[] = [];
//   if (profile.main_role) allRoles.push(profile.main_role);
//   if (Array.isArray(profile.staff_role)) allRoles.push(...profile.staff_role);

//   for (const r of PRIORITY) if ((allRoles as UserRole[]).includes(r)) return r;
//   return "client";
// }
