import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import application from "./csv-sql-app.config";

export default defineConfig({
  ...application,
  testMatch: ["csv-sql-hydration-window.spec.ts", "client-startup-native.spec.ts"],
  outputDir: "../../../test-results/client-startup",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/client-startup.json", import.meta.url),
        ),
      },
    ],
  ],
});
