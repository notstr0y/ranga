import { Link } from "react-router-dom";
import { BrandMark } from "../brand/BrandMark";
import { InteractiveWordmark } from "../brand/InteractiveWordmark";
import { SettingsIcon } from "../ui/icons";
import { useSettings } from "../../context/SettingsContext";

/**
 * Minimal file-manager application header:
 * Clean, lightweight top bar with brand icon, wordmark, and settings action.
 */
export function TopBar() {
  const { openSettings } = useSettings();

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-outline-variant bg-surface">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="RANGA - Academic Resources"
            className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BrandMark size={24} />
          </Link>
          <InteractiveWordmark />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSettings}
            aria-label="Settings"
            aria-haspopup="dialog"
            className="flex size-8 items-center justify-center rounded-md border border-outline-variant bg-surface text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
