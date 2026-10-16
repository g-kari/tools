// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/uuid";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("UUID version selection in the actual route", () => {
  let container: HTMLDivElement;
  let root: Root;
  let writeText: ReturnType<typeof vi.fn>;
  let fetch: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  const v4 = "00112233-4455-4677-8899-aabbccddeeff";
  const values = () =>
    [...container.querySelectorAll(".uuid-value")].map((node) => node.textContent!);
  const generatedVersion = () => container.querySelector("#uuid-result-version")?.textContent;
  const button = (text: string) =>
    [...container.querySelectorAll("button")].find((node) => node.textContent === text)!;
  const click = (node: HTMLElement) => act(() => node.click());
  const choose = (version: 4 | 7) =>
    click(container.querySelector<HTMLInputElement>(`#uuid-version-${version}`)!);
  function count(value: number) {
    act(() => {
      const input = container.querySelector<HTMLInputElement>("#count")!;
      input.value = String(value);
      Simulate.change(input);
    });
  }

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    fetch = vi.fn(() => {
      throw new Error("Unexpected external request");
    });
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(Date, "now").mockReturnValue(1645557742000);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(v4);
    vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      (array as Uint8Array).fill(0xab);
      return array;
    });
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

  it("keeps v4 as the initial generated format and default selection", () => {
    expect(container.querySelector<HTMLInputElement>("#uuid-version-4")?.checked).toBe(true);
    expect(values()).toEqual([v4]);
    expect(generatedVersion()).toContain("v4");
    expect(crypto.getRandomValues).not.toHaveBeenCalled();
  });

  it("keeps the result label and value when selecting the next version", () => {
    choose(7);
    expect(values()).toEqual([v4]);
    expect(generatedVersion()).toContain("v4");
    click(button("UUID生成"));
    expect(values()).toEqual(["017f22e2-79b0-7bab-abab-abababababab"]);
    expect(generatedVersion()).toContain("v7");
    choose(4);
    expect(generatedVersion()).toContain("v7");
  });

  it("generates the selected v7 batch with fresh randomness per item", () => {
    choose(7);
    count(3);
    click(button("UUID生成"));
    expect(values()).toHaveLength(3);
    expect(crypto.getRandomValues).toHaveBeenCalledTimes(3);
    expect(values().every((value) => value[14] === "7")).toBe(true);
  });

  it("formats and copies generated values without regenerating them", async () => {
    choose(7);
    count(2);
    click(button("UUID生成"));
    for (const node of container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
      click(node);
    const expected = "017F22E279B07BABABABABABABABABAB";
    expect(values()).toEqual([expected, expected]);
    expect(crypto.getRandomValues).toHaveBeenCalledTimes(2);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button[aria-label="UUID 1をコピー"]')!.click(),
    );
    expect(writeText).toHaveBeenLastCalledWith(expected);
    await act(async () => button("すべてコピー").click());
    expect(writeText).toHaveBeenLastCalledWith(`${expected}\n${expected}`);
  });

  it("clears results and can generate v4 again", () => {
    choose(7);
    click(button("UUID生成"));
    click(button("クリア"));
    expect(values()).toEqual([]);
    expect(generatedVersion()).toBeUndefined();
    choose(4);
    click(button("UUID生成"));
    expect(values()).toEqual([v4]);
    expect(generatedVersion()).toContain("v4");
  });

  it("removes old results after entropy failure and recovers on retry", () => {
    choose(7);
    vi.mocked(crypto.getRandomValues).mockImplementationOnce(() => {
      throw new Error("private environment detail");
    });
    click(button("UUID生成"));
    expect(values()).toEqual([]);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "UUIDを生成できませんでした",
    );
    expect(container.textContent).not.toContain("private environment detail");
    click(button("UUID生成"));
    expect(values()[0][14]).toBe("7");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("discloses timestamp exposure and ordering limits", () => {
    expect(container.textContent).toContain("生成時刻");
    expect(container.textContent).toContain("同じミリ秒");
    expect(container.textContent).toContain("時計が戻った場合");
  });

  it("does not expose partial batches when a later entropy call fails", () => {
    choose(7);
    count(3);
    vi.mocked(crypto.getRandomValues)
      .mockImplementationOnce((array) => array)
      .mockImplementationOnce(() => {
        throw new Error("unavailable");
      });
    click(button("UUID生成"));
    expect(values()).toEqual([]);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(crypto.getRandomValues).toHaveBeenCalledTimes(2);
  });

  it("clears errors and old output when v4 generation fails, then retries", () => {
    vi.mocked(crypto.randomUUID).mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    click(button("UUID生成"));
    expect(values()).toEqual([]);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    click(button("UUID生成"));
    expect(values()).toEqual([v4]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("rejects an invalid clock and recovers without drawing weak randomness", () => {
    choose(7);
    vi.mocked(Date.now).mockReturnValue(-1);
    click(button("UUID生成"));
    expect(values()).toEqual([]);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(crypto.getRandomValues).not.toHaveBeenCalled();
    vi.mocked(Date.now).mockReturnValue(1645557742000);
    click(button("UUID生成"));
    expect(values()).toHaveLength(1);
    expect(generatedVersion()).toContain("v7");
  });
});
