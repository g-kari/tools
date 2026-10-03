import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { before, after } from "node:test";
import { prepareLiveResponse, containLiveResponseHeaders } from "./live-response.mjs";
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
import { JSDOM } from "jsdom";
import vm from "node:vm";

const packageBytes = Buffer.from("{}\n");
let repository;
before(async () => {
  repository = await mkdtemp(join(tmpdir(), "synthetic-live-response-"));
  await writeFile(join(repository, "package.json"), packageBytes);
});
after(async () => {
  await rm(repository, { recursive: true, force: true });
});
const manifest = {
  version: 1,
  sourceCommit: "a".repeat(40),
  sourceTree: "b".repeat(40),
  origin: "https://tools.0g0.xyz",
  entry: "/assets/main-synthetic.js",
  activeRoute: "/base64",
  activeChunk: "/assets/base64-synthetic.js",
  assets: ["main", "base64"].map((name) => ({
    path: `/assets/${name}-synthetic.js`,
    bytes: 1,
    sha256: "c".repeat(64),
  })),
  sourceFiles: [
    {
      path: "package.json",
      gitBlob: createHash("sha1")
        .update(`blob ${packageBytes.length}\0`)
        .update(packageBytes)
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
};
const serializer =
  '<script>self.$_TSR={};self.$_TSR.router={name:"base64",u:1790940000000};self.$_TSR.e();document.currentScript.remove()</script>';
const entry = '<script type="module" async>import("/assets/main-synthetic.js")</script>';
const initializer =
  "window.__CF$cv$params={synthetic:true};const path='/cdn-cgi/challenge-platform/';document.createElement('iframe')";
const body = `<html><head><title>Base64</title></head><body>日本語 🎉\r\n<p><div>intentionally unrepaired source</div><textarea id="conv-input"></textarea>${serializer}${entry}</body></html>`;
function input(html = body, overrides = {}) {
  return {
    status: 200,
    responseUrl: "https://tools.0g0.xyz/base64",
    contentType: "text/html; charset=utf-8",
    mitigated: false,
    html: Buffer.from(html),
    manifest,
    repository,
    trustedGeneratedHtml: body,
    ...overrides,
  };
}
async function rejects(data, code) {
  await assert.rejects(prepareLiveResponse(data), (error) => {
    assert.equal(error.code, code);
    assert.equal(error.message, `Live response rejected: ${code}`);
    assert.equal(error.cause, undefined);
    assert.doesNotMatch(error.stack, /synthetic-request-id|synthetic-cookie|synthetic-identifier/);
    return true;
  });
}

void test("unknown executable source stays rejected and syntax categories cannot leak its values", async () => {
  const unknown =
    'globalThis.syntheticRequestIdentifier = "synthetic-secret-value"; const userNonce = "synthetic-nonce"; fetch("https://synthetic-identifier.example/private?token=synthetic-cookie")';
  const source = body.replace(
    "</body>",
    `<script nonce="synthetic-cookie">${unknown}</script></body>`,
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "unrecognized-inline-script");
    const shape = error.diagnostics.rejectedInlineScript;
    assert.equal(shape.ordinal, 3);
    assert.equal(shape.parentTag, "body");
    assert.ok(Number.isSafeInteger(shape.elementIndex));
    assert.equal(shape.type, "classic");
    assert.equal(shape.syntaxValid, true);
    assert.equal(shape.codeUtf16Units, unknown.length);
    assert.equal(shape.statementCount, 3);
    assert.ok(shape.nodeCount > 0);
    assert.ok(shape.statementKinds.every(Number.isSafeInteger));
    assert.ok(
      shape.nodeKindCounts.every(([kind, count]) => Number.isSafeInteger(kind) && count > 0),
    );
    assert.doesNotMatch(
      JSON.stringify(error.diagnostics),
      /synthetic-secret|synthetic-nonce|synthetic-cookie|synthetic-identifier|userNonce|fetch|globalThis/,
    );
    return true;
  });
  assert.equal(globalThis.syntheticRequestIdentifier, undefined);
});

void test("malformed unknown syntax remains rejected without exporting parser diagnostics", async () => {
  const source = body.replace(
    "</body>",
    '<script>const syntheticIdentifier = "synthetic-secret"; if (</script></body>',
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "framework-ast-inspection-failed");
    assert.doesNotMatch(
      JSON.stringify(error.diagnostics),
      /syntheticIdentifier|synthetic-secret|parseDiagnostics/,
    );
    return true;
  });
});

