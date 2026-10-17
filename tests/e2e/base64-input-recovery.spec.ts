import { test } from "../browser/csv-json/base64-app-test";
import {
  assertBase64Recovery,
  malformedInputs,
} from "../browser/csv-json/base64-recovery-assertions";

for (const [name, codeUnits] of malformedInputs) {
  test(`Base64 recovers from ${name} without losing input`, async ({ page }) => {
    await assertBase64Recovery(page, codeUnits, "base64-app-error");
  });
}
