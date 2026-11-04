import { useState } from "react";
import { CloseIcon, InfoIcon } from "../ui/icons";

const DISMISSED_KEY = "ranga.announcement.dismissed";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * One-time introductory announcement banner.
 * Displayed once per user/browser; persisted dismissal in localStorage.
 */
export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(isDismissed);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="anim-fade mb-5 flex items-center justify-between gap-3 rounded-md border border-outline-variant bg-surface-container px-3.5 py-2.5 text-on-surface"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded border border-outline-variant bg-surface text-on-surface-variant">
          <InfoIcon size={14} />
        </span>
        <p className="text-xs font-medium leading-snug">
          Help build a shared academic resource library for KTU students.
        </p>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="flex size-6 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}

