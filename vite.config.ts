import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// This is a plain, independent Vite + React build: GitHub Pages serves the static
// output, and the Cloudflare Worker (cloudflare/worker.ts) serves the API. No
// platform-specific dev tooling is bundled into the app itself.
const plugins = [react(), tailwindcss()];

export default defineConfig({
  // GitHub Pages serves this project under /zayaans-signature/ while local development uses root.
  base: process.env.GITHUB_ACTIONS ? "/zayaans-signature/" : "/",
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
