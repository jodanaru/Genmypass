import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  build: {
    target: "esnext", // libsodium-sumo usa top-level await
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom/") || id.includes("node_modules/react/")) {
            return "react";
          }
          if (id.includes("node_modules/react-router")) {
            return "router";
          }
          if (id.includes("libsodium") || id.includes("sodium")) {
            return "crypto";
          }
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
            return "i18n";
          }
        },
      },
    },
    // libsodium-sumo es ~1 MB y no admite más división
    chunkSizeWarningLimit: 1100,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Genmypass",
        short_name: "Genmypass",
        description: "Zero-knowledge password manager",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "48x48",
            type: "image/x-icon",
            purpose: "any",
          },
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["libsodium-wrappers-sumo"],
    esbuildOptions: {
      target: "esnext", // libsodium-sumo usa top-level await
    },
  },
});
