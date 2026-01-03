import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart({
      srcDirectory: "app",
    }),
    cloudflare({
      persistState: true,
      configPath: "./wrangler.jsonc",
      viteEnvironment: { name: "ssr" },
    }),
    tsconfigPaths(),
    react(),
  ],
  ssr: {
    noExternal: ["@mui/*", "@emotion/*"],
  },
  server: {
    watch: {
      // PlaywrightのレポートディレクトリをHMR監視対象から除外
      ignored: ["**/playwright-report/**", "**/test-results/**"],
    },
  },
});
