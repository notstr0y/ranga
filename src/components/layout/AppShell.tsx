import { Outlet } from "react-router-dom";
import { AnnouncementBanner } from "../brand/AnnouncementBanner";
import { SettingsDialog } from "../settings/SettingsDialog";
import { TopBar } from "./TopBar";

/**
 * Minimal file-manager application shell.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-on-primary focus:outline-none"
      >
        Skip to content
      </a>
      <TopBar />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pb-14 pt-5 focus:outline-none sm:px-6 sm:pt-6">
        <AnnouncementBanner />
        <Outlet />
      </main>
      <SettingsDialog />
    </div>
  );
}