void test("optimization markers classify a rejection but never authorize its script", async () => {
  const source = body.replace(
    "</body>",
    '<script>const name="rocket-loader /cf-fonts/ /cdn-cgi/zaraz/ synthetic-secret";</script><script src="https://synthetic-third-party.example/rocket-loader.min.js" data-cf-settings="synthetic-cookie"></script></body>',
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "unrecognized-inline-script");
    assert.equal(error.diagnostics.rejectedInlineScript.namespaceMarkers.rocketLoader, true);
    assert.equal(error.diagnostics.rejectedInlineScript.namespaceMarkers.cloudflareFonts, true);
    assert.equal(error.diagnostics.rejectedInlineScript.namespaceMarkers.zaraz, true);
    assert.equal(error.diagnostics.documentTransformMarkers.rocketLoaderResource, true);
    assert.equal(error.diagnostics.documentTransformMarkers.rocketLoaderSettingsAttribute, true);
    assert.doesNotMatch(
      JSON.stringify(error.diagnostics),
      /synthetic-secret|synthetic-cookie|synthetic-third-party/,
    );
    return true;
  });
});

void test("script inventory exports only finite labels and known paths, never attributes or URL values", async () => {
  const source = body.replace(
    "</body>",
    '<script src="/cdn-cgi/zaraz/s.js?token=synthetic-secret" nonce="synthetic-cookie" data-synthetic-identifier="synthetic-value"></script><script>const marker="zaraz synthetic-secret";</script></body>',
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "unrecognized-inline-script");
    const inventory = error.diagnostics.scriptInventory;
    const external = inventory.find((item) => item.resource === "zaraz");
    assert.equal(external.knownPath, "/cdn-cgi/zaraz/s.js");
    assert.deepEqual(external.attributeNames, ["nonce", "other", "src"]);
    assert.ok(inventory.every((item) => Number.isSafeInteger(item.elementIndex)));
    assert.doesNotMatch(
      JSON.stringify(error.diagnostics),
      /synthetic-secret|synthetic-cookie|synthetic-value|synthetic-identifier|token=/,
    );
    return true;
  });
});

void test("unaltered owned source stays byte-exact, including parser-repair candidates", async () => {
  const result = await prepareLiveResponse(input());
  assert.equal(result.html, body);
  assert.equal(result.diagnostics.surgicalPatchCount, 0);
  assert.equal(result.diagnostics.originalDecodedUtf8Bytes, Buffer.byteLength(body));
  assert.equal(
    result.diagnostics.originalHtmlSha256,
    createHash("sha256").update(body).digest("hex"),
  );
});

void test("pre-guard comparison records clean source and normalized framework AST agreement", async () => {
  const source = body.replace("1790940000000", "1791039999999");
  const result = await prepareLiveResponse(input(source));
  const report = result.diagnostics.sourceDifference;
  assert.equal(report.available, true);
  assert.equal(report.mode, "data-only-before-original-live-guard");
  assert.equal(report.nonScriptHosts.structuralDifferences, 0);
  assert.equal(report.nonScriptHosts.attributeDifferences, 0);
  assert.equal(report.nonScriptHosts.firstDifference, null);
  assert.equal(report.nonScriptText.positionalDifferences, 0);
  assert.equal(report.outsideScriptElementsSourceEqual, true);
  assert.deepEqual(report.framework, {
    referenceCount: 2,
    observedMatchCount: 2,
    orderAndMultiplicityMatch: true,
    entryMatchCount: 1,
    serializerMatchCount: 1,
  });
  assert.equal(
    report.scriptComparisons.filter((item) => item.normalizedSerializerEpochs).length,
    1,
  );
  assert.equal(result.html, source);
});

