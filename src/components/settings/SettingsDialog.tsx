import { useSettings, type ThemeMode } from "../../context/SettingsContext";
import { useDeveloper } from "../../hooks/useDeveloper";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { DEVELOPER, RELEASE_LABEL } from "../../lib/announcement";
import { Dialog } from "../ui/Dialog";
import { CloseIcon, DeveloperIcon, ExternalIcon, InstallIcon } from "../ui/icons";
import { LinkButton, Button } from "../ui/Button";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-outline-variant transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? "bg-primary border-primary" : "bg-surface-container"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size-4 transform rounded-full bg-surface shadow-sm transition duration-150 ease-in-out ${
          checked ? "translate-x-5 bg-on-primary" : "translate-x-0.5 bg-on-surface-variant"
        }`}
      />
    </button>
  );
}

export function SettingsDialog() {
  const {
    settingsOpen,
    closeSettings,
    theme,
    setTheme,
    downloadCelebrationEnabled,
    setDownloadCelebrationEnabled,
    offlineReactionEnabled,
    setOfflineReactionEnabled,
  } = useSettings();

  const { isDeveloper } = useDeveloper();
  const { canInstall, install, installed } = useInstallPrompt();

  return (
    <Dialog open={settingsOpen} onClose={closeSettings} labelledBy="settings-dialog-title" size="md">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <h2 id="settings-dialog-title" className="text-base font-semibold tracking-tight text-on-surface">
          Settings
        </h2>
        <button
          type="button"
          onClick={closeSettings}
          aria-label="Close settings"
          className="flex size-7 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="space-y-5 pt-3">
        {/* Appearance Section */}
        <section aria-labelledby="theme-heading">
          <h3 id="theme-heading" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Appearance
          </h3>
          <div className="grid grid-cols-3 gap-1.5 rounded-md border border-outline-variant bg-surface-container p-1">
            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => {
              const active = theme === mode;
              const labels: Record<ThemeMode, string> = {
                system: "System",
                light: "Light",
                dark: "Dark",
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  className={`rounded py-1.5 text-xs font-medium capitalize transition-colors ${
                    active
                      ? "bg-primary text-on-primary font-semibold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Personality Section */}
        <section aria-labelledby="personality-heading">
          <h3 id="personality-heading" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Personality
          </h3>
          <div className="space-y-3 rounded-md border border-outline-variant bg-surface p-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-on-surface">Download celebrations</p>
                <p className="text-[0.6875rem] text-on-surface-variant">Show celebration on completion</p>
              </div>
              <Switch
                checked={downloadCelebrationEnabled}
                onChange={setDownloadCelebrationEnabled}
                label="Toggle download celebrations"
              />
            </div>

            <hr className="border-outline-variant" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-on-surface">Offline reaction</p>
                <p className="text-[0.6875rem] text-on-surface-variant">Show reaction GIF when disconnected</p>
              </div>
              <Switch
                checked={offlineReactionEnabled}
                onChange={setOfflineReactionEnabled}
                label="Toggle offline reaction GIF"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section aria-labelledby="about-heading" className="rounded-md border border-outline-variant bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <h3 id="about-heading" className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              About ranga
            </h3>
            <span className="font-mono text-xs text-on-surface-variant">
              {RELEASE_LABEL}
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            A shared academic resource library for KTU students.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Developed by {DEVELOPER.name}</span>
            <span aria-hidden="true" className="text-outline">•</span>
            <a
              href={DEVELOPER.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-on-surface underline-offset-2 hover:underline"
            >
              GitHub <ExternalIcon size={11} />
            </a>
          </div>

          {(canInstall || installed || isDeveloper) && (
            <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-outline-variant">
              {isDeveloper && (
                <LinkButton to="/developer" variant="outline" onClick={closeSettings} className="w-full text-xs">
                  <DeveloperIcon size={14} /> Developer workspace
                </LinkButton>
              )}
              {canInstall && (
                <Button variant="primary" onClick={install} className="w-full text-xs">
                  <InstallIcon size={14} /> Install application
                </Button>
              )}
              {installed && (
                <p className="text-center text-xs text-on-surface-variant">Installed on this device.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}
