import path from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
  server: {
    watch: {
      // PlaywrightのレポートディレクトリをHMR監視対象から除外
      ignored: ["**/playwright-report/**", "**/test-results/**"],
    },
    allowedHosts: ['sub2pc-preview.0g0.xyz'],
  },
});
