"use client";

import { useEffect, useState } from "react";

export default function EnvTestPage() {
  const [envVars, setEnvVars] = useState<{[key: string]: string | undefined}>({});

  useEffect(() => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <h2 className="font-bold text-lg">{key}:</h2>
            <div className="mt-2">
              {value ? (
                <div>
                  <p className="text-green-600 dark:text-green-200 font-semibold">✓ Loaded</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-200 dark:text-gray-200">Length: {value.length} characters</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sky-600 dark:text-sky-200">Show Value</summary>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded mt-2 overflow-auto max-h-32">
                      {value}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-red-600 dark:text-red-200 font-semibold">✗ Missing</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 dark:bg-yellow-900/20 rounded">
        <h3 className="font-bold text-yellow-800">Debug Info:</h3>
        <p className="text-sm text-yellow-700">
          If ANON_KEY shows as missing or truncated, there might be a line break or formatting issue in .env.local
        </p>
      </div>
    </div>
  );
}
