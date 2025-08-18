// src/app/admin/test-access/page.tsx  
"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function TestAccessPage() {
  const [authInfo, setAuthInfo] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthInfo({ error: "No session" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setAuthInfo({
        session: {
          userId: session.user.id,
          email: session.user.email
        },
        profile,
        canAccessAdmin: profile?.role === "owner" || profile?.role === "admin"
      });
    };

    checkAuth();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Access Test (No RequireAuth)</h1>
      <p className="text-neutral-600 dark:text-neutral-200 dark:text-gray-200 mb-6">
        This page bypasses RequireAuth to test if the issue is with authentication or authorization.
      </p>

      {authInfo ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <pre className="text-sm">{JSON.stringify(authInfo, null, 2)}</pre>
        </div>
      ) : (
        <div>Loading...</div>
      )}

      <div className="mt-6">
        <a
          href="/admin/users"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Access Admin Users (with RequireAuth)
        </a>
      </div>
    </div>
  );
}
