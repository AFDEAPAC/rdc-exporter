import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// base: "./" keeps every asset reference relative so the build can be served
// from any subpath or opened directly from the local filesystem (file://).
// viteSingleFile inlines JS/CSS into one index.html, which removes the
// cross-origin module fetch that browsers block on file:// URLs.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  // A dedicated, fixed dev port avoids colliding with other Vite projects on
  // this host (e.g. a separate app on the default 5173). strictPort makes a
  // conflict fail loudly instead of silently shifting to another port, which
  // previously led to opening the wrong app in the browser.
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
