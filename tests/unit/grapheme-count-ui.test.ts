// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement, StrictMode, type ComponentType } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Simulate } from "react-dom/test-utils";
import { Route as CharCountRoute } from "../../app/routes/char-count";
import { Route as TextStatsRoute } from "../../app/routes/text-stats";

vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
const pages = [
  ["char-count", (CharCountRoute as unknown as { component: ComponentType }).component],
  ["text-stats", (TextStatsRoute as unknown as { component: ComponentType }).component],
] as const;
let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const result = (testId: string) =>
  container.querySelector(`[data-testid="${testId}"]`)!.textContent;
async function input(text: string) {
  const textarea = container.querySelector("textarea")!;
  await act(async () => Simulate.change(textarea, { target: { value: text } } as never));
  expect(textarea.value).toBe(text);
}

describe.each(pages)("%s grapheme UI", (name, Page) => {
  it("keeps input and legacy counts while updating, clearing, and re-entering compound characters", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(StrictMode, null, createElement(Page)));
    });
    expect(result("grapheme-count")).toBe("0");
    const clear = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "クリア",
    )!;
    expect(clear.disabled).toBe(true);
    await input("👨‍👩‍👧‍👦 🇯🇵 か\u3099 e\u0301");
    expect(result("grapheme-count")).toBe("7");
    expect(result("char-count")).toBe("16");
    expect(result("word-count")).toBe(name === "char-count" ? "4" : "2");
    expect(clear.disabled).toBe(false);
    expect(container.textContent).toContain("コードポイント");
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
    await act(async () => clear.click());
    expect(container.querySelector("textarea")!.value).toBe("");
    expect(result("grapheme-count")).toBe("0");
    expect(result("char-count")).toBe("0");
    expect(clear.disabled).toBe(true);
    await input("👍🏽");
    expect(result("grapheme-count")).toBe("1");
    expect(result("char-count")).toBe("2");
  });

  it("hydrates stable SSR markup when the browser has no Segmenter", async () => {
    container.innerHTML = renderToString(createElement(Page));
    expect(result("grapheme-count")).toBe("確認中");
    const initialValue = container.querySelector('[data-testid="grapheme-count"]');
    const nativeIntl = Intl;
    vi.stubGlobal(
      "Intl",
      new Proxy(nativeIntl, {
        get: (target, key, receiver) =>
          key === "Segmenter" ? undefined : Reflect.get(target, key, receiver),
      }),
    );
    const errors: unknown[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      root = hydrateRoot(container, createElement(Page), {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="grapheme-count"]')).toBe(initialValue);
    expect(result("grapheme-count")).toBe("未対応");
    await input("👨‍👩‍👧‍👦");
    expect(result("grapheme-count")).toBe("未対応");
    expect(result("char-count")).toBe("7");
  });

  it("keeps SSR independent of server Intl and mounts with native client segmentation", async () => {
    const nativeIntl = Intl;
    const serverMarkup = renderToString(createElement(Page));
    vi.stubGlobal("Intl", undefined);
    expect(renderToString(createElement(Page))).toBe(serverMarkup);
    vi.stubGlobal("Intl", nativeIntl);
    container.innerHTML = serverMarkup;
    const initialInput = container.querySelector("textarea");
    const errors: unknown[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      root = hydrateRoot(container, createElement(Page), {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector("textarea")).toBe(initialInput);
    expect(result("grapheme-count")).toBe("0");
    await input("か\u3099");
    expect(result("grapheme-count")).toBe("1");
    expect(result("char-count")).toBe("2");
  });
});
