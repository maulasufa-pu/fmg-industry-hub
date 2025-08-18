import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, role, isAdd, roleType } = body;
    
    if (!profileId || !role || typeof isAdd !== 'boolean' || !roleType) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required parameters: profileId, role, isAdd, roleType" 
      }, { status: 400 });
    }

    // Use service role untuk bypass RLS
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (roleType === 'main_role') {
      // Update global role
      const { error } = await supabase
        .from("profiles")
        .update({ main_role: role })
        .eq("id", profileId);

      if (error) {
        console.error("Error updating main_role:", error);
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (roleType === 'staff_role') {
      // Update staff role array
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("staff_role")
        .eq("id", profileId)
        .single();

      if (fetchError) {
        console.error("Error fetching current profile:", fetchError);
        return NextResponse.json({ 
          success: false, 
          error: fetchError.message 
        }, { status: 500 });
      }

      let currentRoles = currentProfile?.staff_role || [];
      if (!Array.isArray(currentRoles)) {
        currentRoles = currentRoles ? [currentRoles] : [];
      }

      let updatedRoles;
      if (isAdd) {
        // Add role if not already present
        updatedRoles = currentRoles.includes(role) 
          ? currentRoles 
          : [...currentRoles, role];
      } else {
        // Remove role
        updatedRoles = currentRoles.filter((r: string) => r !== role);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ staff_role: updatedRoles })
        .eq("id", profileId);

      if (updateError) {
        console.error("Error updating staff_role:", updateError);
        return NextResponse.json({ 
          success: false, 
          error: updateError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid roleType. Must be 'main_role' or 'staff_role'" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
