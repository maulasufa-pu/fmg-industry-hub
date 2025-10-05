// src/app/admin/users/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import { ROLE_IDS, ROLE_LABEL, UserRole } from "@/lib/roles";

type GlobalRole = "client" | "admin" | "owner";

// Functional roles = semua role di DB selain global/guest
const FUNCTIONAL_ROLES = ROLE_IDS.filter(
  (role) => !["client", "admin", "owner", "guest"].includes(role)
) as readonly string[];
type FuncRole = (typeof FUNCTIONAL_ROLES)[number];

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  main_role: GlobalRole;
  staff_role: FuncRole[];
  created_at: string | null;
  last_sign_in: string | null;
};

const isAbortError = (e: unknown): boolean => {
  if (typeof e !== "object" || e === null) return false;
  const name = (e as { name?: string }).name;
  // beberapa browser/pustaka memberi pesan "signal is aborted without reason"
  return name === "AbortError";
};

export default function UsersPage(): React.JSX.Element {
  useFocusWarmAuth();

  const sb = useMemo(() => getSupabaseClient(), []);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<GlobalRole | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Hindari setState setelah unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ load menerima signal, tidak membuat controller dan tidak return cleanup
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        if (mountedRef.current) setLoading(true);
        if (mountedRef.current) setError(null);
        if (mountedRef.current) setDebugInfo("Starting data load...");

        // 1) Cek sesi
        const { data: sessRes, error: sessionError } = await sb.auth.getSession();
        if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
        if (!sessRes?.session) throw new Error("No active session found");
        if (mountedRef.current) {
          setDebugInfo(`Session found for user: ${sessRes.session.user.email ?? sessRes.session.user.id}`);
        }

        // 2) Ambil profiles melalui API route untuk bypass RLS
        if (mountedRef.current) setDebugInfo("Fetching profiles via API...");
        
        const response = await fetch('/api/profiles?mode=admin', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessRes.session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const apiData = await response.json();
        
        if (signal?.aborted) {
          if (mountedRef.current) setLoading(false);
          return;
        }

        if (!apiData.success) {
          throw new Error(`API returned error: ${apiData.error || 'Unknown error'}`);
        }

        const profs = apiData.data || [];
        
        const allUsers = profs.map((p: any) => ({
          id: p.id,
          email: p.email ?? null,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || null,
          main_role: ((p.main_role as GlobalRole) ?? "client") as GlobalRole,
          staff_role: (p.staff_role as FuncRole[]) ?? [],
          created_at: p.created_at ?? null,
          last_sign_in: null,
        }));

        if (mountedRef.current) setRows(allUsers);
        if (mountedRef.current) setDebugInfo(`Loaded ${allUsers.length} users from API`);
        if (allUsers.length === 0) {
          if (mountedRef.current) setError("No users found. Database may be empty or API issue.");
          if (mountedRef.current) setDebugInfo("WARNING: zero rows from API");
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === "AbortError") {
          // diabaikan saat unmount/strict re-run
        } else {
          console.error("Failed to load users:", err);
          if (mountedRef.current) setError(err instanceof Error ? err.message : "Failed to load users");
          if (mountedRef.current) setDebugInfo(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
        }
      } finally {
        if (!signal?.aborted && mountedRef.current) setLoading(false);
      }
    },
    [sb]
  );

  // ✅ Controller & cleanup di useEffect
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const setGlobalRole = async (profileId: string, newRole: GlobalRole) => {
    try {
      setUpdating(profileId);

      // Cegah demote last owner
      const ownerCount = rows.filter((u) => u.main_role === "owner").length;
      const isSelfOwner = rows.some((u) => u.id === profileId && u.main_role === "owner");
      if (isSelfOwner && newRole !== "owner" && ownerCount <= 1) {
        setError("Cannot demote the last owner. Assign another owner first.");
        return;
      }

      // Get current session for auth
      const { data: sessRes } = await sb.auth.getSession();
      if (!sessRes?.session) {
        setError("No active session found");
        return;
      }

      const response = await fetch('/api/profiles/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessRes.session.access_token}`,
        },
        body: JSON.stringify({
          profileId,
          role: newRole,
          isAdd: true,
          roleType: 'main_role'
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update role');
      }

      void load();
    } catch (err: unknown) {
      console.error("Failed to update role:", err);
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const toggleFuncRole = async (profileId: string, fr: FuncRole) => {
    try {
      setUpdatingRole(`${profileId}-${fr}`);
      const user = rows.find((r) => r.id === profileId);
      if (!user) return;

      const hasRole = user.staff_role.includes(fr);

      // Get current session for auth
      const { data: sessRes } = await sb.auth.getSession();
      if (!sessRes?.session) {
        setError("No active session found");
        return;
      }

      const response = await fetch('/api/profiles/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessRes.session.access_token}`,
        },
        body: JSON.stringify({
          profileId,
          role: fr,
          isAdd: !hasRole,
          roleType: 'staff_role'
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle role');
      }

      void load();
    } catch (err: unknown) {
      console.error("Failed to toggle functional role:", err);
      setError(err instanceof Error ? err.message : "Failed to toggle role");
    } finally {
      setUpdatingRole(null);
    }
  };

  // Filter client-side
  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (roleFilter !== "all") filtered = filtered.filter((u) => u.main_role === roleFilter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((u) => {
        const name = u.name?.toLowerCase() ?? "";
        const email = u.email?.toLowerCase() ?? "";
        const gRole = u.main_role.toLowerCase();
        const hasFunc = u.staff_role.some((fr: FuncRole) => {
          const label = (ROLE_LABEL[fr as UserRole] || fr).toLowerCase();
          return fr.toLowerCase().includes(term) || label.includes(term);
        });
        return name.includes(term) || email.includes(term) || gRole.includes(term) || hasFunc;
      });
    }
    return filtered;
  }, [rows, roleFilter, searchTerm]);

  const formatDate = (dateStr: string | null) => (dateStr ? new Date(dateStr).toLocaleDateString() : "Never");

  const getRoleBadgeColor = (role: GlobalRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700";
      case "admin":
        return "bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700";
      default:
        return "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Manage user roles and permissions ({rows.length} users total)</p>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Global Roles: Client, Admin, Owner | Functional Roles:{" "}
            {FUNCTIONAL_ROLES.map((r) => ROLE_LABEL[r as UserRole] || r).join(", ")}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 p-3 shadow-sm">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">{rows.filter((u) => u.main_role === "owner").length}</div>
            <div className="text-xs text-purple-600 dark:text-purple-300">Owners</div>
          </div>
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{rows.filter((u) => u.main_role === "admin").length}</div>
            <div className="text-xs text-blue-600 dark:text-blue-300">Admins</div>
          </div>
          <div className="rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 p-3 shadow-sm">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">{rows.filter((u) => u.main_role === "client").length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Clients</div>
          </div>
          <div className="rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 p-3 shadow-sm">
            <div className="text-2xl font-bold text-green-700 dark:text-green-200">{filteredRows.length}</div>
            <div className="text-xs text-green-600 dark:text-green-300">Showing</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-red-700 dark:text-red-200 shadow-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
            ×
          </button>
        </div>
      )}

      {debugInfo && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-blue-700 dark:text-blue-200 shadow-sm">
          <span className="text-sm">Debug: {debugInfo}</span>
          <button onClick={() => setDebugInfo(null)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            ×
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name, email, role, or function..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-4 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as GlobalRole | "all")}
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </select>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Users & Role Assignments</h3>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Functional Role Summary:{" "}
            {FUNCTIONAL_ROLES.map((role) => {
              const count = rows.reduce((acc, u) => acc + (u.staff_role.includes(role) ? 1 : 0), 0);
              const label = ROLE_LABEL[role as UserRole] || role;
              return `${label}: ${count}`;
            }).join(" | ")}
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Global Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Functional Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Last Sign In <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(N/A)</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? "No users found matching your search" : "No users found"}
                </td>
              </tr>
            ) : (
              filteredRows.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name || "No name"}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email || "No email"}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <select
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${getRoleBadgeColor(
                        user.main_role
                      )} ${updating === user.id ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      value={user.main_role}
                      disabled={updating === user.id}
                      onChange={(e) => void setGlobalRole(user.id, e.target.value as GlobalRole)}
                    >
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                    {updating === user.id && (
                      <div className="ml-2 inline-block">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent" />
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const isClient = user.main_role === "client";
                        return (
                          <>
                            {FUNCTIONAL_ROLES.map((funcRole) => {
                              const isActive = user.staff_role.includes(funcRole);
                              const isUpdating = updatingRole === `${user.id}-${funcRole}`;
                              const displayName =
                                ROLE_LABEL[funcRole as UserRole] ||
                                funcRole.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

                              return (
                                <button
                                  key={funcRole}
                                  onClick={() => void toggleFuncRole(user.id, funcRole)}
                                  disabled={(error?.toLowerCase().includes("rls recursion") ?? false) || isUpdating || isClient}
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                    isActive 
                                      ? "bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/50" 
                                      : "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700/50"
                                  } ${((error?.toLowerCase().includes("rls recursion") ?? false) || isUpdating || isClient) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                >
                                  {isUpdating ? (
                                    <>
                                      <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      Updating…
                                    </>
                                  ) : (
                                    <>
                                      {displayName}
                                      {isActive && <span className="ml-1">✓</span>}
                                      {isClient && <span className="ml-1 text-gray-500 dark:text-gray-400" title="Functional roles not available for clients">🔒</span>}
                                    </>
                                  )}
                                </button>
                              );
                            })}
                            {isClient && (
                              <div className="mt-1 text-xs italic text-gray-600 dark:text-gray-400">
                                Functional roles not available for Client users
                              </div>
                            )}
                            {(error?.toLowerCase().includes("rls recursion") ?? false) && (
                              <div className="mt-1 text-xs italic text-red-600 dark:text-red-400">
                                Functional roles unavailable due to database RLS recursion
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4 text-sm italic text-gray-600 dark:text-gray-400">Not Available</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
