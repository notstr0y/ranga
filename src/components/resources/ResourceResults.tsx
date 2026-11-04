import type { SearchFilters } from "../../types";
import { Button } from "../ui/Button";
import { RowSkeletons } from "../ui/Skeleton";
import { EmptyState, ErrorState } from "../ui/StateViews";
import { ResourceList, ResourceRow } from "./ResourceRow";
import type { usePagedResources } from "../../hooks/usePagedResources";

type Paged = ReturnType<typeof usePagedResources>;

interface Props {
  paged: Paged;
  filtered: boolean;
  /** the filters in force — lets the empty state say precisely what was looked for */
  filters?: SearchFilters;
  onClear?: () => void;
  onClearYear?: () => void;
}

const linkBtn = "mt-4 text-[0.875rem] font-medium text-ink underline underline-offset-4 hover:text-ink-2";

/** Shared results list: loading skeletons, errors, empty states and "load more". */
export function ResourceResults({ paged, filtered, filters, onClear, onClearYear }: Props) {
  const { rows, total, loading, loadingMore, error, hasMore, loadMore, retry } = paged;

  if (loading) return <RowSkeletons />;
  if (error && !rows.length) return <ErrorState message={error.message} onRetry={retry} />;
  if (!rows.length) {
    if (!filtered) {
      return (
        <EmptyState kicker="ഇതുവരെ ഒന്നും എത്തിയിട്ടില്ല." title="No resources yet" action={{ to: "/browse", label: "Browse the catalogue" }}>
          Papers and notes are added in batches. Check back soon — the subject listings are ready to explore meanwhile.
        </EmptyState>
      );
    }
    // question papers get a precise message: say exactly what is (not) there, and never hint at hidden results
    if (filters?.type === "pyq") {
      return (
        <EmptyState kicker="ഒന്നും കിട്ടിയില്ല, മോനേ." title={filters.year ? `No question papers for ${filters.year}` : "No question papers found"}>
          {filters.year ? "Nothing from that year fits the other filters." : "No question papers match these filters yet."}
          {filters.year && onClearYear && <><br /><button type="button" onClick={onClearYear} className={linkBtn}>Show all years</button></>}
          {onClear && <><br /><button type="button" onClick={onClear} className={linkBtn}>Clear filters</button></>}
        </EmptyState>
      );
    }
    return (
      <EmptyState kicker="ഒന്നും കിട്ടിയില്ല, മോനേ." title="No matching resources">
        Try a different word, or loosen a filter.
        {onClear && <><br /><button type="button" onClick={onClear} className={linkBtn}>Clear filters</button></>}
      </EmptyState>
    );
  }

  return (
    <div>
      <p className="t-meta mb-4" aria-live="polite">{total} {total === 1 ? "resource" : "resources"}</p>
      <ResourceList>{rows.map((r) => <ResourceRow key={r.id} resource={r} />)}</ResourceList>
      {error && <p role="alert" className="t-small mt-4 text-center">{error.message}</p>}
      {(hasMore || error) && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={error ? retry : loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : error ? "Try again" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
