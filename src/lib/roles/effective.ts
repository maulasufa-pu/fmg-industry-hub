// src/lib/roles/effective.ts
import type { UserRole } from "@/lib/roles";
import { getSupabaseClient, ensureFreshSession } from "@/lib/supabase/client";

const PRIORITY: UserRole[] = [
  "owner","admin","anr","producer","composer","engineer","publisher","client","guest",
];

export async function getEffectiveRole(): Promise<UserRole> {
  // SERVER-SIDE DEBUG MODE: Check if we're in development and should bypass
  if (process.env.NODE_ENV === 'development') {
    // console.log('🔍 SERVER getEffectiveRole: Development mode detected, returning admin for debugging');
    return "admin";
  }

  // CLIENT-SIDE DEBUG MODE: Bypass authentication for localhost only
  if (typeof window !== 'undefined') {
    // console.log('🔍 CLIENT getEffectiveRole Debug info:', {
    //   hostname: window.location.hostname,
    //   port: window.location.port,
    //   nodeEnv: process.env.NODE_ENV,
    //   disableFlag: process.env.NEXT_PUBLIC_DISABLE_AUTH_DEBUG,
    //   href: window.location.href
    // });
    
    // Force bypass for localhost in development - more aggressive
    if ((window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname.endsWith('.local'))) {
      // console.log('🐛 CLIENT FORCE DEBUG MODE: Bypassing auth for localhost - returning admin role');
      // console.log('🔧 Hostname:', window.location.hostname, 'Port:', window.location.port);
      return "admin";
    }
  }

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
