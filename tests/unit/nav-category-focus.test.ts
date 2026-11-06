// @vitest-environment jsdom

import { act, createElement, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Route } from "../../app/routes/__root";

vi.mock("@tanstack/react-router", async () => {
  const { createElement } = await import("react");
  return {
    createRootRoute: (options: unknown) => ({ options }),
    useRouterState: () => "/env-parser",
    HeadContent: () => null,
    Scripts: () => null,
    Outlet: () => createElement("textarea", { id: "tool-input", defaultValue: "KEEP=original" }),
    Link: ({ to, children, ...props }: ComponentProps<"a"> & { to: string }) =>
      createElement("a", { ...props, href: to }, children),
  };
});
vi.mock("../../app/components/Toast", () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../app/components/AdBanner", () => ({ AdBanner: () => null }));
vi.mock("../../app/components/SearchModal", () => ({ SearchModal: () => null }));

/** Flush synchronous DOM actions without returning dispatchEvent/timer results to React.act. */
function actSync(action: () => void) {
  act(() => {
    action();
  });
}

describe("global navigation focus ownership", () => {
  let root: Root;
  let mounted: boolean;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Unexpected fetch"))),
    );
    mounted = true;
    // React 18's runtime accepts Document roots; its installed Container type omits Document.
    // Keep the real root document hierarchy instead of nesting an <html> inside a test <div>.
    root = createRoot(document as unknown as Parameters<typeof createRoot>[0]);
    actSync(() => root.render(createElement(Route.options.component as () => ReactNode)));
  });
  afterEach(() => {
    if (mounted) actSync(() => root.unmount());
    vi.clearAllTimers();
    vi.useRealTimers();
    document.appendChild(document.createElement("html"));
    document.documentElement.appendChild(document.createElement("head"));
    document.documentElement.appendChild(document.createElement("body"));
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function category(name: string) {
    return [...document.querySelectorAll<HTMLDivElement>(".nav-category")].find(
      (element) =>
        element.querySelector(".nav-category-btn span:nth-child(2)")?.textContent === name,
    )!;
  }
  function button(name: string) {
    return category(name).querySelector<HTMLButtonElement>("button")!;
  }
  function links(name: string) {
    return category(name).querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
  }
  function enter(name: string) {
    actSync(() => category(name).dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
  }
  function leave(name: string) {
    actSync(() =>
      category(name).dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
      ),
    );
  }
  function press(target: HTMLElement, key: string, options: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    actSync(() => target.dispatchEvent(event));
    return event;
  }
  function focusInput() {
    const input = document.querySelector<HTMLTextAreaElement>("#tool-input")!;
    actSync(() => input.focus());
    input.setSelectionRange(2, 7);
    return input;
  }

  it.each(["カラー", "変換", "テキスト"])(
    "hover opens %s without taking the tool input focus",
    (name) => {
      const input = focusInput();
      enter(name);
      expect(button(name).getAttribute("aria-expanded")).toBe("true");
      expect(links(name).length).toBeGreaterThan(0);
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe("KEEP=original");
      expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each(["Enter", " ", "ArrowDown"])(
    "%j opens a closed menu and focuses its first actual link",
    (key) => {
      const trigger = button("カラー");
      actSync(() => trigger.focus());
      expect(press(trigger, key).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(links("カラー")[0]);
      expect(links("カラー")[0].getAttribute("href")).toBe("/color-picker");
    },
  );

  it("keeps Arrow, Home, End and Escape keyboard behavior", () => {
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    press(links("カラー")[0], "ArrowDown");
    expect(document.activeElement).toBe(links("カラー")[1]);
    press(links("カラー")[1], "End");
    expect(document.activeElement).toBe(links("カラー")[links("カラー").length - 1]);
    press(document.activeElement as HTMLElement, "Home");
    expect(document.activeElement).toBe(links("カラー")[0]);
    press(links("カラー")[0], "ArrowUp");
    expect(document.activeElement).toBe(links("カラー")[links("カラー").length - 1]);
    press(document.activeElement as HTMLElement, "Escape");
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("a hover on another category does not replace a keyboard-focused menu link", () => {
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    const current = links("カラー")[0];
    enter("変換");
    expect(button("変換").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(current);
  });

  it.each(["Enter", " ", "ArrowDown"])("%j activates an already hover-open trigger", (key) => {
    const trigger = button("カラー");
    enter("カラー");
    actSync(() => trigger.focus());
    expect(press(trigger, key).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(links("カラー")[0]);
  });

  it("repeated keyboard activation focuses first even when its selected index is unchanged", () => {
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    const first = links("カラー")[0];
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    expect(document.activeElement).toBe(first);
  });

  it("pointer leave and another hover do not unmount the keyboard-focused anchor", () => {
    vi.useFakeTimers();
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    const first = links("カラー")[0];
    leave("カラー");
    enter("変換");
    actSync(() => vi.advanceTimersByTime(200));
    expect(first.isConnected).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("keyboard activation cancels a pending hover-close timer", () => {
    vi.useFakeTimers();
    enter("カラー");
    const input = focusInput();
    leave("カラー");
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    actSync(() => vi.advanceTimersByTime(200));
    expect(document.activeElement).toBe(links("カラー")[0]);
    expect(input.value).toBe("KEEP=original");
  });

  it("repeated pointer leave and re-entry preserve input ownership and cancel stale timers", () => {
    vi.useFakeTimers();
    const input = focusInput();
    for (let i = 0; i < 3; i++) {
      enter("カラー");
      leave("カラー");
      actSync(() => vi.advanceTimersByTime(50));
      enter("カラー");
    }
    actSync(() => vi.advanceTimersByTime(200));
    expect(button("カラー").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("KEEP=original");
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
    leave("カラー");
    actSync(() => vi.advanceTimersByTime(200));
    expect(button("カラー").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(input);
  });

  it("explicit closed click opens/focuses, open click closes, and reopening resets selection", () => {
    const trigger = button("カラー");
    actSync(() => trigger.click());
    expect(document.activeElement).toBe(links("カラー")[0]);
    press(links("カラー")[0], "End");
    actSync(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    actSync(() => trigger.click());
    expect(document.activeElement).toBe(links("カラー")[0]);
  });

  it("clicking a hovered-open trigger closes without moving input focus", () => {
    const input = focusInput();
    enter("カラー");
    actSync(() => button("カラー").click());
    expect(button("カラー").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(input);
  });

  it("link activation closes and the next keyboard opening starts at the first item", () => {
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    press(links("カラー")[0], "ArrowDown");
    const second = links("カラー")[1];
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    second.addEventListener("click", (event) => event.preventDefault(), { once: true });
    actSync(() => second.dispatchEvent(click));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    expect(document.activeElement).toBe(links("カラー")[0]);
  });

  it("ArrowDown wraps from the last actual link to the first", () => {
    const trigger = button("カラー");
    actSync(() => trigger.focus());
    press(trigger, "ArrowDown");
    press(links("カラー")[0], "End");
    press(document.activeElement as HTMLElement, "ArrowDown");
    expect(document.activeElement).toBe(links("カラー")[0]);
  });

  it("clears the pending close timer when the document unmounts", () => {
    vi.useFakeTimers();
    enter("カラー");
    focusInput();
    leave("カラー");
    const pending = vi.spyOn(globalThis, "clearTimeout");
    actSync(() => root.unmount());
    mounted = false;
    expect(pending).toHaveBeenCalled();
  });

  it.each([false, true])(
    "Tab (shift=%j) keeps the active anchor mounted until native focus moves",
    (shiftKey) => {
      const trigger = button("カラー");
      actSync(() => trigger.focus());
      press(trigger, "ArrowDown");
      const current = links("カラー")[0];
      const event = press(current, "Tab", { shiftKey });
      expect(event.defaultPrevented).toBe(false);
      expect(current.isConnected).toBe(true);
      expect(document.activeElement).toBe(current);
      const destination = shiftKey ? trigger : button("検索");
      // jsdom has no native Tab traversal. Simulate only the ensuing blur/focus boundary.
      actSync(() => destination.focus());
      expect(document.activeElement).toBe(destination);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    },
  );

  it("ordinary pointer focus to the trigger preserves open-click-closes semantics", () => {
    const trigger = button("カラー");
    actSync(() => trigger.click());
    actSync(() => {
      trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      trigger.focus();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    actSync(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it.each(["keyup", "pointerdown", "mouseenter", "non-tab-key"])(
    "clears no-blur Tab intent at %s before a later trigger focus",
    (action) => {
      const trigger = button("カラー");
      actSync(() => trigger.click());
      const current = links("カラー")[0];
      press(current, "Tab");
      expect(current.isConnected).toBe(true);
      if (action === "keyup") {
        actSync(() =>
          current.dispatchEvent(new KeyboardEvent("keyup", { key: "Tab", bubbles: true })),
        );
      } else if (action === "pointerdown") {
        actSync(() => trigger.dispatchEvent(new Event("pointerdown", { bubbles: true })));
      } else if (action === "mouseenter") {
        enter("カラー");
      } else {
        press(current, "ArrowDown");
      }
      actSync(() => trigger.focus());
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      actSync(() => trigger.click());
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    },
  );

  it.each([{ ctrlKey: true }, { altKey: true }, { metaKey: true }])(
    "modified Tab does not arm menu exit: %j",
    (options) => {
      const trigger = button("カラー");
      actSync(() => trigger.click());
      expect(press(links("カラー")[0], "Tab", options).defaultPrevented).toBe(false);
      actSync(() => trigger.focus());
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    },
  );

  it("an already-cancelled Tab does not arm menu exit", () => {
    const trigger = button("カラー");
    actSync(() => trigger.click());
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    event.preventDefault();
    actSync(() => links("カラー")[0].dispatchEvent(event));
    actSync(() => trigger.focus());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("intent is consumed by an internal focus transition", () => {
    const trigger = button("カラー");
    actSync(() => trigger.click());
    press(links("カラー")[0], "Tab");
    actSync(() => links("カラー")[1].focus());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    actSync(() => trigger.focus());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("an explicit outside focus closes without returning focus to the trigger", () => {
    const trigger = button("カラー");
    actSync(() => trigger.click());
    const input = focusInput();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("KEEP=original");
  });
});
