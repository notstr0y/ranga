import { useSettings } from "../../context/SettingsContext";
import { useConnectivity } from "../../hooks/useConnectivity";
import { Button } from "../ui/Button";
import { OfflineIcon, RetryIcon } from "../ui/icons";
import rangaOffline from "../../assets/ranga/ranga-offline.webp";

/**
 * Minimal file-manager offline screen.
 * Displays a clean, accessible offline message with retry action.
 * Shows Fahadh Faasil reaction GIF when enabled in Settings without external embeds.
 */
export function OfflineScreen() {
  const { check, checking, failedRetry } = useConnectivity();
  const { offlineReactionEnabled } = useSettings();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-surface/90 p-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-lg border border-outline-variant bg-surface p-6 text-center shadow-md">
        {offlineReactionEnabled ? (
          <div className="mb-4 w-36 overflow-hidden rounded-md bg-surface-container" style={{ aspectRatio: "280/498" }}>
            <img
              src={rangaOffline}
              alt="You're offline"
              width={280}
              height={498}
              loading="eager"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        ) : (
          <span className="mb-4 flex size-10 items-center justify-center rounded-md border border-outline-variant bg-surface-container text-on-surface-variant">
            <OfflineIcon size={20} />
          </span>
        )}

        <h1 className="text-base font-bold tracking-tight text-on-surface">You're offline</h1>
        <p className="mt-1 text-xs text-on-surface-variant">Check your connection and try again.</p>

        <div className="mt-5 flex flex-col items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => void check()}
            disabled={checking}
            aria-busy={checking}
          >
            <RetryIcon size={14} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking…" : "Try Again"}
          </Button>

          {failedRetry && !checking && (
            <p className="text-xs text-on-surface-variant" role="status">
              Still no connection. Give it a moment, then try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
