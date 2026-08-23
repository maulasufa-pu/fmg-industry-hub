import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });

    const { data, error } = await supabase
      .from("staff_list")
      .select("id, first_name, last_name, email, main_role, staff_role, full_name, is_anr, is_composer, is_producer, is_engineer, is_publisher");

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (e: unknown) {
    const authResponse = apiAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: "Unable to load staff" }, { status: 500 });
  }
}
