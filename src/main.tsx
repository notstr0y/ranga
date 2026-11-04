import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import App from "./App";
import { ConnectivityProvider } from "./hooks/useConnectivity";
import { DeveloperProvider } from "./hooks/useDeveloper";
import { SettingsProvider } from "./context/SettingsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <ConnectivityProvider>
        <DeveloperProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DeveloperProvider>
      </ConnectivityProvider>
    </SettingsProvider>
  </StrictMode>,
);
