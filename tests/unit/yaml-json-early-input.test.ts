// @vitest-environment jsdom

import { act, createElement, StrictMode, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Simulate } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/yaml-json";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

/** Cover native edits before handler installation through the real route and Toast provider. */
describe("YAML input across server rendering and hydration", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;
  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
  });

  async function hydrate(early: string, strict = false, firstAction?: "convert" | "clear") {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const route = createElement(Route.options.component as () => ReactNode);
    const app = createElement(ToastProvider, null, route);
    const element = strict ? createElement(StrictMode, null, app) : app;
    container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(element);
    const ssrInput = input();
    expect(ssrInput.value).toBe("");
    // No React onChange is installed yet. Use the real DOM value and a native input event.
    ssrInput.value = early;
    ssrInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    expect(ssrInput.value).toBe(early);
    await act(async () => {
      root = hydrateRoot(container, element);
      if (firstAction) {
        const selector = firstAction === "convert" ? "button.btn-primary" : "button.btn-clear";
        container.querySelector<HTMLButtonElement>(selector)!.click();
      }
    });
    expect(input()).toBe(ssrInput);
    expect(input().value).toBe(firstAction === "clear" ? "" : early);
    expect(document.activeElement).toBe(ssrInput);
  }
  function input() {
    return container.querySelector<HTMLTextAreaElement>("#inputText")!;
  }
  function output() {
    return container.querySelector<HTMLTextAreaElement>("#outputText")!;
  }
  function convert() {
    act(() => {
      container.querySelector<HTMLButtonElement>("button.btn-primary")!.click();
    });
  }
  function select(name: string, value: string) {
    act(() => {
      Simulate.change(
        container.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!,
      );
    });
  }
  function edit(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  it.each([false, true])(
    "converts the exact early input on first attempt (StrictMode %s)",
    async (strict) => {
      const early = "name: 早い入力😀\ncount: 7\nempty: ''\nquoted: '001'";
      await hydrate(early, strict);
      convert();
      expect(input().value).toBe(early);
      expect(container.querySelector("#input-error")).toBeNull();
      expect(output().value).toBe(
        JSON.stringify({ name: "早い入力😀", count: 7, empty: "", quoted: "001" }, null, 2),
      );
    },
  );

  it.each([false, true])(
    "handles first Convert when the click itself forces hydration (StrictMode %s)",
    async (strict) => {
      await hydrate("name: first-action", strict, "convert");
      expect(container.querySelector("#input-error")).toBeNull();
      expect(output().value).toBe('{\n  "name": "first-action"\n}');
    },
  );

  it.each([false, true])(
    "honors first Clear without restoring adopted input (StrictMode %s)",
    async (strict) => {
      await hydrate("name: discard-me", strict, "clear");
      expect(container.querySelector('[role="status"]')?.textContent).toBe(
        "入力と出力をクリアしました",
      );
      expect(input().value).toBe("");
      expect(output().value).toBe("");
      convert();
      expect(container.querySelector("#input-error-detail")?.textContent).toBe(
        "テキストを入力してください",
      );
      expect(input().value).toBe("");
    },
  );

  it("retains early input across an option-triggered controlled rerender before Convert", async () => {
    const early = "user:\n  name: 残る入力";
    await hydrate(early);
    select("indent", "4");
    expect(input().value).toBe(early);
    convert();
    expect(output().value).toBe(JSON.stringify({ user: { name: "残る入力" } }, null, 4));
  });

  it("uses later editing, repeated conversion and Clear without resurrecting early input", async () => {
    await hydrate("name: old");
    edit("name: latest");
    convert();
    expect(output().value).toBe('{\n  "name": "latest"\n}');
    convert();
    expect(output().value).toBe('{\n  "name": "latest"\n}');
    act(() => {
      container.querySelector<HTMLButtonElement>("button.btn-clear")!.click();
    });
    expect(input().value).toBe("");
    expect(output().value).toBe("");
    convert();
    expect(container.querySelector("#input-error-detail")?.textContent).toBe(
      "テキストを入力してください",
    );
    edit("name: after-clear");
    convert();
    expect(output().value).toBe('{\n  "name": "after-clear"\n}');
  });

  it("honors the intentional mode reset and then converts new JSON", async () => {
    await hydrate("name: early");
    select("mode", "json-to-yaml");
    expect(input().value).toBe("");
    edit('{"name":"new JSON"}');
    convert();
    expect(output().value).toBe("name: new JSON\n");
    select("mode", "yaml-to-json");
    expect(input().value).toBe("");
    expect(output().value).toBe("");
  });

  it.each([
    ["", "テキストを入力してください"],
    [" \n\t ", "テキストを入力してください"],
    ["name: [", "flow"],
    ["# only a comment", "YAMLデータが空です"],
  ])("preserves early invalid input %j and allows repair", async (early, message) => {
    await hydrate(early);
    convert();
    expect(input().value).toBe(early);
    expect(output().value).toBe("");
    expect(container.querySelector("#input-error-detail")?.textContent).toContain(message);
    edit("name: repaired");
    convert();
    expect(container.querySelector("#input-error")).toBeNull();
    expect(output().value).toBe('{\n  "name": "repaired"\n}');
  });
});
