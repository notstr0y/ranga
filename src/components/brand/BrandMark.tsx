import { useState } from "react";
import { InteractiveWordmark } from "./InteractiveWordmark";

/**
 * The RANGA square app icon:
 * Uses the exact square artwork without rounded corners, masks, or circular backgrounds.
 */
export function BrandMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <img
      src="/icons/icon-192.png"
      alt="RANGA icon"
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      onError={() => setBroken(true)}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Square app icon + Clean Wordmark:
 * Simple, consistent branding.
 */
export function Wordmark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <BrandMark size={size} />
      <InteractiveWordmark />
    </span>
  );
}
