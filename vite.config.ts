import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@drcollab/shared": path.resolve(__dirname, "./src/shared/index.ts"),
      "@shared": path.resolve(__dirname, "./src/shared/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        // Don't follow redirects - pass them through to the browser.
        // This is essential for OAuth callbacks: Google redirects the browser
        // to /api/auth/google/callback, the backend then redirects to the
        // frontend — the browser must see and follow that second redirect.
        followRedirects: false,
      },
    },
  },
});