void test("pre-guard comparison sees later unknown external modules despite an earlier inline rejection", async () => {
  const unknown = 'globalThis.syntheticPreGuardExecution="synthetic-secret";';
  const source = body
    .replace(
      "</head>",
      `<script nonce="synthetic-cookie" data-synthetic-id="synthetic-value">${unknown}</script></head>`,
    )
    .replace(
      "</body>",
      `<script>${initializer}</script><script type="module" src="https://synthetic-private-host.example/private-synthetic-path.js?token=synthetic-token#synthetic-fragment"></script></body>`,
    );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "unrecognized-inline-script");
    const report = error.diagnostics.sourceDifference;
    assert.equal(report.available, true);
    assert.equal(report.nonScriptHosts.structuralDifferences, 0);
    assert.equal(report.nonScriptHosts.attributeDifferences, 0);
    assert.equal(report.outsideScriptElementsSourceEqual, true);
    assert.equal(report.framework.orderAndMultiplicityMatch, true);
    assert.equal(report.framework.serializerMatchCount, 1);
    assert.equal(report.framework.entryMatchCount, 1);
    const module = report.scriptComparisons.find((item) => item.unrecognizedExternalModule);
    assert.equal(module.parentTag, "body");
    assert.equal(module.type, "module");
    assert.equal(module.relationship, "no-generated-resource-match");
    assert.deepEqual(module.attributeNames, ["src", "type"]);
    assert.equal(
      report.scriptComparisons.filter((item) => item.relationship === "no-generated-ast-match")
        .length,
      2,
    );
    assert.doesNotMatch(
      JSON.stringify(report),
      /synthetic-|globalThis|https?:|token=|astSha256|nonce.*cookie/,
    );
    assert.doesNotMatch(
      JSON.stringify(error.diagnostics),
      /synthetic-secret|synthetic-cookie|synthetic-value|synthetic-private-host|private-synthetic-path|synthetic-token|synthetic-fragment|data-synthetic-id/,
    );
    return true;
  });
  assert.equal(globalThis.syntheticPreGuardExecution, undefined);
});

void test("source host/text differences report finite shapes without values or custom names", async () => {
  const source = body.replace(
    '<textarea id="conv-input"></textarea>',
    '<private-synthetic-tag data-synthetic-name="synthetic-attribute-value">synthetic-private-text</private-synthetic-tag><textarea id="conv-input"></textarea>',
  );
  const result = await prepareLiveResponse(input(source));
  const report = result.diagnostics.sourceDifference;
  assert.ok(report.nonScriptHosts.structuralDifferences > 0);
  assert.ok(report.nonScriptText.positionalDifferences > 0);
  assert.equal(report.outsideScriptElementsSourceEqual, false);
  assert.equal(report.nonScriptHosts.firstDifference.actual.tag, "other");
  assert.deepEqual(report.nonScriptHosts.firstDifference.actual.attributeNames, ["other"]);
  assert.doesNotMatch(
    JSON.stringify(report),
    /private-synthetic-tag|data-synthetic-name|synthetic-attribute-value|synthetic-private-text/,
  );
});

void test("attribute differences are compared in memory but neither values nor names escape", async () => {
  const source = body.replace(
    '<textarea id="conv-input"',
    '<textarea nonce="synthetic-cookie" data-synthetic-name="synthetic-value" id="conv-input"',
  );
  const result = await prepareLiveResponse(input(source));
  const report = result.diagnostics.sourceDifference;
  assert.equal(report.nonScriptHosts.structuralDifferences, 0);
  assert.equal(report.nonScriptHosts.attributeDifferences, 1);
  assert.equal(report.nonScriptHosts.firstDifference.reason, "attributes");
  assert.deepEqual(report.nonScriptHosts.firstDifference.actual.attributeNames, [
    "id",
    "nonce",
    "other",
  ]);
  assert.doesNotMatch(
    JSON.stringify(report),
    /synthetic-cookie|data-synthetic-name|synthetic-value|conv-input/,
  );
});

void test("serializer strings and non-epoch literals are never normalized to force AST agreement", async () => {
  for (const source of [
    body.replace('name:"base64"', 'name:"synthetic-secret"'),
    body.replace("1790940000000", "7"),
  ]) {
    await assert.rejects(prepareLiveResponse(input(source)), (error) => {
      assert.equal(error.code, "serializer-validation-limit");
      const report = error.diagnostics.sourceDifference;
      assert.equal(report.framework.serializerMatchCount, 0);
      assert.equal(report.framework.entryMatchCount, 1);
      assert.equal(report.framework.orderAndMultiplicityMatch, false);
      assert.doesNotMatch(JSON.stringify(report), /synthetic-secret|1790940000000|name:|astSha256/);
      return true;
    });
  }
});

