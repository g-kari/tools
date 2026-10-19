// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { changeControl } from "../helpers/change-control";
import { Route } from "../../app/routes/password-generator";
const { copy } = vi.hoisted(() => ({ copy: vi.fn(async () => true) }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("../../app/components/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("../../app/hooks/useClipboard", () => ({ useClipboard: () => ({ copy }) }));
const Page = (Route as unknown as { component: ComponentType }).component;
let container: HTMLDivElement;
let root: Root;
const output = () => container.querySelector<HTMLInputElement>("#passwordOutput")!;
const score = () => container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow");
const button = (name: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
async function click(name: string) {
  await act(async () => button(name).click());
}
async function option(name: string, checked: boolean) {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)!;
  await act(async () => changeControl(input, { target: { checked } } as never));
}
async function length(value: number) {
  await act(async () =>
    changeControl(container.querySelector("#passwordLength")!, {
      target: { value: String(value) },
    } as never),
  );
}
async function digitsOnly() {
  await option("大文字を含める", false);
  await option("小文字を含める", false);
  await option("記号を含める", false);
  await option("数字を含める", true);
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("crypto", { getRandomValues: (array: Uint32Array) => array.fill(0) });
  copy.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Page));
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("generated password strength snapshot", () => {
  it("keeps strength and copy tied to the generated digits while options and next length change", async () => {
    await digitsOnly();
    await click("新しいパスワードを生成");
    const original = output().value;
    expect(original).toBe("0".repeat(16));
    expect(score()).toBe("3");
    await option("大文字を含める", true);
    await option("小文字を含める", true);
    await option("記号を含める", true);
    await length(128);
    expect(output().value).toBe(original);
    expect(score()).toBe("3");
    await click("パスワードをクリップボードにコピー");
    expect(copy).toHaveBeenLastCalledWith(original);
    await click("新しいパスワードを生成");
    expect(output().value).toBe("A".repeat(128));
    expect(score()).toBe("5");
    await click("パスワードをクリップボードにコピー");
    expect(copy).toHaveBeenLastCalledWith("A".repeat(128));
  });
  it("keeps the initial generation rating until an explicit regeneration applies fewer character types", async () => {
    expect(output().value).toBe("A".repeat(16));
    expect(score()).toBe("4");
    await digitsOnly();
    expect(output().value).toBe("A".repeat(16));
    expect(score()).toBe("4");
    await click("新しいパスワードを生成");
    expect(output().value).toBe("0".repeat(16));
    expect(score()).toBe("3");
  });
  it("preserves a valid output and rating when generation has no selected character type", async () => {
    const original = output().value;
    await digitsOnly();
    await option("数字を含める", false);
    await click("新しいパスワードを生成");
    expect(output().value).toBe(original);
    expect(score()).toBe("4");
  });
  it("clears output and strength, rejects empty options, and applies the minimum next length", async () => {
    await click("パスワードをクリア");
    expect(output().value).toBe("");
    expect(score()).toBeUndefined();
    expect(button("パスワードをクリップボードにコピー").disabled).toBe(true);
    await digitsOnly();
    await option("数字を含める", false);
    await click("新しいパスワードを生成");
    expect(output().value).toBe("");
    expect(score()).toBeUndefined();
    await option("数字を含める", true);
    await length(4);
    await click("新しいパスワードを生成");
    expect(output().value).toBe("0000");
    expect(score()).toBe("1");
  });
});
