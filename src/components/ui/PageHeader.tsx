import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  kicker,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  kicker?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        {kicker && (
          <p className="font-mono text-[0.6875rem] font-semibold text-on-surface-variant mb-0.5">
            {kicker}
          </p>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-on-surface sm:text-xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}
