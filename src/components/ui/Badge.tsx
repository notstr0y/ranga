import type { ReactNode } from "react";

/** Minimal monochrome badge. */
export function Badge({
  children,
  tone = "default",
  title,
}: {
  children: ReactNode;
  tone?: "default" | "strong" | "warn" | "accent";
  title?: string;
}) {
  const tones = {
    default: "border-outline-variant bg-surface-container text-on-surface-variant",
    strong: "border-primary bg-primary text-on-primary",
    warn: "border-outline-variant bg-surface-container-high text-on-surface",
    accent: "border-outline-variant bg-surface-container text-on-surface",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
