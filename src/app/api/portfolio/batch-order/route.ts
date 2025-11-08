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

    console.log(`⚡ FAST batch updating ${updates.length} items...`);
    const startTime = Date.now();

    // Process in chunks of 20 for optimal performance
    const CHUNK_SIZE = 20;
    const chunks = [];
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      chunks.push(updates.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Processing ${chunks.length} chunks of max ${CHUNK_SIZE} items each`);

    let totalSuccess = 0;
    let totalErrors = 0;

    // Process chunks in parallel for maximum speed
    await Promise.all(
      chunks.map(async (chunk, chunkIndex) => {
        // Update all items in this chunk in parallel
        const chunkPromises = chunk.map(update =>
          supabase
            .from("portfolio")
            .update({ priority_order: update.priority_order })
            .eq("id", update.id)
        );

        const results = await Promise.allSettled(chunkPromises);
        
        const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value as any).error).length;
        const errorCount = results.length - successCount;
        
        totalSuccess += successCount;
        totalErrors += errorCount;
        
        console.log(`Chunk ${chunkIndex + 1}/${chunks.length}: ${successCount} success, ${errorCount} errors`);
      })
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Batch update completed in ${duration}ms: ${totalSuccess} success, ${totalErrors} errors`);

    if (totalErrors > 0) {
      return NextResponse.json(
        { 
          success: true, 
          message: `Updated ${totalSuccess} items, ${totalErrors} failed`,
          duration: `${duration}ms`,
          stats: { success: totalSuccess, errors: totalErrors }
        },
        { status: 207 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully updated ${totalSuccess} items`,
        duration: `${duration}ms`,
        stats: { success: totalSuccess, errors: totalErrors }
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
