import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import type { AnyRouter } from "@tanstack/router-core";
import { prepareOwnedAssets } from "./owned-assets.mjs";
import { FIXTURE_ORIGIN, generateSsrFixture } from "./generate-ssr.mjs";

interface Bootstrap {
  hydrated?: boolean;
  streamEnded?: boolean;
  h: () => void;
  c: () => void;
}
interface Fiber {
  tag: number;
  type?: string;
  pendingProps?: Record<string, unknown> | string;
  memoizedProps?: Record<string, unknown> | string;
  return?: Fiber | null;
}
interface HostSnapshot {
  kind: string;
  tag?: string;
  path?: string;
  attrs?: Record<string, string>;
  text?: string;
}
interface NodeDiff {
  elapsedMs: number;
  reason: string;
  expected: HostSnapshot | null;
  actual: HostSnapshot | null;
  parent: HostSnapshot | null;
  expectedHostAncestry: string[];
}
interface DiagnosticState {
  root?: unknown;
  timeline: Record<string, unknown>[];
  recoverableErrors: Record<string, unknown>[];
  thrownErrors: Record<string, unknown>[];
  firstDiff: NodeDiff | null;
  beforeHydrate: () => void;
  recoverable: (error: Error, info: { componentStack?: string }) => void;
  captureHost: (fiber: Fiber, node: Node | null, reason: string) => void;
  captureText: (fiber: Fiber, node: Node | null, expected: string, actual: string) => void;
  captureThrown: (error: unknown, fiber: Fiber | null) => void;
  lifecycle: () => Record<string, unknown>;
}
declare global {
  interface Window {
    __toolsHydration: DiagnosticState;
    $_TSR?: Bootstrap;
    $R?: { tsr?: unknown };
  }
}

