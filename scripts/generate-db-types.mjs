import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const result = spawnSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--linked", "--schema", "public"],
  {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    shell: process.platform === "win32",
  },
);
if (result.error || result.status !== 0 || !result.stdout) {
  const detail = result.stderr || result.error?.message || "Supabase CLI returned no generated types.";
  process.stderr.write(`${detail}\n`);
  process.exit(result.status || 1);
}
writeFileSync("src/types/database.generated.ts", result.stdout.replace(/\r\n/g, "\n"));
console.log("[database] Generated src/types/database.generated.ts");
