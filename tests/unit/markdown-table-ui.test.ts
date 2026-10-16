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
function fill(element: HTMLTextAreaElement, value: string) {
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
  it("preserves multiline headers and cells through editing and copying", async () => {
    fill(input(), '"A\nB",C\n"x,\n""y""",z');
    click("CSVをインポートしてテーブルに反映");
    const header = container.querySelector<HTMLTextAreaElement>(
      "textarea#markdown-table-header-0",
    )!;
    const cell = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="行1列1"]')!;
    expect(header.value).toBe("A\nB");
    expect(cell.value).toBe('x,\n"y"');
    expect(output().value).toContain('x,<br>"y"');
    expect(output().value.split("\n")).toHaveLength(3);
    fill(cell, cell.value + "\n編集");
    fill(header, header.value + "\n列");
    expect(output().value).toContain('x,<br>"y"<br>編集');
    expect(output().value).toContain("A<br>B<br>列");
    await act(async () => button("Markdownをクリップボードにコピー").click());
    expect(copy).toHaveBeenLastCalledWith(output().value);
    expect(input().value).toBe("");
  });

  it.each(['A,B\n1,"open', "A,B\n1,2,3", 'A\tB\n"x\ny"\tz', '\t\nA,B\n1,"open'])(
    "keeps the previous table and invalid source, then recovers: %j",
    (source) => {
      fill(input(), "A,B\nold,value");
      click("CSVをインポートしてテーブルに反映");
      const previous = output().value;
      fill(input(), source);
      click("CSVをインポートしてテーブルに反映");
      click("CSVをインポートしてテーブルに反映");
      expect(input().value).toBe(source);
      expect(output().value).toBe(previous);
      expect(container.querySelector('[role="alert"]')?.textContent).toContain("レコード 2");
      expect(input().getAttribute("aria-invalid")).toBe("true");
      const description = document.getElementById(input().getAttribute("aria-describedby")!);
      expect(description?.textContent).toContain("レコード 2");
      fill(input(), 'A,B\n"fixed,ok",value');
      click("CSVをインポートしてテーブルに反映");
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(output().value).toContain("fixed,ok");
      expect(input().getAttribute("aria-invalid")).toBeNull();
    },
  );

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
