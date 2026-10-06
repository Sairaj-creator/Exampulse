import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-query": ["@tanstack/react-query", "axios"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.js"],
  },
});