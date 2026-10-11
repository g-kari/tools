// @vitest-environment jsdom
import { act, createElement, useState, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ConversionTool } from "../../app/components/ConversionTool";
import { ToastProvider } from "../../app/components/Toast";
import { useConversionTool } from "../../app/hooks/useConversionTool";
import type { ConversionMode } from "../../app/types/converter";

type Props = ComponentProps<typeof ConversionTool>;
const config = {
  defaultOptions: {},
  encode: (input: string) => ({
    encoded: `encoded:${input}`,
    inputBytes: input.length,
    outputLength: input.length,
  }),
  decode: (input: string) => ({ success: true as const, decoded: input, bytes: new Uint8Array() }),
};

describe("manual conversion mode tabs", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  function render(props: Partial<Props> = {}) {
    act(() =>
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(ConversionTool, {
            mode: "encode",
            input: "retained input",
            output: "retained output",
            onModeChange: vi.fn(),
            onInputChange: vi.fn(),
            onSwap: vi.fn(),
            onClear: vi.fn(),
            ...props,
          }),
        ),
      ),
    );
  }
  function tabs(scope: HTMLElement = container) {
    return Array.from(scope.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  }
  function press(element: HTMLElement, key: string, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    act(() => {
      element.dispatchEvent(event);
    });
    return event;
  }
  function focus(element: HTMLElement) {
    act(() => element.focus());
  }

  it.each(["encode", "decode"] as const)("starts with only %s in the tab sequence", (mode) => {
    render({ mode });
    expect(tabs().map((tab) => tab.tabIndex)).toEqual(mode === "encode" ? [0, -1] : [-1, 0]);
    const selected = tabs().find((tab) => tab.getAttribute("aria-selected") === "true")!;
    const panel = container.querySelector('[role="tabpanel"]')!;
    expect(selected.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(selected.id);
  });
  it("wraps both arrows and Home/End without changing the selected mode or input", () => {
    const change = vi.fn();
    render({ onModeChange: change });
    const [encode, decode] = tabs();
    focus(encode);
    for (const [key, expected] of [
      ["ArrowLeft", decode],
      ["ArrowRight", encode],
      ["End", decode],
      ["Home", encode],
      ["ArrowRight", decode],
      ["ArrowRight", encode],
    ] as const) {
      expect(press(document.activeElement as HTMLElement, key).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(expected);
      expect(tabs().filter((tab) => tab.tabIndex === 0)).toEqual([expected]);
    }
    expect(change).not.toHaveBeenCalled();
    expect(encode.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector<HTMLTextAreaElement>("textarea")!.value).toBe("retained input");
    expect(container.querySelectorAll<HTMLTextAreaElement>("textarea")[1].value).toBe(
      "retained output",
    );
  });
  it("leaves activation to native click and suppresses redundant selected-mode callbacks", () => {
    const change = vi.fn();
    render({ onModeChange: change });
    const [encode, decode] = tabs();
    focus(decode);
    expect(press(decode, "Enter").defaultPrevented).toBe(false);
    expect(press(decode, " ").defaultPrevented).toBe(false);
    expect(change).not.toHaveBeenCalled();
    act(() => decode.click());
    expect(change).toHaveBeenCalledExactlyOnceWith("decode");
    act(() => encode.click());
    expect(change).toHaveBeenCalledOnce();
  });
  it("does not trap Tab and restores the selected tab stop on leaving", () => {
    render();
    const [encode, decode] = tabs();
    focus(encode);
    press(encode, "End");
    expect(press(decode, "Tab").defaultPrevented).toBe(false);
    expect(press(decode, "Tab", { shiftKey: true }).defaultPrevented).toBe(false);
    focus(container.querySelector("textarea")!);
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([0, -1]);
    expect(document.activeElement).toBe(container.querySelector("textarea"));
  });
  it.each([
    ["ArrowUp", {}],
    ["ArrowDown", {}],
    ["ArrowRight", { altKey: true }],
    ["ArrowRight", { ctrlKey: true }],
    ["ArrowRight", { metaKey: true }],
    ["ArrowRight", { shiftKey: true }],
    ["ArrowRight", { isComposing: true }],
    ["ArrowRight", { keyCode: 229 }],
  ] as const)("does not intercept %s with %o", (key, init) => {
    render();
    const [encode] = tabs();
    focus(encode);
    expect(press(encode, key, init).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(encode);
  });
  it("keeps panel, input DOM and editing focus across a controlled mode update", () => {
    render();
    const panel = container.querySelector('[role="tabpanel"]');
    const input = container.querySelector<HTMLTextAreaElement>("textarea")!;
    focus(input);
    input.setSelectionRange(2, 6);
    render({ mode: "decode" });
    expect(container.querySelector('[role="tabpanel"]')).toBe(panel);
    expect(container.querySelector("textarea")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([-1, 0]);
    expect(panel!.getAttribute("aria-labelledby")).toBe(tabs()[1].id);
    expect(press(input, "ArrowLeft").defaultPrevented).toBe(false);
  });
  it("preserves actual hook input on arrows and keeps the existing explicit switch clear", () => {
    function Fixture() {
      const value = useConversionTool(config);
      return createElement(ConversionTool, {
        ...value,
        onModeChange: value.handleModeChange,
        onInputChange: value.setInput,
        onSwap: value.handleSwap,
        onClear: value.handleClear,
      });
    }
    act(() => root.render(createElement(ToastProvider, null, createElement(Fixture))));
    const input = container.querySelector<HTMLTextAreaElement>("textarea")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
        input,
        "hello",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input.value).toBe("hello");
    focus(tabs()[0]);
    press(tabs()[0], "ArrowRight");
    expect(input.value).toBe("hello");
    act(() => tabs()[1].click());
    expect(input.value).toBe("");
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
  });
  it("scopes navigation and generated tab and panel IDs to each instance", () => {
    function Fixture() {
      const [mode, setMode] = useState<ConversionMode>("encode");
      const props = {
        mode,
        onModeChange: setMode,
        input: "hello",
        output: "world",
        onInputChange: vi.fn(),
        onSwap: vi.fn(),
        onClear: vi.fn(),
      };
      return createElement(
        "div",
        null,
        createElement(ConversionTool, props),
        createElement(ConversionTool, { ...props, mode: "decode" }),
      );
    }
    act(() => root.render(createElement(ToastProvider, null, createElement(Fixture))));
    const groups = container.querySelectorAll<HTMLDivElement>('[role="tablist"]');
    focus(tabs(groups[0])[0]);
    press(tabs(groups[0])[0], "End");
    expect(document.activeElement).toBe(tabs(groups[0])[1]);
    expect(tabs(groups[1]).map((tab) => tab.tabIndex)).toEqual([-1, 0]);
    const ids = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tab"], [role="tabpanel"]'),
    ).map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const label of container.querySelectorAll("label")) {
      expect(label.htmlFor).toBe(label.nextElementSibling!.id);
    }
  });
});
