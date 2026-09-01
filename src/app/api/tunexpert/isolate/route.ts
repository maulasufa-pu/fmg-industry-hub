import crypto from "node:crypto";
import { parseBuffer } from "music-metadata";
import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { elevenLabsApiKey, elevenLabsError, elevenLabsUrl, safeDownloadName } from "@/lib/elevenlabs/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { tuneXpertCreditsForSeconds } from "@/lib/tunexpert/billing";
import { completeTuneXpertJob, refundTuneXpertJob, reserveTuneXpertJob, TuneXpertInsufficientCreditsError } from "@/lib/tunexpert/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_DURATION_SECONDS = 20 * 60;
const ALLOWED_EXTENSIONS = new Set(["aac", "aiff", "flac", "m4a", "mp3", "mp4", "ogg", "opus", "wav", "webm"]);

function extensionOf(filename: string): string {
  return filename.toLowerCase().split(".").pop() || "";
}

export async function POST(request: Request): Promise<NextResponse> {
  let reservedJobId: string | null = null;
  let shouldRefund = false;
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

    const bytes = new Uint8Array(await audio.arrayBuffer());
    let durationSeconds: number;
    try {
      const metadata = await parseBuffer(bytes, { mimeType: audio.type || undefined, size: audio.size });
      durationSeconds = Math.ceil(metadata.format.duration ?? 0);
    } catch {
      return NextResponse.json({ error: "Unable to read the audio duration." }, { status: 422 });
    }
    if (!durationSeconds) return NextResponse.json({ error: "The audio duration could not be detected." }, { status: 422 });
    if (durationSeconds > MAX_DURATION_SECONDS) {
      return NextResponse.json({ error: "Audio must be 20 minutes or shorter." }, { status: 413 });
    }

    const costCredits = tuneXpertCreditsForSeconds(durationSeconds);
    reservedJobId = crypto.randomUUID();
    const balanceAfter = await reserveTuneXpertJob({
      userId: auth.user.id,
      jobId: reservedJobId,
      jobType: "isolation",
      costCredits,
      usageSeconds: durationSeconds,
      requestSummary: { filename: safeDownloadName(audio.name, "audio-input"), size: audio.size },
    });
    shouldRefund = true;

    const upstreamForm = new FormData();
    upstreamForm.append("audio", new Blob([bytes], { type: audio.type }), safeDownloadName(audio.name, "audio-input"));
    upstreamForm.append("file_format", "other");

    const upstream = await fetch(elevenLabsUrl("/audio-isolation"), {
      method: "POST",
      headers: { "xi-api-key": elevenLabsApiKey() },
      body: upstreamForm,
      cache: "no-store",
      signal: AbortSignal.timeout(280_000),
    });

    if (!upstream.ok || !upstream.body) {
      const upstreamError = await elevenLabsError(upstream);
      await refundTuneXpertJob(reservedJobId, upstreamError);
      shouldRefund = false;
      return NextResponse.json(
        { error: upstreamError },
        { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 },
      );
    }

    shouldRefund = false;
    const historyItemId = upstream.headers.get("history-item-id");
    await completeTuneXpertJob(reservedJobId, historyItemId).catch(() => undefined);

    const basename = audio.name.replace(/\.[^.]+$/, "");
    const filename = `${safeDownloadName(basename, "audio")}-isolated.mp3`;
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "X-Content-Type-Options": "nosniff",
        "X-TuneXpert-Cost": String(costCredits),
        "X-TuneXpert-Balance": String(balanceAfter),
      },
    });
  } catch (error: unknown) {
    if (reservedJobId && shouldRefund) {
      await refundTuneXpertJob(reservedJobId, error instanceof Error ? error.message : "Audio isolation failed");
    }
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof TuneXpertInsufficientCreditsError) {
      return NextResponse.json(
        { error: "Not enough tuneXpert credits.", code: "INSUFFICIENT_CREDITS", balance: error.balance, cost: error.cost },
        { status: 402 },
      );
    }
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { error: timedOut ? "Audio isolation timed out. Try a shorter file." : "Unable to isolate this audio right now." },
      { status: timedOut ? 504 : 500 },
    );
  }
}
