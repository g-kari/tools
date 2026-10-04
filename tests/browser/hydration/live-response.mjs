/** Runtime-only public response inspection; never serialize or save its HTML. */
import { createHash } from "node:crypto";
import { parse } from "parse5";
import ts from "typescript";
import { verifySourceSnapshot } from "./owned-assets.mjs";

const inertType = "application/x-tools-hydration-inert";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Reject with a static, bounded classification, never an upstream error/cause. */
export class LiveResponseRejected extends Error {
  constructor(code) {
    super(`Live response rejected: ${code}`);
    this.name = "LiveResponseRejected";
    this.code = code;
  }
}

/** Compare executable structure; never evaluate code or expose AST/source. */
function astFingerprint(code, normalizeTimestamps) {
  const file = ts.createSourceFile(
    "runtime-only-framework.js",
    code,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  if (file.parseDiagnostics.length) throw new Error("Invalid framework syntax");
  const isTimestamp = (node) => {
    if (
      !normalizeTimestamps ||
      !/^\d{13}$/.test(node.text) ||
      Number(node.text) < 1000000000000 ||
      Number(node.text) > 3000000000000
    )
      return false;
    const parent = node.parent;
    return (
      (ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(parent.left) &&
        parent.left.name.text === "u") ||
      (ts.isPropertyAssignment(parent) &&
        (ts.isIdentifier(parent.name) || ts.isStringLiteral(parent.name)) &&
        parent.name.text === "u")
    );
  };
  function fingerprintNode(node) {
    const result = { kind: node.kind };
    if (
      ts.isIdentifier(node) ||
      ts.isStringLiteralLike(node) ||
      ts.isRegularExpressionLiteral(node) ||
      ts.isBigIntLiteral(node) ||
      [
        ts.SyntaxKind.TemplateHead,
        ts.SyntaxKind.TemplateMiddle,
        ts.SyntaxKind.TemplateTail,
      ].includes(node.kind)
    )
      result.value = node.text;
    else if (ts.isNumericLiteral(node))
      result.value = isTimestamp(node) ? "[updatedAt-epoch]" : node.text;
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node))
      result.operator = node.operator;
    const children = [];
    ts.forEachChild(node, (child) => {
      children.push(fingerprintNode(child));
    });
    if (children.length) result.children = children;
    return result;
  }
  return sha256(JSON.stringify(fingerprintNode(file)));
}