void test("framework order and duplicate comparisons cannot widen the original guard", async () => {
  for (const source of [
    body.replace(`${serializer}${entry}`, `${entry}${serializer}`),
    body.replace(`${serializer}${entry}`, `${serializer}${serializer}${entry}`),
  ]) {
    await assert.rejects(prepareLiveResponse(input(source)), (error) => {
      assert.equal(
        error.code,
        source.includes(`${serializer}${serializer}`)
          ? "missing-or-unsupported-serializer"
          : "unexpected-framework-envelope",
      );
      assert.equal(error.diagnostics.sourceDifference.framework.orderAndMultiplicityMatch, false);
      return true;
    });
  }
});

void test("malformed inline source has a redacted pre-guard comparison and retains its rejection", async () => {
  const source = body.replace(
    "</head>",
    '<script>const syntheticPrivateIdentifier="synthetic-secret";if(</script></head>',
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "framework-ast-inspection-failed");
    const report = error.diagnostics.sourceDifference;
    assert.equal(report.framework.entryMatchCount, 1);
    assert.equal(report.framework.serializerMatchCount, 1);
    assert.equal(
      report.scriptComparisons.find((item) => item.relationship === "no-generated-ast-match")
        .syntaxValid,
      false,
    );
    assert.doesNotMatch(
      JSON.stringify(report),
      /syntheticPrivateIdentifier|synthetic-secret|parseDiagnostics/,
    );
    return true;
  });
});

void test("containment rejects nested documents and SVG scripts after data-only inspection", async () => {
  for (const [markup, code] of [
    ['<iframe srcdoc="synthetic-secret-document"></iframe>', "unexpected-embedded-document"],
    [
      '<svg><script>globalThis.syntheticContainedExecution="synthetic-secret"</script></svg>',
      "non-html-script-namespace",
    ],
    [
      '<template shadowrootmode="open"><script>globalThis.syntheticContainedExecution="synthetic-secret"</script></template>',
      "declarative-shadow-template",
    ],
    [
      '<a href="vbscript:syntheticSecret()">synthetic-private-text</a>',
      "unsupported-document-bearing-url",
    ],
  ]) {
    await assert.rejects(
      prepareLiveResponse(input(body.replace("</body>", `${markup}</body>`))),
      (error) => {
        assert.equal(error.code, code);
        assert.equal(
          error.diagnostics.sourceDifference.available,
          code !== "non-html-script-namespace",
        );
        assert.doesNotMatch(
          JSON.stringify(error.diagnostics.sourceDifference),
          /synthetic-|syntheticSecret|syntheticContainedExecution|globalThis|vbscript:/,
        );
        return true;
      },
    );
  }
  assert.equal(globalThis.syntheticContainedExecution, undefined);
});

void test("foreign template and nested SVG scripts cannot be reported as complete inert HTML inventories", async () => {
  for (const markup of [
    '<svg><template><script type="module" href="https://synthetic-host.example/module.js"></script></template></svg>',
    '<svg><script><script type="module" href="https://synthetic-host.example/module.js"></script></script></svg>',
  ]) {
    await assert.rejects(
      prepareLiveResponse(input(body.replace("</body>", `${markup}</body>`))),
      (error) => {
        assert.equal(error.code, "non-html-script-namespace");
        assert.deepEqual(error.diagnostics.sourceDifference, {
          version: 1,
          available: false,
          failureCode: "bounded-source-inspection-unavailable",
          originalGuardUnchanged: true,
        });
        assert.doesNotMatch(
          JSON.stringify(error.diagnostics.sourceDifference),
          /synthetic-host|module.js|inert-template|scriptComparisons/,
        );
        return true;
      },
    );
  }
});

void test("template external scripts do not consume executable generated resources", async () => {
  const external =
    '<script type="module" src="https://synthetic-host.example/module.js?secret=synthetic-token"></script>';
  const trusted = body.replace("</head>", `${external}</head>`);
  const source = body.replace(
    "</head>",
    `<template>${external}</template><script>const value="synthetic-secret";</script></head>`,
  );
  await assert.rejects(
    prepareLiveResponse(input(source, { trustedGeneratedHtml: trusted })),
    (error) => {
      assert.equal(error.code, "unrecognized-inline-script");
      const report = error.diagnostics.sourceDifference;
      assert.equal(report.missingGeneratedExternalCount, 1);
      const item = report.scriptComparisons.find((item) => item.kind === "external");
      assert.equal(item.inTemplate, true);
      assert.equal(item.relationship, "inert-template");
      assert.equal(item.unrecognizedExternalModule, false);
      assert.doesNotMatch(
        JSON.stringify(report),
        /synthetic-host|module.js|synthetic-token|synthetic-secret/,
      );
      return true;
    },
  );
});

