import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in Server Components
            }
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("main_role, staff_role")
      .eq("id", user.id)
      .single();

    const allRoles: string[] = [];
    if (profile?.main_role) allRoles.push(profile.main_role);
    if (Array.isArray(profile?.staff_role)) allRoles.push(...profile.staff_role);

    const isAdmin = allRoles.includes("admin") || allRoles.includes("owner");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    console.log(`Batch updating ${updates.length} items...`);

    // Update each item one by one with proper error handling
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { data, error } = await supabase
          .from("portfolio")
          .update({ priority_order: update.priority_order })
          .eq("id", update.id)
          .select("id, priority_order")
          .single();

        if (error) {
          console.error(`Error updating item ${update.id}:`, error);
          errors.push({ id: update.id, error: error.message });
        } else {
          results.push(data);
        }
      } catch (err) {
        console.error(`Exception updating item ${update.id}:`, err);
        errors.push({ id: update.id, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    console.log(`Batch update completed: ${results.length} success, ${errors.length} errors`);

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Updated ${results.length} items, but ${errors.length} failed`,
          results,
          errors 
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully updated ${results.length} items`,
        results 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Batch update API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
