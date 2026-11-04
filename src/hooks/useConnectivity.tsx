import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface Connectivity {
  online: boolean;
  checking: boolean;
  /** Last manual retry failed. */
  failedRetry: boolean;
  /** Actually test the connection (not just navigator.onLine). Resolves to the result. */
  check: () => Promise<boolean>;
}

const Ctx = createContext<Connectivity | null>(null);

async function ping(): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    // ping.txt is deliberately NOT precached by the service worker, so a response means the
    // network is genuinely reachable (a cached answer would hide being offline).
    const res = await fetch(`/ping.txt?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [checking, setChecking] = useState(false);
  const [failedRetry, setFailedRetry] = useState(false);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const check = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    setChecking(true);
    const p = ping().then((ok) => {
      setOnline(ok);
      setFailedRetry(!ok);
      return ok;
    }).finally(() => { setChecking(false); inFlight.current = null; });
    inFlight.current = p;
    return p;
  }, []);

  useEffect(() => {
    const goOffline = () => { setOnline(false); setFailedRetry(false); };
    const goOnline = () => { void check(); };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, [check]);

  // While offline, quietly keep checking so the app restores itself.
  useEffect(() => {
    if (online) return;
    const id = setInterval(() => { void check(); }, 10000);
    return () => clearInterval(id);
  }, [online, check]);

  const value = useMemo(() => ({ online, checking, failedRetry, check }), [online, checking, failedRetry, check]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConnectivity(): Connectivity {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConnectivity must be used inside <ConnectivityProvider>");
  return v;
}
