import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

const RoleUpdateSchema = z.object({
  profileId: z.string().uuid(),
  role: z.string().min(1).max(40),
  isAdd: z.boolean(),
  roleType: z.enum(["main_role", "staff_role"]),
});

const MAIN_ROLES = new Set(["client", "admin", "owner"]);
const STAFF_ROLES = new Set(["anr", "composer", "producer", "engineer", "publisher"]);

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const actor = await requireAdminRequest(request);
    const rate = consumeRateLimit(request, "role-update", 30, 60_000, actor.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many role updates" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const parsed = RoleUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid role update payload" }, { status: 400 });
    const { profileId, role, isAdd, roleType } = parsed.data;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

    const { data: target } = await supabase
      .from("profiles")
      .select("main_role")
      .eq("id", profileId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    if (roleType === "main_role") {
      if (!MAIN_ROLES.has(role)) return NextResponse.json({ error: "Invalid main role" }, { status: 400 });
      if (actor.mainRole !== "owner") return NextResponse.json({ error: "Only an owner can change main roles" }, { status: 403 });
      if (profileId === actor.user.id && role === "client") return NextResponse.json({ error: "An owner cannot demote their own active account" }, { status: 400 });
    } else if (!STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid staff role" }, { status: 400 });
    }

    if (roleType === 'main_role') {
      const { error } = await supabase
        .from("profiles")
        .update({ main_role: isAdd ? role : "client" })
        .eq("id", profileId);

      if (error) {
        //console.error("Error updating main_role:", error);
        return NextResponse.json({ 
          success: false, 
          error: "Unable to update main role"
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (roleType === 'staff_role') {
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("staff_role")
        .eq("id", profileId)
        .single();

      if (fetchError) {
        //console.error("Error fetching current profile:", fetchError);
        return NextResponse.json({ 
          success: false, 
          error: "Unable to load current roles"
        }, { status: 500 });
      }

      let currentRoles = currentProfile?.staff_role || [];
      if (!Array.isArray(currentRoles)) {
        currentRoles = currentRoles ? [currentRoles] : [];
      }

      let updatedRoles;
      if (isAdd) {
        updatedRoles = currentRoles.includes(role) 
          ? currentRoles 
          : [...currentRoles, role];
      } else {
        updatedRoles = currentRoles.filter((r: string) => r !== role);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ staff_role: updatedRoles })
        .eq("id", profileId);

      if (updateError) {
        //console.error("Error updating staff_role:", updateError);
        return NextResponse.json({ 
          success: false, 
          error: "Unable to update staff roles"
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
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    //console.error("API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
