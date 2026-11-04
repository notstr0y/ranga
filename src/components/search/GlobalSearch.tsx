import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDebounced } from "../../hooks/useDebounced";
import { CloseIcon, SearchIcon } from "../ui/icons";

interface Props {
  /** "header" = compact field in the masthead; "page" = the large field that opens Home and Search. */
  variant?: "header" | "page";
  /** Focus the field when it appears (the Search page, when there is no query yet). */
  focusOnMount?: boolean;
}

/** Search field. Submits to /search; while on /search it updates results as you type. */
export function GlobalSearch({ variant = "header", focusOnMount = false }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const onSearchPage = pathname === "/search";
  const urlQ = params.get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  const debounced = useDebounced(value, 350);
  const lastUrlQ = useRef(urlQ);
  const input = useRef<HTMLInputElement>(null);
  const page = variant === "page";

  // keep the box in sync when the URL changes from elsewhere (e.g. back button, suggestion links)
  useEffect(() => {
    if (onSearchPage && urlQ !== lastUrlQ.current) { setValue(urlQ); lastUrlQ.current = urlQ; }
  }, [urlQ, onSearchPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // live search on the search page
  useEffect(() => {
    if (!onSearchPage || debounced.trim() === urlQ) return;
    lastUrlQ.current = debounced.trim();
    setParams((p) => {
      const next = new URLSearchParams(p);
      if (debounced.trim()) next.set("q", debounced.trim()); else next.delete("q");
      return next;
    }, { replace: true });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (focusOnMount) input.current?.focus(); }, [focusOnMount]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form role="search" onSubmit={submit} className="relative min-w-0 flex-1">
      <label htmlFor={page ? "page-search" : "global-search"} className="sr-only">Search subjects and resources</label>
      <SearchIcon size={page ? 20 : 17} className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${page ? "left-4" : "left-3.5"}`} />
      <input
        ref={input}
        id={page ? "page-search" : "global-search"}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={page ? "Search subjects and papers" : "Search"}
        className={`input [&::-webkit-search-cancel-button]:hidden ${page ? "!min-h-14 !pl-12 !pr-12 !text-[1.0625rem]" : "!min-h-9 !pl-10 !text-[0.875rem]"}`}
      />
      {page && value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setValue(""); input.current?.focus(); }}
          className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <CloseIcon size={17} />
        </button>
      )}
    </form>
  );
}
