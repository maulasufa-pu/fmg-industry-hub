import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    
    if (mode === 'admin') {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, name, email, staff_role, main_role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        //console.error("Database error:", error);
        return NextResponse.json({ success: false, error: "Unable to load profiles" }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, staff_role")
      .limit(10);

    if (error) {
      //console.error("Database error:", error);
      return NextResponse.json({ error: "Unable to load profiles" }, { status: 500 });
    }

    const roleOptions: any = {
      anr: [],
      composer: [],
      producer: [],
      engineer: [],
      publisher: [],
    };

    data?.forEach((profile: any) => {
      if (!profile.staff_role) return;

      const roles = Array.isArray(profile.staff_role) ? profile.staff_role : [profile.staff_role];

      const member = {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        staff_role: roles,
        main_role: 'staff',
      };

      roles.forEach((role: string) => {
        if (role === 'anr') roleOptions.anr.push(member);
        if (role === 'composer') roleOptions.composer.push(member);
        if (role === 'producer') roleOptions.producer.push(member);
        if (role === 'engineer') roleOptions.engineer.push(member);
        if (role === 'publisher') roleOptions.publisher.push(member);
      });
    });

    return NextResponse.json(roleOptions);
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    //console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
