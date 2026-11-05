// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/text-binary";

const BYTE_INPUT = "01000001 01000010";
const NIBBLE_INPUT = "0100 0001 0100 0010";
const MIXED_ERROR =
  "4ビットと8ビットのグループが混在しています。すべて8ビット（1バイト）、またはすべて4ビット（ニブル）のグループにそろえてください。";
const MIXED_INPUTS = [
  "0100 0001 01000010",
  "01000001 0100 0010",
  "0100 00010100 0010",
  "  0100,\n0001,\t01000010  ",
  "\n01000001,0100\n0010\t",
  "0100,00010100\n0010",
];

describe("text-binary mounted mixed-group recovery", () => {
  let container: HTMLDivElement;
  let root: Root;
  let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
  let previousClipboard: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    // Only the clipboard boundary is mocked. Route, UI, hooks and Toast are real.
    previousClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Converter = Route.options.component!;
    act(() => root.render(createElement(ToastProvider, null, createElement(Converter))));
    const decode = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "バイナリ → テキスト",
    )!;
    act(() => decode.click());
    expect(decode.getAttribute("aria-pressed")).toBe("true");
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (previousClipboard) {
      Object.defineProperty(navigator, "clipboard", previousClipboard);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function input() {
    return container.querySelector<HTMLTextAreaElement>("#text-binary-input")!;
  }

  function enter(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  function output() {
    return container.querySelector<HTMLTextAreaElement>("#text-binary-output");
  }

  function copyButton() {
    return container.querySelector<HTMLButtonElement>('button[aria-label="変換結果をコピー"]');
  }

  function error() {
    return container.querySelector('.text-binary-error[role="alert"]');
  }

  function expectRejected(value: string) {
    expect(input().value).toBe(value);
    // Soft assertions expose the stale/partial output and Copy failures on RED too.
    expect.soft(error()?.textContent).toBe(MIXED_ERROR);
    expect.soft(output()).toBeNull();
    expect.soft(copyButton()).toBeNull();
    expect.soft(container.querySelector('[aria-label="統計情報"]')).toBeNull();
  }

  async function copyAB(expectedCalls: number) {
    expect(error()).toBeNull();
    expect(output()?.value).toBe("AB");
    expect(output()?.readOnly).toBe(true);
    expect(copyButton()?.disabled).toBe(false);
    await act(async () => copyButton()!.click());
    expect(writeText).toHaveBeenCalledTimes(expectedCalls);
    expect(writeText).toHaveBeenLastCalledWith("AB");
    expect(container.querySelector(".toast-success .toast-message")?.textContent).toBe(
      "変換結果をコピーしました",
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "変換結果をコピーしました",
    );
  }

  for (const repaired of [BYTE_INPUT, NIBBLE_INPUT]) {
    it.each(MIXED_INPUTS)(
      `retains mixed %j, removes previous output and recovers with ${repaired}`,
      async (mixed) => {
        const node = input();
        node.focus();
        enter(BYTE_INPUT);
        await copyAB(1);
        const previousOutput = output()!;
        const previousCopy = copyButton()!;

        enter(mixed);
        expect(input()).toBe(node);
        expect(document.activeElement).toBe(node);
        expectRejected(mixed);
        expect.soft(previousOutput.isConnected).toBe(false);
        expect.soft(previousCopy.isConnected).toBe(false);
        expect(writeText).toHaveBeenCalledTimes(1);

        enter(repaired);
        expect(input()).toBe(node);
        expect(input().value).toBe(repaired);
        expect(document.activeElement).toBe(node);
        await copyAB(2);
        expect(writeText.mock.calls.map(([text]) => text)).toEqual(["AB", "AB"]);
      },
    );
  }

  it("supports repeated failure, edit, clear and repair without remounting", async () => {
    const node = input();
    node.focus();
    enter(BYTE_INPUT);
    await copyAB(1);
    enter(MIXED_INPUTS[0]);
    expectRejected(MIXED_INPUTS[0]);
    enter(NIBBLE_INPUT);
    await copyAB(2);
    enter(MIXED_INPUTS[1]);
    expectRejected(MIXED_INPUTS[1]);
    expect(writeText).toHaveBeenCalledTimes(2);

    const clear = container.querySelector<HTMLButtonElement>('button[aria-label="入力をクリア"]')!;
    act(() => clear.click());
    expect(input()).toBe(node);
    expect(input().value).toBe("");
    expect(error()).toBeNull();
    expect(output()).toBeNull();
    expect(copyButton()).toBeNull();
    expect(clear.disabled).toBe(true);

    enter(BYTE_INPUT);
    await copyAB(3);
    expect(input()).toBe(node);
    expect(writeText.mock.calls.map(([text]) => text)).toEqual(["AB", "AB", "AB"]);
  });
});
