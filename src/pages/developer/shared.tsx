import type { ComponentProps, ReactNode } from "react";
import { WarningIcon } from "../../components/ui/icons";

export const inputCls =
  "flex h-9 w-full rounded-md border border-outline-variant bg-surface px-3 text-xs font-normal text-on-surface transition-colors hover:border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-semibold text-on-surface mb-1 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-on-surface-variant">{hint}</span>}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

/** Clean container for developer panels. */
export function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-on-surface">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Inline message using minimal tokens. */
export function Notice({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
        tone === "error"
          ? "border-error/20 bg-error-container text-on-error-container"
          : "border-outline-variant bg-surface-container text-on-surface"
      }`}
    >
      {tone === "error" && <WarningIcon size={14} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

export const VERIFICATION_OPTIONS = [
  { value: "needs_review", label: "Needs review" },
  { value: "verified_secondary", label: "Verified (secondary source)" },
  { value: "verified_official", label: "Verified (official)" },
] as const;
