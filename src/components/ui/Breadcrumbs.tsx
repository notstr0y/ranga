import { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "./icons";

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/**
 * File-manager breadcrumb bar:
 * Displays a clean hierarchical directory path: `CSE / 2019 Scheme / Semester 5 / Database Management Systems`
 * Every parent segment is clickable, with a subtle directional back control.
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const navigate = useNavigate();
  // Filter out any blank items to prevent awkward empty path segments or dangling separators
  const validItems = items.filter((c) => c && c.label && c.label.trim().length > 0);
  if (validItems.length === 0) return null;

  const parentCrumb = validItems.length > 1 ? validItems[validItems.length - 2] : null;

  return (
    <nav aria-label="Breadcrumbs" className={`mb-5 flex items-center gap-2.5 ${className}`}>
      {/* Subtle back navigation control */}
      {parentCrumb && (
        <button
          type="button"
          onClick={() => (parentCrumb.to ? navigate(parentCrumb.to) : navigate(-1))}
          aria-label={`Back to ${parentCrumb.label}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-surface text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeftIcon size={15} />
        </button>
      )}

      {/* Directory path */}
      <ol className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {validItems.map((c, i) => {
          const isLast = i === validItems.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true" className="shrink-0 select-none text-outline-variant font-medium">
                  /
                </li>
              )}
              <li className="shrink-0">
                {c.to && !isLast ? (
                  <Link
                    to={c.to}
                    className="rounded px-1 py-0.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface hover:underline underline-offset-4"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="px-1 py-0.5 font-semibold text-on-surface"
                  >
                    {c.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
