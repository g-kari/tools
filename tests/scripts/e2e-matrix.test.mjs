import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  createMatrix,
  fileFilter,
  findTestFiles,
  runTestFiles,
} from "../../scripts/e2e-matrix.mjs";

const script = fileURLToPath(new URL("../../scripts/e2e-matrix.mjs", import.meta.url));
const paths = (count) =>
  Array.from({ length: count }, (_, index) => `tests/e2e/test-${index}.spec.ts`);

for (const count of [1, 255, 256, 257, 312, 1000, 65537]) {
  test(`${count} specs are assigned exactly once to at most 256 nonempty balanced jobs`, () => {
    const files = paths(count);
    const matrix = createMatrix(files);
    const grouped = matrix.include.flatMap((group) => group.files);
    assert.equal(matrix.include.length, Math.min(count, 256));
    assert.deepEqual([...grouped].sort(), [...files].sort());
    assert.equal(new Set(grouped).size, count);
    assert.deepEqual(
      matrix.include.map((group) => group.group),
      Array.from({ length: matrix.include.length }, (_, index) => index + 1),
    );
    for (const { files: group } of matrix.include) {
      assert.ok(group.length >= Math.floor(count / matrix.include.length));
      assert.ok(group.length <= Math.ceil(count / matrix.include.length));
    }
    assert.deepEqual(createMatrix([...files].reverse()), matrix);
    assert.deepEqual(files, paths(count));
    assert.deepEqual(JSON.parse(JSON.stringify(matrix)), matrix);
  });
}

test("empty, duplicate, non-spec, traversal, and malformed groups fail closed", () => {
  for (const files of [
    [],
    new Array(1),
    null,
    {},
    "tests/e2e/a.spec.ts",
    [null],
    [1],
    ["tests/e2e/a.spec.ts", "tests/e2e/a.spec.ts"],
    ["tests/e2e/a.test.ts"],
    ["other/a.spec.ts"],
    ["/tests/e2e/a.spec.ts"],
    ["tests/e2e/../a.spec.ts"],
    ["tests/e2e/./a.spec.ts"],
    ["tests/e2e//a.spec.ts"],
    ["tests/e2e/\0.spec.ts"],
  ]) {
    assert.throws(() => createMatrix(files));
    assert.throws(() => runTestFiles(files, () => assert.fail("Must not launch a process")));
  }
});

test("discovery and matrix CLI include nested and unusual filenames, ignoring non-spec files and symlinks", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "e2e-matrix-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, "tests/e2e/nested"), { recursive: true });
  const files = ["tests/e2e/z.spec.ts", "tests/e2e/nested/a [1]\n'$(echo test).spec.ts"];
  for (const file of [...files, "tests/e2e/ignored.txt"]) writeFileSync(join(directory, file), "");
  mkdirSync(join(directory, "tests/e2e/directory.spec.ts"));
  symlinkSync(join(directory, files[0]), join(directory, "tests/e2e/link.spec.ts"));
  symlinkSync(join(directory, "tests/e2e/nested"), join(directory, "tests/e2e/link-directory"));
  assert.deepEqual(
    findTestFiles(join(directory, "tests/e2e")),
    files.map((file) => join(directory, file)).sort(),
  );
  const matrix = JSON.parse(
    execFileSync(process.execPath, [script, "matrix"], { cwd: directory, encoding: "utf8" }),
  );
  assert.deepEqual(matrix.include.flatMap((group) => group.files).sort(), [...files].sort());
});

test("file filters select only the exact absolute path, escaping regex and shell metacharacters", () => {
  for (const file of [
    "tests/e2e/a.spec.ts",
    "tests/e2e/nested/[a]+(b).*$^?|{}\\ '$(echo test)\n.spec.ts",
  ]) {
    const filter = new RegExp(fileFilter(file));
    assert.ok(filter.test(resolve(file)));
    assert.ok(!filter.test(`${resolve(file)}.extra`));
    assert.ok(!filter.test(`prefix${resolve(file)}`));
    assert.ok(!filter.test(resolve(file.replace(".spec.ts", "xspecYts"))));
  }
});

test("each file gets one shell-free Playwright invocation and all files run after failures", () => {
  const files = [
    "tests/e2e/first.spec.ts",
    "tests/e2e/a '$(echo test) [2].spec.ts",
    "tests/e2e/last.spec.ts",
  ];
  for (const failure of [
    { status: 1 },
    { status: null, signal: "SIGTERM" },
    { status: null, error: new Error("spawn failed") },
  ]) {
    const calls = [];
    const result = runTestFiles(files, (...args) => {
      calls.push(args);
      return calls.length === 1 ? failure : { status: 0 };
    });
    assert.equal(result, 1);
    assert.deepEqual(
      calls,
      files.map((file) => [
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
      ]),
    );
  }
  assert.equal(
    runTestFiles(files, () => ({ status: 0 })),
    0,
  );
});

test("CLI fails for invalid JSON, empty groups, empty discovery, or an unknown command", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "e2e-matrix-empty-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, "tests/e2e"), { recursive: true });
  for (const [command, value] of [
    ["run", "not-json"],
    ["run", "[]"],
    ["validate", "not-json"],
    ["validate", "[]"],
    ["validate", undefined],
    ["matrix", "[]"],
    ["unknown", "[]"],
  ]) {
    const result = spawnSync(process.execPath, [script, command], {
      cwd: directory,
      env: { ...process.env, E2E_TEST_FILES: value },
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.notEqual(result.stderr, "");
  }
  const valid = spawnSync(process.execPath, [script, "validate"], {
    cwd: directory,
    env: { ...process.env, E2E_TEST_FILES: JSON.stringify(paths(2)) },
    encoding: "utf8",
  });
  assert.equal(valid.status, 0);
  assert.equal(valid.stdout, "");
  assert.equal(valid.stderr, "");
});
