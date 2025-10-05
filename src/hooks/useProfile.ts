"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role =
  | "client"
  | "admin"
  | "owner"
  | "anr"
  | "engineer"
  | "composer"
  | "producer"
  | "publisher";

type ProfileData = {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  artist_name?: string;
  email?: string;
  main_role?: string;
  staff_role?: string[];
  avatar_path?: string;
  avatar_url?: string;
  location?: string;
  phone_number?: string;
};

type ProfileInfo = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarPath: string | null;
  avatarUrl: string | null;
};

const BUCKET = "avatars";
const USE_PUBLIC_BUCKET = true;

export function useProfile() {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = getSupabaseClient();

  const pickEffectiveRole = useCallback((mainRole?: string | null, staffRole?: string[] | null): Role => {
    const roles = [
      ...(mainRole ? [mainRole] : []),
      ...(Array.isArray(staffRole) ? staffRole : []),
    ];
    if (roles.includes("owner")) return "owner";
    if (roles.includes("admin")) return "admin";
    const staffPriority: Role[] = ["anr", "engineer", "composer", "producer", "publisher"];
    const found = staffPriority.find(r => roles.includes(r));
    return found ?? "client";
  }, []);

  const refreshAvatarUrl = useCallback(async (path: string | null): Promise<string | null> => {
    if (!path) return null;

    try {
      if (USE_PUBLIC_BUCKET) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return data?.publicUrl ?? null;
      } else {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
        return error ? null : (data?.signedUrl ?? null);
      }
    } catch (error) {
      // console.error('Error refreshing avatar URL:', error);
      return null;
    }
  }, [supabase]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        setProfile(null);
        return;
      }

      const { data: row, error: dbError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (dbError) {
        // console.error('Database error:', dbError);
        setError(dbError.message);
        return;
      }

      // Build full name
      const fullName =
        row?.name ||
        [row?.first_name, row?.last_name].filter(Boolean).join(" ") ||
        user.user_metadata?.full_name ||
        [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") ||
        user.email?.split("@")[0] ||
        "User";

      const email = row?.email ?? user.email ?? "";
      const role = pickEffectiveRole(row?.main_role, row?.staff_role);
      const avatarPath = (row?.avatar_path as string | null) ?? null;
      
      // Get avatar URL
      let avatarUrl: string | null = null;
      if (avatarPath) {
        avatarUrl = await refreshAvatarUrl(avatarPath);
      } else if (typeof row?.avatar_url === "string" && row.avatar_url.length > 0) {
        avatarUrl = row.avatar_url;
      }

      setProfile({
        id: user.id,
        fullName,
        email,
        role,
        avatarPath,
        avatarUrl,
      });
    } catch (error) {
      // console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, pickEffectiveRole, refreshAvatarUrl]);

  // Load profile on mount and auth changes
  useEffect(() => {
    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        loadProfile();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  // Listen to profile changes via realtime
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        () => {
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, loadProfile, supabase]);

  return {
    profile,
    loading,
    error,
    refetch: loadProfile,
  };
}
