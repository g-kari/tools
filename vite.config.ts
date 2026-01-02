import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      srcDirectory: "app",
      // TODO: SSG prerenderingは一時的に無効（MUI SSR問題解決後に有効化）
      // prerender: {
      //   enabled: true,
      //   crawlLinks: true,
      //   filter: (route) => !route.path.startsWith("/api/"),
      // },
    }),
    cloudflare({
      persistState: true,
      configPath: "./wrangler.jsonc",
      viteEnvironment: { name: "ssr" },
    }),
  ],
  ssr: {
    noExternal: ["@mui/*"],
  },
  server: {
    watch: {
      // PlaywrightのレポートディレクトリをHMR監視対象から除外
      ignored: ["**/playwright-report/**", "**/test-results/**"],
    },
  },
});
