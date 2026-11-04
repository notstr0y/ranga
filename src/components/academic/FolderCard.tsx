import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { FolderIcon, ChevronIcon } from "../ui/icons";

export type FolderVariant = "programme" | "scheme" | "semester" | "subject";

interface FolderCardProps {
  to: string;
  name: string;
  code?: string;
  meta?: ReactNode;
  badge?: ReactNode;
  variant?: FolderVariant;
  itemCount?: number;
  itemLabel?: string;
  className?: string;
}

/**
 * Minimal file-manager folder item:
 * Clean, monochrome Google Drive-style folder component.
 * Features an outlined monochrome folder icon, readable typography,
 * subtle metadata, and responsive grid/list adaptability.
 */
export function FolderCard({
  to,
  name,
  code,
  meta,
  badge,
  variant: _variant,
  itemCount,
  itemLabel = "items",
  className = "",
}: FolderCardProps) {
  return (
    <Link
      to={to}
      className={`group relative flex items-start gap-3.5 rounded-lg border border-outline-variant bg-surface p-3.5 transition-colors duration-150 hover:bg-surface-container hover:border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-outline-variant/60 bg-surface-container text-on-surface-variant transition-colors group-hover:border-outline group-hover:text-on-surface">
        <FolderIcon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {code && (
              <span className="font-mono text-[0.6875rem] font-bold tracking-wider text-on-surface-variant block mb-0.5">
                {code}
              </span>
            )}
            <h3 className="text-sm font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary">
              {name}
            </h3>
          </div>
          <ChevronIcon
            size={16}
            className="mt-0.5 shrink-0 text-on-surface-variant/50 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-on-surface"
          />
        </div>

        {(meta || itemCount !== undefined || badge) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            {meta && <span>{meta}</span>}
            {itemCount !== undefined && (
              <span className="font-mono text-[0.75rem]">
                {itemCount} {itemLabel}
              </span>
            )}
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        )}
      </div>
    </Link>
  );
}
