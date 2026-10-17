// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/base32";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("Base32 errors and recovery in the actual route", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetch: ReturnType<typeof vi.fn>;
  let writeText: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  const input = () => container.querySelector<HTMLTextAreaElement>("#b32-input")!;
  const output = () => container.querySelector<HTMLTextAreaElement>(".b32-textarea-output");
  const error = () => container.querySelector<HTMLElement>("#b32-error-detail");
  const button = (label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const click = (node: HTMLElement) => act(() => node.click());
  const decode = () => click([...container.querySelectorAll<HTMLElement>('[role="tab"]')][1]);
  function fill(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }
  function expectRejected(value: string, reason: string) {
    fill(value);
    expect(input().value).toBe(value);
    expect(error()?.textContent).toContain(reason);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().getAttribute("aria-describedby")).toBe("b32-decode-rules b32-error-detail");
    expect(output()).toBeNull();
    expect(button("出力をコピー").disabled).toBe(true);
    expect(button("入出力を入れ替える").disabled).toBe(true);
  }

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    fetch = vi.fn(() => {
      throw new Error("Unexpected external request");
    });
    vi.stubGlobal("fetch", fetch);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() =>
      root.render(
        createElement(ToastProvider, null, createElement(Route.options.component as ComponentType)),
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
    expect(fetch).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    ["M", "文字数"],
    ["MY=", "パディング"],
    ["MZ======", "未使用ビット"],
    ["ſA", "無効な文字"],
    ["MY=AAAAA", "パディング"],
  ])("removes prior output for %s and recovers without losing input", async (bad, reason) => {
    decode();
    fill("MY======");
    expect(output()?.value).toBe("f");
    expectRejected(bad, reason);
    click(button("出力をコピー"));
    expect(writeText).not.toHaveBeenCalled();
    expectRejected(bad, reason);
    fill(" mzxw6=== \n");
    expect(output()?.value).toBe("foo");
    expect(error()).toBeNull();
    expect(input().hasAttribute("aria-invalid")).toBe(false);
    expect(input().getAttribute("aria-describedby")).toBe("b32-decode-rules");
    await act(async () => button("出力をコピー").click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith("foo");
  });

  it("rechecks the variant and clears errors on Clear or mode change", () => {
    decode();
    click(container.querySelector<HTMLInputElement>('input[value="hex"]')!);
    expectRejected("CP======", "未使用ビット");
    fill("CO======");
    expect(output()?.value).toBe("f");
    click(container.querySelector<HTMLInputElement>('input[value="standard"]')!);
    expect(error()?.textContent).toContain("未使用ビット");
    expect(output()).toBeNull();
    click(button("入力をクリア"));
    expect(input().value).toBe("");
    expect(error()).toBeNull();
    expect(input().hasAttribute("aria-invalid")).toBe(false);
    expectRejected("MY=", "パディング");
    click([...container.querySelectorAll<HTMLElement>('[role="tab"]')][0]);
    expect(error()).toBeNull();
    expect(input().hasAttribute("aria-describedby")).toBe(false);
    fill("f");
    expect(output()?.value).toBe("MY======");
    click(button("入出力を入れ替える"));
    expect(input().value).toBe("MY======");
    expect(output()?.value).toBe("f");
  });
});
