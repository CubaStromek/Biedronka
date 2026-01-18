import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  const plugins = [react()];

  // Replit pluginy pouze v Replit prostředí
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
        m.default(),
      );
      const cartographer = await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer(),
      );
      const devBanner = await import("@replit/vite-plugin-dev-banner").then((m) =>
        m.devBanner(),
      );
      plugins.push(runtimeErrorOverlay, cartographer, devBanner);
    } catch {
      // Pluginy nejsou dostupné - OK pro Electron
    }
  }

  return {
    plugins,
    // Relativní cesty pro Electron
    base: './',
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "client-dist"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
