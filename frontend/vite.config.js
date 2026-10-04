import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PWA setup (vite-plugin-pwa) is intentionally NOT added yet -- that's a
// separate step once this basic app is confirmed working. Adding it now
// would make build errors harder to isolate.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Lets the dev server proxy /api/* straight to FastAPI, so the
      // frontend can just call fetch('/api/match') without hardcoding
      // localhost:8000 everywhere -- one less thing to change per environment.
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