/** Runs before any document script; only redacted summaries leave the browser. */
function installBrowserDiagnostics() {
  const start = performance.now();
  let bootstrap: Bootstrap | undefined;
  const elapsed = () => Math.round((performance.now() - start) * 10) / 10;
  const clean = (value: unknown): string =>
    (typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : ""
    )
      .replace(/data:[^\s]+/g, "[data-url-omitted]")
      .replace(/ca-pub-\d+/g, "[publisher-redacted]")
      .replace(/\b\d{6,}\b/g, "[numeric-identifier-redacted]")
      .replace(/https?:\/\/[^\s"'`<>]+/g, (url) => {
        try {
          const parsed = new URL(url);
          return `${parsed.origin}${parsed.pathname}`;
        } catch {
          return "[url-redacted]";
        }
      })
      .slice(0, 240);
  const attrs = ["id", "class", "role", "lang", "rel", "href", "src", "type", "name"];
  const pathFor = (node: Node): string => {
    const segments: string[] = [];
    for (
      let current: Node | null = node;
      current && current.nodeType !== Node.DOCUMENT_NODE;
      current = current.parentNode
    ) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as Element;
        const siblings = [...(element.parentElement?.children ?? [])].filter(
          (item) => item.tagName === element.tagName,
        );
        segments.unshift(
          `${element.localName}:nth-of-type(${element.parentElement ? siblings.indexOf(element) + 1 : 1})`,
        );
      } else if (current.nodeType === Node.TEXT_NODE) segments.unshift("#text");
      else if (current.nodeType === Node.COMMENT_NODE) segments.unshift("#comment");
    }
    return segments.join(" > ");
  };
  const nodeSnapshot = (node: Node | null): HostSnapshot | null => {
    if (!node) return null;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const result: HostSnapshot = {
        kind: "element",
        tag: element.localName,
        path: pathFor(node),
        attrs: {},
      };
      for (const key of attrs)
        if (element.hasAttribute(key)) result.attrs![key] = clean(element.getAttribute(key));
      // Never export script/serialization/ad contents or the full document.
      if (["script", "style", "ins", "head", "body", "html"].includes(element.localName))
        result.text = "[contents omitted]";
      else if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE)
        result.text = clean(element.textContent);
      return result;
    }
    return {
      kind: node.nodeType === Node.TEXT_NODE ? "text" : "comment",
      path: pathFor(node),
      text: clean(node.nodeValue),
    };
  };
  const fiberSnapshot = (fiber: Fiber): HostSnapshot => {
    if (fiber.tag === 6) return { kind: "text", text: clean(fiber.pendingProps) };
    if (fiber.tag === 13)
      return { kind: "suspense", text: "Expected a React suspense comment boundary" };
    const props = typeof fiber.pendingProps === "object" ? fiber.pendingProps : {};
    const result: HostSnapshot = { kind: "element", tag: String(fiber.type), attrs: {} };
    for (const key of attrs) {
      const prop = key === "class" ? "className" : key;
      if (typeof props?.[prop] === "string") result.attrs![key] = clean(props[prop]);
    }
    if (fiber.type === "script") result.text = "[contents omitted]";
    else if (["string", "number"].includes(typeof props?.children))
      result.text = clean(props?.children);
    return result;
  };
  const ancestry = (fiber: Fiber): string[] => {
    const result: string[] = [];
    for (let current: Fiber | null | undefined = fiber.return; current; current = current.return) {
      if (current.tag === 5) result.unshift(clean(current.type));
    }
    return result;
  };
  const state: DiagnosticState = {
    timeline: [],
    recoverableErrors: [],
    thrownErrors: [],
    firstDiff: null,
    lifecycle() {
      const router: AnyRouter | undefined = window.__TSR_ROUTER__;
      return {
        hydrated: !!bootstrap?.hydrated,
        streamEnded: !!bootstrap?.streamEnded,
        bootstrapPresent: !!window.$_TSR,
        serializationPoolPresent: !!window.$R?.tsr,
        routerPresent: !!router,
        routerIsLoading: router?.state.isLoading,
        routerStatus: router?.state.status,
        matches: router?.state.matches.map(({ id, status, ssr }) => ({ id, status, ssr })),
      };
    },
    beforeHydrate() {
      bootstrap = window.$_TSR;
      state.timeline.push({
        elapsedMs: elapsed(),
        event: "hydrateRoot-called",
        ...state.lifecycle(),
      });
      if (!bootstrap) return;
      for (const key of ["h", "c"] as const) {
        const original = bootstrap[key];
        bootstrap[key] = function () {
          state.timeline.push({
            elapsedMs: elapsed(),
            event: `bootstrap.${key}:before`,
            ...state.lifecycle(),
          });
          original.call(this);
          state.timeline.push({
            elapsedMs: elapsed(),
            event: `bootstrap.${key}:after`,
            ...state.lifecycle(),
          });
        };
      }
    },
    recoverable(error, info) {
      const item = {
        elapsedMs: elapsed(),
        message: clean(error.message),
        reactCode: error.message.match(/(?:error #|invariant=)(\d+)/)?.[1] ?? null,
        componentNames:
          info.componentStack
            ?.split("\n")
            .map((line) => line.match(/at ([^ (]+)/)?.[1])
            .filter(Boolean)
            .map((name) =>
              /^[\w$.-]+$/.test(name!) ? clean(name) : "[component-location-omitted]",
            ) ?? [],
      };
      state.recoverableErrors.push(item);
      state.timeline.push({ event: "recoverable-error", ...item });
    },
    captureHost(fiber, node, reason) {
      // Capture before React mutates the host node or replaces the document.
      if (state.firstDiff) return;
      state.firstDiff = {
        elapsedMs: elapsed(),
        reason,
        expected: reason === "extra-host" ? null : fiberSnapshot(fiber),
        actual: nodeSnapshot(node),
        parent: nodeSnapshot(node?.parentNode ?? null),
        expectedHostAncestry: ancestry(fiber),
      };
    },
    captureText(fiber, node, expected, actual) {
      if (state.firstDiff) return;
      state.firstDiff = {
        elapsedMs: elapsed(),
        reason: "text",
        expected: { ...fiberSnapshot(fiber), text: clean(expected) },
        actual: { ...nodeSnapshot(node)!, text: clean(actual) },
        parent: nodeSnapshot(node?.parentNode ?? null),
        expectedHostAncestry: ancestry(fiber),
      };
    },
    captureThrown(error, fiber) {
      if (!error || typeof error !== "object" || "then" in error) return;
      const value = error as { name?: string; message?: string };
      const item = {
        elapsedMs: elapsed(),
        name: clean(value.name),
        message: clean(value.message),
        fiberTag: fiber?.tag,
        expectedHostAncestry: fiber ? ancestry(fiber) : [],
      };
      state.thrownErrors.push(item);
      state.timeline.push({ event: "render-exception", ...item });
    },
  };
  window.__toolsHydration = state;
  for (const event of ["DOMContentLoaded", "load"])
    window.addEventListener(event, () => {
      state.timeline.push({ elapsedMs: elapsed(), event, ...state.lifecycle() });
    });
}

type GeneratedFixture = Awaited<ReturnType<typeof generateSsrFixture>>;
type PreparedAssets = Awaited<ReturnType<typeof prepareOwnedAssets>>;
let fixture: GeneratedFixture;
let prepared: PreparedAssets;

test.beforeAll(async () => {
  const cacheDir = fileURLToPath(new URL("./.tmp/owned-assets", import.meta.url));
  prepared = await prepareOwnedAssets(cacheDir, {
    localDirectory: process.env.HYDRATION_OWNED_ASSET_DIRECTORY,
  });
  fixture = await generateSsrFixture(prepared);
});

/** Browser network is deny-by-default and never falls through to the internet. */
async function replay(page: Page, testInfo: TestInfo, mismatch: boolean) {
  const requests: Record<string, unknown>[] = [];
  const pageErrors: { name: string; reactCode: string | null }[] = [];
  const consoleErrors: { reactCode: string | null; category: string }[] = [];
  let html = fixture.html;
  if (mismatch) {
    const original = '<h1 class="terminal-cursor">Web ツール集</h1>';
    if (html.split(original).length !== 2) throw new Error("Synthetic mismatch target changed");
    html = html.replace(original, '<h2 class="terminal-cursor">Web ツール集</h2>');
  }
  const inertCss = new Set<string>();
  for (const route of Object.values(prepared.manifest.routerManifest.routes)) {
    for (const asset of route.assets ?? []) {
      if (
        asset.tag === "link" &&
        asset.attrs?.rel === "stylesheet" &&
        typeof asset.attrs.href === "string"
      )
        inertCss.add(asset.attrs.href);
    }
  }
  const css = fixture.html.match(/href="(\/assets\/styles-[\w-]+\.css)"/)?.[1];
  if (css) inertCss.add(css);
  await page.addInitScript(installBrowserDiagnostics);
  page.on("pageerror", (error) =>
    pageErrors.push({
      name: error.name,
      reactCode: error.message.match(/(?:error #|invariant=)(\d+)/)?.[1] ?? null,
    }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push({
        reactCode: message.text().match(/(?:error #|invariant=)(\d+)/)?.[1] ?? null,
        category: /Minified React error/.test(message.text()) ? "react" : "other-redacted",
      });
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const own = url.origin === FIXTURE_ORIGIN;
    if (
      own &&
      url.pathname === "/base64" &&
      !url.search &&
      method === "GET" &&
      request.isNavigationRequest()
    ) {
      requests.push({ action: "generated-document", path: "/base64" });
      await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html });
      return;
    }
    const asset =
      own && !url.search && method === "GET" ? prepared.assets.get(url.pathname) : undefined;
    if (asset) {
      requests.push({
        action: "verified-owned-js",
        path: url.pathname,
        diagnosticClone: fixture.diagnosticAssets.has(url.pathname),
      });
      await route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        body: fixture.diagnosticAssets.get(url.pathname) ?? asset,
      });
      return;
    }
    if (own && !url.search && method === "GET" && inertCss.has(url.pathname)) {
      requests.push({ action: "inert-owned-css", path: url.pathname });
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "/* diagnostic: intentionally inert */",
      });
      return;
    }
    if (
      url.origin === "https://fonts.googleapis.com" &&
      url.pathname === "/css2" &&
      method === "GET"
    ) {
      requests.push({ action: "inert-font-css", resourceType: request.resourceType() });
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "/* diagnostic: external fonts disabled */",
      });
      return;
    }
    if (
      url.origin === "https://pagead2.googlesyndication.com" &&
      url.pathname === "/pagead/js/adsbygoogle.js" &&
      method === "GET"
    ) {
      requests.push({ action: "inert-ad-script", resourceType: request.resourceType() });
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "/* diagnostic: ads disabled */",
      });
      return;
    }
    if (own && url.pathname === "/favicon.ico" && !url.search && method === "GET") {
      requests.push({ action: "inert-source-icon", path: "/favicon.ico" });
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    // Do not report unknown request URLs: path/query/hostname can contain IDs.
    requests.push({ action: "blocked-unknown", resourceType: request.resourceType(), method });
    await route.abort("blockedbyclient");
  });
  let controlsCompleted = false;
  let lifecycleCompleted = false;
  let observationCompleted = false;
  let redactionFailed = false;
  try {
    await page.goto(`${FIXTURE_ORIGIN}/base64`, { waitUntil: "load" });
    await page.waitForFunction(() => {
      const state = window.__toolsHydration?.lifecycle();
      const router = window.__TSR_ROUTER__;
      return (
        state?.hydrated &&
        state.streamEnded &&
        !state.bootstrapPresent &&
        !state.serializationPoolPresent &&
        router &&
        !router.state.isLoading &&
        router.state.matches.length === 2 &&
        router.state.matches.every((match) => match.status === "success")
      );
    });
    lifecycleCompleted = true;
    await page.locator("#conv-input").fill("Hello hydration");
    await expect(page.getByRole("textbox", { name: "Base64 出力", exact: true })).toHaveValue(
      "SGVsbG8gaHlkcmF0aW9u",
    );
    await page.getByRole("tab", { name: "Base64 デコード", exact: true }).click();
    await page.locator("#conv-input").fill("SGVsbG8gaHlkcmF0aW9u");
    await expect(page.getByRole("textbox", { name: "デコード結果", exact: true })).toHaveValue(
      "Hello hydration",
    );
    controlsCompleted = true;
    // Observe a completed lifecycle plus working deferred controls, then allow
    // queued/lazy effects and browser tasks to settle instead of checking early.
    await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });
    observationCompleted = true;
  } finally {
    const browserState = await page.evaluate(() => ({
      timeline: window.__toolsHydration?.timeline ?? [],
      recoverableErrors: window.__toolsHydration?.recoverableErrors ?? [],
      thrownErrors: window.__toolsHydration?.thrownErrors ?? [],
      firstDiff: window.__toolsHydration?.firstDiff ?? null,
      lifecycle: window.__toolsHydration?.lifecycle() ?? {},
    }));
    const report = {
      ...fixture.diagnostics,
      browser: { name: "chromium", version: page.context().browser()?.version() },
      variant: mismatch ? "deliberate-h1-to-h2-host-mismatch" : "generated-ssr-baseline",
      controlsCompleted,
      lifecycleCompleted,
      observationCompleted,
      ...browserState,
      requests,
      pageErrors,
      consoleErrors,
      redaction:
        "No HTML, source asset bytes, script contents, ad identifiers, URL queries, raw console/error messages, traces, screenshots, or video",
    };
    let reportJson = JSON.stringify(report, null, 2) + "\n";
    if (/ca-pub-\d|data:text\/javascript;base64|"data-ad-(?:client|slot)"/.test(reportJson)) {
      redactionFailed = true;
      reportJson =
        JSON.stringify({
          variant: report.variant,
          redactionFailed: true,
          message: "Diagnostic details omitted because the redaction guard rejected them",
        }) + "\n";
    }
    const reportDirectory = fileURLToPath(
      new URL("../../../test-results/hydration-diagnostic/", import.meta.url),
    );
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(
      `${reportDirectory}${mismatch ? "synthetic-mismatch" : "generated-baseline"}.json`,
      reportJson,
    );
    await testInfo.attach("redacted-hydration-diagnostic", {
      body: Buffer.from(reportJson),
      contentType: "application/json",
    });
  }
  if (redactionFailed)
    throw new Error("Diagnostic report redaction guard failed; diagnostic details were omitted");
  return {
    state: await page.evaluate(() => ({
      errors: window.__toolsHydration.recoverableErrors,
      diff: window.__toolsHydration.firstDiff,
      lifecycle: window.__toolsHydration.lifecycle(),
    })),
    requests,
    pageErrors,
    consoleErrors,
  };
}

