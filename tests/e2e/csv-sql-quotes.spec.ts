import { test } from "../browser/csv-json/url-app-test";
import {
  assertCsvSqlRecovery,
  malformedCsvSqlInputs,
} from "../browser/csv-json/csv-sql-recovery-assertions";

for (const [viewportName, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test.describe(viewportName, () => {
    test.use({ viewport });
    for (const malformed of malformedCsvSqlInputs) {
      test(`CSV SQL full app repairs ${malformed.name} without stale SQL or lost input`, async ({
        page,
      }) => {
        await assertCsvSqlRecovery(page, malformed, "csv-sql-app-error");
      });
    }
  });
}
