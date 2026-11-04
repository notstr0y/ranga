import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";

interface DeveloperState {
  /** Supabase Auth session, if someone signed in. */
  session: Session | null;
  /** Decided by Postgres (public.is_developer()), never by the browser. */
  isDeveloper: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<DeveloperState | null>(null);

export function DeveloperProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(supabaseConfigured);

  const verify = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) { setIsDeveloper(false); setLoading(false); return; }
    const { data, error } = await supabase.rpc("is_developer");
    setIsDeveloper(!error && data === true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    // getSession reads local storage only: visitors who never signed in cause no network request here.
    void supabase.auth.getSession().then(({ data }) => verify(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // never await supabase calls inside this callback (it can deadlock the auth client)
      setTimeout(() => { void verify(s); }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [verify]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? "Those details didn't work. Check the email and password." : null;
  }, []);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value = useMemo(() => ({ session, isDeveloper, loading, signIn, signOut }), [session, isDeveloper, loading, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDeveloper(): DeveloperState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDeveloper must be used inside <DeveloperProvider>");
  return v;
}
