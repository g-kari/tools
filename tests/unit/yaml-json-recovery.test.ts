// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { changeControl } from "../helpers/change-control";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/yaml-json";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("YAML/JSON conversion recovery", () => {
  let container: HTMLDivElement;
  let root: Root;
  let writeText: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    writeText = vi.fn().mockResolvedValue(undefined);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
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
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    vi.unstubAllGlobals();
  });

  const input = () => container.querySelector<HTMLTextAreaElement>("#inputText")!;
  const output = () => container.querySelector<HTMLTextAreaElement>("#outputText")!;
  const copy = () =>
    container.querySelector<HTMLButtonElement>(
      'button[aria-label="出力結果をクリップボードにコピー"]',
    )!;
  const error = () => container.querySelector<HTMLElement>('[role="alert"][id="input-error"]');

  function enter(value: string) {
    act(() => {
      input().value = value;
      changeControl(input());
    });
  }

  function convert() {
    act(() => container.querySelector<HTMLButtonElement>("button.btn-primary")!.click());
  }

  function select(name: "mode" | "indent", value: string) {
    act(() => {
      const radio = container.querySelector<HTMLInputElement>(
        `input[name="${name}"][value="${value}"]`,
      )!;
      changeControl(radio);
    });
  }

  function seed(mode: "yaml-to-json" | "json-to-yaml") {
    if (mode === "json-to-yaml") select("mode", mode);
    enter(mode === "yaml-to-json" ? "name: 田中\nage: 30" : '{"name":"田中","age":30}');
    convert();
    expect(output().value).toContain("田中");
    expect(copy().disabled).toBe(false);
  }

  it.each([
    ["yaml-to-json", "name: [", "flow"],
    ["json-to-yaml", '{"name":', "無効なJSON形式です"],
    ["yaml-to-json", "", "テキストを入力してください"],
    ["json-to-yaml", "", "テキストを入力してください"],
    ["yaml-to-json", " \n\t ", "テキストを入力してください"],
    ["json-to-yaml", " \n\t ", "テキストを入力してください"],
    ["yaml-to-json", "# comment only", "YAMLデータが空です"],
    ["yaml-to-json", "null", "YAMLデータが空です"],
    ["yaml-to-json", "~", "YAMLデータが空です"],
    ["yaml-to-json", "[&1 {self: *1}, *1]", "circular"],
  ] as const)("clears stale output for %s %j and permits repair", async (mode, value, reason) => {
    seed(mode);
    const inputNode = input();
    enter(value);
    convert();
    expect(output().value).toBe("");
    expect(copy().disabled).toBe(true);
    expect(input()).toBe(inputNode);
    expect(input().value).toBe(value);
    expect(document.activeElement).toBe(input());
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().getAttribute("aria-describedby")?.split(" ")).toEqual([
      "input-help",
      "input-error-summary",
      "input-error-detail",
    ]);
    expect(container.querySelector("#input-error-summary")?.textContent).toContain(
      "入力を確認して再度変換してください",
    );
    expect(container.querySelector("#input-error-detail")?.textContent).toContain(reason);
    expect(error()?.textContent).toContain(reason);
    expect(container.querySelector(".toast-error")?.textContent).toContain(reason);
    expect(container.querySelector('[role="status"]')?.textContent).toContain(reason);
    await act(async () => copy().click());
    expect(writeText).not.toHaveBeenCalled();

    enter(mode === "yaml-to-json" ? "name: 修復済み" : '{"name":"修復済み"}');
    convert();
    expect(output().value).toContain("修復済み");
    expect(output().readOnly).toBe(true);
    expect(error()).toBeNull();
    expect(input().getAttribute("aria-invalid")).not.toBe("true");
    expect(input().getAttribute("aria-describedby")).toBe("input-help");
    expect(copy().disabled).toBe(false);
    await act(async () => copy().click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith(output().value);
  });

  it("retains the last success during editing and indent selection until conversion", () => {
    seed("yaml-to-json");
    const previous = output().value;
    enter("user:\n  name: changed");
    select("indent", "4");
    expect(output().value).toBe(previous);
    convert();
    expect(output().value).toBe('{\n    "user": {\n        "name": "changed"\n    }\n}');
    enter("name: [");
    convert();
    select("indent", "2");
    expect(output().value).toBe("");
    expect(copy().disabled).toBe(true);
    enter("user:\n  name: repaired");
    convert();
    expect(output().value).toBe('{\n  "user": {\n    "name": "repaired"\n  }\n}');
  });

  it("clears error/output on mode changes and Clear, then converts again", () => {
    seed("yaml-to-json");
    select("mode", "json-to-yaml");
    expect(input().value).toBe("");
    expect(output().value).toBe("");
    expect(copy().disabled).toBe(true);
    enter("{");
    convert();
    expect(error()).not.toBeNull();
    select("mode", "yaml-to-json");
    expect(error()).toBeNull();
    expect(input().value).toBe("");
    expect(copy().disabled).toBe(true);
    enter("name: [");
    convert();
    act(() => container.querySelector<HTMLButtonElement>("button.btn-clear")!.click());
    expect(input().value).toBe("");
    expect(output().value).toBe("");
    expect(error()).toBeNull();
    expect(document.activeElement).toBe(input());
    seed("yaml-to-json");
  });

  it.each([
    ["yaml-to-json", "false", "false"],
    ["yaml-to-json", "0", "0"],
    ["yaml-to-json", '""', '""'],
    ["json-to-yaml", "false", "false\n"],
    ["json-to-yaml", "0", "0\n"],
    ["json-to-yaml", '""', "''\n"],
    ["json-to-yaml", "null", "null\n"],
  ] as const)("keeps scalar success/copy contract for %s %s", async (mode, value, result) => {
    if (mode === "json-to-yaml") select("mode", mode);
    enter(value);
    convert();
    expect(output().value).toBe(result);
    expect(error()).toBeNull();
    expect(copy().disabled).toBe(false);
    await act(async () => copy().click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("copies the repaired result after copying a previous success", async () => {
    seed("yaml-to-json");
    await act(async () => copy().click());
    expect(copy().textContent).toBe("コピー済");
    enter("name: [");
    convert();
    expect(copy().textContent).toBe("コピー");
    enter("name: new");
    convert();
    await act(async () => copy().click());
    expect(copy().textContent).toBe("コピー済");
    expect(writeText).toHaveBeenLastCalledWith(output().value);
    expect(writeText).toHaveBeenCalledTimes(2);
  });
});
