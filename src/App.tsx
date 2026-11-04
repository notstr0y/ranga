import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { OfflineScreen } from "./components/brand/OfflineScreen";
import { UpdateToast } from "./components/brand/UpdateToast";
import { AppShell } from "./components/layout/AppShell";
import { RouteEffects } from "./components/layout/RouteEffects";
import { useConnectivity } from "./hooks/useConnectivity";
import { BrowsePage } from "./pages/BrowsePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ResourcePage } from "./pages/ResourcePage";
import { SubjectPage } from "./pages/SubjectPage";
import { WelcomeOverlay } from "./components/brand/WelcomeOverlay";
import { DownloadCelebrationToast } from "./components/brand/DownloadCelebrationToast";

// The developer workspace is lazy-loaded only when accessing /developer
const DeveloperPage = lazy(() =>
  import("./pages/developer/DeveloperPage").then((m) => ({ default: m.DeveloperPage }))
);

export default function App() {
  const { online } = useConnectivity();
  // When the connection returns, remount the routes so every page re-fetches cleanly.
  const [epoch, setEpoch] = useState(0);
  const wasOffline = useRef(!online);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setEpoch((n) => n + 1);
    }
  }, [online]);

  return (
    <>
      <div inert={!online} aria-hidden={!online}>
        <WelcomeOverlay />
        <RouteEffects />
        <Routes key={epoch}>
          <Route element={<AppShell />}>
            {/* Primary browsing flow: default entry point is the programme/catalogue browsing experience */}
            <Route index element={<BrowsePage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="browse/:programme" element={<BrowsePage />} />
            <Route path="browse/:programme/:scheme" element={<BrowsePage />} />
            <Route path="browse/:programme/:scheme/:semester" element={<BrowsePage />} />
            <Route path="subject/:id" element={<SubjectPage />} />
            <Route path="resources" element={<Navigate to="/" replace />} />
            <Route path="resources/:id" element={<ResourcePage />} />
            <Route path="search" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route
            path="developer"
            element={
              <Suspense
                fallback={
                  <div className="dev grid min-h-dvh place-items-center bg-paper">
                    <p className="t-label font-bold" role="status">
                      Loading…
                    </p>
                  </div>
                }
              >
                <DeveloperPage />
              </Suspense>
            }
          />
        </Routes>
        <UpdateToast />
        <DownloadCelebrationToast />
      </div>
      {!online && <OfflineScreen />}
    </>
  );
}
