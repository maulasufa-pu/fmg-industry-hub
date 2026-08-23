import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

async function files(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await files(target));
    else output.push(target);
  }
  return output;
}

async function gzipBytes(file) {
  return gzipSync(await readFile(file)).length;
}

const failures = [];
const publicFiles = await files("public");
const publicBytes = (await Promise.all(publicFiles.map((file) => stat(file)))).reduce((sum, item) => sum + item.size, 0);
if (publicBytes > 20 * 1024 * 1024) failures.push(`public is ${(publicBytes / 1024 / 1024).toFixed(1)} MB; budget is 20 MB`);

for (const file of publicFiles.filter((item) => /[\\/]videos[\\/].+\.(ts|m4s|mp4)$/i.test(item))) {
  const bytes = (await stat(file)).size;
  if (bytes > 1.5 * 1024 * 1024) failures.push(`${file} is ${(bytes / 1024 / 1024).toFixed(2)} MB; media-file budget is 1.5 MB`);
}

const chunkRoot = path.join(".next", "static", "chunks");
const chunkFiles = (await files(chunkRoot)).filter((file) => file.endsWith(".js"));
for (const file of chunkFiles) {
  const bytes = await gzipBytes(file);
  if (bytes > 180 * 1024) failures.push(`${file} is ${(bytes / 1024).toFixed(0)} KB gzip; single-chunk budget is 180 KB`);
}

const routeManifests = (await files(path.join(".next", "server", "app"))).filter((file) => file.endsWith("_client-reference-manifest.js"));
const routeTotals = [];
for (const manifestPath of routeManifests) {
  const line = (await readFile(manifestPath, "utf8")).split(/\r?\n/).find((item) => item.includes("__RSC_MANIFEST[") && item.includes(" = {"));
  if (!line) continue;
  const routeMatch = line.match(/__RSC_MANIFEST\["([^"]+)"\]/);
  const jsonStart = line.indexOf(" = ");
  if (!routeMatch || jsonStart < 0) continue;
  const manifest = JSON.parse(line.slice(jsonStart + 3, -1));
  const routeChunks = new Set(Object.values(manifest.entryJSFiles ?? {}).flat());
  let total = 0;
  for (const chunk of routeChunks) total += await gzipBytes(path.join(".next", chunk));
  routeTotals.push({ route: routeMatch[1], total });
  if (total > 300 * 1024) failures.push(`${routeMatch[1]} loads ${(total / 1024).toFixed(0)} KB gzip; route budget is 300 KB`);
}

routeTotals.sort((a, b) => b.total - a.total);
if (failures.length) {
  console.error(failures.map((item) => `[performance] ${item}`).join("\n"));
  process.exit(1);
}
const heaviest = routeTotals[0];
console.log(`[performance] public ${(publicBytes / 1024 / 1024).toFixed(2)} MB; ${chunkFiles.length} chunks; heaviest route ${heaviest?.route ?? "n/a"} ${heaviest ? (heaviest.total / 1024).toFixed(0) : 0} KB gzip.`);
