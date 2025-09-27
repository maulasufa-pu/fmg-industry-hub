import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        user_id,
        role,
        active,
        assigned_at,
        profiles!assignments_user_id_fkey(id, first_name, last_name, email)
      `)
      .eq('project_id', projectId)
      .eq('active', true);

    if (error) {
      console.error('Assignments query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
          : profile.email || "";

        if (displayName && assignment.role in assignments) {
          (assignments as any)[assignment.role] = displayName;
        }
      }
    });

    return NextResponse.json({ success: true, assignments });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, assignments: newAssignments } = body;

    if (!project_id || !newAssignments) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        console.error(`Error deactivating ${role}:`, deactivateError);
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
            note: 'Assigned via admin panel API'
          });

        if (insertError) {
          console.error(`Error inserting ${role} assignment:`, insertError);
          return NextResponse.json({ 
            error: `Failed to assign ${role}: ${insertError.message}` 
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Assignments updated successfully" });

  } catch (error) {
    console.error('Assignment update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const role = url.searchParams.get('role');

    if (!projectId || !role) {
      return NextResponse.json({ error: "Project ID and role required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('project_id', projectId)
      .eq('role', role)
      .eq('active', true);

    if (error) {
      console.error('Remove assignment error:', error);
      return NextResponse.json({ 
        error: `Failed to remove ${role} assignment: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `${role} assignment removed successfully` });

  } catch (error) {
    console.error('Remove assignment error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
