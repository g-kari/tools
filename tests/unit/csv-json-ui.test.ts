// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/csv-json";

describe("CSV/JSON変換のフォーム操作", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Component = Route.options.component!;
    act(() => {
      root.render(createElement(ToastProvider, { children: createElement(Component) }));
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  /** 実際にマウントしたフォームの要素を取得する。 */
  function element<T extends Element>(selector: string): T {
    const found = container.querySelector<T>(selector);
    if (!found) throw new Error(`要素が見つかりません: ${selector}`);
    return found;
  }

  /** Reactの入力イベントで変換元テキストを変更する。 */
  function setInput(value: string): void {
    act(() => {
      const input = element<HTMLTextAreaElement>("#inputText");
      input.value = value;
      Simulate.change(input);
    });
  }

  /** 実際のクリックハンドラーで変換を実行する。 */
  function convert(): void {
    act(() => element<HTMLButtonElement>("button.btn-primary").click());
  }

  it("複数行を変換し、不正な引用符の後に以前の出力を消して修正後の再変換ができる", () => {
    setInput('name,note\n 田中 ,"前\n\n""後"""');
    convert();
    const output = element<HTMLTextAreaElement>("#outputText");
    const copy = element<HTMLButtonElement>(
      'button[aria-label="出力結果をクリップボードにコピー"]',
    );
    expect(JSON.parse(output.value)).toEqual([{ name: " 田中 ", note: '前\n\n"後"' }]);
    expect(copy.disabled).toBe(false);

    setInput('name,note\n田中,"閉じ忘れ');
    convert();
    expect(output.value).toBe("");
    expect(copy.disabled).toBe(true);
    expect(container.textContent).toContain("CSVのダブルクォートが閉じられていません");

    setInput('name,note\n田中,"修正\n完了"');
    convert();
    expect(JSON.parse(output.value)).toEqual([{ name: "田中", note: "修正\n完了" }]);
    expect(copy.disabled).toBe(false);

    setInput("");
    convert();
    expect(output.value).toBe("");
    expect(copy.disabled).toBe(true);
  });

  it("タブのみの空フィールドを空入力として拒否しない", () => {
    act(() => {
      const delimiter = element<Element & { value: string }>("#delimiter");
      delimiter.value = "\t";
      Simulate.change(delimiter);
      element<HTMLInputElement>('input[type="checkbox"]').click();
    });
    setInput("\t");
    convert();
    expect(JSON.parse(element<HTMLTextAreaElement>("#outputText").value)).toEqual([["", ""]]);
  });

  it("後続行のキーをCSV列へ追加し、混在行のエラー後に修正して再変換できる", () => {
    act(() => element<HTMLInputElement>('input[value="json-to-csv"]').click());
    setInput('[{"name":"田中"},{"email":"taro@example.com"}]');
    convert();
    const output = element<HTMLTextAreaElement>("#outputText");
    const copy = element<HTMLButtonElement>(
      'button[aria-label="出力結果をクリップボードにコピー"]',
    );
    expect(output.value).toBe("name,email\n田中,\n,taro@example.com");

    setInput('[{"name":"田中"},null]');
    convert();
    expect(output.value).toBe("");
    expect(copy.disabled).toBe(true);
    expect(container.textContent).toContain("JSONのレコード 2 はオブジェクト");

    setInput(JSON.stringify([{}, { note: "修正\n完了" }]));
    convert();
    expect(output.value).toBe('note\n""\n"修正\n完了"');
    expect(copy.disabled).toBe(false);
  });

  it.each(["name,name\n前,後", "name\n前,後"])(
    "列を失うCSVはエラーになり、ヘッダーなしへ切り替えて回復できる: %s",
    (csv) => {
      setInput("name\n通常");
      convert();
      setInput(csv);
      convert();
      expect(element<HTMLTextAreaElement>("#outputText").value).toBe("");
      expect(
        element<HTMLButtonElement>('button[aria-label="出力結果をクリップボードにコピー"]')
          .disabled,
      ).toBe(true);
      expect(container.textContent).toContain("ヘッダーなしで変換してください");
      act(() => element<HTMLInputElement>('input[type="checkbox"]').click());
      convert();
      expect(JSON.parse(element<HTMLTextAreaElement>("#outputText").value)).toEqual(
        csv.split("\n").map((line) => line.split(",")),
      );
    },
  );

  it("モードを切り替えて1列の空文字・空白と複数行を往復変換できる", () => {
    const original = [{ note: "" }, { note: " " }, { note: "前\n後" }];
    act(() => element<HTMLInputElement>('input[value="json-to-csv"]').click());
    setInput(JSON.stringify(original));
    convert();
    const csv = element<HTMLTextAreaElement>("#outputText").value;

    act(() => element<HTMLInputElement>('input[value="csv-to-json"]').click());
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe("");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe("");
    setInput(csv);
    convert();
    expect(JSON.parse(element<HTMLTextAreaElement>("#outputText").value)).toEqual(original);
  });
});
