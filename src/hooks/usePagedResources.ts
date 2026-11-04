import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_SIZE, searchResources } from "../lib/api";
import { isNetworkError, toAppError } from "../lib/errors";
import type { Resource, SearchFilters } from "../types";
import { useConnectivity } from "./useConnectivity";

/** Progressive loading: first page on filter change, "load more" appends further pages. */
export function usePagedResources(filters: SearchFilters, enabled: boolean) {
  const { check } = useConnectivity();
  const [rows, setRows] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const page = useRef(0);
  const req = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const key = JSON.stringify(filters);

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    const id = ++req.current;
    setError(null);
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await searchResources(filtersRef.current, p);
      if (id !== req.current) return;
      page.current = p;
      setRows((prev) => (append ? [...prev, ...res.rows] : res.rows));
      setTotal(res.total);
    } catch (e) {
      if (id !== req.current) return;
      if (isNetworkError(e)) void check();
      setError(toAppError(e));
    } finally {
      if (id === req.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [check]);

  useEffect(() => {
    if (!enabled) { req.current++; setRows([]); setTotal(0); setLoading(false); return; }
    void fetchPage(0, false);
    return () => { req.current++; };
  }, [key, enabled, fetchPage]);

  return {
    rows, total, loading, loadingMore, error,
    hasMore: rows.length < total && rows.length >= PAGE_SIZE * (page.current + 1),
    loadMore: () => fetchPage(page.current + 1, true),
    retry: () => fetchPage(error && rows.length ? page.current + 1 : 0, !!(error && rows.length)),
  };
}
