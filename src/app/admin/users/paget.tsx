// src/app/admin/users/page.tsx (CLIENT)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type GlobalRole = "client" | "admin" | "owner";
const ALL_FUNC = ["A&R","Engineer","Composer","Producer","Sound Designer","Publishing"] as const;
type FuncRole = typeof ALL_FUNC[number];

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  role: GlobalRole;
  funcRoles: FuncRole[];
};

export default function UsersPage(): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // join manual: profiles + profile_roles
    const { data: profs } = await sb.from("profiles").select("id, name, role");
    // email via auth? kalau kamu mirror ke profiles.email gunakan itu.
    const emails: Record<string,string> = {};

    const { data: roles } = await sb.from("profile_roles").select("profile_id, role");
    const mapRoles = new Map<string, FuncRole[]>();
    (roles ?? []).forEach(r => {
      const list = mapRoles.get(r.profile_id) ?? [];
      list.push(r.role as FuncRole);
      mapRoles.set(r.profile_id, list);
    });

    const out: UserRow[] = (profs ?? []).map(p => ({
      id: p.id, email: emails[p.id] ?? null, name: p.name ?? null,
      role: (p.role ?? "client") as GlobalRole,
      funcRoles: mapRoles.get(p.id) ?? [],
    }));
    setRows(out);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const setGlobalRole = async (profileId: string, role: GlobalRole) => {
    const { error } = await sb.from("profiles").update({ role }).eq("id", profileId);
    if (error) return console.error(error);
    void load();
  };

  const toggleFuncRole = async (profileId: string, fr: FuncRole) => {
    const has = rows.find(r => r.id === profileId)?.funcRoles.includes(fr);
    if (has) {
      const { error } = await sb.from("profile_roles").delete().eq("profile_id", profileId).eq("role", fr);
      if (error) return console.error(error);
    } else {
      const { error } = await sb.from("profile_roles").insert({ profile_id: profileId, role: fr });
      if (error) return console.error(error);
    }
    void load();
  };

  if (loading) return <div className="p-6">Loading users…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Users (Owner)</h1>
      <table className="w-full rounded-lg border bg-white shadow">
        <thead>
          <tr className="bg-gray-50 text-left text-sm">
            <th className="p-3">Name</th>
            <th className="p-3">Global Role</th>
            <th className="p-3">Functional Roles</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-3">
                <div className="font-medium">{u.name ?? "(no name)"}</div>
                <div className="text-xs text-gray-500">{u.email ?? u.id}</div>
              </td>
              <td className="p-3">
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={u.role}
                  onChange={(e) => setGlobalRole(u.id, e.currentTarget.value as GlobalRole)}
                >
                  <option value="client">client</option>
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  {ALL_FUNC.map(fr => {
                    const active = u.funcRoles.includes(fr);
                    return (
                      <button
                        key={fr}
                        onClick={() => toggleFuncRole(u.id, fr)}
                        className={`rounded-full px-3 py-1 text-xs border ${active ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                      >
                        {fr}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
