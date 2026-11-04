import { Link, type LinkProps } from "react-router-dom";
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "accent" | "tonal" | "outline" | "ghost" | "danger" | "inverse";

const base =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3.5 text-xs font-semibold tracking-wide transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  accent: "bg-primary text-on-primary hover:bg-primary/90",
  tonal: "bg-surface-container text-on-surface hover:bg-surface-container-high",
  outline: "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container hover:border-outline",
  ghost: "bg-transparent text-on-surface hover:bg-surface-container",
  danger: "bg-error text-on-error hover:bg-error/90",
  inverse: "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container",
};

const cls = (v: ButtonVariant, extra = "") => `${base} ${variants[v]} ${extra}`;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type="button" className={cls(variant, className)} {...props} />;
}

export function LinkButton({ variant = "primary", className, children, ...props }: LinkProps & { variant?: ButtonVariant; children: ReactNode }) {
  return <Link className={cls(variant, className)} {...props}>{children}</Link>;
}

/** A button-styled external anchor (opens in a new tab). */
export function AnchorButton({ variant = "primary", className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }) {
  return <a className={cls(variant, className)} {...props} />;
}
