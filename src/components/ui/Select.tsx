import { Children, Fragment, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

interface Opt { value: string; label: string; disabled?: boolean }

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Reads <option> children (also inside fragments / optgroups) so call sites keep the familiar markup. */
function collect(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const p = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    if (child.type === "option") out.push({ value: p.value !== undefined ? String(p.value) : textOf(p.children), label: textOf(p.children), disabled: p.disabled });
    else if (child.type === "optgroup" || child.type === Fragment) collect(p.children, out);
  });
  return out;
}

interface Props {
  label: string;
  value: string | number | undefined;
  onChange: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A designed dropdown (select-only combobox): the closed control and the open list both follow the RANGA
 * system, instead of the browser's own popup. Keyboard: ↑ ↓ Home End to move, Enter / Space to choose,
 * Esc to close, type a letter to jump. It is labelled by its visible label, and keeps the <option> API.
 */
export function Select({ label, value, onChange, disabled, className = "", children }: Props) {
  const uid = useId();
  const labelId = `${uid}-label`, valueId = `${uid}-value`, listId = `${uid}-list`;
  const options = useMemo(() => collect(children), [children]);
  const current = String(value ?? "");
  const selectedIndex = options.findIndex((o) => o.value === current);
  const shown = options[selectedIndex >= 0 ? selectedIndex : 0];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", t: 0 });

  const openList = useCallback(() => {
    if (disabled) return;
    const r = btn.current?.getBoundingClientRect();
    if (r) { const below = window.innerHeight - r.bottom; setUp(below < 280 && r.top > below); }
    setActive(selectedIndex >= 0 ? selectedIndex : Math.max(0, options.findIndex((o) => !o.disabled)));
    setOpen(true);
  }, [disabled, selectedIndex, options]);

  const choose = useCallback((i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    setOpen(false);
    btn.current?.focus();
    if (o.value !== current) onChange({ target: { value: o.value } });
  }, [options, current, onChange]);

  // close on outside press
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // keep the active option in view
  useEffect(() => {
    if (open) (list.current?.children[active] as HTMLElement | undefined)?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);

  const step = (from: number, dir: 1 | -1) => {
    for (let n = 1; n <= options.length; n++) {
      const i = (from + dir * n + options.length * n) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    const k = e.key;
    if (k === "Tab") { setOpen(false); return; }
    if (k === "Escape") { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } return; }
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (!open) openList(); else setActive((a) => step(a, k === "ArrowDown" ? 1 : -1));
      return;
    }
    if (k === "Home" || k === "End") {
      if (!open) return;
      e.preventDefault();
      setActive(k === "Home" ? step(-1, 1) : step(options.length, -1));
      return;
    }
    if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (open) choose(active); else openList();
      return;
    }
    if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { // type-ahead
      const t = typed.current;
      window.clearTimeout(t.t);
      t.text += k.toLowerCase();
      t.t = window.setTimeout(() => { t.text = ""; }, 600);
      const from = open ? active : selectedIndex;
      const hit = [...options.keys()].map((n) => (from + 1 + n) % options.length).find((i) => !options[i].disabled && options[i].label.toLowerCase().startsWith(t.text));
      if (hit !== undefined) { if (open) setActive(hit); else choose(hit); }
    }
  }

  return (
    <div ref={wrap} className={`relative min-w-0 ${className}`}>
      <span id={labelId} className="text-xs font-semibold text-on-surface mb-1 block">{label}</span>
      <button
        ref={btn}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-activedescendant={open ? `${uid}-o${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex h-9 w-full items-center justify-between gap-2.5 rounded-md border border-outline-variant bg-surface px-3 text-left text-xs font-normal text-on-surface transition-colors hover:border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40"
      >
        <span id={valueId} className={`truncate ${selectedIndex < 0 && current ? "text-on-surface-variant/60" : ""}`}>{shown?.label ?? ""}</span>
        <ChevronDownIcon size={14} className={`shrink-0 text-on-surface-variant transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          className={`anim-fade absolute left-0 z-40 max-h-64 w-max min-w-full max-w-[min(24rem,calc(100vw-2.5rem))] overflow-y-auto rounded-md border border-outline-variant bg-surface p-1 shadow-md ${up ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          {options.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              id={`${uid}-o${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              aria-disabled={o.disabled || undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-1.5 text-xs transition-colors ${i === active ? "bg-surface-container" : ""} ${o.disabled ? "cursor-not-allowed opacity-40" : ""} ${i === selectedIndex ? "font-semibold text-on-surface" : "text-on-surface"}`}
            >
              <span className="min-w-0 truncate">{o.label}</span>
              {i === selectedIndex && <CheckIcon size={13} className="shrink-0 text-on-surface" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
