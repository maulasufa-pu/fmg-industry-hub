"use client";

import { useLayoutEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import translations from "@/i18n/generated-translations.json";
import { translationOverrides } from "@/i18n/translation-overrides";

type Translation = { id?: string; en?: string };
const dictionary = { ...(translations as Record<string, Translation>), ...translationOverrides };
const reverseDictionary = new Map<string, Translation>();
for (const entry of Object.values(dictionary)) {
  if (entry.id) reverseDictionary.set(entry.id.replace(/\s+/g, " ").trim(), entry);
  if (entry.en) reverseDictionary.set(entry.en.replace(/\s+/g, " ").trim(), entry);
}
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;
const PROTECTED_COPY = new Set([
  "FLEMMO MUSIC",
  "Flemmo Music",
  "Flemmo Music Global",
  "Flemmo Music Global Publishing",
  "Flemmo Music Global (FMG) Publishing",
  "FMG Universe",
  "FMG UNIVERSE",
  "Global Universe Solution",
  "Beyond Sound. Built-in Intelligence",
  "Beyond Sound. Built-in Intelligence.",
  "“Beyond Sound. Built-in Intelligence.”",
  "Build Ecosystem • Spark Innovation • Foster Collaboration",
  "Build Ecosystem",
  "Spark Innovation",
  "Foster Collaboration",
  "A&R",
  "AI R&D",
  "Music Arrangement",
  "Arrangement",
  "Mixing",
  "Mastering",
  "Publishing",
  "Distribution",
  "ISRC",
  "ISWC",
  "IPI/CAE",
  "tuneXpert",
  "FMG Labs",
]);

export function translateWebsiteText(value: string, language: "id" | "en") {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const key = value.trim().replace(/\s+/g, " ");
  if (PROTECTED_COPY.has(key)) return value;
  const entry = dictionary[key] ?? reverseDictionary.get(key);
  let result = entry?.[language];
  if (!result && language === "id") {
    const step = key.match(/^Step (\d+) of (\d+)$/i);
    const loading = key.match(/^Loading (.+?)(?:\.{3}|…)?$/i);
    if (step) result = `Langkah ${step[1]} dari ${step[2]}`;
    else if (loading) result = `Memuat ${loading[1].toLowerCase()}…`;
  }
  return result && result !== key ? `${leading}${result}${trailing}` : value;
}

function hasTranslationSource(value: string) {
  const key = value.trim().replace(/\s+/g, " ");
  return Boolean(
    dictionary[key] ||
    reverseDictionary.has(key) ||
    /^Step \d+ of \d+$/i.test(key) ||
    /^Loading .+?(?:\.{3}|…)?$/i.test(key)
  );
}

function skip(element: Element | null) {
  return Boolean(element?.closest("script,style,code,pre,[data-no-translate]"));
}

function localize(root: ParentNode, language: "id" | "en") {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (!skip(node.parentElement) && node.data.trim()) {
      if (!originalText.has(node)) originalText.set(node, node.data);
      let source = originalText.get(node) ?? node.data;

      // React reuses text nodes for live values such as prices, totals, and
      // statuses. If the stored source is not translatable, a changed value is
      // fresh application state and must become the new source instead of
      // being overwritten with the first-render value.
      if (!hasTranslationSource(source) && node.data !== source) {
        source = node.data;
        originalText.set(node, source);
      }

      const next = translateWebsiteText(source, language);
      if (node.data !== next) node.data = next;
    }
    node = walker.nextNode() as Text | null;
  }

  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const element of elements) {
    if (skip(element)) continue;
    let originals = originalAttributes.get(element);
    if (!originals) {
      originals = new Map();
      originalAttributes.set(element, originals);
    }
    for (const attribute of ATTRIBUTES) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      if (!originals.has(attribute)) originals.set(attribute, current);
      let source = originals.get(attribute) ?? current;
      if (!hasTranslationSource(source) && current !== source) {
        source = current;
        originals.set(attribute, source);
      }
      const next = translateWebsiteText(source, language);
      if (current !== next) element.setAttribute(attribute, next);
    }
  }
}

export default function GlobalWebsiteTranslator() {
  const { language } = useLanguage();

  useLayoutEffect(() => {
    let queued = false;
    const run = () => {
      queued = false;
      localize(document.body, language);
    };
    run();
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(run);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