void test("an unavailable bounded comparison preserves the exact original guard rejection", async () => {
  const source = body.replace(
    "</body>",
    `${'<script>const value="synthetic-secret";</script>'.repeat(129)}</body>`,
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "unrecognized-inline-script");
    assert.deepEqual(error.diagnostics.sourceDifference, {
      version: 1,
      available: false,
      failureCode: "bounded-source-inspection-unavailable",
      originalGuardUnchanged: true,
    });
    return true;
  });
});

void test("unclosed HTML scripts cannot be reported as empty complete source inventories", async () => {
  const source = body.replace(
    "</body>",
    '<script>const syntheticIdentifier="synthetic-secret";</body>',
  );
  await assert.rejects(prepareLiveResponse(input(source)), (error) => {
    assert.equal(error.code, "malformed-script-source");
    assert.equal(error.diagnostics.sourceDifference.available, false);
    assert.equal(error.diagnostics.sourceDifference.originalGuardUnchanged, true);
    assert.doesNotMatch(
      JSON.stringify(error.diagnostics.sourceDifference),
      /syntheticIdentifier|synthetic-secret|scriptComparisons/,
    );
    return true;
  });
});
void test("only intended inline type attributes are edited; external tags and framework source stay exact", async () => {
  const external =
    '<script defer nonce="synthetic-nonce" src="https://synthetic-third-party.example/beacon.js?token=synthetic-identifier"></script>';
  const inserted = `<script data-test="synthetic-value">${initializer}</script>`;
  const replaced = `<script TYPE='text/javascript' nonce="synthetic-nonce">${initializer}</script>`;
  const source = body.replace("</body>", `${inserted}${replaced}${external}</body>`);
  const result = await prepareLiveResponse(input(source));
  const expected = source
    .replace(
      '<script data-test="synthetic-value">',
      '<script data-test="synthetic-value" type="application/x-tools-hydration-inert">',
    )
    .replace("TYPE='text/javascript'", 'type="application/x-tools-hydration-inert"');
  assert.equal(result.html, expected);
  assert.equal(result.diagnostics.surgicalPatchCount, 2);
  assert.deepEqual(
    result.diagnostics.surgicalPatches.map((patch) => patch.operation),
    ["insert-type-attribute", "replace-type-attribute"],
  );
  assert.equal(result.diagnostics.offsetUnits, "UTF-16 code units in original source");
  assert.equal(result.observedExternalScriptUrls.size, 1);
  assert.ok(
    result.observedExternalScriptUrls.has(
      "https://synthetic-third-party.example/beacon.js?token=synthetic-identifier",
    ),
  );
  assert.ok(result.html.includes(serializer));
  assert.ok(result.html.includes(entry));
  assert.ok(result.html.includes(external));
  assert.doesNotMatch(
    JSON.stringify(result.diagnostics),
    /synthetic-identifier|synthetic-nonce|synthetic-value|https:\/\//,
  );
});
void test("inert data and template scripts are preserved without widening executable allowances", async () => {
  const source = body.replace(
    "</body>",
    '<script type="application/json">{"synthetic":"data"}</script><template><script>unknownExecutable()</script></template></body>',
  );
  const result = await prepareLiveResponse(input(source));
  assert.equal(result.html, source);
});
void test("redirect status is rejected without accepting an alternate destination", () =>
  rejects(input(body, { status: 302 }), "unexpected-response-status"));
void test("changed response URL is rejected without retaining its identifier", () =>
  rejects(
    input(body, { responseUrl: "https://tools.0g0.xyz/base64?synthetic-request-id" }),
    "redirect-or-url-change",
  ));
void test("non-HTML responses are rejected", () =>
  rejects(input(body, { contentType: "application/json" }), "non-html-response"));
void test("challenge response headers are rejected", () =>
  rejects(input(body, { mitigated: true }), "blocked-or-challenge-response"));
void test("challenge/block pages are rejected before framework replay", () =>
  rejects(
    input(body.replace("<title>Base64</title>", "<title>Just a moment...</title>")),
    "blocked-or-challenge-response",
  ));
