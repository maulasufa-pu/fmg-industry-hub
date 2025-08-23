/* eslint-disable no-console */
import fg from "fast-glob";
import fs from "fs/promises";
import path from "node:path";

const ROOT = process.cwd();

function toRoute(appFile: string): `/${string}` | null {
  let rel = appFile.replace(/\\/g, "/").replace(/^src\/app\//, "");
  rel = rel.replace(/(?:^|\/)page\.[tj]sx?$/, ""); // handle root page
  if (rel.includes("/api/")) return null;
  rel = rel.replace(/\(([^)]+)\)\//g, "");
  if (rel === "") return "/";
  if (/\[.*\]/.test(rel)) return null;
  if (/\.old|\.backup|\.oldd/.test(rel)) return null;
  return ("/" + rel) as `/${string}`;
}

function isPriv(route: `/${string}`): boolean {
  return (
    // route.startsWith("/admin") ||
    // route.startsWith("/client") ||
    route.startsWith("/auth") ||
    route.startsWith("/api") 
    // route.startsWith("/payments") ||
    // route.startsWith("/profile") ||
    // route.startsWith("/ui") ||
    // route.startsWith("/debug")
  );
}

function hasUseClient(src: string): boolean {
  const first500 = src.slice(0, 500);
  return /["']use client["']/.test(first500);
}

function hasMetadataExport(src: string): boolean {
  // deteksi berbagai bentuk export metadata (dengan/ tanpa tipe)
  return (
    /\bexport\s+(?:const|let|var)\s+metadata\b/.test(src) ||
    /\bexport\s+async\s+function\s+generateMetadata\b/.test(src)
  );
}

function hasSeoInjectedMarker(src: string): boolean {
  return src.includes("@seo-injected");
}

function hasSeoFromDB(src: string): boolean {
  return /seoFromDB\s*\(/.test(src) && /from\s+["']@\/lib\/seo-loader["']/.test(src);
}

function ensureImports(code: string): string {
  let out = code;
  const needMetaType = !/import\s+type\s+\{\s*Metadata\s*\}\s+from\s+["']next["']/.test(out);
  const needLoader = !/from\s+["']@\/lib\/seo-loader["']/.test(out);

  if (needMetaType || needLoader) {
    const importEndIdx = (() => {
      const matches = [...out.matchAll(/^import .*;$/gm)];
      return matches.length ? matches[matches.length - 1].index! + matches[matches.length - 1][0].length : 0;
    })();

    let add = "";
    if (needMetaType) add += `\nimport type { Metadata } from "next";`;
    if (needLoader) add += `\nimport { seoFromDB } from "@/lib/seo-loader";`;
    out = out.slice(0, importEndIdx) + add + out.slice(importEndIdx);
  }
  return out;
}

async function run() {
  const files = await fg(["src/app/**/page.@(tsx|ts|jsx|js)"], {
    cwd: ROOT,
    ignore: ["**/*.old*", "**/*.backup*", "**/*.oldd*"],
  });

  for (const f of files) {
    const route = toRoute(f);
    if (!route) continue;
    if (isPriv(route)) continue;

    const abs = path.join(ROOT, f);
    const code = await fs.readFile(abs, "utf8");

    if (hasUseClient(code)) {
      console.log(`skip (client page)   -> ${route}`);
      continue;
    }

    // Jika sudah ada metadata export / generateMetadata / atau sudah di-inject, jangan inject lagi
    if (hasMetadataExport(code) || hasSeoInjectedMarker(code) || hasSeoFromDB(code)) {
      console.log(`keep (exists)        -> ${route}`);
      continue;
    }

    // Tambah import bila perlu
    let newCode = ensureImports(code);

    // Sisipkan block injeksi setelah imports
    const insertIdx = (() => {
      const matches = [...newCode.matchAll(/^import .*;$/gm)];
      return matches.length ? matches[matches.length - 1].index! + matches[matches.length - 1][0].length + 1 : 0;
    })();

    const injectBlock = `
// @seo-injected
export const metadata: Metadata = seoFromDB("${route}");
`;
    newCode = newCode.slice(0, insertIdx) + injectBlock + newCode.slice(insertIdx);

    await fs.writeFile(abs, newCode, "utf8");
    console.log(`injected              -> ${route}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
