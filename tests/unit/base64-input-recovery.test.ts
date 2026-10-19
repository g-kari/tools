// @vitest-environment jsdom
import { Component, act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { changeControl } from "../helpers/change-control";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Route } from "../../app/routes/base64";
import { ToastProvider } from "../../app/components/Toast";
import { useConversionTool } from "../../app/hooks/useConversionTool";

const ENCODE_ERROR = "エンコードに失敗しました。入力と設定を確認してください。";
const INVALID_UTF16 = [
  "\uD800",
  "\uDC00",
  "前\uD800後",
  "前\uDC00後",
  "\uD800後",
  "前\uD800",
  "\uDC00後",
  "前\uDC00",
];

describe("Base64 input failure recovery", () => {
  let container: HTMLDivElement;
  let root: Root;
  let caught: Error[];
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("External fetch forbidden");
      }),
    );
    caught = [];
    class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
      state = { failed: false };
      static getDerivedStateFromError() {
        return { failed: true };
      }
      componentDidCatch(error: Error) {
        caught.push(error);
      }
      render() {
        return this.state.failed
          ? createElement("p", null, "boundary fallback")
          : this.props.children;
      }
    }
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Converter = Route.options.component!;
    act(() =>
      root.render(
        createElement(Boundary, {
          children: createElement(ToastProvider, null, createElement(Converter)),
        }),
      ),
    );
  });
  afterEach(() => {
    expect(caught).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  function input() {
    return container.querySelector<HTMLTextAreaElement>("#conv-input")!;
  }
  function enter(value: string) {
    act(() => {
      input().value = value;
      changeControl(input());
    });
  }
  function button(label: string) {
    return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  }
  function output() {
    return container.querySelector<HTMLTextAreaElement>(".conv-textarea-output");
  }
  function error() {
    return container.querySelector('[role="alert"]');
  }

  it.each(INVALID_UTF16)(
    "retains malformed UTF-16 %j and disables invalid output actions",
    (value) => {
      const node = input();
      node.focus();
      enter(value);
      expect(input()).toBe(node);
      expect(input().value).toBe(value);
      expect(document.activeElement).toBe(node);
      expect(error()?.textContent).toContain(ENCODE_ERROR);
      expect(output()).toBeNull();
      expect(button("出力をコピー").disabled).toBe(true);
      expect(button("入出力を入れ替える").disabled).toBe(true);
      expect(button("入力をクリア").disabled).toBe(false);
    },
  );
  it.each(INVALID_UTF16)(
    "recovers from %j by editing and keeps Unicode round-trip semantics",
    (value) => {
      enter("previous valid output");
      expect(output()).not.toBeNull();
      enter(value);
      expect(output()).toBeNull();
      enter("日本語 👩‍💻 e\u0301");
      expect(error()).toBeNull();
      expect(output()?.value).toBe(btoa(unescape(encodeURIComponent("日本語 👩‍💻 e\u0301"))));
      act(() => button("入出力を入れ替える").click());
      expect(output()?.value).toBe("日本語 👩‍💻 e\u0301");
      expect(error()).toBeNull();
    },
  );
  it.each(["Hello", "日本語", "😀"])("keeps valid UTF-8 metadata for %j", (value) => {
    enter(value);
    const encoded = btoa(unescape(encodeURIComponent(value)));
    expect(error()).toBeNull();
    expect(output()?.value).toBe(encoded);
    expect(container.querySelector(".conv-output-meta")?.textContent).toBe(
      `${new TextEncoder().encode(value).length} バイト → ${encoded.length} 文字`,
    );
  });
  it("clears invalid input and error without remounting", () => {
    const node = input();
    enter("\uD800");
    act(() => button("入力をクリア").click());
    expect(input()).toBe(node);
    expect(input().value).toBe("");
    expect(error()).toBeNull();
    expect(output()).toBeNull();
    expect(button("入力をクリア").disabled).toBe(true);
  });
  it("preserves invalid input during tab navigation then uses the existing explicit-switch clear", () => {
    enter("\uD800");
    const [encode, decode] = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    act(() => encode.focus());
    act(() => {
      encode.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
      );
    });
    expect(document.activeElement).toBe(decode);
    expect(input().value).toBe("\uD800");
    expect(error()?.textContent).toContain(ENCODE_ERROR);
    act(() => decode.click());
    expect(input().value).toBe("");
    expect(error()).toBeNull();
    enter("44GT44KT44Gr44Gh44Gv");
    expect(output()?.value).toBe("こんにちは");
  });
  it("preserves whitespace encoding and its output metadata", () => {
    enter(" \n");
    expect(error()).toBeNull();
    expect(output()?.value).toBe("IAo=");
    expect(container.querySelector(".conv-output-meta")?.textContent).toBe("2 バイト → 4 文字");
  });
  it.each(["invalid!!!", "/w=="])("keeps existing decode failure and repair for %j", (value) => {
    act(() => container.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click());
    enter(value);
    expect(error()?.textContent).not.toContain(ENCODE_ERROR);
    expect(error()).not.toBeNull();
    expect(input().value).toBe(value);
    expect(output()).toBeNull();
    enter("SGVsbG8=");
    expect(error()).toBeNull();
    expect(output()?.value).toBe("Hello");
  });
  it("does not expose exception text and retries when an encode option is corrected", () => {
    let state!: ReturnType<typeof useConversionTool<{ fail: boolean }>>;
    const config = {
      defaultOptions: { fail: true },
      encode(text: string, options: { fail: boolean }) {
        if (options.fail) throw new Error(`synthetic private detail ${text}`);
        return { encoded: text, inputBytes: text.length, outputLength: text.length };
      },
      decode(text: string) {
        return { success: true as const, decoded: text, bytes: new Uint8Array() };
      },
    };
    function HookFixture() {
      state = useConversionTool(config);
      return null;
    }
    act(() => root.render(createElement(HookFixture)));
    act(() => state.setInput("safe fixture input"));
    expect(state.error).toBe(ENCODE_ERROR);
    expect(state.encodeResult).toBeNull();
    expect(state.output).toBe("");
    expect(state.input).toBe("safe fixture input");
    act(() => state.updateOptions({ fail: true }));
    act(() => state.handleSwap());
    expect(state.mode).toBe("encode");
    expect(state.input).toBe("safe fixture input");
    expect(state.error).toBe(ENCODE_ERROR);
    act(() => state.updateOptions({ fail: false }));
    expect(state.error).toBeNull();
    expect(state.output).toBe("safe fixture input");
  });
});
