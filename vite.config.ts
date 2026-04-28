import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { version } from "./package.json";

// Teams requires HTTPS for tab apps
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/meetburn/" : "/",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react(), basicSsl()],
  server: {
    port: 53000,
    https: true,
  },
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
}));
