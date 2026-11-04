import { useEffect, useRef, useState } from "react";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Clean Ranga Wordmark with Easter Egg Popup:
 * Clicking the 'ranga' wordmark opens a tiny, minimal popup:
 * "Why name Ranga?
 * Ithokke oru fun alle bro 😂"
 *
 * Closes on outside click or Escape.
 */
export function InteractiveWordmark({ className = "", size = "md" }: WordmarkProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Why name Ranga?"
        className={`font-semibold tracking-tight text-on-surface select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-opacity hover:opacity-80 active:opacity-60 ${sizeClasses} ${className}`}
      >
        ranga
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Why name Ranga?"
          className="anim-pop absolute left-0 top-full z-50 mt-2 w-56 rounded-md border border-outline-variant bg-surface p-3 text-left shadow-md"
        >
          <p className="text-xs font-semibold tracking-tight text-on-surface">
            Why name Ranga?
          </p>
          <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
            Ithokke oru fun alle bro 😂<span className="sr-only"> :laugh-emoji</span>
          </p>
        </div>
      )}
    </div>
  );
}
