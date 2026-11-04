import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { SearchFilters } from "../types";
import { isResourceType } from "../utils/format";

const num = (v: string | null): number | undefined => {
  const n = v ? Number(v) : NaN;
  return Number.isInteger(n) ? n : undefined;
};

/** Search/browse filters live in the URL so results are shareable and survive refresh/back. */
export function useFilters() {
  const [params, setParams] = useSearchParams();

  const filters: SearchFilters = useMemo(() => {
    const semester = num(params.get("semester"));
    const type = params.get("type");
    return {
      q: params.get("q")?.trim() || undefined,
      programme: params.get("programme") || undefined,
      scheme: params.get("scheme") || undefined,
      semester: semester && semester >= 1 && semester <= 8 ? semester : undefined,
      type: isResourceType(type) ? type : undefined,
      // year is a question-paper field: ignore it (even from an old URL) for every other category
      year: type === "pyq" ? num(params.get("year")) : undefined,
    };
  }, [params]);

  const update = useCallback(
    (patch: Partial<Record<keyof SearchFilters, string | number | undefined>>) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "") next.delete(k); else next.set(k, String(v));
        }
        return next;
      }, { replace: true });
    },
    [setParams],
  );

  const clear = useCallback(
    (keys: (keyof SearchFilters)[]) => update(Object.fromEntries(keys.map((k) => [k, undefined]))),
    [update],
  );

  const key = JSON.stringify(filters);
  return { filters, update, clear, key };
}
