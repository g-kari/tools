import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateSsrFixture } from "./generate-ssr.mjs";

const syntheticPackage = Buffer.from("{}\n");

/** A valid, exclusively synthetic snapshot for failure-path contract tests. */
function syntheticInput(repository) {
  const assets = new Map([
    ["/assets/main-synthetic.js", Buffer.from("const style=`/assets/styles-synthetic.css`;")],
    [
      "/assets/site-synthetic.js",
      Buffer.from("var P=`ca-pub-0`,S=`synthetic-slot`;export{P as t,S as n};"),
    ],
    ["/assets/base64-synthetic.js", Buffer.from("export const synthetic=true;")],
  ]);
  return {
    repository,
    assets,
    manifest: {
      version: 1,
      sourceCommit: "a".repeat(40),
      sourceTree: "b".repeat(40),
      origin: "https://tools.0g0.xyz",
      entry: "/assets/main-synthetic.js",
      activeRoute: "/base64",
      activeChunk: "/assets/base64-synthetic.js",
      assets: [...assets].map(([path, bytes]) => ({
        path,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      })),
      sourceFiles: [
        {
          path: "package.json",
          gitBlob: createHash("sha1")
            .update(`blob ${syntheticPackage.length}\0`)
            .update(syntheticPackage)
            .digest("hex"),
        },
      ],
      routerManifest: {
        routes: {
          __root__: {
            preloads: ["/assets/main-synthetic.js"],
            assets: [
              {
                tag: "script",
                attrs: { type: "module", async: true },
                children: 'import("/assets/main-synthetic.js")',
              },
            ],
          },
          "/base64": { preloads: ["/assets/base64-synthetic.js"], assets: [] },
        },
      },
    },
  };
}

async function checkSafeFailure(runtimeThrow) {
  const repository = await mkdtemp(join(tmpdir(), "synthetic-hydration-redaction-"));
  const captured = [];
  const originalError = console.error;
  console.error = (...arguments_) => captured.push(arguments_);
  try {
    await writeFile(join(repository, "package.json"), syntheticPackage);
    if (runtimeThrow) {
      await mkdir(join(repository, "app/routes"), { recursive: true });
      await writeFile(
        join(repository, "app/routes/__root.tsx"),
        "export const Route=(()=>{throw new Error('SSR_RUNTIME_SENTINEL:'+import.meta.env.VITE_ADSENSE_PUBLISHER_ID)})()",
      );
      await writeFile(join(repository, "app/routes/base64.tsx"), "export const Route={};");
    }
    await assert.rejects(generateSsrFixture(syntheticInput(repository)), (error) => {
      assert.equal(
        error.message,
        runtimeThrow
          ? "Generated source SSR failed; source module details were redacted"
          : "Generated source SSR compilation failed; source details were redacted",
      );
      assert.ok(error.stack.length < 3000);
      assert.doesNotMatch(
        error.stack,
        /data:|base64,|ca-pub-|synthetic-slot|SSR_RUNTIME_SENTINEL|nonexistent-synthetic-repository/,
      );
      assert.equal(error.cause, undefined);
      return true;
    });
    assert.deepEqual(captured, []);
  } finally {
    console.error = originalError;
    await rm(repository, { recursive: true, force: true });
  }
}

test("SSR compilation failures are bounded and redacted", () => checkSafeFailure(false));
test("data-URL source import failures expose no source or runtime constants", () =>
  checkSafeFailure(true));
