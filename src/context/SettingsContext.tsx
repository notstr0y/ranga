import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";

interface SettingsContextValue {
  theme: ThemeMode;
  effectiveTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
  downloadCelebrationEnabled: boolean;
  setDownloadCelebrationEnabled: (enabled: boolean) => void;
  offlineReactionEnabled: boolean;
  setOfflineReactionEnabled: (enabled: boolean) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  celebrationOpen: boolean;
  triggerDownloadCelebration: () => void;
  closeCelebration: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const THEME_KEY = "ranga.theme";
const GIF_DOWNLOAD_KEY = "ranga.gif.download";
const GIF_OFFLINE_KEY = "ranga.gif.offline";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === "light" || val === "dark" || val === "system") return val;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

function getStoredBool(key: string, defaultValue = true): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const val = localStorage.getItem(key);
    if (val === "false") return false;
    if (val === "true") return true;
  } catch {
    /* storage unavailable */
  }
  return defaultValue;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);
  const [downloadCelebrationEnabled, setDownloadCelebrationState] = useState(() =>
    getStoredBool(GIF_DOWNLOAD_KEY, true)
  );
  const [offlineReactionEnabled, setOfflineReactionState] = useState(() =>
    getStoredBool(GIF_OFFLINE_KEY, true)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  // Monitor system color scheme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  // Apply theme class and data-theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
      root.dataset.theme = "dark";
    } else {
      root.classList.remove("dark");
      root.dataset.theme = "light";
    }
  }, [effectiveTheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const setDownloadCelebrationEnabled = (enabled: boolean) => {
    setDownloadCelebrationState(enabled);
    try {
      localStorage.setItem(GIF_DOWNLOAD_KEY, String(enabled));
    } catch {
      /* ignore */
    }
  };

  const setOfflineReactionEnabled = (enabled: boolean) => {
    setOfflineReactionState(enabled);
    try {
      localStorage.setItem(GIF_OFFLINE_KEY, String(enabled));
    } catch {
      /* ignore */
    }
  };

  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  const triggerDownloadCelebration = () => {
    if (downloadCelebrationEnabled) {
      setCelebrationOpen(true);
    }
  };

  const closeCelebration = () => setCelebrationOpen(false);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        effectiveTheme,
        setTheme,
        downloadCelebrationEnabled,
        setDownloadCelebrationEnabled,
        offlineReactionEnabled,
        setOfflineReactionEnabled,
        settingsOpen,
        openSettings,
        closeSettings,
        celebrationOpen,
        triggerDownloadCelebration,
        closeCelebration,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

const defaultSettings: SettingsContextValue = {
  theme: "system",
  effectiveTheme: "light",
  setTheme: () => {},
  downloadCelebrationEnabled: true,
  setDownloadCelebrationEnabled: () => {},
  offlineReactionEnabled: true,
  setOfflineReactionEnabled: () => {},
  settingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
  celebrationOpen: false,
  triggerDownloadCelebration: () => {},
  closeCelebration: () => {},
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  return ctx ?? defaultSettings;
}

