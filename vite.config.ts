import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

const BG = "#0a0c10"; // modern neutral dark — matches --md-sys-color-surface in dark mode
// package.json is the single source of truth for the release label shown on the home screen.
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a new deployment is downloaded in the background and the student is asked to
      // refresh (see UpdateToast) — nothing reloads mid-read.
      registerType: "prompt",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon-64.png"],
      manifest: {
        id: "/",
        name: "RANGA",
        short_name: "RANGA",
        description: "KTU academic resources, all in one place.",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: BG,
        background_color: BG,
        categories: ["education"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell + static assets only (includes the offline meme so the offline screen works).
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2,webmanifest}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Catalogue data, the signed-URL function and signed storage URLs are never cached:
          // they are private/short-lived and must always reflect the server.
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith(".supabase.co"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.searchParams.has("X-Amz-Signature"),
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
