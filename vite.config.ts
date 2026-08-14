import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { cpSync, existsSync } from "node:fs";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const resourceImageBase = `/@fs/${path.resolve(__dirname, "./src-tauri/resources/images").replace(/\\/g, "/")}`;

// https://vite.dev/config/
function copyWebImages(mode: string): Plugin {
  return {
    name: "copy-web-images",
    closeBundle() {
      if (mode !== "web") return;
      const source = path.resolve(__dirname, "src-tauri/resources/images");
      const destination = path.resolve(__dirname, "dist/images");
      if (existsSync(source)) cpSync(source, destination, { recursive: true });
    },
  };
}

export default defineConfig(async ({ mode }) => ({
  plugins: [react(), tailwindcss(), copyWebImages(mode)],
  base: mode === "web" ? (process.env.VITE_WEB_BASE || "/") : "/",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  define: {
    "import.meta.env.VITE_RESOURCE_IMAGE_BASE": JSON.stringify(resourceImageBase),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
