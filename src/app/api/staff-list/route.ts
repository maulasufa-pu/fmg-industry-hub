import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import type { Database } from "@/lib/supabase/types";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient/* <Database> */(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data, error } = await supabase
      .from("staff_list")
      .select("id, first_name, last_name, email, main_role, staff_role, full_name, is_anr, is_composer, is_producer, is_engineer, is_publisher");

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
