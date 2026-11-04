export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-md ${className}`} />;
}

/** Quiet placeholder rows while data loads — the same hairline rhythm as the real lists. */
export function RowSkeletons({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="list-row">
          <Skeleton className="size-10 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-24 !rounded-lg" />)}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
