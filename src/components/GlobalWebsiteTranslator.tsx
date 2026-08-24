"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import translations from "@/i18n/generated-translations.json";
import { translationOverrides } from "@/i18n/translation-overrides";

type Translation = { id?: string; en?: string };
const dictionary = { ...(translations as Record<string, Translation>), ...translationOverrides };
let originalText = new WeakMap<Text, string>();
let originalAttributes = new WeakMap<Element, Map<string, string>>();
const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;

export function translateWebsiteText(value: string, language: "id" | "en") {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const key = value.trim().replace(/\s+/g, " ");
  let result = dictionary[key]?.[language];
  if (!result && language === "id") {
    const step = key.match(/^Step (\d+) of (\d+)$/i);
    const loading = key.match(/^Loading (.+?)(?:\.{3}|…)?$/i);
    if (step) result = `Langkah ${step[1]} dari ${step[2]}`;
    else if (loading) result = `Memuat ${loading[1].toLowerCase()}…`;
  }
  return result && result !== key ? `${leading}${result}${trailing}` : value;
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
      const source = originalText.get(node) ?? node.data;
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
      const source = originals.get(attribute) ?? current;
      const next = translateWebsiteText(source, language);
      if (current !== next) element.setAttribute(attribute, next);
    }
  }
}

export default function GlobalWebsiteTranslator() {
  const { language } = useLanguage();

  useEffect(() => {
    // React components that use `pick()` have already rendered the new language
    // by the time this effect runs. Reset the source snapshots so the global
    // layer complements those components instead of restoring stale copy.
    originalText = new WeakMap<Text, string>();
    originalAttributes = new WeakMap<Element, Map<string, string>>();
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
