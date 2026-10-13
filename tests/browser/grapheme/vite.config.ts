import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

/** Bundle actual route components/styles, excluding Workers and external services. */
export default defineConfig({
  root: fileURLToPath(new URL("./fixture", import.meta.url)),
  plugins: [tailwindcss()],
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
