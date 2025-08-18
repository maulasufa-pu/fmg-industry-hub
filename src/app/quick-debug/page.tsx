"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";

type ProfileData = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
};

type InfoState = {
  session: Session | null;
  profile: ProfileData | null;
  error: string | null;
  loading: boolean;
};

export default function QuickDebugPage() {
  const [info, setInfo] = useState<InfoState>({
    session: null,
    profile: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    const checkAuth = async () => {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setInfo({ session: null, profile: null, error: sessionError.message, loading: false });
          return;
        }
        
        if (!session) {
          setInfo({ session: null, profile: null, error: null, loading: false });
          return;
        }
        
        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
          
        if (profileError) {
          setInfo({ 
            session, 
            profile: null, 
            error: `Profile error: ${profileError.message}`, 
            loading: false 
          });
          return;
        }
        
        setInfo({ session, profile: profile as ProfileData, error: null, loading: false });
        
      } catch (err) {
        setInfo({ session: null, profile: null, error: String(err), loading: false });
      }
    };
    
    checkAuth();
  }, []);

  if (info.loading) {
    return <div className="p-6">Loading authentication check...</div>;
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Quick Auth Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-semibold">Session Status:</h2>
          {info.session ? (
            <div className="text-green-600 dark:text-green-200">
              ✅ Logged in as: {info.session.user.email}
              <br />User ID: {info.session.user.id}
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-200">❌ Not logged in</div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-semibold">Profile Status:</h2>
          {info.profile ? (
            <div>
              <div className="text-green-600 dark:text-green-200">✅ Profile found</div>
              <div>Name: {info.profile.name || "null"}</div>
              <div>Email: {info.profile.email || "null"}</div>
              <div className="font-bold">Role: {info.profile.role || "null"}</div>
              <div>
                Can access admin: {
                  info.profile.role === "owner" || info.profile.role === "admin" 
                    ? "✅ YES" 
                    : "❌ NO"
                }
              </div>
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-200">❌ No profile found</div>
          )}
        </div>

        {info.error && (
          <div className="bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 p-4 rounded text-red-700">
            <h2 className="font-semibold">Error:</h2>
            {info.error}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 p-4 rounded">
          <h2 className="font-semibold">Quick Actions:</h2>
          <div className="space-y-2 mt-2">
            {!info.session && (
              <a href="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Go to Login
              </a>
            )}
            {info.session && info.profile && (info.profile.role === "owner" || info.profile.role === "admin") && (
              <a href="/admin/users" className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Try Admin Access
              </a>
            )}
            <a href="/client/dashboard" className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-2">
              Try Client Access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
