// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { Route } from "../../app/routes/markdown-table";

const { copy } = vi.hoisted(() => ({ copy: vi.fn(async () => true) }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("../../app/components/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("../../app/hooks/useClipboard", () => ({ useClipboard: () => ({ copy }) }));
const Page = (Route as unknown as { component: ComponentType }).component;
let container: HTMLDivElement;
let root: Root;
const input = () =>
  container.querySelector<HTMLTextAreaElement>('[aria-label="CSVインポート入力"]')!;
const output = () => container.querySelector<HTMLTextAreaElement>("#markdown-table-output")!;
const button = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
    element.value = value;
    Simulate.change(element);
  });
}
function click(label: string) {
  act(() => button(label).click());
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  copy.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(createElement(Page)));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
describe("Markdown table CSV import", () => {
  it("preserves quoted commas and escaped quotes through editing and copying", async () => {
    fill(input(), '"A,B",C\n"x,""y""",z');
    click("CSVをインポートしてテーブルに反映");
    const header = container.querySelector<HTMLInputElement>("input#markdown-table-header-0")!;
    const cell = container.querySelector<HTMLInputElement>('input[aria-label="行1列1"]')!;
    expect(header.value).toBe("A,B");
    expect(cell.value).toBe('x,"y"');
    expect(output().value).toContain('x,"y"');
    expect(output().value.split("\n")).toHaveLength(3);
    fill(cell, cell.value + "編集");
    fill(header, header.value + "列");
    expect(output().value).toContain('x,"y"編集');
    expect(output().value).toContain("A,B列");
    await act(async () => button("Markdownをクリップボードにコピー").click());
    expect(copy).toHaveBeenLastCalledWith(output().value);
    expect(input().value).toBe("");
  });

  it("keeps CSV header/body tabs and pads missing cells in the existing single-line editor", () => {
    fill(input(), '"A\tB",C,D\n"x\ty",z');
    click("CSVをインポートしてテーブルに反映");
    expect(container.querySelector<HTMLInputElement>("#markdown-table-header-0")?.value).toBe(
      "A\tB",
    );
    expect(container.querySelector<HTMLInputElement>('[aria-label="行1列1"]')?.value).toBe("x\ty");
    expect(container.querySelector<HTMLInputElement>('[aria-label="行1列3"]')?.value).toBe("");
    expect(output().value).toContain("x\ty");
    expect(input().value).toBe("");
  });

  it.each([
    ['A,B\n1,"open', "レコード 2"],
    ["A,B\n1,2,3", "レコード 2"],
    ['A\tB\n"x\ny"\tz', "レコード 2"],
    ['\t\nA,B\n1,"open', "レコード 2"],
    ['A,B\nx,"前\n後"', "レコード 2"],
    ['"A\nB",C\nx,y', "レコード 1"],
    ['A,B\nx,"a\\|b"', "レコード 2"],
    ['"A\\|B",C\nx,y', "レコード 1"],
  ])("keeps the previous table and invalid source, then recovers: %j", (source, position) => {
    fill(input(), "A,B\nold,value");
    click("CSVをインポートしてテーブルに反映");
    const previous = output().value;
    fill(input(), source);
    click("CSVをインポートしてテーブルに反映");
    click("CSVをインポートしてテーブルに反映");
    expect(input().value).toBe(source);
    expect(output().value).toBe(previous);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(position);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    const description = document.getElementById(input().getAttribute("aria-describedby")!);
    expect(description?.textContent).toContain(position);
    fill(input(), 'A,B\n"fixed,ok",value');
    click("CSVをインポートしてテーブルに反映");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(output().value).toContain("fixed,ok");
    expect(input().getAttribute("aria-invalid")).toBeNull();
  });

  it("clears import errors with the import clear button and table reset", () => {
    for (const label of ["CSVインポート入力をクリア", "テーブルをリセット"]) {
      fill(input(), 'A\n"open');
      click("CSVをインポートしてテーブルに反映");
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      click(label);
      expect(container.querySelector('[role="alert"]')).toBeNull();
    }
  });
});
