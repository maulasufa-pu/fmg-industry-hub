// app/api/staff-list/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("staff_list")
      .select(
        "id, first_name, last_name, email, main_role, staff_role, full_name, is_anr, is_composer, is_producer, is_engineer, is_publisher"
      );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // cache ringan di edge jika mau (boleh diubah/dihapus)
    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}
