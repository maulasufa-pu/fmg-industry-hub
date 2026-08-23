export default function Loading() {
  return <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-16" aria-busy="true" aria-label="Loading page"><div className="h-8 w-56 animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10"/><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5"/>)}</div></main>;
}
