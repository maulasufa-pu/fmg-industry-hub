import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Create client dengan JWT token untuk validasi user
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Use service role client untuk bypass RLS
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate filename
    const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Upload to storage dengan service role
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from("avatars")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Update profile dengan service role
    const { error: updateError } = await serviceSupabase
      .from("profiles")
      .update({ avatar_path: uploadData.path })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      message: "Avatar uploaded successfully"
    });

  } catch (error) {
    console.error("Avatar upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
