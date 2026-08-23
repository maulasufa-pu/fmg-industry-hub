import { readdir, readFile, stat } from "node:fs/promises";

const names = (await readdir("supabase/migrations")).filter((name) => name.endsWith(".sql"));
const invalid = names.filter((name) => !/^\d{12,14}_[a-z0-9_]+\.sql$/.test(name));
const malformed = [];
const contents = new Map();
for (const name of names) {
  const sql = (await readFile(`supabase/migrations/${name}`, "utf8")).trim().toLowerCase();
  contents.set(name, sql);
  if (!sql.includes("begin;") || !sql.endsWith("commit;")) malformed.push(name);
}

const requiredMigrationChecks = [
  ["202608230002_p2_privacy_and_reliability.sql", "create table if not exists public.data_privacy_requests"],
  ["202608230002_p2_privacy_and_reliability.sql", "create table if not exists public.app_error_events"],
  ["202608230003_core_rls_hardening.sql", 'drop policy if exists "view can read projects"'],
  ["202608230003_core_rls_hardening.sql", "create or replace function public.can_manage_project"],
  ["202608230003_core_rls_hardening.sql", "revoke update on public.profiles from authenticated"],
  ["202608230003_core_rls_hardening.sql", "create policy meetings_participant_select"],
];
const missingGuards = requiredMigrationChecks.filter(
  ([name, pattern]) => !contents.get(name)?.includes(pattern),
);

let schemaProblem = "";
try {
  const schemaStats = await stat("supabase/schema.sql");
  const schema = (await readFile("supabase/schema.sql", "utf8")).toLowerCase();
  const requiredSchemaPatterns = [
    'create table "public"."projects"',
    'create table "public"."profiles"',
    'create table "public"."invoices"',
    'create table "public"."portfolio"',
    "create policy",
    "enable row level security",
  ];
  if (schemaStats.size < 100_000) schemaProblem = `schema snapshot is unexpectedly small (${schemaStats.size} bytes)`;
  const missing = requiredSchemaPatterns.filter((pattern) => !schema.includes(pattern));
  if (missing.length) schemaProblem = `schema snapshot is missing: ${missing.join(", ")}`;
} catch (error) {
  schemaProblem = `schema snapshot cannot be read: ${error.message}`;
}

if (invalid.length || malformed.length || missingGuards.length || schemaProblem) {
  if (invalid.length) console.error(`[migrations] Invalid names: ${invalid.join(", ")}`);
  if (malformed.length) console.error(`[migrations] Missing transaction: ${malformed.join(", ")}`);
  if (missingGuards.length) {
    console.error(`[migrations] Missing security guards: ${missingGuards.map(([name, pattern]) => `${name}: ${pattern}`).join("; ")}`);
  }
  if (schemaProblem) console.error(`[migrations] ${schemaProblem}`);
  process.exit(1);
}
console.log(`[migrations] ${names.length} migrations and the live schema snapshot passed repository checks.`);
