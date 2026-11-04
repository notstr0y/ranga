import type { ReactNode } from "react";
import { LinkButton, Button } from "./Button";
import { RetryIcon } from "./icons";
import { hasMalayalam } from "./Ml";

interface EmptyProps {
  title: string;
  kicker?: string;
  children?: ReactNode;
  action?: { to: string; label: string };
  compact?: boolean;
}

/** Clean, minimal monochrome empty state. */
export function EmptyState({ title, kicker, children, action, compact }: EmptyProps) {
  return (
    <div
      className={`anim-fade flex flex-col items-center rounded-lg border border-outline-variant bg-surface text-center ${
        compact ? "px-4 py-5" : "px-6 py-8"
      }`}
    >
      {kicker && <p className="text-[0.6875rem] font-semibold text-on-surface-variant mb-1">{kicker}</p>}
      <h3
        className={`text-sm font-semibold tracking-tight text-on-surface ${
          hasMalayalam(title) ? "font-ml" : ""
        }`}
        lang={hasMalayalam(title) ? "ml" : undefined}
      >
        {title}
      </h3>
      {children && <p className="mt-1 max-w-sm text-xs text-on-surface-variant leading-relaxed">{children}</p>}
      {action && (
        <LinkButton to={action.to} variant="outline" className="mt-4 !min-h-8 !px-3.5 text-xs">
          {action.label}
        </LinkButton>
      )}
    </div>
  );
}

/** Clean, minimal error state. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="anim-fade flex flex-col items-center rounded-lg border border-error/20 bg-error-container/40 px-6 py-8 text-center"
    >
      <h3 className="text-sm font-semibold text-on-error-container">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-xs text-on-error-container/80 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 !min-h-8 !px-3.5 text-xs" onClick={onRetry}>
          <RetryIcon size={14} /> Try again
        </Button>
      )}
    </div>
  );
}

export function SectionHeader({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-outline-variant pb-2">
      <h2 id={id} className="text-sm font-semibold tracking-tight text-on-surface">{title}</h2>
      {action}
    </div>
  );
}
