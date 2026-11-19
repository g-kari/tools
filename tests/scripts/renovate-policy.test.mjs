import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const config = JSON.parse(readFileSync(new URL("../../renovate.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

// Repository policy, not a Renovate evaluator or proof of GitHub branch protection.
function assertManualAutomergePolicy(value) {
  assert.deepEqual(value.extends, ["config:recommended", "helpers:pinGitHubActionDigests"]);
  for (const [key, expected] of Object.entries({
    automerge: false,
    automergeType: "pr",
    platformAutomerge: false,
    ignoreTests: false,
    ignoreScripts: true,
    rebaseWhen: "behind-base-branch",
    minimumReleaseAge: "14 days",
    minimumReleaseAgeBehaviour: "timestamp-required",
    internalChecksFilter: "strict",
  })) {
    assert.equal(value[key], expected, `root ${key}`);
  }

  assert.ok(Array.isArray(value.packageRules) && value.packageRules.length > 0);
  const { description, ...lastRule } = value.packageRules.at(-1);
  assert.equal(typeof description, "string");
  assert.deepEqual(lastRule, { matchPackageNames: ["*"], automerge: false });
  assert.deepEqual(value.vulnerabilityAlerts, {
    enabled: true,
    minimumReleaseAge: null,
    automerge: false,
  });
  assert.deepEqual(value.lockFileMaintenance, { enabled: false, automerge: false });

  function visit(node, location = "root") {
    if (node === null || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      const path = `${location}.${key}`;
      if (key === "automerge" || key === "platformAutomerge" || key === "ignoreTests") {
        assert.equal(child, false, path);
      }
      if (key === "ignoreScripts") assert.equal(child, true, path);
      if (key === "extends") assert.equal(location, "root", `Unreviewed nested preset: ${path}`);
      visit(child, path);
    }
  }
  visit(value);
}

await test("Renovate stays manual until required real CI and merge requirements are verified", () => {
  assertManualAutomergePolicy(config);
});

const mutations = {
  "root automerge": (value) => (value.automerge = true),
  "platform-native automerge": (value) => (value.platformAutomerge = true),
  "ignored tests": (value) => (value.ignoreTests = true),
  "enabled scripts": (value) => (value.ignoreScripts = false),
  "unknown root preset": (value) => value.extends.push(":automergeAll"),
  "nested preset": (value) => (value.packageRules[0].extends = [":automergeAll"]),
  "nested automerge": (value) => (value.npm = { automerge: true }),
  "nested platform automerge": (value) => (value.group = { platformAutomerge: true }),
  "early enabling rule": (value) => (value.packageRules[0].automerge = true),
  "late enabling rule": (value) =>
    value.packageRules.push({ matchUpdateTypes: ["minor", "patch"], automerge: true }),
  "missing terminal guard": (value) => value.packageRules.pop(),
  "narrowed terminal guard": (value) => (value.packageRules.at(-1).matchManagers = ["npm"]),
  "weakened release age": (value) => (value.minimumReleaseAge = "0 days"),
  "optional release timestamp": (value) =>
    (value.minimumReleaseAgeBehaviour = "timestamp-optional"),
  "security automerge": (value) => (value.vulnerabilityAlerts.automerge = true),
  "lockfile automerge": (value) => (value.lockFileMaintenance.automerge = true),
};

for (const [name, mutate] of Object.entries(mutations)) {
  await test(`policy rejects ${name}`, () => {
    const changed = structuredClone(config);
    mutate(changed);
    assert.throws(() => assertManualAutomergePolicy(changed));
  });
}

await test("npm test runs the policy regression before the unchanged application unit suite", () => {
  assert.equal(manifest.scripts.test, "npm run test:renovate && vp test run");
  assert.equal(
    manifest.scripts["test:renovate"],
    "node --test tests/scripts/renovate-policy.test.mjs",
  );
});
