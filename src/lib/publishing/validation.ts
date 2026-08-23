import "server-only";

type Split = { party?: unknown; percentage?: unknown };

export type PublishingMetadata = {
  title?: unknown;
  artist_name?: unknown;
  isrc?: unknown;
  release_date?: unknown;
  label_name?: unknown;
  copyright_c?: unknown;
  copyright_p?: unknown;
  language?: unknown;
  primary_genre?: unknown;
  artwork_path?: unknown;
  artwork_url?: unknown;
  royalty_splits?: unknown;
};

export function validatePublishingMetadata(input: PublishingMetadata): string[] {
  const errors: string[] = [];
  const required: Array<[keyof PublishingMetadata, string]> = [
    ["title", "Project title"],
    ["artist_name", "Artist name"],
    ["release_date", "Release date"],
    ["label_name", "Label name"],
    ["copyright_c", "Composition copyright"],
    ["copyright_p", "Sound-recording copyright"],
    ["language", "Language"],
    ["primary_genre", "Primary genre"],
  ];
  required.forEach(([key, label]) => {
    if (typeof input[key] !== "string" || !input[key]?.toString().trim()) errors.push(`${label} is required.`);
  });

  const isrc = typeof input.isrc === "string" ? input.isrc.replace(/-/g, "").toUpperCase() : "";
  if (!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc)) errors.push("ISRC must contain a valid 12-character code.");
  if (!input.artwork_path && !input.artwork_url) errors.push("Release artwork is required.");

  if (typeof input.release_date === "string" && input.release_date) {
    const date = new Date(`${input.release_date}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) errors.push("Release date is invalid.");
    else if (date.getTime() < Date.now() - 86_400_000) errors.push("Release date cannot be in the past.");
  }

  const splits = Array.isArray(input.royalty_splits) ? (input.royalty_splits as Split[]) : [];
  if (splits.length > 0) {
    const total = splits.reduce((sum, split) => sum + Number(split.percentage || 0), 0);
    if (Math.abs(total - 100) > 0.01) errors.push("Royalty splits must total exactly 100% before submission.");
    if (splits.some((split) => !String(split.party || "").trim())) errors.push("Every royalty split needs a party name.");
  }
  return errors;
}