void test("invalid UTF-8 is rejected rather than silently repaired", () =>
  rejects(input(body, { html: Buffer.from([0xff, 0xfe]) }), "invalid-utf8-response"));
void test("oversized bodies are rejected", () =>
  rejects(input(body, { html: Buffer.alloc(1024 * 1024 + 1, 65) }), "invalid-or-oversized-body"));
void test("unexpected deployed entry is rejected", () =>
  rejects(
    input(body.replace("/assets/main-synthetic.js", "/assets/main-unexpected.js")),
    "unexpected-owned-entry",
  ));
void test("missing framework serializer is rejected", () =>
  rejects(input(body.replace(serializer, "")), "missing-or-unsupported-serializer"));
void test("missing Base64 controls are rejected", () =>
  rejects(
    input(body.replace('id="conv-input"', 'id="synthetic-other"')),
    "missing-base64-controls",
  ));
void test("unknown executable inline source is rejected rather than rewritten", () =>
  rejects(
    input(body.replace("</body>", "<script>unknownExecutable()</script></body>")),
    "unrecognized-inline-script",
  ));
void test("embedded documents are rejected rather than allowing uninspected scripts", () =>
  rejects(
    input(body.replace("</body>", '<iframe srcdoc="synthetic"></iframe></body>')),
    "unexpected-embedded-document",
  ));
for (const protocol of [
  "data:text/javascript,",
  "javascript:",
  "blob:https://synthetic.example/",
]) {
  void test(`unsupported script protocol ${protocol.split(":")[0]} is rejected`, () =>
    rejects(
      input(body.replace("</body>", `<script src="${protocol}synthetic"></script></body>`)),
      "unsupported-document-bearing-url",
    ));
}
void test("unknown owned preload is rejected", () =>
  rejects(
    input(
      body.replace("</head>", '<link rel="modulepreload" href="/assets/unexpected.js"></head>'),
    ),
    "unexpected-owned-assets",
  ));
void test("source snapshot drift is rejected with a bounded classification", async () => {
  await writeFile(join(repository, "package.json"), "synthetic-source-drift");
  try {
    await rejects(input(), "source-snapshot-mismatch");
  } finally {
    await writeFile(join(repository, "package.json"), packageBytes);
  }
});

