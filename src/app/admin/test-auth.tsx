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

export default function TestAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseClient();
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await sb.auth.getSession();
        //console.log("Session:", session);
        //console.log("Session error:", sessionError);
        
        setSession(session);
        
        if (session?.user) {
          const { data: profile, error: profileError } = await sb
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
            
          //console.log("Profile:", profile);
          //console.log("Profile error:", profileError);
          
          setProfile(profile);
        }
      } catch (err) {
        //console.error("Auth check error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold">Session:</h2>
          <pre className="text-sm">{JSON.stringify(session, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-bold">Profile:</h2>
          <pre className="text-sm">{JSON.stringify(profile, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
