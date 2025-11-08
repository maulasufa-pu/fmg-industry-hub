import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
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
    const {
      genre,
      song_title,
      album_title,
      singer,
      songwriter,
      composer,
      arranger,
      producer,
      mixing_engineer,
      mastering_engineer,
      publisher,
      aggregator,
      release_date_aggregator,
      spotify_link,
      youtube_link,
      apple_music_link,
      artwork_link
    } = body;

    // Validate required fields
    if (!genre || !song_title) {
      return NextResponse.json(
        { error: "Genre and song_title are required" },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from("portfolio")
      .insert({
        genre,
        song_title,
        album_title: album_title || null,
        singer: singer || [],
        songwriter: songwriter || [],
        composer: composer || [],
        arranger: arranger || [],
        producer: producer || [],
        mixing_engineer: mixing_engineer || [],
        mastering_engineer: mastering_engineer || [],
        publisher: publisher || [],
        aggregator: aggregator || [],
        release_date_aggregator: release_date_aggregator || null,
        spotify_link: spotify_link || null,
        youtube_link: youtube_link || null,
        apple_music_link: apple_music_link || null,
        artwork_link: artwork_link || null
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to insert portfolio", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all portfolio items
export async function GET(request: NextRequest) {
  try {
    // Log environment check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

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

    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .order("priority_order", { ascending: true, nullsFirst: false })
      .order("release_date_aggregator", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch portfolio", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT - Update portfolio item
export async function PUT(request: NextRequest) {
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
    if (profile?.staff_role) allRoles.push(...profile.staff_role);

    const isAdmin = allRoles.includes("admin") || allRoles.includes("owner");
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("portfolio")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update portfolio", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete portfolio item
export async function DELETE(request: NextRequest) {
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
    if (profile?.staff_role) allRoles.push(...profile.staff_role);

    const isAdmin = allRoles.includes("admin") || allRoles.includes("owner");
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("portfolio")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete portfolio", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
