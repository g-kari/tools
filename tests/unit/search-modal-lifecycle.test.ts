// @vitest-environment jsdom

import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { SearchModal } from "../../app/components/SearchModal";

vi.mock("@tanstack/react-router", async () => {
  const { createElement } = await import("react");
  return {
    createFileRoute: () => (options: unknown) => ({ options }),
    Link: ({ to, children, ...props }: ComponentProps<"a"> & { to: string }) =>
      createElement("a", { ...props, href: to }, children),
  };
});

describe("search dialog focus lifecycle", () => {
  let container: HTMLDivElement;
  let background: HTMLDivElement;
  let invoker: HTMLInputElement;
  let fallback: HTMLButtonElement;
  let root: Root;
  let key: string;
  let close: () => void;

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
    background = document.createElement("div");
    invoker = document.createElement("input");
    fallback = document.createElement("button");
    background.appendChild(invoker);
    background.appendChild(fallback);
    container = document.createElement("div");
    document.body.appendChild(background);
    document.body.appendChild(container);
    root = createRoot(container);
    key = "/top";
    close = vi.fn(() => render(false));
    invoker.focus();
  });

  afterEach(() => {
    act(() => root.unmount());
    background.remove();
    container.remove();
    document.body.style.removeProperty("overflow");
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function render(isOpen = true) {
    act(() => {
      root.render(
        createElement(SearchModal, {
          isOpen,
          onClose: () => close(),
          locationKey: key,
          returnFocusRef: { current: fallback },
        }),
      );
    });
  }
  function input() {
    return document.querySelector<HTMLInputElement>(".search-modal-input")!;
  }
  function type(value: string) {
    act(() => {
      const element = input();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        element,
        value,
      );
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  function press(element: HTMLElement, key: string, shiftKey = false) {
    const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
    act(() => {
      element.dispatchEvent(event);
    });
    return event;
  }

  it("focuses search and restores the invoker without changing its value or selection", () => {
    invoker.value = "retain input";
    invoker.setSelectionRange(2, 7);
    render();
    expect(document.activeElement).toBe(input());
    expect(background.hasAttribute("inert")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(press(input(), "Escape").defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(invoker);
    expect(invoker.value).toBe("retain input");
    expect([invoker.selectionStart, invoker.selectionEnd]).toEqual([2, 7]);
    expect(background.hasAttribute("inert")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cycles both boundaries and recomputes tab stops after results disappear", () => {
    render();
    const links = document.querySelectorAll<HTMLAnchorElement>(".search-result-item");
    expect(links.length).toBe(8);
    expect(press(input(), "Tab", true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(links[7]);
    expect(press(links[7], "Tab").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input());
    // A fresh query removes all links but keeps clear and close controls.
    type("xyz-absent JSON");
    const dismiss = document.querySelector<HTMLButtonElement>(".search-modal-close")!;
    expect(document.querySelectorAll(".search-result-item").length).toBe(0);
    press(input(), "Tab", true);
    expect(document.activeElement).toBe(dismiss);
    press(dismiss, "Tab");
    expect(document.activeElement).toBe(input());
  });

  it.each([
    ".search-modal-input",
    ".search-modal-clear",
    ".search-modal-close",
    ".search-result-item",
  ])("Escape dismisses from %s", (selector) => {
    render();
    type("JSON");
    const target = document.querySelector<HTMLElement>(selector)!;
    act(() => target.focus());
    press(target, "Escape");
    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(invoker);
  });

  it("guards unexpected focus outside the dialog and handles Escape at document level", () => {
    render();
    act(() => invoker.focus());
    expect(document.activeElement).toBe(input());
    press(document.body, "Escape");
    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(invoker);
  });

  it("does not hijack clear-button or focused-link Enter", () => {
    render();
    type("JSON");
    const click = vi.fn((event: Event) => event.preventDefault());
    const links = document.querySelectorAll<HTMLAnchorElement>(".search-result-item");
    for (const link of links) link.addEventListener("click", click);
    const clear = document.querySelector<HTMLButtonElement>(".search-modal-clear")!;
    act(() => clear.focus());
    expect(press(clear, "Enter").defaultPrevented).toBe(false);
    expect(click).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    act(() => links[1].focus());
    expect(input().getAttribute("aria-activedescendant")).toBe("search-result-1");
    expect(press(links[1], "Enter").defaultPrevented).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it("does not replace the invoker or clear the query when callbacks rerender", () => {
    render();
    type("JSON 圧縮");
    render();
    expect(input().value).toBe("JSON 圧縮");
    press(input(), "Escape");
    expect(document.activeElement).toBe(invoker);
    render();
    expect(input().value).toBe("");
    press(input(), "Escape");
    expect(close).toHaveBeenCalledTimes(2);
  });

  it.each(["removed", "disabled", "hidden", "body"])(
    "uses the fallback for a %s invoker",
    (state) => {
      if (state === "body") invoker.blur();
      render();
      if (state === "removed") invoker.remove();
      if (state === "disabled") invoker.disabled = true;
      if (state === "hidden") invoker.hidden = true;
      press(input(), "Escape");
      expect(document.activeElement).toBe(fallback);
    },
  );

  it("preserves existing inert and scroll state, including newly added body siblings", async () => {
    const retained = document.createElement("div");
    retained.setAttribute("inert", "retained");
    document.body.appendChild(retained);
    document.body.style.setProperty("overflow", "scroll", "important");
    render();
    const added = document.createElement("div");
    await act(async () => {
      document.body.appendChild(added);
      await Promise.resolve();
    });
    expect(added.hasAttribute("inert")).toBe(true);
    press(input(), "Escape");
    expect(retained.getAttribute("inert")).toBe("retained");
    expect(added.hasAttribute("inert")).toBe(false);
    expect(document.body.style.getPropertyValue("overflow")).toBe("scroll");
    expect(document.body.style.getPropertyPriority("overflow")).toBe("important");
    retained.remove();
    added.remove();
  });

  it("uses the fallback when an invoker's ancestor becomes hidden", () => {
    const wrapper = document.createElement("div");
    background.appendChild(wrapper);
    wrapper.appendChild(invoker);
    invoker.focus();
    render();
    wrapper.style.display = "none";
    press(input(), "Escape");
    expect(document.activeElement).toBe(fallback);
  });

  it("uses the fallback when the invoker loses programmatic focusability", () => {
    const target = document.createElement("div");
    target.tabIndex = -1;
    background.appendChild(target);
    target.focus();
    render();
    target.removeAttribute("tabindex");
    press(input(), "Escape");
    expect(document.activeElement).toBe(fallback);
  });

  it("does not restore old focus after ordinary result navigation or route changes", () => {
    render();
    type("変換 /url-encode");
    const link = document.querySelector<HTMLAnchorElement>(".search-result-item")!;
    link.addEventListener("click", (event) => event.preventDefault());
    act(() => link.click());
    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement).not.toBe(invoker);
    invoker.focus();
    render();
    key = "/different-tool";
    render();
    expect(close).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).not.toBe(invoker);
  });

  it("isolates modal keys from background global handlers without blocking native defaults", () => {
    const globalKey = vi.fn((event: KeyboardEvent) => event.preventDefault());
    document.addEventListener("keydown", globalKey);
    window.addEventListener("keydown", globalKey);
    try {
      render();
      type("JSON");
      for (const key of ["f", " "]) expect(press(input(), key).defaultPrevented).toBe(false);
      press(input(), "ArrowDown");
      expect(input().getAttribute("aria-activedescendant")).toBe("search-result-1");
      const clear = document.querySelector<HTMLButtonElement>(".search-modal-clear")!;
      expect(press(clear, "Enter").defaultPrevented).toBe(false);
      const composing = new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        input().dispatchEvent(composing);
      });
      expect(composing.defaultPrevented).toBe(false);
      expect(globalKey).not.toHaveBeenCalled();
      const toggle = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        input().dispatchEvent(toggle);
      });
      expect(toggle.defaultPrevented).toBe(true);
      expect(close).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(invoker);
      expect(globalKey).not.toHaveBeenCalled();
      press(invoker, "f");
      expect(globalKey).toHaveBeenCalledTimes(2);
    } finally {
      document.removeEventListener("keydown", globalKey);
      window.removeEventListener("keydown", globalKey);
    }
  });

  it("removes listeners on dismissal and does not move focus later", async () => {
    render();
    press(input(), "Escape");
    fallback.focus();
    await act(async () => Promise.resolve());
    expect(document.activeElement).toBe(fallback);
    expect(press(fallback, "Escape").defaultPrevented).toBe(false);
    expect(close).toHaveBeenCalledOnce();
  });
});
