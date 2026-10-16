// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/json-to-zod";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("JSON→Zod special member names in the actual component", () => {
  let container: HTMLDivElement;
  let root: Root;
  let externalFetch: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    externalFetch = vi.fn(() => {
      throw new Error("Unexpected external fetch in JSON→Zod fixture");
    });
    vi.stubGlobal("fetch", externalFetch);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    writeText = vi.fn().mockResolvedValue(undefined);
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
    if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
    expect(externalFetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  const input = () => container.querySelector<HTMLTextAreaElement>("#jsonInput")!;
  const output = () =>
    container.querySelector('[role="region"][aria-label="生成されたZodスキーマ"]')!;
  const error = () => container.querySelector('.error-message[role="alert"]');
  const button = (label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const copy = () => button("生成されたZodスキーマをクリップボードにコピーする");

  function enter(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  function generate() {
    act(() => button("Zodスキーマを生成する").click());
  }

  it("preserves input, renders literal key code, and copies exactly the displayed schema", async () => {
    const json = '{"first-name":"A","quote\\\"key":1,"__proto__":true}';
    enter(json);
    generate();
    const source = output().textContent;
    expect(input().value).toBe(json);
    expect(source).toContain('"first-name": z.string()');
    expect(source).toContain('"quote\\\"key": z.number()');
    expect(source).toContain('["__proto__"]: z.boolean()');
    expect(copy().disabled).toBe(false);
    await act(async () => copy().click());
    expect(writeText).toHaveBeenCalledExactlyOnceWith(source);
    expect(error()).toBeNull();
  });

  it("replaces prior output on repeated generation and supports existing options", () => {
    enter('{"old-name":1}');
    generate();
    expect(output().textContent).toContain('"old-name"');
    const checks = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    act(() => {
      checks[0].checked = false;
      Simulate.change(checks[0]);
      checks[1].checked = true;
      Simulate.change(checks[1]);
      checks[2].checked = true;
      Simulate.change(checks[2]);
    });
    enter('{"rows":[{"line\\nbreak":null}]}');
    generate();
    expect(output().textContent).not.toContain('"old-name"');
    expect(output().textContent).not.toContain("import");
    expect(output().textContent).toContain('"line\\nbreak": z.unknown().nullable().optional()');
    expect(output().textContent).toContain("z.array(z.object(");
    generate();
    expect(error()).toBeNull();
  });

  it("clears invalid output, disables copy, and recovers using a literal member name", () => {
    enter('{"valid":1}');
    generate();
    enter("{invalid");
    generate();
    expect(error()?.textContent).toContain("無効なJSON形式です");
    expect(output().textContent).not.toContain("export const");
    expect(copy().disabled).toBe(true);
    expect(input().value).toBe("{invalid");
    enter('{"first-name":"fixed"}');
    generate();
    expect(error()).toBeNull();
    expect(output().textContent).toContain('"first-name": z.string()');
    expect(copy().disabled).toBe(false);
    act(() => button("入力と結果をクリアする").click());
    expect(input().value).toBe("");
    expect(copy().disabled).toBe(true);
  });
});
