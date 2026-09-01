import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/roles";

export class ApiAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export type ServerAuthContext = {
  user: User;
  mainRole: UserRole;
  staffRoles: UserRole[];
  effectiveRole: UserRole;
  isAdmin: boolean;
  mfaRequired: boolean;
  assuranceLevel: "aal1" | "aal2" | null;
};

const ROLE_PRIORITY: UserRole[] = [
  "owner",
  "admin",
  "anr",
  "producer",
  "composer",
  "engineer",
  "publisher",
  "client",
  "guest",
];

function configuredOwnerEmails(): Set<string> {
  return new Set(
    (process.env.OWNER_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function asKnownRole(value: unknown, fallback: UserRole): UserRole {
  const known: readonly string[] = ROLE_PRIORITY;
  return typeof value === "string" && known.includes(value)
    ? (value as UserRole)
    : fallback;
}

async function authenticatedIdentity(request?: Request): Promise<{ user: User; accessToken: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase authentication is not configured");

  const authorization = request?.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (!token) return null;
    const bearerClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await bearerClient.auth.getUser(token);
    return error || !data.user ? null : { user: data.user, accessToken: token };
  }

  const cookieStore = await cookies();
  const cookieClient = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // Route handlers/layouts may run in contexts where response cookies cannot
        // be mutated. Middleware refreshes sessions before protected pages execute.
      },
    },
  });
  const { data, error } = await cookieClient.auth.getUser();
  if (error || !data.user) return null;
  const { data: sessionData } = await cookieClient.auth.getSession();
  if (!sessionData.session?.access_token) return null;
  return { user: data.user, accessToken: sessionData.session.access_token };
}

export async function getServerAuthContext(
  request?: Request,
): Promise<ServerAuthContext | null> {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  const { user, accessToken } = identity;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase admin access is not configured");

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error } = await admin
    .from("profiles")
    .select("main_role, staff_role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error("Unable to verify the signed-in user's role");

  const isConfiguredOwner = configuredOwnerEmails().has(
    (user.email ?? "").toLowerCase(),
  );
  const mainRole = isConfiguredOwner
    ? "owner"
    : asKnownRole(profile?.main_role, "client");
  const staffRoles = Array.isArray(profile?.staff_role)
    ? profile.staff_role.map((role: unknown) => asKnownRole(role, "guest"))
    : [];
  const allRoles = [mainRole, ...staffRoles];
  const effectiveRole =
    ROLE_PRIORITY.find((role) => allRoles.includes(role)) ?? "client";
  const mfaRequired = user.app_metadata?.mfa_required === true;
  let assuranceLevel: "aal1" | "aal2" | null = null;
  if (mfaRequired) {
    const verifier = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: aal, error: aalError } = await verifier.auth.mfa.getAuthenticatorAssuranceLevel(accessToken);
    if (aalError) throw new Error("Unable to verify authenticator assurance level");
    assuranceLevel = aal.currentLevel === "aal2" ? "aal2" : aal.currentLevel === "aal1" ? "aal1" : null;
  }

  return {
    user,
    mainRole,
    staffRoles,
    effectiveRole,
    isAdmin: mainRole === "admin" || mainRole === "owner",
    mfaRequired,
    assuranceLevel,
  };
}

export async function requireAuthenticatedRequest(
  request?: Request,
): Promise<ServerAuthContext> {
  const auth = await getServerAuthContext(request);
  if (!auth) throw new ApiAuthError(401, "Authentication required");
  return auth;
}

export async function requireAdminRequest(
  request?: Request,
): Promise<ServerAuthContext> {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth.isAdmin) throw new ApiAuthError(403, "Administrator access required");
  if (auth.mfaRequired && auth.assuranceLevel !== "aal2") {
    throw new ApiAuthError(403, "Authenticator verification required");
  }
  return auth;
}

export function isApiAuthError(error: unknown): error is ApiAuthError {
  return error instanceof ApiAuthError;
}

export function apiAuthErrorResponse(error: unknown): NextResponse | null {
  if (!isApiAuthError(error)) return null;
  return NextResponse.json({ error: error.message }, { status: error.status });
}
