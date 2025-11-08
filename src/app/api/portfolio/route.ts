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
      release_date,
      youtube_link,
      spotify_artwork,
      youtube_thumbnail,
      apple_music_artwork
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
        release_date: release_date || null,
        youtube_link: youtube_link || null,
        spotify_artwork: spotify_artwork || null,
        youtube_thumbnail: youtube_thumbnail || null,
        apple_music_artwork: apple_music_artwork || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      .order("release_date", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch portfolio", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
