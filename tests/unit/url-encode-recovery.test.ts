// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { changeControl } from "../helpers/change-control";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/url-encode";

// Mount the actual page without starting the full application router.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("URL conversion failure recovery", () => {
  let container: HTMLDivElement;
  let root: Root;
  let externalFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    externalFetch = vi.fn(() => {
      throw new Error("Unexpected external fetch in URL conversion fixture");
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

  const input = () => container.querySelector<HTMLTextAreaElement>("#inputText")!;
  const output = () => container.querySelector<HTMLTextAreaElement>("#outputText")!;
  function enter(value: string) {
    act(() => {
      input().value = value;
      changeControl(input());
    });
  }
  function click(mode: "encode" | "decode" | "clear") {
    const label = {
      encode: "入力テキストをURLエンコード",
      decode: "URLエンコードされた文字列をデコード",
      clear: "入力と出力をクリア",
    }[mode];
    act(() => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click());
  }
  function seed(mode: "encode" | "decode") {
    const text = "日本語 😀 e\u0301";
    enter(mode === "encode" ? text : encodeURIComponent(text));
    click(mode);
    expect(output().value).toBe(mode === "encode" ? encodeURIComponent(text) : text);
  }

  it.each([
    "\uD800",
    "\uDC00",
    "前\uD800後",
    "前\uDC00後",
    "\uD800後",
    "前\uD800",
    "\uDC00後",
    "前\uDC00",
  ])("clears previous encode output while preserving invalid UTF16 %j", (value) => {
    seed("encode");
    const node = input();
    enter(value);
    click("encode");
    expect(input()).toBe(node);
    expect(input().value).toBe(value);
    expect(output().value).toBe("");
    expect(container.querySelector(".toast-error")?.textContent).toContain(
      "エンコードに失敗しました",
    );
    enter("修正済み 👩‍💻");
    click("encode");
    expect(output().value).toBe(encodeURIComponent("修正済み 👩‍💻"));
  });

  it.each(["%ZZ", "%E3%81", "%"])(
    "clears previous decode output for %s and permits retry",
    (value) => {
      seed("decode");
      const node = input();
      enter(value);
      click("decode");
      expect(input()).toBe(node);
      expect(input().value).toBe(value);
      expect(output().value).toBe("");
      expect(container.querySelector(".toast-error")?.textContent).toContain(
        "無効なURLエンコード文字列です",
      );
      enter("new%20value");
      click("decode");
      expect(output().value).toBe("new value");
      expect(output().readOnly).toBe(true);
    },
  );

  it.each(["encode", "decode"] as const)(
    "clears old output and focuses empty input for %s",
    (mode) => {
      seed(mode);
      enter("");
      click(mode);
      expect(input().value).toBe("");
      expect(output().value).toBe("");
      expect(document.activeElement).toBe(input());
      expect(container.querySelector(".toast-error")?.textContent).toContain(
        "テキストを入力してください",
      );
    },
  );

  it("retains last success during manual editing until a conversion is attempted", () => {
    seed("encode");
    const previous = output().value;
    enter("editing a new value");
    expect(output().value).toBe(previous);
    click("encode");
    expect(output().value).toBe("editing%20a%20new%20value");
  });

  it.each(["ctrlKey", "metaKey"] as const)(
    "uses the existing %s Enter path for error and repair",
    (modifier) => {
      seed("encode");
      enter("\uD800");
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
        [modifier]: true,
      });
      act(() => {
        input().dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(true);
      expect(input().value).toBe("\uD800");
      expect(output().value).toBe("");
      enter("repaired value");
      act(() => {
        input().dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true,
            [modifier]: true,
          }),
        );
      });
      expect(output().value).toBe("repaired%20value");
    },
  );

  it("keeps Clear available after failure and restores input focus", () => {
    seed("decode");
    enter("%ZZ");
    click("decode");
    click("clear");
    expect(input().value).toBe("");
    expect(output().value).toBe("");
    expect(document.activeElement).toBe(input());
  });
});
