import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when .env.local is missing — the UI shows a setup message instead of crashing. */
export const supabaseConfigured = Boolean(url && key);

/**
 * The browser only ever holds the public anon key. Students never sign in, so for them nothing is stored;
 * a developer's session (Supabase Auth) is kept in localStorage so the workspace survives a refresh.
 * Every privileged action is decided by Postgres (RLS + is_developer()) or the Edge Function — never here.
 */
export const supabase = createClient(url ?? "http://localhost:54321", key ?? "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
