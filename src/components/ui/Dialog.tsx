import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  /** id of the element that titles the dialog */
  labelledBy: string;
  children: ReactNode;
  size?: "sm" | "md";
  /** false = Esc and the backdrop do nothing (e.g. while a request is running) */
  dismissible?: boolean;
}

/**
 * The one modal every popup in RANGA is built on: a quiet scrim, a paper panel (a bottom sheet on phones),
 * focus moved in and trapped, Esc to close, background scroll locked, focus returned to what opened it.
 */
export function Dialog({ open, onClose, labelledBy, children, size = "md", dismissible = true }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const canDismiss = useRef(dismissible);
  canDismiss.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canDismiss.current) { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) { e.preventDefault(); return; }
      const a = document.activeElement;
      if (e.shiftKey && (a === items[0] || a === panel.current)) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && a === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const width = size === "sm" ? "sm:max-w-sm" : "sm:max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="anim-fade absolute inset-0 bg-black/40" onClick={() => canDismiss.current && closeRef.current()} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`anim-rise pb-safe relative max-h-[88dvh] w-full overflow-y-auto rounded-t-lg border border-outline-variant bg-surface p-5 text-on-surface shadow-dialog focus:outline-none sm:rounded-lg sm:p-6 ${width}`}
      >
        {children}
      </div>
    </div>
  );
}
