"use client";
export default function Error({ error }: { error: Error & { digest?: string } }) {
  console.error("[/client/projects] error:", error);
  return (
    <div className="p-6">
      <h2 className="text-red-600 font-semibold">Route Error</h2>
      <pre className="whitespace-pre-wrap text-sm mt-2">
        {String(error.stack || error.message)}
      </pre>
    </div>
  );
}
