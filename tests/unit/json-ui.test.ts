// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/json";

describe("Lossless JSON formatter UI", () => {
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
  function fill(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }
  function click(label: string) {
    act(() => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click());
  }
  const source = String.raw`{"id":9007199254740993,"v":1e400,"n":-0,"x":1,"x":2,"text":"\u0061"}`;

  it("keeps input and exact tokens through repeated format/minify", () => {
    fill(source);
    click("JSONを整形（フォーマット）");
    const formatted = output().value;
    expect(formatted).toContain("9007199254740993");
    expect(formatted).toContain("1e400");
    expect(input().value).toBe(source);
    click("JSONを整形（フォーマット）");
    expect(output().value).toBe(formatted);
    fill(formatted);
    expect(output().value).toBe("");
    click("JSONを圧縮（ミニファイ）");
    expect(output().value).toBe(source);
    expect(input().value).toBe(formatted);
  });

  it("clears stale results and errors on edits, rejects invalid input and recovers", () => {
    for (const action of ["JSONを整形（フォーマット）", "JSONを圧縮（ミニファイ）"]) {
      fill(source);
      click(action);
      expect(output().value).not.toBe("");
      fill('{"bad":1,}');
      expect(output().value).toBe("");
      click(action);
      expect(container.querySelector(".error-message")).not.toBeNull();
      expect(output().value).toBe("");
      expect(input().value).toBe('{"bad":1,}');
      fill(source);
      expect(container.querySelector(".error-message")).toBeNull();
      click(action);
      expect(output().value).not.toBe("");
      fill("");
      click(action);
      expect(output().value).toBe("");
      expect(document.activeElement).toBe(input());
      expect(container.querySelector(".error-message")?.textContent).toContain("入力してください");
    }
  });

  it("handles Ctrl+Enter and clear without changing the original source", () => {
    fill(source);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
    });
    expect(output().value).toContain("9007199254740993");
    expect(input().value).toBe(source);
    click("入力と出力をクリア");
    expect(input().value).toBe("");
    expect(output().value).toBe("");
    expect(document.activeElement).toBe(input());
    expect(container.querySelector(".error-message")).toBeNull();
  });
});
