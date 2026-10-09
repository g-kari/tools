// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/json-pointer";

describe("JSON Pointer evaluation recovery", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Component = Route.options.component!;
    act(() => root.render(createElement(ToastProvider, { children: createElement(Component) })));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const jsonInput = () => container.querySelector<HTMLTextAreaElement>("#jsonInput")!;
  const pointerInput = () => container.querySelector<HTMLInputElement>("#pointerInput")!;
  const output = () => container.querySelector<HTMLElement>(".json-pointer-result-pre");
  const error = () => container.querySelector<HTMLElement>(".error-message");
  const copyButton = () =>
    container.querySelector<HTMLButtonElement>(
      '[aria-label="評価結果をクリップボードにコピーする"]',
    )!;

  function fillJson(value: string) {
    act(() => {
      jsonInput().value = value;
      Simulate.change(jsonInput());
    });
  }

  function fillPointer(value: string) {
    act(() => {
      pointerInput().value = value;
      Simulate.change(pointerInput());
    });
  }

  function evaluate() {
    act(() =>
      container.querySelector<HTMLButtonElement>('[aria-label="JSON Pointerを評価する"]')!.click(),
    );
  }

  it("clears stale success on repeated invalid array indices and recovers by keyboard", () => {
    const source = '["first","second"]';
    fillJson(source);
    fillPointer("/1");
    evaluate();
    expect(output()?.textContent).toBe('"second"');
    expect(copyButton().disabled).toBe(false);

    for (const pointer of ["/01", "/", "/+1", "/1.0", "/-"]) {
      fillPointer(pointer);
      evaluate();
      evaluate();
      expect(output()).toBeNull();
      expect(error()).not.toBeNull();
      expect(copyButton().disabled).toBe(true);
      expect(jsonInput().value).toBe(source);
      expect(pointerInput().value).toBe(pointer);
    }

    fillPointer("/0");
    act(() => {
      pointerInput().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      );
    });
    expect(output()?.textContent).toBe('"first"');
    expect(error()).toBeNull();
    expect(copyButton().disabled).toBe(false);
    expect(jsonInput().value).toBe(source);
  });

  it("rejects inherited keys and malformed escapes while keeping actual special keys", () => {
    fillJson("{}");
    fillPointer("/constructor");
    evaluate();
    expect(error()?.textContent).toContain("存在しません");
    expect(output()).toBeNull();

    fillJson('{"a~2b":7,"__proto__":{"constructor":"own"},"":"empty"}');
    fillPointer("/a~2b");
    evaluate();
    expect(error()?.textContent).toContain("エスケープ");
    expect(output()).toBeNull();

    fillPointer("/a~02b");
    evaluate();
    expect(output()?.textContent).toBe("7");
    expect(error()).toBeNull();
    fillPointer("/__proto__/constructor");
    evaluate();
    expect(output()?.textContent).toBe('"own"');
    fillPointer("/");
    evaluate();
    expect(output()?.textContent).toBe('"empty"');
  });

  it("explains canonical array indices and valid escapes", () => {
    expect(container.textContent).toContain("01・+1・1.0は不可");
    expect(container.textContent).toContain("~0・~1以外のエスケープ");
  });
});
