// E:\FMGIH\fmg-industry-hub\src\app\client\projects\error.tsx
"use client";

import React, { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props): React.JSX.Element {
  useEffect(() => {
    // log sekali saat mount
    // (hindari log di render agar tidak spam)
    // eslint-disable-next-line no-console
    console.error("[/client/projects] error:", error);
  }, [error]);

  const onTryAgain = () => {
    // kasih kesempatan komponen-komponen client untuk re-fetch
    try {
      window.dispatchEvent(new Event("client-refresh"));
    } catch {
      // no-op
    }
    // minta Next.js re-render error boundary subtree
    reset();
  };

  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="text-red-700 font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-red-700/80">
          Terjadi kesalahan saat memuat halaman Projects.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTryAgain}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Reload page
          </button>
        </div>

        <details className="mt-4 group">
          <summary className="cursor-pointer text-sm text-red-700/80 hover:text-red-700">
            Show technical details
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-white/60 p-3 text-xs text-red-900">
            {String(error.stack || error.message)}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        </details>
      </div>
    </div>
  );
}
