import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { elevenLabsApiKey, elevenLabsError, elevenLabsUrl, safeDownloadName } from "@/lib/elevenlabs/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["aac", "aiff", "flac", "m4a", "mp3", "mp4", "ogg", "opus", "wav", "webm"]);

function extensionOf(filename: string): string {
  return filename.toLowerCase().split(".").pop() || "";
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const auth = await requireAuthenticatedRequest(request);
    const rate = consumeRateLimit(request, "tunexpert-isolation", 8, 60 * 60_000, auth.user.id);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Isolation limit reached. Try again after the cooldown." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "Choose an audio file first." }, { status: 400 });
    }
    if (audio.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "The file must be 4 MB or smaller." }, { status: 413 });
    }
    if (!ALLOWED_EXTENSIONS.has(extensionOf(audio.name))) {
      return NextResponse.json({ error: "Unsupported audio format." }, { status: 415 });
    }

    const upstreamForm = new FormData();
    upstreamForm.append("audio", audio, safeDownloadName(audio.name, "audio-input"));
    upstreamForm.append("file_format", "other");

    const upstream = await fetch(elevenLabsUrl("/audio-isolation"), {
      method: "POST",
      headers: { "xi-api-key": elevenLabsApiKey() },
      body: upstreamForm,
      cache: "no-store",
      signal: AbortSignal.timeout(280_000),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: await elevenLabsError(upstream) },
        { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 },
      );
    }

    const basename = audio.name.replace(/\.[^.]+$/, "");
    const filename = `${safeDownloadName(basename, "audio")}-isolated.mp3`;
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { error: timedOut ? "Audio isolation timed out. Try a shorter file." : "Unable to isolate this audio right now." },
      { status: timedOut ? 504 : 500 },
    );
  }
}
