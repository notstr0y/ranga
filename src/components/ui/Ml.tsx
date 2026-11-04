import type { ReactNode } from "react";

/** Malayalam block (U+0D00–U+0D7F). */
const MALAYALAM = /[\u0D00-\u0D7F]/;
export const hasMalayalam = (s: unknown): boolean => typeof s === "string" && MALAYALAM.test(s);

/**
 * Wraps intentionally-Malayalam copy. `lang="ml"` selects the right shaping and fallback face, and the global
 * :lang(ml) rule gives it Noto Sans Malayalam with a taller line height and no tracking or upper-casing.
 */
export function Ml({ children, className = "", as: Tag = "span" }: { children: ReactNode; className?: string; as?: "span" | "p" | "h2" | "h3" | "div" }) {
  return <Tag lang="ml" className={`ml ${className}`}>{children}</Tag>;
}
