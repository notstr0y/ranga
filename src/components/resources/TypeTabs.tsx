import { RESOURCE_TYPES } from "../../utils/format";
import type { ResourceType } from "../../types";

interface Props {
  value: ResourceType | undefined;
  onChange: (v: ResourceType | undefined) => void;
  counts?: Partial<Record<ResourceType, number>>;
  hideEmpty?: boolean;
}

/** Minimal monochrome category filter chips for file manager view. */
export function TypeTabs({ value, onChange, counts, hideEmpty }: Props) {
  const total = counts ? Object.values(counts).reduce((a, b) => a + (b ?? 0), 0) : undefined;
  const items = RESOURCE_TYPES.filter((t) => !hideEmpty || !counts || (counts[t.value] ?? 0) > 0 || value === t.value);

  const tabStyle = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active
        ? "border-primary bg-primary text-on-primary font-semibold"
        : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  const countStyle = (active: boolean) =>
    `font-mono text-[0.6875rem] font-bold ${
      active ? "text-on-primary/80" : "text-on-surface-variant"
    }`;

  return (
    <div
      role="tablist"
      aria-label="Resource category"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!value}
        className={tabStyle(!value)}
        onClick={() => onChange(undefined)}
      >
        <span>All</span>
        {total !== undefined && <span className={countStyle(!value)}>{total}</span>}
      </button>

      {items.map((t) => {
        const active = value === t.value;
        const n = counts ? counts[t.value] ?? 0 : undefined;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={tabStyle(active)}
            onClick={() => onChange(t.value)}
          >
            <span>{t.plural}</span>
            {n !== undefined && <span className={countStyle(active)}>{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