test("generated SSR hydrates the pinned production entry and lazy route", async ({
  page,
}, testInfo) => {
  const result = await replay(page, testInfo, false);
  expect(
    result.requests.some(
      (item) => item.action === "verified-owned-js" && item.path === prepared.manifest.activeChunk,
    ),
  ).toBe(true);
  expect(result.requests.filter((item) => item.action === "blocked-unknown")).toEqual([]);
  // If a baseline regression is found, require an actionable first node diff.
  if (result.state.errors.length)
    expect(
      result.state.diff,
      "Recoverable errors must identify the first expected/actual host node",
    ).not.toBeNull();
  expect(result.state.errors, JSON.stringify(result.state.diff)).toEqual([]);
  expect(result.state.diff).toBeNull();
  expect(result.pageErrors).toEqual([]);
  expect(result.consoleErrors.filter((item) => item.category === "react")).toEqual([]);
});

test("deliberate synthetic host mismatch proves the detector is active", async ({
  page,
}, testInfo) => {
  const result = await replay(page, testInfo, true);
  expect(result.requests.filter((item) => item.action === "blocked-unknown")).toEqual([]);
  expect(result.state.errors.length).toBeGreaterThan(0);
  expect(result.state.diff?.reason).toBe("claim");
  expect(result.state.diff?.expected?.tag).toBe("h1");
  expect(result.state.diff?.actual?.tag).toBe("h2");
  expect(result.state.diff?.actual?.path).toContain("header:nth-of-type(1) > h2:nth-of-type(1)");
  expect(result.state.lifecycle.hydrated).toBe(true);
  expect(result.state.lifecycle.streamEnded).toBe(true);
  expect(result.pageErrors).toEqual([]);
});
