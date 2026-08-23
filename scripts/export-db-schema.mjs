import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const isWindows = process.platform === "win32";
const dryRun = spawnSync(
  "npx",
  ["supabase", "db", "dump", "--linked", "--dry-run"],
  { encoding: "utf8", shell: isWindows, maxBuffer: 10 * 1024 * 1024 },
);
if (dryRun.status !== 0) throw new Error("Supabase CLI could not create a temporary read-only database login.");

const output = `${dryRun.stdout ?? ""}${dryRun.stderr ?? ""}`;
const connection = {};
for (const match of output.matchAll(/^export (PG[A-Z]+)=(?:"([^"]*)"|([^\r\n]+))$/gm)) {
  connection[match[1]] = match[2] ?? match[3];
}
for (const key of ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"]) {
  if (!connection[key]) throw new Error(`Supabase CLI did not provide ${key}.`);
}

const excludedSchemas = "information_schema|pg_*|_analytics|_realtime|_supavisor|auth|etl|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault";
const dump = spawnSync(
  "pg_dump",
  [
    "--schema-only",
    "--quote-all-identifiers",
    "--no-password",
    "--role", "postgres",
    "--exclude-schema", excludedSchemas,
  ],
  {
    encoding: "utf8",
    env: { ...process.env, ...connection },
    maxBuffer: 100 * 1024 * 1024,
    shell: false,
  },
);
connection.PGPASSWORD = "";
if (dump.status !== 0 || !dump.stdout) throw new Error("Local pg_dump could not export the linked schema. Install PostgreSQL client tools and retry.");

const schema = dump.stdout
  .replace(/^\\(un)?restrict .*$/gm, "")
  .replace(/^SET transaction_timeout = 0;$/gm, "")
  .replace(/\r\n/g, "\n")
  .trim();
await writeFile("supabase/schema.sql", `${schema}\n`, "utf8");
console.log(`[database] Wrote linked public schema snapshot (${Buffer.byteLength(schema)} bytes) without credentials or table data.`);
