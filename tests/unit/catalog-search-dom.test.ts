// @vitest-environment jsdom

import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Route } from "../../app/routes/top";
import { SearchModal } from "../../app/components/SearchModal";

vi.mock("@tanstack/react-router", async () => {
  const { createElement } = await import("react");
  return {
    createFileRoute: () => (options: unknown) => ({ options }),
    Link: ({ to, children, ...props }: ComponentProps<"a"> & { to: string }) =>
      createElement("a", { ...props, href: to }, children),
  };
});

describe("catalog search interaction", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Unexpected fetch"))),
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function type(input: HTMLInputElement, value: string) {
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it.each(["JSON 圧縮", "xyz-absent"])(
    "clearing %s returns focus to the live catalog input",
    (query) => {
      act(() => root.render(createElement(Route.options.component!)));
      const input = container.querySelector<HTMLInputElement>("#tool-search")!;
      const initialCount = container.querySelectorAll(".top-tool-card").length;
      type(input, query);
      const clears = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).filter(
        (button) =>
          button.getAttribute("aria-label") === "検索をクリア" ||
          button.textContent === "検索をクリア",
      );
      const clear = clears.at(-1)!;
      clear.focus();
      act(() => clear.click());
      expect(input.value).toBe("");
      expect(document.activeElement).toBe(input);
      expect(container.querySelectorAll(".top-tool-card").length).toBe(initialCount);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    { key: "Enter", isComposing: true },
    { key: "ArrowDown", isComposing: true },
    { key: "Escape", isComposing: true },
    { key: "Enter", keyCode: 229 },
  ])("IME event %j does not select, navigate or close", (eventOptions) => {
    const close = vi.fn();
    act(() => root.render(createElement(SearchModal, { isOpen: true, onClose: close })));
    const input = document.querySelector<HTMLInputElement>(".search-modal-input")!;
    type(input, "JSON 圧縮");
    const selected = input.getAttribute("aria-activedescendant");
    const click = vi.fn();
    document.querySelector('[role="dialog"]')!.addEventListener("click", click);
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      ...eventOptions,
    });
    act(() => {
      input.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe(selected);
    expect(click).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ordinary Enter still activates the current result", () => {
    const close = vi.fn();
    act(() => root.render(createElement(SearchModal, { isOpen: true, onClose: close })));
    const input = document.querySelector<HTMLInputElement>(".search-modal-input")!;
    type(input, "変換 /url-encode");
    let path = "";
    document.querySelector('[role="dialog"]')!.addEventListener("click", (event) => {
      event.preventDefault();
      path = (event.target as HTMLAnchorElement).getAttribute("href") ?? "";
    });
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    act(() => {
      input.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(path).toBe("/url-encode");
    expect(close).toHaveBeenCalledOnce();
  });
});
