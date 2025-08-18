"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";

type Profile = {
  id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  created_at: string | null;
};

export default function TestAuthPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseClient();
    
    const checkAuth = async () => {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await sb.auth.getSession();
        console.log("Session:", session);
        console.log("Session error:", sessionError);
        
        setSession(session);
        
        if (session?.user) {
          // Check profile
          const { data: profile, error: profileError } = await sb
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
            
          console.log("Profile:", profile);
          console.log("Profile error:", profileError);
          
          setProfile(profile);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Session Status:</h2>
          {session ? (
            <div>
              <p className="text-green-600 dark:text-green-200 font-semibold">✓ Logged In</p>
              <p className="text-sm">User ID: {session.user.id}</p>
              <p className="text-sm">Email: {session.user.email}</p>
              <p className="text-sm">Role from auth: {session.user.role || 'none'}</p>
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-200 font-semibold">✗ Not Logged In</p>
          )}
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Profile Data:</h2>
          {profile ? (
            <div>
              <p className="text-green-600 dark:text-green-200 font-semibold">✓ Profile Found</p>
              <p className="text-sm">Name: {profile.name || 'None'}</p>
              <p className="text-sm">Role: {profile.role || 'None'}</p>
              <p className="text-sm">Email: {profile.email || 'None'}</p>
              <p className="text-sm">Created: {profile.created_at || 'None'}</p>
            </div>
          ) : session ? (
            <p className="text-yellow-600 font-semibold">⚠ No Profile Found</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Need to login first</p>
          )}
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Access Check:</h2>
          {profile?.role === 'admin' || profile?.role === 'owner' ? (
            <p className="text-green-600 dark:text-green-200 font-semibold">✓ Should have admin access</p>
          ) : profile?.role === 'client' ? (
            <p className="text-red-600 dark:text-red-200 font-semibold">✗ Client role - no admin access</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Role unknown or not set</p>
          )}
        </div>

        {/* Raw JSON for debugging */}
        <details className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <summary className="cursor-pointer font-bold">Raw Data (click to expand)</summary>
          <div className="mt-2">
            <h3 className="font-semibold">Session:</h3>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
            <h3 className="font-semibold mt-2">Profile:</h3>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
