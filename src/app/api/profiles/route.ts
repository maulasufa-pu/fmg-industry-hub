import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (mode === 'admin') {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, name, email, staff_role, main_role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, staff_role")
      .limit(10);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

      let roles = Array.isArray(profile.staff_role) ? profile.staff_role : [profile.staff_role];

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
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
