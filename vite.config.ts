import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    viteTsConfigPaths(),
    tanstackStart({
      srcDirectory: "app",
    }),
    cloudflare({
      viteEnvironment: { name: "ssr" },
    }),
  ],
});
