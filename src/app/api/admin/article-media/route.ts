import { NextResponse } from "next/server";

import {
  apiAuthErrorResponse,
  requireAdminRequest,
} from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported image format" }, { status: 415 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be 10 MB or smaller" }, { status: 413 });

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const objectPath = `${auth.user.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const { error } = await admin.storage.from("article-media").upload(objectPath, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;

    const { data } = admin.storage.from("article-media").getPublicUrl(objectPath);
    return NextResponse.json({ url: data.publicUrl, path: objectPath });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[article-media] upload failed", error);
    return NextResponse.json({ error: "Unable to upload image" }, { status: 500 });
  }
}
