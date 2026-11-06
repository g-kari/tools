import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import application from "./csv-sql-app.config";

/** Diagnostic-only overlay; retain application server, launch options and budgets. */
export default defineConfig({
  ...application,
  testMatch: ["csv-sql-hydration-window.spec.ts"],
  outputDir: "../../../test-results/csv-sql-hydration-window",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/csv-sql-hydration-window.json", import.meta.url),
        ),
      },
    ],
  ],
});
