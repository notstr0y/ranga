import { useCallback, useEffect, useRef, useState } from "react";
import { isNetworkError, toAppError } from "../lib/errors";
import { useConnectivity } from "./useConnectivity";

interface State<T> { data: T | null; error: Error | null; loading: boolean }

/**
 * Run an async loader whenever `deps` change. Stale responses are ignored.
 * A network failure also nudges the connectivity check so the offline screen can appear.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[], enabled = true) {
  const { check } = useConnectivity();
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: enabled });
  const reqId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(() => {
    const id = ++reqId.current;
    setState((s) => ({ data: s.data, error: null, loading: true }));
    loaderRef.current().then(
      (data) => { if (id === reqId.current) setState({ data, error: null, loading: false }); },
      (e) => {
        if (id !== reqId.current) return;
        if (isNetworkError(e)) void check();
        setState({ data: null, error: toAppError(e), loading: false });
      },
    );
  }, [check]);

  useEffect(() => {
    if (!enabled) { reqId.current++; setState({ data: null, error: null, loading: false }); return; }
    load();
    return () => { reqId.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { ...state, reload: load };
}
