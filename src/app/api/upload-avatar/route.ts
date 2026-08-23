import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATARS: Record<string, { extension: string; signatures: number[][] }> = {
  "image/jpeg": { extension: "jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },
};

function hasSignature(bytes: Uint8Array, signatures: number[][]): boolean {
  return signatures.some((signature) => signature.every((value, index) => bytes[index] === value));
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
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
    const rate = consumeRateLimit(request, "avatar-upload", 10, 60 * 60_000, user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many upload attempts" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const allowed = ALLOWED_AVATARS[file.type];
    if (!allowed) return NextResponse.json({ error: "Avatar must be JPEG, PNG, or WebP" }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) return NextResponse.json({ error: "Avatar must be smaller than 5 MB" }, { status: 413 });

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const fileBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fileBuffer);
    if (!hasSignature(bytes, allowed.signatures)) return NextResponse.json({ error: "File content does not match its image type" }, { status: 415 });
    if (file.type === "image/webp" && String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") {
      return NextResponse.json({ error: "Invalid WebP image" }, { status: 415 });
    }
    const fileName = `${user.id}/${crypto.randomUUID()}.${allowed.extension}`;

    const { data: oldProfile } = await serviceSupabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .maybeSingle();
    
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from("avatars")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      //console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Unable to store avatar" }, { status: 500 });
    }

    const { error: updateError } = await serviceSupabase
      .from("profiles")
      .update({ avatar_path: uploadData.path })
      .eq("id", user.id);

    if (updateError) {
      await serviceSupabase.storage.from("avatars").remove([uploadData.path]);
      //console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Unable to update avatar" }, { status: 500 });
    }

    if (oldProfile?.avatar_path && oldProfile.avatar_path !== uploadData.path) {
      await serviceSupabase.storage.from("avatars").remove([oldProfile.avatar_path]);
    }

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      message: "Avatar uploaded successfully"
    });

  } catch (error) {
    //console.error("Avatar upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
