"use client";

import { Languages } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

export default function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return (
    <label className={`inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-neutral-900 dark:text-white ${mobile ? "h-10 w-full" : "h-9"}`}>
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="min-w-0 cursor-pointer bg-transparent text-sm font-semibold outline-none"
      >
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
