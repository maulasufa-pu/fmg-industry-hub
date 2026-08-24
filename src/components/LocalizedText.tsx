"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function LocalizedText({ id, en }: { id: string; en: string }) {
  const { pick } = useLanguage();
  return <>{pick(id, en)}</>;
}
