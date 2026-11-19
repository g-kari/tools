// @vitest-environment jsdom

import { act, createElement, StrictMode, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Simulate } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/ini-parser";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("INI input adoption and explicitly unavailable pre-hydration actions", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;
  let recoverableErrors: unknown[] = [];
  const early = "[__proto__]\nconstructor = first\nconstructor = second";
  const single = JSON.stringify(JSON.parse('{"__proto__":{"constructor":"second"}}'), null, 2);
  const multiple = JSON.stringify(
    JSON.parse('{"__proto__":{"constructor":["first","second"]}}'),
    null,
    2,
  );

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
    expect(recoverableErrors).toEqual([]);
  });

  function input() {
    return container.querySelector<HTMLTextAreaElement>("#ini-input")!;
  }
  function duplicate() {
    return container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  }
  function tab(mode: "ini" | "json") {
    return container.querySelectorAll<HTMLButtonElement>('[role="tab"]')[mode === "ini" ? 0 : 1];
  }
  function button(name: string) {
    return container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  }
  function output(label = "JSON出力") {
    return container.querySelector<HTMLTextAreaElement>(`textarea[aria-label="${label}"]`);
  }
  function edit(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }
  function click(element: HTMLElement) {
    act(() => {
      element.click();
    });
  }
  function expectEmpty() {
    expect(input().value).toBe("");
    expect(output()).toBeNull();
    expect(button("入力をクリア").disabled).toBe(true);
    expect(button("出力をコピー").disabled).toBe(true);
  }
  function expectReady() {
    expect(container.querySelector('[aria-label="INIツールの準備"]')?.textContent).toBe(
      "操作の準備ができました。",
    );
    expect(tab("ini").disabled).toBe(false);
    expect(tab("json").disabled).toBe(false);
    expect(duplicate().disabled).toBe(false);
    expect(duplicate().checked).toBe(false);
  }

  async function hydrate(
    strict: boolean,
    beforeHydration?: () => void,
    duringHydration?: () => void,
    value = early,
    checkAvailability = true,
  ) {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    recoverableErrors = [];
    const route = createElement(Route.options.component as () => ReactNode);
    const app = createElement(ToastProvider, null, route);
    const element = strict ? createElement(StrictMode, null, app) : app;
    const ssr = renderToString(element);
    if (checkAvailability) {
      expect(ssr).toContain("<noscript>");
      expect(ssr).toContain("変換と各操作にはJavaScriptが必要です。");
    }
    container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = ssr;
    const ssrInput = input();
    expectEmpty();
    expect(input().disabled).toBe(false);
    expect(input().readOnly).toBe(false);
    if (checkAvailability) {
      for (const control of container.querySelectorAll<HTMLButtonElement>("button")) {
        expect(control.disabled).toBe(true);
      }
      expect(duplicate().disabled).toBe(true);
    }
    expect(duplicate().checked).toBe(false);
    ssrInput.value = value;
    ssrInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    beforeHydration?.();
    await act(async () => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      duringHydration?.();
    });
    expect(input()).toBe(ssrInput);
    if (checkAvailability) expectReady();
  }

  for (const strict of [false, true]) {
    it(`adopts the exact SSR input once (StrictMode ${strict})`, async () => {
      await hydrate(strict, undefined, undefined, early, false);
      expect(input().value).toBe(early);
      expect(output()?.value).toBe(single);
      expect(button("出力をコピー").disabled).toBe(false);
    });

    it(`native disabled SSR actions do not change mode or checkbox (StrictMode ${strict})`, async () => {
      await hydrate(strict, () => {
        tab("json").click();
        duplicate().click();
        button("php.ini のサンプルを読み込む").click();
        expect(tab("ini").getAttribute("aria-selected")).toBe("true");
        expect(duplicate().checked).toBe(false);
        expect(input().value).toBe(early);
      });
      expect(input().value).toBe(early);
      expect(output()?.value).toBe(single);
    });

    it(`first enabled checkbox click is not reset by post-mount state (StrictMode ${strict})`, async () => {
      await hydrate(strict);
      click(duplicate());
      expect(duplicate().checked).toBe(true);
      expect(input().value).toBe(early);
      expect(output()?.value).toBe(multiple);
      click(duplicate());
      expect(duplicate().checked).toBe(false);
      expect(output()?.value).toBe(single);
    });

    it(`first enabled mode action preserves both inputs (StrictMode ${strict})`, async () => {
      await hydrate(strict);
      click(tab("json"));
      expect(tab("json").getAttribute("aria-selected")).toBe("true");
      expect(input().getAttribute("aria-label")).toBe("JSON入力テキストエリア");
      expect(input().value).toBe("");
      edit('{"section":{"key":"json-value"}}');
      expect(output("INI出力")?.value).toBe("[section]\nkey = json-value");
      click(tab("ini"));
      expect(input().value).toBe(early);
      expect(output()?.value).toBe(single);
      click(tab("json"));
      expect(input().value).toBe('{"section":{"key":"json-value"}}');
      click(button("入力をクリア"));
      expect(input().value).toBe("");
      expect(output("INI出力")).toBeNull();
      click(tab("ini"));
      expect(input().value).toBe(early);
    });

    it(`latest native input before commit wins (StrictMode ${strict})`, async () => {
      const latest = "[latest]\nkey = before-commit";
      await hydrate(strict, undefined, () => {
        input().value = latest;
        input().dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
      });
      expect(input().value).toBe(latest);
      expect(output()?.value).toBe(JSON.stringify({ latest: { key: "before-commit" } }, null, 2));
    });

    it(`Clear and subsequent edits cannot revive the adopted input (StrictMode ${strict})`, async () => {
      await hydrate(strict);
      click(button("入力をクリア"));
      expectEmpty();
      click(duplicate());
      click(tab("json"));
      click(tab("ini"));
      expectEmpty();
      edit("[latest]\nkey = fresh");
      expect(output()?.value).toBe(JSON.stringify({ latest: { key: "fresh" } }, null, 2));
      click(button("php.ini のサンプルを読み込む"));
      expect(input().value).toContain("memory_limit = 128M");
      expect(output()?.value).toContain('"PHP"');
      expect(output()?.value).not.toContain('"__proto__"');
      click(button("入力をクリア"));
      click(tab("json"));
      click(tab("ini"));
      expectEmpty();
    });

    it(`empty SSR input stays empty across first options and edits (StrictMode ${strict})`, async () => {
      await hydrate(strict, undefined, undefined, "");
      expectEmpty();
      click(duplicate());
      expect(duplicate().checked).toBe(true);
      expectEmpty();
      edit(early);
      expect(output()?.value).toBe(multiple);
      click(button("入力をクリア"));
      expectEmpty();
    });
  }
});
