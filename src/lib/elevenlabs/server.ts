import "server-only";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export function elevenLabsApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) throw new Error("ElevenLabs is not configured");
  return key;
}

export function elevenLabsUrl(path: string): string {
  return `${ELEVENLABS_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function errorFromPayload(payload: unknown): string | null {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return null;

  const value = payload as Record<string, unknown>;
  if (typeof value.message === "string") return value.message;
  if (typeof value.detail === "string") return value.detail;
  if (value.detail && typeof value.detail === "object") {
    const detail = value.detail as Record<string, unknown>;
    if (typeof detail.message === "string") return detail.message;
    if (typeof detail.status === "string") return detail.status.replaceAll("_", " ");
  }
  return null;
}

export async function elevenLabsError(response: Response): Promise<string> {
  const fallback = response.status === 401 || response.status === 403
    ? "ElevenLabs rejected the server credentials or account permissions."
    : response.status === 429
      ? "The ElevenLabs usage limit has been reached. Please try again later."
      : "ElevenLabs could not complete this request.";

  try {
    const raw = (await response.text()).slice(0, 8_000);
    const payload = JSON.parse(raw) as unknown;
    return errorFromPayload(payload) || fallback;
  } catch {
    return fallback;
  }
}

export function safeDownloadName(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}
