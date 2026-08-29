import type { Language } from "@/contexts/LanguageContext";

export type LanguageRoutePair = Readonly<{ en: string; id: string }>;

export const languageRoutePairs: readonly LanguageRoutePair[] = [
  { en: "/", id: "/id" },
  { en: "/arrangement", id: "/id/jasa-aransemen-lagu" },
  { en: "/song-creation-service", id: "/id/jasa-pembuatan-lagu" },
  { en: "/learn/how-to-make-a-song", id: "/id/cara-bikin-lagu" },
  { en: "/services", id: "/id/layanan" },
  { en: "/pricing", id: "/id/harga" },
  { en: "/portfolio", id: "/id/portofolio" },
  { en: "/contact", id: "/id/kontak" },
] as const;

const routeLookup = new Map<string, LanguageRoutePair>();
for (const pair of languageRoutePairs) {
  routeLookup.set(pair.en, pair);
  routeLookup.set(pair.id, pair);
}

const indonesianFallbacks: Record<string, string> = {
  "/id": "/",
  "/id/biaya-pembuatan-lagu": "/pricing",
  "/id/cara-memilih-jasa-aransemen-lagu": "/arrangement",
  "/id/jasa-editing-vokal": "/services",
  "/id/jasa-mixing-mastering-lagu": "/services",
  "/id/jasa-pembuatan-jingle": "/song-creation-service",
  "/id/jasa-pembuatan-soundtrack": "/song-creation-service",
  "/id/jasa-produksi-musik": "/song-creation-service",
  "/id/perbedaan-komposer-arranger-produser-musik": "/learn/how-to-make-a-song",
  "/id/perbedaan-mixing-dan-mastering": "/learn/how-to-make-a-song",
  "/id/persiapan-rekaman-vokal": "/learn/how-to-make-a-song",
};

export function localizedPathFor(pathname: string, language: Language): string | null {
  const pair = routeLookup.get(pathname);
  if (pair) return pair[language];
  if (language === "en" && pathname.startsWith("/id/")) {
    return indonesianFallbacks[pathname] ?? "/services";
  }
  return null;
}