/** Fixed syntax categories only: no literal, identifier, attribute, or source value escapes. */
function rejectedScriptShape(code, type, ordinal, node) {
  const file = ts.createSourceFile(
    "runtime-only-rejected.js",
    code,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const counts = new Map();
  let nodeCount = 0;
  function visit(node) {
    nodeCount++;
    counts.set(node.kind, (counts.get(node.kind) ?? 0) + 1);
    ts.forEachChild(node, visit);
  }
  visit(file);
  const parentTag = node.parentNode?.tagName;
  return {
    ordinal,
    parentTag: ["head", "body", "main", "div", "html"].includes(parentTag) ? parentTag : "other",
    elementIndex: (node.parentNode?.childNodes ?? []).filter((item) => item.tagName).indexOf(node),
    type: type === "module" ? "module" : "classic",
    codeUtf16Units: code.length,
    syntaxValid: file.parseDiagnostics.length === 0,
    statementCount: file.statements.length,
    statementKinds: file.statements.slice(0, 12).map((node) => node.kind),
    nodeCount,
    nodeKindCounts: [...counts].sort(([left], [right]) => left - right),
    namespaceMarkers: {
      tanstackBootstrap: code.includes("$_TSR"),
      tanstackPool: code.includes('$R["tsr"]') || code.includes("$R.tsr"),
      cloudflareInitializer: code.includes("__CF$cv$params"),
      rocketLoader: /__cfRLUnblockHandlers|rocket-loader/.test(code),
      cloudflareFonts: code.includes("cf-fonts"),
      zaraz: code.includes("zaraz"),
    },
  };
}

/** Trusted generated source defines every permitted executable inline script. */
function trustedFrameworkEnvelope(html, manifest) {
  const document = parse(html, { sourceCodeLocationInfo: true, scriptingEnabled: true });
  const result = [];
  function visit(node) {
    if (node.tagName === "template") return;
    if (node.tagName === "script" && !node.attrs.some((item) => item.name === "src")) {
      const location = node.sourceCodeLocation;
      if (!location?.startTag || !location.endTag)
        throw new Error("Trusted script has no source offsets");
      const type = (node.attrs.find((item) => item.name === "type")?.value ?? "")
        .toLowerCase()
        .trim();
      const code = html.slice(location.startTag.endOffset, location.endTag.startOffset);
      if (
        !["", "module", "text/javascript", "application/javascript"].includes(type) ||
        !code.trim()
      )
        return;
      const entry =
        code.trim() === `import(${JSON.stringify(manifest.entry)})` && type === "module";
      const serializer =
        code.includes("self.$_TSR=") &&
        /(?:self\.)?\$_TSR\.router=/.test(code) &&
        /(?:self\.)?\$_TSR\.e\(\)/.test(code) &&
        code.includes("document.currentScript.remove()");
      const classification = entry
        ? "pinned-owned-entry-import-preserved"
        : serializer
          ? "trusted-tanstack-serializer-preserved"
          : "trusted-framework-inline-preserved";
      result.push({
        type,
        classification,
        normalizeTimestamps: serializer,
        astSha256: astFingerprint(code, serializer),
      });
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(document);
  if (
    result.filter((item) => item.classification === "trusted-tanstack-serializer-preserved")
      .length !== 1 ||
    result.filter((item) => item.classification === "pinned-owned-entry-import-preserved")
      .length !== 1
  )
    throw new Error("Trusted framework envelope changed");
  return result;
}

/**
 * Compare every source node before the execution guard can stop at its first
 * rejection. Values/fingerprints stay in memory; this report never grants trust
 * or changes the original source, patches, URL sets, or rejection decision.
 */
function sourceDifferenceReport(html, document, trustedHtml, trustedEnvelope, manifest) {
  const referenceDocument = parse(trustedHtml, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: true,
  });
  const allowedTags = new Set(
    "html head body title meta link script style a div header h1 h2 h3 h4 p nav main button span kbd label textarea input ins ul ol li pre code section article svg path iframe template form select option img noscript footer aside strong small br hr table tbody thead tr td th".split(
      " ",
    ),
  );
  const allowedAttributeNames = new Set(
    "id class role lang rel href src type name charset content http-equiv aria-label aria-labelledby aria-controls aria-selected aria-hidden tabindex disabled readonly value placeholder rows cols width height viewBox d fill stroke nonce async defer crossorigin data-cfasync data-cf-settings"
      .toLowerCase()
      .split(" "),
  );
  const attribute = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
  const safeTag = (node) => (allowedTags.has(node?.tagName) ? node.tagName : "other");
  const safeNames = (node) =>
    [
      ...new Set(
        (node.attrs ?? []).map((item) =>
          allowedAttributeNames.has(item.name) ? item.name : "other",
        ),
      ),
    ].sort((left, right) => left.localeCompare(right));
  function inspect(root, source) {
    const hosts = [];
    const texts = [];
    const scripts = [];
    let visited = 0;
    function visit(node, path, depth, inTemplate = false) {
      if (++visited > 50000 || depth > 256) throw new Error("Source inspection limit");
      if (node.tagName === "script") {
        // Foreign-content scripts can have nested elements/overlapping ranges.
        // Do not classify them as HTML scripts or claim a complete inventory.
        if (node.namespaceURI !== "http://www.w3.org/1999/xhtml")
          throw new Error("Unsupported script namespace");
        scripts.push({ node, inTemplate });
        return;
      }
      if (node.tagName) hosts.push({ node, path });
      if (node.nodeName === "#text") texts.push({ value: node.value, path });
      // Style source can contain URLs/IDs. Compare it in memory, never export it.
      const children = [...(node.childNodes ?? []), ...(node.content?.childNodes ?? [])];
      const inHtmlTemplate =
        inTemplate ||
        (node.tagName === "template" && node.namespaceURI === "http://www.w3.org/1999/xhtml");
      let index = 0;
      for (const child of children) {
        if (child.tagName === "script") {
          visit(child, path, depth + 1, inHtmlTemplate);
          continue;
        }
        visit(child, [...path, index++], depth + 1, inHtmlTemplate);
      }
    }
    visit(root, [], 0);
    if (scripts.length > 128) throw new Error("Source script inspection limit");
    const ranges = scripts.map(({ node }) => node.sourceCodeLocation);
    if (
      ranges.some(
        (item) =>
          !item?.startTag ||
          !item.endTag ||
          !Number.isSafeInteger(item.startOffset) ||
          !Number.isSafeInteger(item.endOffset),
      )
    )
      throw new Error("Missing source offsets");
    const ordered = ranges.sort((left, right) => left.startOffset - right.startOffset);
    let previous = 0;
    let withoutScripts = "";
    for (const range of ordered) {
      if (
        range.startOffset < previous ||
        range.endOffset > source.length ||
        range.startOffset >= range.endOffset
      )
        throw new Error("Invalid source offsets");
      withoutScripts += source.slice(previous, range.startOffset);
      previous = range.endOffset;
    }
    withoutScripts += source.slice(previous);
    return { hosts, texts, scripts, withoutScripts };
  }
  const reference = inspect(referenceDocument, trustedHtml);
  const observed = inspect(document, html);
  const nodeSummary = (item, index) =>
    item
      ? {
          index,
          tag: safeTag(item.node),
          namespace: item.node.namespaceURI === "http://www.w3.org/1999/xhtml" ? "html" : "other",
          path: item.path,
          attributeNames: safeNames(item.node),
        }
      : null;
  const attributes = (node) =>
    JSON.stringify(
      (node.attrs ?? [])
        .map(({ name, value, namespace }) => [name, value, namespace ?? ""])
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    );
  let structuralDifferences = 0;
  let attributeDifferences = 0;
  let firstHostDifference = null;
  for (let index = 0; index < Math.max(reference.hosts.length, observed.hosts.length); index++) {
    const expected = reference.hosts[index];
    const actual = observed.hosts[index];
    const structural =
      !expected ||
      !actual ||
      expected.node.tagName !== actual.node.tagName ||
      expected.node.namespaceURI !== actual.node.namespaceURI ||
      JSON.stringify(expected.path) !== JSON.stringify(actual.path);
    const attributeDifference =
      expected && actual && attributes(expected.node) !== attributes(actual.node);
    if (structural) structuralDifferences++;
    if (attributeDifference) attributeDifferences++;
    if (!firstHostDifference && (structural || attributeDifference))
      firstHostDifference = {
        reason: structural ? "structure" : "attributes",
        expected: nodeSummary(expected, index),
        actual: nodeSummary(actual, index),
      };
  }
  let textDifferences = 0;
  for (let index = 0; index < Math.max(reference.texts.length, observed.texts.length); index++) {
    const expected = reference.texts[index];
    const actual = observed.texts[index];
    if (
      !expected ||
      !actual ||
      expected.value !== actual.value ||
      JSON.stringify(expected.path) !== JSON.stringify(actual.path)
    )
      textDifferences++;
  }
  const externalKey = (node) => {
    try {
      return JSON.stringify([
        new URL(attribute(node, "src"), `${manifest.origin}${manifest.activeRoute}`).href,
        (attribute(node, "type") ?? "").trim().toLowerCase(),
      ]);
    } catch {
      return undefined;
    }
  };
  const referenceExternal = reference.scripts
    .filter(({ node, inTemplate }) => !inTemplate && attribute(node, "src") !== undefined)
    .map(({ node }) => externalKey(node));
  const remainingExternal = [...referenceExternal];
  const matchedFramework = [];
  const scriptComparisons = observed.scripts.map(({ node, inTemplate }, ordinal) => {
    const source = attribute(node, "src");
    const type = (attribute(node, "type") ?? "").trim().toLowerCase();
    const executable = ["", "module", "text/javascript", "application/javascript"].includes(type);
    const descriptor = {
      ordinal: ordinal + 1,
      parentTag: safeTag(node.parentNode),
      elementIndex: (node.parentNode?.childNodes ?? [])
        .filter((item) => item.tagName)
        .indexOf(node),
      inTemplate,
      type: type === "module" ? "module" : executable ? "classic" : "inert-or-other",
      attributeNames: safeNames(node),
    };
    if (source !== undefined) {
      const key = externalKey(node);
      const index = inTemplate || key === undefined ? -1 : remainingExternal.indexOf(key);
      if (index >= 0) remainingExternal.splice(index, 1);
      return {
        ...descriptor,
        kind: "external",
        relationship: inTemplate
          ? "inert-template"
          : index >= 0
            ? "generated-resource-match"
            : "no-generated-resource-match",
        unrecognizedExternalModule: !inTemplate && type === "module" && index < 0,
      };
    }
    const location = node.sourceCodeLocation;
    const code =
      location?.startTag && location.endTag
        ? html.slice(location.startTag.endOffset, location.endTag.startOffset)
        : "";
    let trustedMatch;
    let syntaxValid = null;
    if (!inTemplate && executable && code.trim()) {
      try {
        // Validate even when no trusted script has this exact MIME type.
        astFingerprint(code, false);
        trustedMatch = trustedEnvelope.find(
          (item) =>
            item.type === type && item.astSha256 === astFingerprint(code, item.normalizeTimestamps),
        );
        syntaxValid = true;
      } catch {
        syntaxValid = false;
      }
    }
    if (trustedMatch) matchedFramework.push(trustedMatch);
    return {
      ...descriptor,
      kind: "inline",
      inlineUtf16Units: code.length,
      syntaxValid,
      relationship: inTemplate
        ? "inert-template"
        : !executable
          ? "inert-or-other-type"
          : !code.trim()
            ? "empty"
            : trustedMatch
              ? trustedMatch.classification
              : "no-generated-ast-match",
      normalizedSerializerEpochs: trustedMatch?.normalizeTimestamps ?? false,
    };
  });
  return {
    version: 1,
    available: true,
    mode: "data-only-before-original-live-guard",
    nonScriptHosts: {
      referenceCount: reference.hosts.length,
      observedCount: observed.hosts.length,
      structuralDifferences,
      attributeDifferences,
      firstDifference: firstHostDifference,
    },
    nonScriptText: {
      referenceCount: reference.texts.length,
      observedCount: observed.texts.length,
      positionalDifferences: textDifferences,
    },
    outsideScriptElementsSourceEqual: reference.withoutScripts === observed.withoutScripts,
    framework: {
      referenceCount: trustedEnvelope.length,
      observedMatchCount: matchedFramework.length,
      orderAndMultiplicityMatch:
        matchedFramework.map((item) => item.astSha256).join(",") ===
        trustedEnvelope.map((item) => item.astSha256).join(","),
      entryMatchCount: matchedFramework.filter(
        (item) => item.classification === "pinned-owned-entry-import-preserved",
      ).length,
      serializerMatchCount: matchedFramework.filter(
        (item) => item.classification === "trusted-tanstack-serializer-preserved",
      ).length,
    },
    missingGeneratedExternalCount: remainingExternal.length,
    scriptComparisons,
    limitations: [
      "Source inspection only; no script evaluation, hydration, provider attribution, or execution permission",
      "Non-script hosts/text compare positional parser trees, not React expected hosts; insertion can shift later differences",
      "Outside-script equality excludes every script element including its attributes; script comparisons separately report finite labels",
      "Resource matching and AST fingerprints remain memory-only; marker names and matching syntax cannot authenticate a provider",
      "Unavailable inspection never changes the original live guard decision",
    ],
  };
}

/**
 * Inspect inertly with original-source offsets, then surgically change only
 * recognized inline third-party script type attributes. parse5.serialize is
 * deliberately never used: Chromium must parse the original source structure.
 */
export async function prepareLiveResponse({
  status,
  responseUrl,
  contentType,
  mitigated,
  html: originalBytes,
  manifest,
  repository,
  ownedStylesheetPaths = new Set(),
  trustedGeneratedHtml,
}) {
  let documentMetadata;
  let rejectedInlineScript;
  const reject = (code) => {
    const error = new LiveResponseRejected(code);
    if (documentMetadata)
      error.diagnostics = {
        ...documentMetadata,
        rejected: true,
        failureCode: code,
        ...(rejectedInlineScript ? { rejectedInlineScript } : {}),
        ...(code === "serializer-validation-limit"
          ? {
              limitation:
                "Trusted generated serializer AST differs from the live envelope; the cause is unresolved. Live source is neither rewritten nor executed to force a match",
            }
          : {}),
      };
    throw error;
  };
  await verifySourceSnapshot(repository, manifest).catch(() => reject("source-snapshot-mismatch"));
  let trustedEnvelope;
  try {
    trustedEnvelope = trustedFrameworkEnvelope(trustedGeneratedHtml, manifest);
  } catch {
    reject("trusted-framework-envelope-unavailable");
  }
  const documentUrl = `${manifest.origin}${manifest.activeRoute}`;
  if (status !== 200) reject("unexpected-response-status");
  if (responseUrl !== documentUrl) reject("redirect-or-url-change");
  if (mitigated) reject("blocked-or-challenge-response");
  if (!/^text\/html(?:\s*;|\s*$)/i.test(contentType ?? "")) reject("non-html-response");
  if (
    !(originalBytes instanceof Uint8Array) ||
    originalBytes.byteLength > 1024 * 1024 ||
    !originalBytes.byteLength
  ) {
    reject("invalid-or-oversized-body");
  }
  let html;
  try {
    html = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(originalBytes);
    if (!Buffer.from(html, "utf8").equals(Buffer.from(originalBytes)))
      reject("invalid-utf8-response");
  } catch {
    reject("invalid-utf8-response");
  }
  documentMetadata = {
    kind: "live-public-owned-response",
    status: 200,
    requestedPath: manifest.activeRoute,
    originalDecodedUtf8Bytes: originalBytes.byteLength,
    originalHtmlSha256: sha256(originalBytes),
  };
  let document;
  try {
    document = parse(html, { sourceCodeLocationInfo: true, scriptingEnabled: true });
  } catch {
    reject("parser-inspection-failed");
  }
  const nodes = [];
  const containmentNodes = [];
  function visitContainment(node) {
    containmentNodes.push(node);
    for (const child of node.childNodes ?? []) visitContainment(child);
    for (const child of node.content?.childNodes ?? []) visitContainment(child);
  }
  function visit(node) {
    nodes.push(node);
    // Script elements inside templates are already inert and must stay intact.
    if (node.tagName === "template") return;
    for (const child of node.childNodes ?? []) visit(child);
  }
  try {
    visit(document);
    visitContainment(document);
  } catch {
    reject("parser-inspection-failed");
  }
  documentMetadata.documentTransformMarkers = {
    rocketLoaderResource: html.includes("rocket-loader.min.js"),
    rocketLoaderSettingsAttribute: nodes.some((node) =>
      node.attrs?.some((item) => item.name === "data-cf-settings"),
    ),
    rewrittenScriptType: nodes.some(
      (node) =>
        node.tagName === "script" &&
        node.attrs?.some(
          (item) =>
            item.name === "type" &&
            /^[a-f0-9]{16,64}-(?:text\/javascript|module)$/.test(item.value),
        ),
    ),
    cloudflareFontsResource: html.includes("/cf-fonts/"),
    zarazResource: html.includes("/cdn-cgi/zaraz/"),
  };
  const attribute = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
  const text = (node) => (node.childNodes ?? []).map((child) => child.value ?? "").join("");
  const safeAttributeNames = new Set([
    "src",
    "type",
    "id",
    "class",
    "async",
    "defer",
    "crossorigin",
    "nonce",
    "data-cfasync",
    "data-cf-settings",
  ]);
  documentMetadata.scriptInventory = nodes
    .filter((node) => node.tagName === "script")
    .map((node) => {
      const source = attribute(node, "src");
      const code = text(node);
      const parentTag = node.parentNode?.tagName;
      const type = (attribute(node, "type") ?? "").toLowerCase().trim();
      let resource = "inline";
      let knownPath;
      if (source !== undefined) {
        resource = "other-external";
        try {
          const url = new URL(source, documentUrl);
          if (
            url.origin === manifest.origin &&
            manifest.assets.some((asset) => asset.path === url.pathname) &&
            !url.search &&
            !url.hash
          ) {
            resource = "pinned-owned";
            knownPath = url.pathname;
          } else if (
            url.origin === manifest.origin &&
            ["/cdn-cgi/zaraz/i.js", "/cdn-cgi/zaraz/s.js"].includes(url.pathname)
          ) {
            resource = "zaraz";
            knownPath = url.pathname;
          } else if (
            url.origin === "https://pagead2.googlesyndication.com" &&
            url.pathname === "/pagead/js/adsbygoogle.js"
          ) {
            resource = "adsense";
            knownPath = "/pagead/js/adsbygoogle.js";
          }
        } catch {
          // Classification cannot make an invalid URL acceptable to the guard.
        }
      }
      return {
        parentTag: ["head", "body", "main", "div", "html"].includes(parentTag)
          ? parentTag
          : "other",
        elementIndex: (node.parentNode?.childNodes ?? [])
          .filter((item) => item.tagName)
          .indexOf(node),
        attributeNames: [
          ...new Set(
            (node.attrs ?? []).map((item) =>
              safeAttributeNames.has(item.name) ? item.name : "other",
            ),
          ),
        ].sort((left, right) => left.localeCompare(right)),
        type: ["", "text/javascript", "application/javascript"].includes(type)
          ? "classic"
          : type === "module"
            ? "module"
            : ["application/json", "application/ld+json", inertType].includes(type)
              ? "inert-data"
              : "other",
        resource,
        ...(knownPath ? { knownPath } : {}),
        inlineUtf16Units: code.length,
        namespaceMarkers: {
          tanstack: code.includes("$_TSR") || code.includes('$R["tsr"]') || code.includes("$R.tsr"),
          zaraz: code.includes("zaraz"),
          cloudflareInitializer: code.includes("__CF$cv$params"),
        },
      };
    });
  try {
    documentMetadata.sourceDifference = sourceDifferenceReport(
      html,
      document,
      trustedGeneratedHtml,
      trustedEnvelope,
      manifest,
    );
  } catch {
    documentMetadata.sourceDifference = {
      version: 1,
      available: false,
      failureCode: "bounded-source-inspection-unavailable",
      originalGuardUnchanged: true,
    };
  }
  const title = nodes.find((node) => node.tagName === "title");
  if (
    containmentNodes.some(
      (node) => node.tagName === "script" && node.namespaceURI !== "http://www.w3.org/1999/xhtml",
    )
  )
    reject("non-html-script-namespace");
  if (
    containmentNodes.some(
      (node) =>
        node.tagName === "template" &&
        node.attrs?.some((item) => item.name.startsWith("shadowroot")),
    )
  )
    reject("declarative-shadow-template");
  if (
    /just a moment|attention required|access denied|forbidden|you have been blocked/i.test(
      text(title ?? {}),
    ) ||
    nodes.some((node) =>
      /^(?:cf-challenge-running|challenge-running|cf-error-details|cf-wrapper)$/.test(
        attribute(node, "id") ?? "",
      ),
    )
  ) {
    reject("blocked-or-challenge-response");
  }
  if (
    nodes.some(
      (node) =>
        node.tagName === "base" ||
        (node.tagName === "meta" && /^refresh$/i.test(attribute(node, "http-equiv") ?? "")),
    )
  ) {
    reject("unexpected-document-redirect");
  }
  if (nodes.some((node) => node.attrs?.some((item) => /^on[a-z]+$/.test(item.name)))) {
    reject("unexpected-inline-event-handler");
  }
  if (
    containmentNodes.some((node) => ["iframe", "frame", "object", "embed"].includes(node.tagName))
  ) {
    reject("unexpected-embedded-document");
  }
  if (
    containmentNodes.some((node) =>
      node.attrs?.some((item) => {
        if (item.name === "srcdoc") return true;
        if (!["href", "src", "action", "formaction", "data"].includes(item.name)) return false;
        try {
          return new URL(item.value, documentUrl).protocol !== "https:";
        } catch {
          return true;
        }
      }),
    )
  )
    reject("unsupported-document-bearing-url");
  if (
    nodes.filter((node) => node.tagName === "textarea" && attribute(node, "id") === "conv-input")
      .length !== 1
  ) {
    reject("missing-base64-controls");
  }
  const pinnedPaths = new Set(manifest.assets.map((item) => item.path));
  const observedExternalScriptUrls = new Set();
  const observedExternalStylesheetUrls = new Set();
  const patches = [];
  const classifications = [];
  let serializerCount = 0;
  let entryCount = 0;
  const matchedEnvelope = [];
  let inlineOrdinal = 0;
  const resolveUrl = (value) => {
    let url;
    try {
      url = new URL(value, documentUrl);
    } catch {
      reject("unsupported-resource-url");
    }
    if (url.protocol !== "https:" || url.username || url.password)
      reject("unsupported-resource-url");
    return url;
  };
  for (const node of nodes) {
    if (node.tagName === "link") {
      const relation = (attribute(node, "rel") ?? "").toLowerCase();
      const href = attribute(node, "href");
      if (!href || !["stylesheet", "modulepreload"].includes(relation)) continue;
      const url = resolveUrl(href);
      if (url.origin === manifest.origin) {
        if (
          url.search ||
          url.hash ||
          (relation === "modulepreload"
            ? !pinnedPaths.has(url.pathname)
            : !ownedStylesheetPaths.has(url.pathname))
        ) {
          reject("unexpected-owned-assets");
        }
      } else if (relation === "stylesheet") observedExternalStylesheetUrls.add(url.href);
      else reject("unexpected-external-module-preload");
    }
    if (node.tagName !== "script") continue;
    const source = attribute(node, "src");
    if (source !== undefined) {
      const url = resolveUrl(source);
      if (url.origin === manifest.origin && url.pathname.startsWith("/assets/")) {
        if (url.search || url.hash || !pinnedPaths.has(url.pathname))
          reject("unexpected-owned-entry");
        if (url.pathname === manifest.entry) reject("unexpected-owned-entry");
        classifications.push({ classification: "pinned-owned-external-script" });
      } else {
        observedExternalScriptUrls.add(url.href);
        classifications.push({ classification: "observed-external-script-left-intact" });
      }
      continue;
    }
    const location = node.sourceCodeLocation;
    if (!location?.startTag || !location.endTag) reject("malformed-script-source");
    const code = html.slice(location.startTag.endOffset, location.endTag.startOffset);
    const type = (attribute(node, "type") ?? "").toLowerCase().trim();
    inlineOrdinal++;
    if (type && !["module", "text/javascript", "application/javascript"].includes(type)) {
      if (!["application/json", "application/ld+json", inertType].includes(type))
        reject("unsupported-script-type");
      classifications.push({ classification: "already-inert-inline-data" });
      continue;
    }
    let trustedMatch;
    try {
      trustedMatch = trustedEnvelope.find(
        (item) =>
          item.type === type && item.astSha256 === astFingerprint(code, item.normalizeTimestamps),
      );
    } catch {
      reject("framework-ast-inspection-failed");
    }
    if (trustedMatch) {
      if (trustedMatch.classification === "pinned-owned-entry-import-preserved") entryCount++;
      if (trustedMatch.classification === "trusted-tanstack-serializer-preserved")
        serializerCount++;
      matchedEnvelope.push(trustedMatch.astSha256);
      classifications.push({
        classification: trustedMatch.classification,
        trustedAstSha256: trustedMatch.astSha256,
      });
      continue;
    }
    if (code.includes("$_TSR") || code.includes('$R["tsr"]') || code.includes("$R.tsr")) {
      rejectedInlineScript = rejectedScriptShape(code, type, inlineOrdinal, node);
      reject("serializer-validation-limit");
    }
    // The successful owned response may contain Cloudflare's injected inline
    // iframe/challenge initializer. Its runtime identifiers stay in memory.
    if (
      code.includes("__CF$cv$params") &&
      code.includes("/cdn-cgi/challenge-platform/") &&
      /createElement\((['"])iframe\1\)/.test(code)
    ) {
      const typeLocation = location.attrs?.type;
      const startOffset = typeLocation?.startOffset ?? location.startTag.endOffset - 1;
      const endOffset = typeLocation?.endOffset ?? startOffset;
      patches.push({
        startOffset,
        endOffset,
        replacement: `${typeLocation ? "" : " "}type="${inertType}"`,
        classification: "cloudflare-inline-initializer",
        operation: typeLocation ? "replace-type-attribute" : "insert-type-attribute",
      });
      continue;
    }
    if (code.trim().startsWith("import(")) reject("unexpected-owned-entry");
    if (!code.trim()) {
      classifications.push({ classification: "empty-inline-script-preserved" });
      continue;
    }
    rejectedInlineScript = rejectedScriptShape(code, type, inlineOrdinal, node);
    reject("unrecognized-inline-script");
  }
  if (entryCount !== 1) reject("unexpected-owned-entry");
  if (serializerCount !== 1) reject("missing-or-unsupported-serializer");
  if (matchedEnvelope.join(",") !== trustedEnvelope.map((item) => item.astSha256).join(",")) {
    documentMetadata.frameworkEnvelopeOrder = {
      reference: trustedEnvelope.map((item) => item.classification),
      observed: classifications
        .filter((item) => item.trustedAstSha256)
        .map((item) => item.classification),
    };
    reject("unexpected-framework-envelope");
  }
  let patchedHtml = html;
  for (const patch of [...patches].sort((left, right) => right.startOffset - left.startOffset)) {
    patchedHtml =
      patchedHtml.slice(0, patch.startOffset) +
      patch.replacement +
      patchedHtml.slice(patch.endOffset);
  }
  return {
    html: patchedHtml,
    observedExternalScriptUrls,
    observedExternalStylesheetUrls,
    diagnostics: {
      ...documentMetadata,
      patchedDecodedUtf8Bytes: Buffer.byteLength(patchedHtml),
      patchedHtmlSha256: sha256(patchedHtml),
      parser: "parse5 inert source-location inspection only; no HTML serialization/reconstruction",
      offsetUnits: "UTF-16 code units in original source",
      surgicalPatchCount: patches.length,
      surgicalPatches: patches.map(({ startOffset, endOffset, classification, operation }) => ({
        startOffset,
        endOffset,
        classification,
        operation,
      })),
      scriptClassifications: classifications,
      frameworkValidation:
        "Trusted generated inline-script AST fingerprints retain identifiers/operators/property names/all strings; only 13-digit epoch literals in serializer .u assignments/property values are normalized",
      frameworkAstCompilerVersion: ts.version,
      observedExternalScriptCount: observedExternalScriptUrls.size,
      observedExternalStylesheetCount: observedExternalStylesheetUrls.size,
      buffering:
        "route.fetch body is fully buffered before route.fulfill; original streaming/chunk timing is not preserved",
      requestTransport:
        "Playwright route.fetch of the production-origin GET with native Chromium request defaults; no UA/header/fingerprint overrides, redirects, retries, or fallback",
      limitations: [
        "API-request fetch transport is not the original browser navigation transport/TLS sequence",
        "Recognized inline third-party initializer type attributes are made inert",
        "Observed external scripts/stylesheets receive inert responses at their exact memory-only URLs",
        "Preconnect hints remain unchanged; resource interception does not prove zero DNS/TCP/TLS activity",
      ],
    },
  };
}

/** Suppress response-triggered telemetry and known speculative fetches in the fixture only. */
export function containLiveResponseHeaders(originalHeaders) {
  const headers = { ...originalHeaders };
  const removedHeaderNames = [];
  const speculationHeaders = [];
  const removedDirectives = [];
  const seenPolicies = new Set();
  const knownDirectives = new Set(
    "default-src script-src script-src-elem script-src-attr style-src style-src-elem style-src-attr img-src font-src connect-src media-src object-src frame-src worker-src child-src manifest-src prefetch-src base-uri form-action frame-ancestors navigate-to sandbox upgrade-insecure-requests block-all-mixed-content require-trusted-types-for trusted-types report-uri report-to".split(
      " ",
    ),
  );
  for (const [name, value] of Object.entries(headers)) {
    const lowerName = name.toLowerCase();
    if (lowerName === "speculation-rules") {
      // This single fixed same-origin endpoint is the only speculative header
      // the isolated fixture suppresses. Never parse, fetch, or grant trust to
      // an arbitrary header URL/list; unsupported values remain untouched and
      // the existing unknown-resource guard still blocks any resulting fetch.
      const knownDefault =
        typeof value === "string" && /^ *"\/cdn-cgi\/speculation" *$/.test(value);
      speculationHeaders.push(knownDefault ? "known-default-omitted" : "unrecognized-preserved");
      if (knownDefault) delete headers[name];
      continue;
    }
    if (["nel", "report-to", "reporting-endpoints"].includes(lowerName)) {
      delete headers[name];
      removedHeaderNames.push(lowerName);
      continue;
    }
    if (!["content-security-policy", "content-security-policy-report-only"].includes(lowerName))
      continue;
    if (
      seenPolicies.has(lowerName) ||
      typeof value !== "string" ||
      value.length > 65536 ||
      /[^\x20-\x7e]/.test(value)
    ) {
      throw new LiveResponseRejected("ambiguous-reporting-policy");
    }
    seenPolicies.add(lowerName);
    const parts = value.split(/([;,])/);
    for (let index = 0; index < parts.length; index += 2) {
      const directive = parts[index].trim();
      if (!directive) continue;
      const directiveName = directive.match(/^([a-zA-Z][a-zA-Z0-9-]*)(?: |$)/)?.[1]?.toLowerCase();
      if (!directiveName || !knownDirectives.has(directiveName))
        throw new LiveResponseRejected("ambiguous-reporting-policy");
      if (["report-uri", "report-to"].includes(directiveName)) {
        parts[index] =
          (parts[index].match(/^ */)?.[0] ?? "") + (parts[index].match(/ *$/)?.[0] ?? "");
        removedDirectives.push({ headerName: lowerName, directiveName });
      }
    }
    headers[name] = parts.join("");
  }
  return {
    headers,
    diagnostics: {
      removedReportingHeaderNames: [...new Set(removedHeaderNames)],
      removedReportingHeaderCount: removedHeaderNames.length,
      speculationRulesHeaderCount: speculationHeaders.length,
      speculationRulesHeaderClassifications: speculationHeaders,
      removedSpeculationRulesHeaderCount: speculationHeaders.filter(
        (item) => item === "known-default-omitted",
      ).length,
      removedCspDirectiveNames: removedDirectives,
      removedCspDirectiveCount: removedDirectives.length,
      limitation:
        "Fixture-only response reporting registrations, CSP report directives, and the single known default same-origin speculation header omitted; CSP enforcement directives, COOP, COEP and unsupported speculation values retained in memory; no production/header setting or request-identity change. Browser-managed speculative loading is outside this replay",
    },
  };
}
