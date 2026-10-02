import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const real = process.env.EMOJI_REAL_FFMPEG === "1";
export default defineConfig({
  root: fileURLToPath(new URL("./fixture", import.meta.url)),
  base: real ? "/real/" : "/shim/",
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("../../../app", import.meta.url)),
      ...(!real
        ? { "@ffmpeg/ffmpeg": fileURLToPath(new URL("./fixture/ffmpeg-shim.ts", import.meta.url)) }
        : {}),
    },
  },
  build: {
    outDir: fileURLToPath(new URL(real ? "./dist/real" : "./dist/shim", import.meta.url)),
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: { entryFileNames: "fixture.js", assetFileNames: "assets/[name]-[hash].[ext]" },
    },
  },
});
