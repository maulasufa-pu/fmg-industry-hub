/* eslint-disable no-console */
import fg from "fast-glob";
import fs from "fs/promises";
import path from "node:path";
const ROOT = process.cwd();

const RE_INJECT =
  /(?:\/\/\s*@seo-injected\s*\r?\n)?export\s+const\s+metadata(?:\s*:\s*Metadata)?\s*=\s*seoFromDB\([^)]*\);\s*\r?\n?/g;
const RE_IMP_META = /import\s+type\s+\{\s*Metadata\s*\}\s+from\s+["']next["'];?\r?\n?/g;
const RE_IMP_LOADER = /import\s+\{\s*seoFromDB\s*\}\s+from\s+["']@\/lib\/seo-loader["'];?\r?\n?/g;

async function run() {
  const files = await fg(["src/app/**/page.@(tsx|ts|jsx|js)"], {
    cwd: ROOT,
    ignore: ["**/*.old*", "**/*.backup*", "**/*.oldd*"],
  });
  for (const f of files) {
    const abs = path.join(ROOT, f);
    let code = await fs.readFile(abs, "utf8");
    const orig = code;

    // keep only first metadata injection (seoFromDB)
    const injMatches = [...code.matchAll(RE_INJECT)];
    if (injMatches.length > 1) {
      let first = true;
      code = code.replace(RE_INJECT, (m) => (first ? ((first = false), m) : ""));
    }

    // dedupe imports
    const metaMatches = [...code.matchAll(RE_IMP_META)];
    if (metaMatches.length > 1) {
      let first = true;
      code = code.replace(RE_IMP_META, (m) => (first ? ((first = false), m) : ""));
    }
    const loaderMatches = [...code.matchAll(RE_IMP_LOADER)];
    if (loaderMatches.length > 1) {
      let first = true;
      code = code.replace(RE_IMP_LOADER, (m) => (first ? ((first = false), m) : ""));
    }

    if (code !== orig) {
      await fs.writeFile(abs, code, "utf8");
      console.log("deduped ->", f);
    }
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
