// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { changeControl } from "../helpers/change-control";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/csv-sql";

describe("CSV SQL の引用符エラーからの回復", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Component = Route.options.component!;
    act(() => root.render(createElement(ToastProvider, { children: createElement(Component) })));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  /** 実コンポーネントの入力イベントを発火する。 */
  function setInput(value: string): HTMLTextAreaElement {
    const input = container.querySelector<HTMLTextAreaElement>("#csv-sql-input")!;
    input.focus();
    act(() => {
      input.value = value;
      changeControl(input);
    });
    return input;
  }

  it.each([
    ['id,name\n1,"alpha', "引用符が閉じていません"],
    ['id,name\n1,al"pha', "値は全体を引用符で囲み"],
    ['id,name\n1,"alpha"x', "閉じた引用符の後には"],
  ])("正常→不正→修正→クリアの間に入力とフォーカスを保持する: %j", (invalid, reason) => {
    setInput("id,name\n1,alpha");
    const output = () =>
      container.querySelector<HTMLTextAreaElement>('[aria-label="生成されたSQL INSERT文"]');
    const copy = container.querySelector<HTMLButtonElement>('button[aria-label="SQLをコピー"]')!;
    expect(output()?.value).toContain("(1, 'alpha')");
    expect(copy.disabled).toBe(false);

    const input = setInput(invalid);
    const error = container.querySelector('[role="alert"]');
    expect(error?.getAttribute("aria-label")).toBe("エラー");
    expect(error?.textContent).toContain("2番目のレコードの2列目");
    expect(error?.textContent).toContain(reason);
    expect(input.value).toBe(invalid);
    expect(document.activeElement).toBe(input);
    expect(output()).toBeNull();
    expect(container.querySelector('[aria-label="生成結果の統計"]')).toBeNull();
    expect(copy.disabled).toBe(true);

    setInput('id,name\n1,"alpha,beta"');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(output()?.value).toContain("(1, 'alpha,beta')");
    expect(copy.disabled).toBe(false);
    expect(container.querySelector('[aria-label="生成結果の統計"]')?.textContent).toContain("1 行");

    act(() =>
      container.querySelector<HTMLButtonElement>('button[aria-label="入力をクリア"]')!.click(),
    );
    expect(input.value).toBe("");
    expect(output()).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[aria-label="生成結果の統計"]')).toBeNull();
    expect(copy.disabled).toBe(true);
  });
});
