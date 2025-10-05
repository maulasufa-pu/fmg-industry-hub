// src/lib/supabase/admin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

/**
 * Get Supabase admin client with service role key
 * Use this for admin operations that bypass RLS
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  try {
    if (_adminClient) return _adminClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      // console.warn('Admin client not available: missing service role key');
      return null;
    }

    _adminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    return _adminClient;
  } catch (err) {
    // console.warn('Failed to create admin client:', err);
    return null;
  }
}

/**
 * Safely toggle profile staff role using profiles.staff_role array
 * staff_role is for functional roles (anr, composer, producer, engineer)
 * main_role is for global permissions (client, admin, owner)
 */
export async function toggleProfileRole(
  profileId: string, 
  role: string, 
  isAdd: boolean,
  roleType: 'main_role' | 'staff_role' = 'staff_role'
): Promise<{ error: Error | null }> {
  // Try admin client first (bypasses RLS)
  const adminClient = getSupabaseAdminClient();
  
  if (adminClient) {
    try {
      if (roleType === 'main_role') {
        // Update main_role (single value)
        const updateValue = isAdd ? role : 'client'; // Default to client when removing
        
        const { error: updateError } = await adminClient
          .from("profiles")
          .update({ main_role: updateValue })
          .eq("id", profileId);

        return { error: updateError };
        
      } else {
        // Update staff_role (array)
        const { data: profile, error: fetchError } = await adminClient
          .from("profiles")
          .select("staff_role")
          .eq("id", profileId)
          .single();

        if (fetchError) {
          return { error: fetchError };
        }

        // Get current staff_role array, default to empty array
        const currentRoles = profile?.staff_role || [];
        let updatedRoles: string[];

        if (isAdd) {
          // Add role if not already present
          if (!currentRoles.includes(role)) {
            updatedRoles = [...currentRoles, role];
          } else {
            // Role already exists, no change needed
            return { error: null };
          }
        } else {
          // Remove role from array
          updatedRoles = currentRoles.filter((r: string) => r !== role);
        }

        // Update profiles table with new staff_role array
        const { error: updateError } = await adminClient
          .from("profiles")
          .update({ staff_role: updatedRoles })
          .eq("id", profileId);

        return { error: updateError };
      }
      
    } catch (err) {
      // console.warn('Admin client failed, falling back to regular client:', err);
    }
  }

  // Fallback: will be handled by the calling code
  return { error: new Error('Admin client not available') };
}

/**
 * Update user's main role (global permissions: client, admin, owner)
 */
export async function updateMainRole(
  profileId: string, 
  mainRole: 'client' | 'admin' | 'owner'
): Promise<{ error: Error | null }> {
  const adminClient = getSupabaseAdminClient();
  
  if (!adminClient) {
    return { error: new Error('Admin client not available') };
  }

  try {
    const { error } = await adminClient
      .from("profiles")
      .update({ main_role: mainRole })
      .eq("id", profileId);

    return { error };
  } catch (err) {
    // console.error('Update main role error:', err);
    return { error: err instanceof Error ? err : new Error('Failed to update main role') };
  }
}

/**
 * Update user's staff roles (functional roles: anr, composer, producer, engineer)
 */
export async function updateStaffRoles(
  profileId: string, 
  staffRoles: string[]
): Promise<{ error: Error | null }> {
  const adminClient = getSupabaseAdminClient();
  
  if (!adminClient) {
    return { error: new Error('Admin client not available') };
  }

  try {
    const { error } = await adminClient
      .from("profiles")
      .update({ staff_role: staffRoles })
      .eq("id", profileId);

    return { error };
  } catch (err) {
    //console.error('Update staff roles error:', err);
    return { error: err instanceof Error ? err : new Error('Failed to update staff roles') };
  }
}

/**
 * Create or update project assignment using assignments table
 */
export async function assignTeamMember(
  projectId: string,
  userId: string,
  role: string,
  assignedBy?: string
): Promise<{ error: Error | null }> {
  const adminClient = getSupabaseAdminClient();
  
  if (!adminClient) {
    return { error: new Error('Admin client not available') };
  }

  try {
    // Deactivate existing assignment for this role in this project
    await adminClient
      .from('assignments')
      .update({ 
        active: false, 
        unassigned_at: new Date().toISOString() 
      })
      .eq('project_id', projectId)
      .eq('role', role)
      .eq('active', true);

    // Create new assignment
    const { error: assignError } = await adminClient
      .from('assignments')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role,
        active: true,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy || null,
        note: 'Assigned via admin panel'
      });

    if (assignError) {
      return { error: assignError };
    }

    // Also update projects table for compatibility
    const { error: projectUpdateError } = await adminClient
      .from('projects')
      .update({ [role]: userId })
      .eq('project_id', projectId);

    return { error: projectUpdateError };

  } catch (err) {
    //console.error('Assignment error:', err);
    return { error: err instanceof Error ? err : new Error('Assignment failed') };
  }
}

/**
 * Remove team member assignment
 */
export async function unassignTeamMember(
  projectId: string,
  role: string
): Promise<{ error: Error | null }> {
  const adminClient = getSupabaseAdminClient();
  
  if (!adminClient) {
    return { error: new Error('Admin client not available') };
  }

  try {
    // Deactivate assignment
    const { error: deactivateError } = await adminClient
      .from('assignments')
      .update({ 
        active: false, 
        unassigned_at: new Date().toISOString() 
      })
      .eq('project_id', projectId)
      .eq('role', role)
      .eq('active', true);

    if (deactivateError) {
      return { error: deactivateError };
    }

    // Clear projects table
    const { error: projectUpdateError } = await adminClient
      .from('projects')
      .update({ [role]: null })
      .eq('project_id', projectId);

    return { error: projectUpdateError };

  } catch (err) {
    // console.error('Unassignment error:', err);
    return { error: err instanceof Error ? err : new Error('Unassignment failed') };
  }
}

/**
 * Get team members with specific staff roles or main roles
 */
export async function getTeamMembersByRole(
  role: string, 
  roleType: 'main_role' | 'staff_role' = 'staff_role'
): Promise<{
  data: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    main_role: string | null;
    staff_role: string[];
  }> | null;
  error: Error | null;
}> {
  const adminClient = getSupabaseAdminClient();
  
  if (!adminClient) {
    return { data: null, error: new Error('Admin client not available') };
  }

  try {
    let query = adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, main_role, staff_role');

    if (roleType === 'main_role') {
      // Filter by main_role
      query = query.eq('main_role', role);
    } else {
      // Filter by staff_role array contains
      query = query.contains('staff_role', [role]);
    }

    const { data, error } = await query;

    return { data, error };
  } catch (err) {
    //console.error('Get team members error:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Failed to get team members') 
    };
  }
}

/**
 * Get all team members (non-clients) with their roles
 */
export async function getAllTeamMembers(): Promise<{
  data: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    main_role: string | null;
    staff_role: string[];
  }> | null;
  error: Error | null;
}> {
  const adminClient = getSupabaseAdminClient();
  
  if (!adminClient) {
    return { data: null, error: new Error('Admin client not available') };
  }

  try {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, main_role, staff_role')
      .not('main_role', 'eq', 'client')
      .order('created_at', { ascending: true });

    return { data, error };
  } catch (err) {
    //console.error('Get all team members error:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Failed to get team members') 
    };
  }
}
