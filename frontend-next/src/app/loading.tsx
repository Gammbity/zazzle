export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-10 w-1/3 animate-pulse rounded-lg bg-ink-200" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-ink-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
