import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_MATRIX_JOBS = 256;

/** Find the same regular .spec.ts files as the former find command, without following symlinks. */
export function findTestFiles(directory = "tests/e2e") {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) return findTestFiles(file);
      return entry.isFile() && entry.name.endsWith(".spec.ts") ? [file] : [];
    })
    .sort();
}

/** Validate the group shape; Playwright still checks file existence and collects the actual tests. */
function validateFiles(files) {
  if (
    !Array.isArray(files) ||
    files.length === 0 ||
    Array.from(files).some(
      (file) =>
        typeof file !== "string" ||
        !file.startsWith("tests/e2e/") ||
        !file.endsWith(".spec.ts") ||
        file.includes("\0") ||
        file.split("/").some((part) => part === ".." || part === "." || part === ""),
    ) ||
    new Set(files).size !== files.length
  ) {
    throw new Error("Expected a nonempty, unique list of tests/e2e/*.spec.ts paths");
  }
}

/** Keep every file exactly once while bounding GitHub's matrix expansion to 256 jobs. */
export function createMatrix(files) {
  validateFiles(files);
  const groups = Array.from({ length: Math.min(files.length, MAX_MATRIX_JOBS) }, (_, index) => ({
    group: index + 1,
    files: [],
  }));
  [...files].sort().forEach((file, index) => groups[index % groups.length].files.push(file));
  return { include: groups };
}

/** Playwright treats positional arguments as regular expressions against absolute file paths. */
export function fileFilter(file) {
  return `^${resolve(file).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
}

/** Preserve the per-file retry/maxFailures budget and still attempt later files after a failure. */
export function runTestFiles(files, run = spawnSync) {
  validateFiles(files);
  let exitCode = 0;
  for (const file of files) {
    console.log(`Running E2E file: ${JSON.stringify(file)}`);
    const result = run(
      "npx",
      [
        "--no-install",
        "playwright",
        "test",
        fileFilter(file),
        "--project=chromium",
        "--reporter=list",
      ],
      { stdio: "inherit", shell: false },
    );
    if (result.error) console.error(result.error.message);
    if (result.error || result.status !== 0) exitCode = 1;
  }
  return exitCode;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv[2] === "matrix") {
      console.log(JSON.stringify(createMatrix(findTestFiles())));
    } else if (process.argv[2] === "run" || process.argv[2] === "validate") {
      const files = JSON.parse(process.env.E2E_TEST_FILES);
      validateFiles(files);
      if (process.argv[2] === "run") process.exitCode = runTestFiles(files);
    } else {
      throw new Error("Usage: node scripts/e2e-matrix.mjs matrix|validate|run");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
