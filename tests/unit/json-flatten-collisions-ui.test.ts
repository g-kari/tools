// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/json-flatten";

describe("JSON Flatten conflict recovery", () => {
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

  const input = () => container.querySelector<HTMLTextAreaElement>("#inputText")!;
  const output = () => container.querySelector<HTMLTextAreaElement>("#outputText")!;
  const error = () => container.querySelector<HTMLElement>(".error-message");
  const copy = () => container.querySelector('[aria-label="出力をクリップボードにコピー"]');

  function fill(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  function convert(mode = "フラット化") {
    act(() => container.querySelector<HTMLButtonElement>(`[aria-label="JSONを${mode}"]`)!.click());
  }

  it("clears prior output for repeated collisions and recovers with Ctrl+Enter", () => {
    fill('{"a":{"b":1}}');
    convert();
    expect(JSON.parse(output().value)).toEqual({ "a.b": 1 });
    expect(copy()).not.toBeNull();
    const source = '{"a.b":1,"a":{"b":2}}';
    fill(source);
    convert();
    convert();
    expect(error()?.textContent).toContain("衝突");
    expect(error()?.textContent).toContain("a.b");
    expect(output().value).toBe("");
    expect(copy()).toBeNull();
    expect(input().value).toBe(source);
    fill('{"a":{"b":2}}');
    act(() => {
      input().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      );
    });
    expect(JSON.parse(output().value)).toEqual({ "a.b": 2 });
    expect(error()).toBeNull();
    expect(copy()).not.toBeNull();
  });

  it("reports custom-delimiter collisions without rewriting the input", () => {
    const select = container.querySelector("#delimiter")!;
    act(() => {
      Reflect.set(select, "value", "__");
      Simulate.change(select);
    });
    const source = '{"a__b":1,"a":{"b":2}}';
    fill(source);
    convert();
    expect(error()?.textContent).toContain("a__b");
    expect(output().value).toBe("");
    expect(input().value).toBe(source);
  });

  it("rejects unflatten prefix conflicts in both orders and preserves the correction flow", () => {
    act(() => container.querySelector<HTMLButtonElement>('button[aria-pressed="false"]')!.click());
    for (const source of ['{"a.b":1,"a":2}', '{"a":2,"a.b":1}']) {
      fill('{"a.b":1}');
      convert("アンフラット化");
      expect(output().value).not.toBe("");
      fill(source);
      convert("アンフラット化");
      expect(error()?.textContent).toContain("衝突");
      expect(output().value).toBe("");
      expect(copy()).toBeNull();
      expect(input().value).toBe(source);
    }
  });
});
