import process from "node:process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const required = ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const errors = [];
for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value || /YOUR_|REPLACE_WITH|example\.com/i.test(value)) errors.push(`${key} is missing or still contains a placeholder`);
}
for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  try { new URL(process.env[key] ?? ""); } catch { errors.push(`${key} must be an absolute URL`); }
}
if (process.env.NEXT_PUBLIC_SITE_URL) { try { new URL(process.env.NEXT_PUBLIC_SITE_URL); } catch { errors.push("NEXT_PUBLIC_SITE_URL must be an absolute URL when set"); } }
if (process.env.OWNER_BOOTSTRAP_CODE && process.env.OWNER_BOOTSTRAP_CODE.length < 32) errors.push("OWNER_BOOTSTRAP_CODE must be at least 32 characters");
if (errors.length) {
  console.error(`[env] ${errors.join("\n[env] ")}`);
  process.exit(1);
}
console.log("[env] Required environment variables are valid.");
