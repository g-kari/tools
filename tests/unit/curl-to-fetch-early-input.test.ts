// @vitest-environment jsdom

import { act, createElement, StrictMode, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Simulate } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/curl-to-fetch";
import { convertCurl, type ConvertOptions } from "../../app/utils/curl-to-fetch";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("cURL input and options across server rendering and hydration", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;
  let recoverableErrors: unknown[];
  const early = "curl 'https://example.com/early-input' -H 'X-Test: exact'";

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
    expect(recoverableErrors).toEqual([]);
  });

  function input() {
    return container.querySelector<HTMLTextAreaElement>("#ctf-curl-input")!;
  }
  function radio(mode: "fetch" | "axios") {
    return container.querySelector<HTMLInputElement>(`input[name="ctf-mode"][value="${mode}"]`)!;
  }
  function typed() {
    return container.querySelector<HTMLInputElement>(".ctf-checkbox")!;
  }
  function output() {
    return container.querySelector('[aria-label="変換されたコード"]')!;
  }
  function button(name: string) {
    return container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  }
  function expectCode(value: string, options: ConvertOptions) {
    expect(input().value).toBe(value);
    expect(radio(options.mode).checked).toBe(true);
    expect(typed().checked).toBe(options.typescript);
    expect(output().textContent).toBe(convertCurl(value, options).code);
  }
  function expectEmpty() {
    expect(input().value).toBe("");
    expect(output().textContent).toBe("cURLコマンドを入力すると変換結果が表示されます");
    expect(button("入力をクリア").disabled).toBe(true);
  }
  function edit(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  async function hydrate(
    strict: boolean,
    beforeHydration?: () => void,
    firstAction?: () => void,
    value = early,
  ) {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    recoverableErrors = [];
    const route = createElement(Route.options.component as () => ReactNode);
    const app = createElement(ToastProvider, null, route);
    const element = strict ? createElement(StrictMode, null, app) : app;
    container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(element);
    const ssrInput = input();
    expectEmpty();
    ssrInput.value = value;
    ssrInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    beforeHydration?.();
    expect(input().value).toBe(value);
    expect(button("入力をクリア").disabled).toBe(true);
    await act(async () => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      firstAction?.();
    });
    expect(input()).toBe(ssrInput);
  }

  for (const strict of [false, true]) {
    it(`adopts early input (StrictMode ${strict})`, async () => {
      await hydrate(strict);
      expectCode(early, { mode: "fetch", typescript: false });
      act(() => radio("axios").click());
      expectCode(early, { mode: "axios", typescript: false });
      act(() => typed().click());
      expectCode(early, { mode: "axios", typescript: true });
    });

    it(`adopts all SSR options (StrictMode ${strict})`, async () => {
      await hydrate(strict, () => {
        radio("axios").click();
        typed().click();
      });
      expectCode(early, { mode: "axios", typescript: true });
      act(() => button("入力をクリア").click());
      expectEmpty();
      act(() => radio("fetch").click());
      act(() => typed().click());
      expectEmpty();
      const latest = "curl 'https://example.com/latest-input'";
      edit(latest);
      expectCode(latest, { mode: "fetch", typescript: false });
      expect(output().textContent).not.toContain("early-input");
    });

    for (const action of ["axios", "typescript"] as const) {
      it(`first ${action} click preserves input (StrictMode ${strict})`, async () => {
        await hydrate(strict, undefined, () => {
          if (action === "axios") radio("axios").click();
          else typed().click();
          expect(input().value).toBe(early);
        });
        expectCode(early, {
          mode: action === "axios" ? "axios" : "fetch",
          typescript: action === "typescript",
        });
      });
    }

    it(`latest input event wins (StrictMode ${strict})`, async () => {
      const latest = "curl 'https://example.com/latest-event'";
      await hydrate(strict, undefined, () => {
        input().value = latest;
        input().dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
        expect(input().value).toBe(latest);
      });
      expectCode(latest, { mode: "fetch", typescript: false });
    });

    it(`sample wins and Clear stays empty (StrictMode ${strict})`, async () => {
      await hydrate(strict, undefined, () => {
        button("GET リクエストのサンプルを読み込む").click();
      });
      expect(input().value).toContain("https://api.example.com/users");
      expect(output().textContent).toContain("https://api.example.com/users");
      expect(output().textContent).not.toContain("early-input");
      act(() => button("入力をクリア").click());
      expectEmpty();
      act(() => radio("axios").click());
      act(() => typed().click());
      expectEmpty();
    });

    it(`empty input keeps options (StrictMode ${strict})`, async () => {
      await hydrate(
        strict,
        () => {
          radio("axios").click();
          typed().click();
        },
        undefined,
        "",
      );
      expectEmpty();
      expect(radio("axios").checked).toBe(true);
      expect(typed().checked).toBe(true);
      edit(early);
      expectCode(early, { mode: "axios", typescript: true });
    });
  }
});
