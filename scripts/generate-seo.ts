/* eslint-disable no-console */
import fg from "fast-glob";
import { parse } from "node-html-parser";
import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import type { SeoDoc, SeoDB } from "../src/lib/seo-types";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ROOT = process.cwd();

const STOP = new Set([
  "the","a","an","and","or","but","for","nor","on","in","to","of","with","by","from","at","as",
  "is","are","was","were","be","been","being","it","this","that","these","those","you","your",
  "we","our","us",
  // dev/build noise:
  "next","app","pages","internals","browser","static","chunks","node","modules","dist","null","light","dark"
]);

function norm(txt: string | undefined | null): string {
  return (txt ?? "").replace(/\s+/g, " ").replace(/\u00A0/g, " ").trim();
}

function pickFirstNonEmptyText(root: any, selector: string, minLen = 40): string | null {
  const nodes = root.querySelectorAll(selector) ?? [];
  for (const n of nodes) {
    const t = norm(n.text);
    if (t && t.length >= minLen) return t;
  }
  return null;
}

function toRoute(appFile: string): `/${string}` | null {
  let rel = appFile.replace(/\\/g, "/").replace(/^src\/app\//, "");
  rel = rel.replace(/(?:^|\/)page\.[tj]sx?$/, ""); // <-- FIX utama
  if (rel.includes("/api/")) return null;
  rel = rel.replace(/\(([^)]+)\)\//g, "");
  if (rel === "") return "/";               // root
  if (/\[.*\]/.test(rel)) return null;
  if (/\.old|\.backup|\.oldd/.test(rel)) return null;
  return ("/" + rel) as `/${string}`;
}

function keywordsFrom(text: string, limit = 8): string[] {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]+/gu, " ").split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (STOP.has(w)) continue;
    if (w.length < 3) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

async function fetchHtml(route: `/${string}`): Promise<string> {
  const res = await fetch(`${BASE_URL}${route}`, { headers: { accept: "text/html" } });
  if (!res.ok) throw new Error(`Fetch ${route} -> ${res.status}`);
  return await res.text();
}

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0] ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)
    .join(" ");
}

function labelFromRoute(route: `/${string}`): string {
  if (route === "/") return "Home";
  const seg = route.split("/").filter(Boolean).slice(-1)[0] ?? "";
  // ganti dash dengan spasi lalu Title Case
  return titleCaseWords(seg.replace(/[-_]+/g, " "));
}

/**
 * Normalize an image URL into a path-only value.
 * - Preserves pathname and search (query string) but removes origin.
 * - Returns a safe default if input is missing or invalid.
 */
function normalizeImage(src: string | null | undefined): string {
  if (!src) return "/og-default.jpg";
  try {
    // Use BASE_URL as base so relative URLs resolve properly
    const u = new URL(src, BASE_URL);
    return (u.pathname || "/") + (u.search || "");
  } catch {
    return "/og-default.jpg";
  }
}

function extract(html: string, route: `/${string}`): SeoDoc {
  const root = parse(html);

  // Cari "main" yang benar-benar konten
  const main =
    root.querySelector("main") ||
    root.querySelector('[role="main"]') ||
    root.querySelector("#__next") ||
    root;

  // Title: lebihkan H1 → OG Title → <title>
  const h1 = norm(main.querySelector("h1")?.text) || null;
  const titleTag = norm(root.querySelector("title")?.text);
  const siteName =
    (titleTag && (titleTag.split("—")[0] || titleTag.split("|")[0])?.trim()) || "FMG Universe";

  const label = labelFromRoute(route);

  // Root page: pakai <title> asli (biasanya sudah lengkap). Halaman lain: "Site — Label"
  const title = route === "/" ? (titleTag || `${siteName} — Home`) : `${siteName} — ${label}`;

  // Description: utamakan paragraf konten (di <main>), baru fallback ke meta
  const p1 =
    pickFirstNonEmptyText(main, "p, article p, section p", 60) ||
    pickFirstNonEmptyText(main, "li", 60) ||
    norm(root.querySelector('meta[name="description"]')?.getAttribute("content")) ||
    "";

  const description = p1.length > 180 ? `${p1.slice(0, 177)}…` : p1;

  // OG image (normalized to path only)
  const rawOg = norm(root.querySelector('meta[property="og:image"]')?.getAttribute("content"));
  const ogImg = normalizeImage(rawOg || "/og-default.jpg");

  // Keywords: ambil dari teks di <main> saja (hindari <script> dev noise)
  const forKw = norm(
    [
      h1 ?? "",
      pickFirstNonEmptyText(main, "p, article p, section p", 30) ?? "",
      pickFirstNonEmptyText(main, "h2, h3", 20) ?? ""
    ].join(" ")
  );

  const keywords = keywordsFrom(forKw);

  return { path: route, title, description, image: ogImg, keywords };
}

async function loadDynamicRouteSamples(): Promise<Record<string, `/${string}`[]>> {
  try {
    const configPath = path.join(ROOT, "seo.routes.config.ts");
    const mod = (await import(pathToFileURL(configPath).href)) as {
      dynamicRouteSamples?: Record<string, `/${string}`[]>;
    };
    return mod.dynamicRouteSamples ?? {};
  } catch {
    return {};
  }
}

async function main() {
  // 1) kumpulkan route statis
  const files = await fg(["src/app/**/page.@(tsx|ts|jsx|js)"], {
    cwd: ROOT,
    ignore: ["**/*.old*", "**/*.backup*", "**/*.oldd*"],
  });

  const staticRoutes: `/${string}`[] = [];
  for (const f of files) {
    const r = toRoute(f);
    if (r) staticRoutes.push(r);
  }

  // 2) tambahkan dynamic dari config (via dynamic import)
  const dynConfig = await loadDynamicRouteSamples();
  const dynamicRoutes = Object.values(dynConfig).flat() as `/${string}`[];

  // 3) filter publik — list prefix yang HARUS DIKECUALIKAN
  const EXCLUDE_PREFIXES = [
    "/admin",
    "/client",
    "/auth",
    "/api",
    "/login",
    "/signup",
    "/payments",
    "/profile",
    "/ui",
    "/debug",
  ];

  const isPublicRoute = (r: string) => !EXCLUDE_PREFIXES.some((p) => r === p || r.startsWith(p + "/") || r.startsWith(p));

  const routes = Array.from(new Set([...staticRoutes, ...dynamicRoutes])).filter((r) => isPublicRoute(r));

  console.log(`Crawling ${routes.length} routes from ${BASE_URL}`);
  if (routes.length === 0) {
    console.warn("No routes discovered — check your src/app pages or BASE_URL environment variable.");
  }

  const db: SeoDB = {};
  for (const r of routes) {
    try {
      const html = await fetchHtml(r);
      db[r] = extract(html, r);
      console.log("✓", r);
    } catch (e) {
      console.warn("✗", r, String(e));
    }
  }

  const outPath = path.join(ROOT, "src/seo/metadata.generated.ts");
  await mkdir(path.dirname(outPath), { recursive: true });
  const header = `/* AUTO-GENERATED. Do not edit manually. */
import type { SeoDB } from "@/lib/seo-types";
export const SEO_DB: SeoDB = `;
  const body = JSON.stringify(db, null, 2);
  await writeFile(outPath, `${header}${body} as const;\n`);
  console.log("Wrote:", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
