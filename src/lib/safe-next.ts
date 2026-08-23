export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/client/dashboard",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function withNext(path: string, next: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}next=${encodeURIComponent(next)}`;
}
