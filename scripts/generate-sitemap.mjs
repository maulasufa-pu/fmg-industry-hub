import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const command = "node_modules/next-sitemap/bin/next-sitemap.mjs";
let lastOutput = "";

for (let attempt = 1; attempt <= 3; attempt += 1) {
  const result = spawnSync(process.execPath, [command], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
  lastOutput = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const reportedError = /(?:❌|\[next-sitemap\]\s+Error:)/i.test(lastOutput);

  if (result.status === 0 && !reportedError) {
    const [index, sitemap] = await Promise.all([
      readFile("public/sitemap.xml", "utf8"),
      readFile("public/sitemap-0.xml", "utf8"),
    ]);
    if (index.includes("<sitemapindex") && sitemap.includes("<urlset")) {
      process.stdout.write(lastOutput);
      process.exit(0);
    }
  }

  if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 300));
}

process.stderr.write(lastOutput || "[sitemap] Generator failed without output.\n");
process.exit(1);
