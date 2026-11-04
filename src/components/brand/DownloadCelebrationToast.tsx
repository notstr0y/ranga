import { useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { CloseIcon } from "../ui/icons";
import rangaCelebration from "../../assets/ranga/ranga-celebration.webp";

/**
 * Small celebratory popup shown after a successful resource download.
 * Features Fahadh Faasil / Rangannan with caption: "Nannayi baa ... Nnnayii baa".
 */
export function DownloadCelebrationToast() {
  const { celebrationOpen, closeCelebration } = useSettings();

  useEffect(() => {
    if (!celebrationOpen) return;
    const timer = window.setTimeout(closeCelebration, 4000);
    return () => window.clearTimeout(timer);
  }, [celebrationOpen, closeCelebration]);

  if (!celebrationOpen) return null;

  return (
    <aside
      aria-live="polite"
      role="status"
      className="anim-pop fixed bottom-5 right-5 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-outline-variant bg-surface p-2.5 shadow-lg"
    >
      <div className="relative">
        <button
          type="button"
          onClick={closeCelebration}
          aria-label="Close celebration"
          className="absolute -right-1 -top-1 z-10 flex size-6 items-center justify-center rounded border border-outline-variant bg-surface text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <CloseIcon size={12} />
        </button>

        {/* Local Celebratory WebP/GIF */}
        <div className="overflow-hidden rounded-md bg-surface-container" style={{ aspectRatio: "398/224" }}>
          <img
            src={rangaCelebration}
            alt="Download celebration"
            width={398}
            height={224}
            loading="eager"
            decoding="async"
            className="size-full object-cover"
          />
        </div>

        <div className="mt-2 px-1 pb-0.5 text-center">
          <p className="text-xs font-semibold text-on-surface">Nannayi baa ... Nnnayii baa</p>
        </div>
      </div>
    </aside>
  );
}
