import "server-only";

type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as typeof globalThis & {
  __fmgRateLimitBuckets?: Map<string, Bucket>;
};

const buckets =
  globalBuckets.__fmgRateLimitBuckets ??
  (globalBuckets.__fmgRateLimitBuckets = new Map<string, Bucket>());

export function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
export function consumeRateLimit(
  request: Request,
  namespace: string,
  limit: number,
  windowMs: number,
  identity?: string,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const key = `${namespace}:${identity || requestIp(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
