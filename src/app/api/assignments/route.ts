import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAdminRequest, requireAuthenticatedRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

const ASSIGNMENT_ROLES = ["anr", "composer", "producer", "engineer", "publisher"] as const;
const AssignmentBodySchema = z.object({
  project_id: z.string().uuid(),
  assignments: z.partialRecord(z.enum(ASSIGNMENT_ROLES), z.string().uuid().nullable()),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedRequest(request);
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    if (!z.string().uuid().safeParse(projectId).success) return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    if (!auth.isAdmin) {
      const { data: project } = await supabase.from("projects").select("client_id").eq("project_id", projectId).maybeSingle();
      if (!project || project.client_id !== auth.user.id) return NextResponse.json({ error: "Project access denied" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        user_id,
        role,
        active,
        assigned_at,
        profiles!assignments_user_id_fkey(id, first_name, last_name)
      `)
      .eq('project_id', projectId)
      .eq('active', true);

    if (error) {
      //console.error('Assignments query error:', error);
      return NextResponse.json({ error: "Unable to load assignments" }, { status: 500 });
    }

    const assignments = {
      anr: "",
      composer: "",
      producer: "",
      engineer: "",
      publisher: "",
    };

    data?.forEach((assignment: any) => {
      const profile = assignment.profiles;
      if (profile) {
        const firstName = profile.first_name?.trim() || "";
        const lastName = profile.last_name?.trim() || "";
        const displayName = (firstName || lastName) 
          ? `${firstName} ${lastName}`.trim() 
          : "Assigned team member";

        if (displayName && assignment.role in assignments) {
          (assignments as any)[assignment.role] = displayName;
        }
      }
    });

    return NextResponse.json({ success: true, assignments });

  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    //console.error('API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const actor = await requireAdminRequest(request);
    const rate = consumeRateLimit(request, "assignments-write", 60, 60_000, actor.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many assignment updates" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const parsed = AssignmentBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid assignment payload" }, { status: 400 });
    const { project_id, assignments: newAssignments } = parsed.data;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

    for (const [role, userId] of Object.entries(newAssignments)) {
      if (typeof userId !== 'string' && userId !== null) continue;

      const { error: deactivateError } = await supabase
        .from('assignments')
        .update({ 
          active: false, 
          unassigned_at: new Date().toISOString() 
        })
        .eq('project_id', project_id)
        .eq('role', role)
        .eq('active', true);

      if (deactivateError) {
        //console.error(`Error deactivating ${role}:`, deactivateError);
        continue;
      }

      if (userId) {
        const { error: insertError } = await supabase
          .from('assignments')
          .insert({
            project_id,
            user_id: userId,
            role,
            active: true,
            assigned_at: new Date().toISOString(),
            assigned_by: actor.user.id,
            note: 'Assigned via admin panel API'
          });

        if (insertError) {
          //console.error(`Error inserting ${role} assignment:`, insertError);
          return NextResponse.json({ 
            error: `Failed to assign ${role}`
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Assignments updated successfully" });

  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    //console.error('Assignment update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const actor = await requireAdminRequest(request);
    const rate = consumeRateLimit(request, "assignments-delete", 30, 60_000, actor.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many assignment updates" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const role = url.searchParams.get('role');

    if (!projectId || !role) {
      return NextResponse.json({ error: "Project ID and role required" }, { status: 400 });
    }

    if (!z.string().uuid().safeParse(projectId).success || !ASSIGNMENT_ROLES.includes(role as typeof ASSIGNMENT_ROLES[number])) {
      return NextResponse.json({ error: "Invalid project or role" }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

    const { error } = await supabase
      .from('assignments')
      .update({ active: false, unassigned_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('role', role)
      .eq('active', true);

    if (error) {
      //console.error('Remove assignment error:', error);
      return NextResponse.json({ 
        error: `Failed to remove ${role} assignment`
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `${role} assignment removed successfully` });

  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    //console.error('Remove assignment error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