void test("live host/error snapshots retain no synthetic identifiers, text, or relative URL values", async () => {
  // Synthetic-only JSDOM executes the actual diagnostics initializer. The live
  // helper never uses JSDOM or any HTML serializer/reconstruction operation.
  const source = await readFile(new URL("./hydration.spec.ts", import.meta.url), "utf8");
  const compiled = (await transform(source, { loader: "ts" })).code;
  const initializerCode = compiled.slice(
    compiled.indexOf("function installBrowserDiagnostics("),
    compiled.indexOf("let fixture;"),
  );
  const dom = new JSDOM(
    '<body><div id="synthetic-parent-id"><a id="synthetic-node-id" class="synthetic-node-class" href="/private?synthetic-relative-id#synthetic-fragment">synthetic-private-text</a></div></body>',
    { url: "https://synthetic-browser.example/base64", runScripts: "outside-only" },
  );
  try {
    vm.runInContext(
      initializerCode + ";installBrowserDiagnostics({live:true})",
      dom.getInternalVMContext(),
    );
    const state = dom.window.__toolsHydration;
    const fiber = {
      tag: 5,
      type: "h1",
      pendingProps: {
        id: "synthetic-expected-id",
        className: "synthetic-expected-class",
        children: "synthetic-expected-text",
      },
      return: { tag: 5, type: "header" },
    };
    state.captureHost(fiber, dom.window.document.querySelector("a"), "claim");
    state.recoverable(
      { message: "synthetic-error-message #418" },
      { componentStack: "at synthetic-component-id" },
    );
    state.captureThrown(
      { name: "synthetic-error-name", message: "synthetic-render-message" },
      fiber,
    );
    dom.window.__TSR_ROUTER__ = {
      state: {
        isLoading: false,
        status: "idle",
        matches: [
          { id: "__root__", status: "success", ssr: true },
          { id: "/base64", status: "success", ssr: true },
          { id: "synthetic-private-match-id", status: "success", ssr: true },
        ],
      },
    };
    const lifecycle = state.lifecycle();
    assert.deepEqual(
      Array.from(lifecycle.matches, (match) => match.id),
      ["__root__", "/base64", "[unknown-match-id-omitted]"],
    );
    let report = JSON.stringify({
      firstDiff: state.firstDiff,
      timeline: state.timeline,
      errors: state.recoverableErrors,
      lifecycle,
    });
    assert.doesNotMatch(report, /synthetic-|\/private|https:\/\/|value=|__CF/);
    assert.equal(state.firstDiff.expected.tag, "h1");
    assert.equal(state.firstDiff.actual.tag, "a");
    assert.ok(state.firstDiff.actual.textLength > 0);
    assert.equal(state.firstDiff.actual.attrs.href, "[value-omitted]");
    state.firstDiff = null;
    state.captureText(
      fiber,
      dom.window.document.querySelector("a"),
      "synthetic-expected-text",
      "synthetic-actual-text",
    );
    report = JSON.stringify(state.firstDiff);
    assert.doesNotMatch(report, /synthetic-|\/private|https:\/\//);
    assert.equal(state.firstDiff.reason, "text");
  } finally {
    dom.window.close();
  }
});

void test("serializer markers in a comment cannot authorize executable code", () =>
  rejects(
    input(
      body.replace(
        serializer,
        "<script>/* self.$_TSR= self.$_TSR.router= self.$_TSR.e() document.currentScript.remove() */ unknownExecutable()</script>",
      ),
    ),
    "serializer-validation-limit",
  ));
void test("only updatedAt epoch literals may vary within the trusted serializer", async () => {
  const source = body.replace("1790940000000", "1790940000123");
  const result = await prepareLiveResponse(input(source));
  assert.equal(result.html, source);
});
void test("serializer string values remain pinned by the AST fingerprint", () =>
  rejects(
    input(body.replace('name:"base64"', 'name:"synthetic-other-value"')),
    "serializer-validation-limit",
  ));
void test("serializer identifiers and operators remain pinned by the AST fingerprint", () =>
  rejects(
    input(body.replace("self.$_TSR.router=", "self.$_TSR.router+=")),
    "serializer-validation-limit",
  ));
void test("numeric literals outside updatedAt fields cannot be normalized", () =>
  rejects(
    input(body.replace("router={name", "router={other:1790940000123,name")),
    "serializer-validation-limit",
  ));
void test("SVG script execution forms are rejected while normal SVG remains allowed", async () => {
  await rejects(
    input(
      body.replace(
        "</body>",
        '<svg><script href="https://synthetic.example/script"></script></svg></body>',
      ),
    ),
    "non-html-script-namespace",
  );
  const source = body.replace(
    "</body>",
    '<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/></svg></body>',
  );
  assert.equal((await prepareLiveResponse(input(source))).html, source);
});
void test("declarative shadow templates are rejected before their content is considered inert", () =>
  rejects(
    input(
      body.replace(
        "</body>",
        '<template shadowrootmode="open"><script>unknownExecutable()</script></template></body>',
      ),
    ),
    "declarative-shadow-template",
  ));
void test("nested shadow templates are rejected by the containment-only template walk", () =>
  rejects(
    input(
      body.replace(
        "</body>",
        '<template><template shadowrootmode="open"><script>unknownExecutable()</script></template></template></body>',
      ),
    ),
    "declarative-shadow-template",
  ));
void test("document-bearing URL protocols are rejected on anchors and forms", async () => {
  await rejects(
    input(body.replace("</body>", '<a href="javascript:unknownExecutable()">synthetic</a></body>')),
    "unsupported-document-bearing-url",
  );
  await rejects(
    input(body.replace("</body>", '<form action="data:text/html,synthetic"></form></body>')),
    "unsupported-document-bearing-url",
  );
});

void test("document-bearing attributes reject every non-HTTPS scheme, including vbscript", async () => {
  for (const attribute of ["href", "src", "action", "formaction", "data"]) {
    for (const value of [
      "vbscript:synthetic",
      "http://synthetic.example/",
      "file:///synthetic",
      "ftp://synthetic.example/",
      "mailto:synthetic@example.invalid",
      "tel:synthetic",
      "https://[",
    ]) {
      await rejects(
        input(body.replace("</body>", `<a ${attribute}="${value}">synthetic</a></body>`)),
        "unsupported-document-bearing-url",
      );
    }
  }
});

void test("URL parsing rejects scheme aliases and decoded HTML references inside templates", async () => {
  for (const value of [
    "VBScript:synthetic",
    "  vbscript:synthetic",
    "vb\tscript:synthetic",
    "vb\nscript:synthetic",
    "vb&#115;cript:synthetic",
    "javascript&#58;synthetic",
  ]) {
    await rejects(
      input(
        body.replace("</body>", `<template><a href="${value}">synthetic</a></template></body>`),
      ),
      "unsupported-document-bearing-url",
    );
  }
});

void test("HTTPS and ordinary relative document-bearing values remain byte-exact", async () => {
  for (const attribute of ["href", "src", "action", "formaction", "data"]) {
    for (const value of [
      "/relative",
      "relative",
      "?synthetic=1",
      "#main-content",
      "",
      "//synthetic.example/path",
      "HTTPS://synthetic.example/path",
    ]) {
      const source = body.replace("</body>", `<a ${attribute}="${value}">synthetic</a></body>`);
      assert.equal((await prepareLiveResponse(input(source))).html, source);
    }
  }
});

void test("response reporting registrations are omitted, with names/counts only", () => {
  const source = {
    NEL: '{"synthetic":"private-nel"}',
    "Report-To": '{"url":"https://synthetic.example/report?synthetic-request-id"}',
    "Reporting-Endpoints": 'synthetic="/relative?synthetic-request-id"',
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Content-Type": "text/html",
  };
  const result = containLiveResponseHeaders(source);
  assert.deepEqual(result.headers, {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Content-Type": "text/html",
  });
  assert.equal(result.diagnostics.removedReportingHeaderCount, 3);
  assert.deepEqual(result.diagnostics.removedReportingHeaderNames, [
    "nel",
    "report-to",
    "reporting-endpoints",
  ]);
  assert.doesNotMatch(JSON.stringify(result.diagnostics), /private-nel|synthetic|https:\/\//);
  assert.ok(source.NEL, "The original in-memory response header map remains untouched");
});
void test("CSP multi-policy reporting directives are removed surgically, including relative endpoints", () => {
  const csp =
    "default-src 'self'; report-uri /relative?synthetic-id /other; script-src 'self', img-src 'self'; report-to synthetic-group; upgrade-insecure-requests";
  const reportOnly =
    "script-src 'none'; report-uri /relative?synthetic-report-only, style-src 'self'; report-to synthetic-second";
  const result = containLiveResponseHeaders({
    "Content-Security-Policy": csp,
    "Content-Security-Policy-Report-Only": reportOnly,
    "Cross-Origin-Opener-Policy": 'same-origin; report-to="synthetic-group"',
    "Cross-Origin-Embedder-Policy": "require-corp",
  });
  assert.equal(
    result.headers["Content-Security-Policy"],
    "default-src 'self'; ; script-src 'self', img-src 'self'; ; upgrade-insecure-requests",
  );
  assert.equal(
    result.headers["Content-Security-Policy-Report-Only"],
    "script-src 'none'; , style-src 'self'; ",
  );
  assert.equal(
    result.headers["Cross-Origin-Opener-Policy"],
    'same-origin; report-to="synthetic-group"',
  );
  assert.equal(result.headers["Cross-Origin-Embedder-Policy"], "require-corp");
  assert.equal(result.diagnostics.removedCspDirectiveCount, 4);
  assert.doesNotMatch(JSON.stringify(result.diagnostics), /synthetic|relative|https:\/\//);
});
void test("ambiguous or control-character CSP policies are rejected without leaking values", () => {
  for (const policy of [
    "default-src 'self'\nreport-uri /synthetic-secret",
    "default-src\t'self'",
    "report-uri https://synthetic.example/a,b",
    "unknown-directive synthetic-secret",
  ]) {
    assert.throws(
      () => containLiveResponseHeaders({ "Content-Security-Policy": policy }),
      (error) => {
        assert.equal(error.code, "ambiguous-reporting-policy");
        assert.equal(error.cause, undefined);
        assert.doesNotMatch(error.stack, /synthetic-secret|https:\/\/synthetic/);
        return true;
      },
    );
  }
  assert.throws(
    () =>
      containLiveResponseHeaders({
        "Content-Security-Policy": "default-src 'self'",
        "content-security-policy": "script-src 'none'",
      }),
    /ambiguous-reporting-policy/,
  );
});
