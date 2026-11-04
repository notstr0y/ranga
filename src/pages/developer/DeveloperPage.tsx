import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../components/brand/BrandMark";
import { Button } from "../../components/ui/Button";
import { ConfirmProvider } from "../../components/ui/ConfirmDialog";
import { EyeIcon, EyeOffIcon, SignOutIcon } from "../../components/ui/icons";
import { ToastProvider } from "../../components/ui/Toast";
import { useDeveloper } from "../../hooks/useDeveloper";
import { useTitle } from "../../hooks/useTitle";
import { supabaseConfigured } from "../../lib/supabase";
import { CataloguePanel } from "./CataloguePanel";
import { ChecksPanel } from "./ChecksPanel";
import { ResourcesPanel } from "./ResourcesPanel";
import { UploadPanel, type Prefill } from "./UploadPanel";
import { Field, Notice, TextInput } from "./shared";
import rangaDevLogin from "../../assets/ranga/ranga-dev-login.webp";

const TABS = [
  { id: "checks", label: "Checks" },
  { id: "resources", label: "Resources" },
  { id: "upload", label: "Upload" },
  { id: "catalogue", label: "Catalogue" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * Developer workspace: Minimal file-manager style, preserving all operations.
 */
export function DeveloperPage() {
  useTitle("Developer");
  useEffect(() => {
    document.documentElement.dataset.surface = "dev";
    return () => { delete document.documentElement.dataset.surface; };
  }, []);

  return (
    <div className="dev min-h-dvh bg-surface text-on-surface">
      <ConfirmProvider>
        <ToastProvider>
          <Gate />
        </ToastProvider>
      </ConfirmProvider>
    </div>
  );
}

function Gate() {
  const { session, isDeveloper, loading, signIn, signOut } = useDeveloper();
  const [tab, setTab] = useState<Tab>("checks");
  const [prefill, setPrefill] = useState<Prefill | undefined>();
  const [findQuery, setFindQuery] = useState("");

  if (!supabaseConfigured) {
    return <Centered><Notice tone="error">Supabase isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.</Notice></Centered>;
  }
  if (loading) return <Centered><p className="text-xs text-on-surface-variant font-medium" role="status">Checking access…</p></Centered>;
  if (!session) return <SignIn onSignIn={signIn} />;

  if (!isDeveloper) {
    return (
      <Centered>
        <div className="w-full max-w-sm rounded-lg border border-outline-variant bg-surface p-6 text-center shadow-md">
          <h1 className="text-base font-semibold text-on-surface">Not authorised</h1>
          <p className="mt-1.5 text-xs text-on-surface-variant">This account isn't on the developer list.</p>
          <Button variant="outline" className="mt-5 w-full text-xs" onClick={() => void signOut()}><SignOutIcon size={14} /> Sign out</Button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <header className="pt-safe sticky top-0 z-30 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Back to RANGA" className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <BrandMark size={22} />
            <span className="font-semibold text-xs tracking-tight text-on-surface">RANGA</span>
          </Link>
          <span aria-hidden="true" className="text-outline-variant">/</span>
          <span className="text-xs font-semibold text-on-surface">Developer</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="mr-2 hidden truncate font-mono text-xs text-on-surface-variant sm:block">{session.user.email}</span>
            <Button variant="ghost" className="!min-h-8 !px-2.5 text-xs" onClick={() => void signOut()}><SignOutIcon size={14} /> <span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div role="tablist" aria-label="Workspace sections" className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 py-2.5 text-xs transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 ${
                  tab === t.id ? "font-semibold text-on-surface after:bg-primary" : "text-on-surface-variant after:bg-transparent hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 focus:outline-none sm:px-6">
        {tab === "checks" && (
          <ChecksPanel
            onUpload={(p) => { setPrefill(p); setTab("upload"); }}
            onFindResource={(q) => { setFindQuery(q); setTab("resources"); }}
          />
        )}
        {tab === "resources" && <ResourcesPanel key={findQuery} initialQuery={findQuery} />}
        {tab === "upload" && <UploadPanel key={JSON.stringify(prefill ?? null)} prefill={prefill} />}
        {tab === "catalogue" && <CataloguePanel />}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main id="main" tabIndex={-1} className="grid min-h-dvh place-items-center px-4 py-8 focus:outline-none">{children}</main>;
}

/** The standalone sign-in page: simple, minimal login form with cropped GIF header. */
function SignIn({ onSignIn }: { onSignIn: (e: string, p: string) => Promise<string | null> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    setErr(await onSignIn(email, password));
    setBusy(false);
  }

  return (
    <Centered>
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-md">
        {/* Cropped GIF header without caption */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
          <img
            src={rangaDevLogin}
            alt=""
            width={498}
            height={281}
            loading="eager"
            decoding="async"
            className="size-full object-cover"
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-on-surface">Developer Sign-in</h1>
              <p className="mt-0.5 text-xs text-on-surface-variant">Sign in to manage academic resources</p>
            </div>
            <Link to="/" aria-label="Back to RANGA" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <BrandMark size={24} />
            </Link>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <Field label="Email">
              <TextInput
                type="email"
                autoComplete="username"
                required
                placeholder="developer@ranga.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <TextInput
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="!pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  {show ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
            </Field>

            {err && <Notice tone="error">{err}</Notice>}

            <Button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="w-full !min-h-9 text-xs font-semibold"
            >
              {busy ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </Centered>
  );
}
