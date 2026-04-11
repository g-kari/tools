import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    // 自動生成ファイルはフォーマットチェック対象外
    ignorePatterns: ["app/routeTree.gen.ts"],
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [
    tanstackStart({
      srcDirectory: "app",
    }),
    cloudflare({
      persistState: true,
      configPath: "./wrangler.jsonc",
      viteEnvironment: { name: "ssr" },
    }),
    {
      // rolldownがCJSインターロップ用に生成する createRequire(import.meta.url) は
      // CF Workers の no_bundle 環境では import.meta.url が undefined になり失敗する。
      // ビルド時にダミーパスへ置き換えてWorker起動クラッシュを防ぐ。
      name: "fix-cloudflare-create-require",
      renderChunk(code: string) {
        if (!code.includes("createRequire(import.meta.url)")) return null;
        return {
          code: code.replaceAll(
            "createRequire(import.meta.url)",
            'createRequire("file:///worker.js")',
          ),
          map: null,
        };
      },
    },
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "~": new URL("./app", import.meta.url).pathname,
    },
  },
  server: {
    watch: {
      // PlaywrightのレポートディレクトリをHMR監視対象から除外
      ignored: ["**/playwright-report/**", "**/test-results/**"],
    },
    // Cloudflare Pagesプレビュー環境用のホスト許可設定
    allowedHosts: ["sub2pc-preview.0g0.xyz"],
  },
});
