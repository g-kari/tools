// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/ipv6";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("IPv6混在表記の実コンポーネント", () => {
  let container: HTMLDivElement;
  let root: Root;
  let externalFetch: ReturnType<typeof vi.fn>;
  const expanded = "2001:0db8:0000:0000:0000:0000:c000:0201";

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    externalFetch = vi.fn(() => {
      throw new Error("Unexpected external fetch in IPv6 fixture");
    });
    vi.stubGlobal("fetch", externalFetch);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        createElement(ToastProvider, null, createElement(Route.options.component as ComponentType)),
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    expect(externalFetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  const input = () => container.querySelector<HTMLInputElement>("#ipv6-input")!;
  const result = () => container.querySelector('section[aria-label="解析結果"]');
  function enter(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  it.each(["2001:db8::192.0.2.1", "2001:db8::c000:201"])(
    "%s の変換値とコピー操作を表示する",
    (value) => {
      enter(value);
      expect(input().getAttribute("aria-invalid")).toBe("false");
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(result()?.textContent).toContain(expanded);
      expect(result()?.textContent).toContain("2001:db8::c000:201");
      expect(result()?.querySelectorAll('[role="listitem"]')).toHaveLength(8);
      expect(result()?.querySelector('button[aria-label="展開形式をコピー"]')).not.toBeNull();
    },
  );

  it.each(["2001:db8:::192.0.2.1", "1:2:3:4:5:6::192.0.2.1"])(
    "成功後の不正入力 %s で旧結果を消し修復できる",
    (value) => {
      enter("2001:db8::192.0.2.1");
      expect(result()?.textContent).toContain(expanded);
      const node = input();
      enter(value);
      expect(input()).toBe(node);
      expect(input().value).toBe(value);
      expect(input().getAttribute("aria-invalid")).toBe("true");
      expect(input().getAttribute("aria-describedby")).toBe("ipv6-error");
      expect(container.querySelector('[role="alert"]')?.textContent).not.toBe("");
      expect(result()).toBeNull();
      expect(container.querySelector('button[aria-label="展開形式をコピー"]')).toBeNull();

      enter("::192.0.2.1");
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(input().getAttribute("aria-invalid")).toBe("false");
      expect(result()?.textContent).toContain("0000:0000:0000:0000:0000:0000:c000:0201");
      act(() =>
        container.querySelector<HTMLButtonElement>('button[aria-label="入力をクリア"]')!.click(),
      );
      expect(input().value).toBe("");
      expect(result()).toBeNull();
    },
  );
});
