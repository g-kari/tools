import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Build the real clipboard hook with a synthetic React UI and no app services. */
export default defineConfig({
  root: fileURLToPath(new URL("./fixture", import.meta.url)),
  resolve: {
    alias: { "~": fileURLToPath(new URL("../../../app", import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "fixture.js",
        assetFileNames: "fixture.[ext]",
      },
    },
  },
});
