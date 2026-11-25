import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The browser only ever talks to /api. In dev, Vite forwards it to the backend.
// In Docker, nginx does the same job (see web/nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
  },
});
