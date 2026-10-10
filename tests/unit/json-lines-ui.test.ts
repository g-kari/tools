// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/json-lines";

describe("JSON Linesのフォーム操作", () => {
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

  /** 操作ボタンをアクセシブル名で選んでクリックする。 */
  function click(label: string): void {
    act(() => element<HTMLButtonElement>(`button[aria-label="${label}"]`).click());
  }

  /** モードボタンを表示テキストで選んでクリックする。 */
  function mode(label: string): void {
    const button = [...container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")].find(
      (candidate) => candidate.textContent === label,
    );
    if (!button) throw new Error(`モードが見つかりません: ${label}`);
    act(() => button.click());
  }

  it("整形・圧縮を繰り返しても全レコードが有効なまま残る", () => {
    const input = '{"id":1,"v":["a,b:c",null]}\nfalse\n"前\\n後"';
    setInput(input);
    click("各行のJSONを整形");
    const formatted = element<HTMLTextAreaElement>("#inputText").value;
    expect(formatted.split("\n")).toHaveLength(3);
    expect(container.querySelector(".jsonl-error-list")).toBeNull();
    click("各行のJSONを整形");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe(formatted);
    click("各行のJSONを圧縮");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe(input);
  });

  it("不正な行があれば整形・圧縮は入力を変更せず、修正後に処理できる", () => {
    const input = '{"id":1}\n  invalid  \n{"id":2}';
    for (const action of ["各行のJSONを整形", "各行のJSONを圧縮"]) {
      setInput(input);
      click(action);
      expect(element<HTMLTextAreaElement>("#inputText").value).toBe(input);
      expect(element<HTMLDivElement>(".error-message").textContent).toContain(
        "入力は変更していません",
      );
      expect(element<HTMLDivElement>(".jsonl-error-list").textContent).toContain("行 2");
      setInput('{"id":1}\n{"id":2}');
      expect(container.querySelector(".error-message")).toBeNull();
      click(action);
      expect(container.querySelector(".jsonl-error-list")).toBeNull();
      expect(container.querySelector(".error-message")).toBeNull();
    }
  });

  it("検証モードではCtrl+Enterで配列変換を実行しない", () => {
    setInput('{"id":1}');
    const shortcut = new KeyboardEvent("keydown", {
      key: "Enter",
      ctrlKey: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(shortcut);
    });
    expect(shortcut.defaultPrevented).toBe(true);
    expect(container.querySelector(".error-message")).toBeNull();
    expect(container.querySelector("#outputText")).toBeNull();
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe('{"id":1}');
  });

  it("選択中のモードを再クリックしても入力・出力を消さない", () => {
    mode("JSONL → JSON配列");
    setInput('{"id":1}');
    click("JSON配列に変換");
    const output = element<HTMLTextAreaElement>("#outputText").value;
    mode("JSONL → JSON配列");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe('{"id":1}');
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe(output);
  });

  it("変換モードのショートカットで往復でき、入力編集・モード変更で古い出力を消す", () => {
    mode("JSONL → JSON配列");
    setInput('{"id":1}\nfalse');
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
    });
    const array = element<HTMLTextAreaElement>("#outputText").value;
    expect(JSON.parse(array)).toEqual([{ id: 1 }, false]);
    setInput("");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe("");
    expect(container.querySelector('button[aria-label="出力をクリップボードにコピー"]')).toBeNull();
    click("JSON配列に変換");
    expect(element<HTMLDivElement>(".error-message").textContent).toContain("入力してください");
    mode("JSON配列 → JSONL");
    expect(container.querySelector(".error-message")).toBeNull();
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe("");
    setInput(array);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
    });
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe('{"id":1}\nfalse');
    click("入力と出力をクリア");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe("");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe("");
  });
  it("BOM・NBSP付きの有効な入力を検証と同じ基準で整形・圧縮する", () => {
    const input = '\uFEFF{"id":1,"v":[1,2]}\u00A0\n\u00A0{"id":2}\uFEFF';
    setInput(input);
    expect(container.querySelector(".jsonl-error-list")).toBeNull();
    click("各行のJSONを整形");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe(
      '{"id": 1, "v": [1, 2]}\n{"id": 2}',
    );
    expect(container.querySelector(".error-message")).toBeNull();
    setInput(input);
    click("各行のJSONを圧縮");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe('{"id":1,"v":[1,2]}\n{"id":2}');
    expect(container.querySelector(".error-message")).toBeNull();
  });
  it("整形・圧縮の入力置換でID、指数、重複キー、escapeを失わない", () => {
    const record = String.raw`{"id":9007199254740993,"n":1e400,"d":0.1234567890123456789,"x":1,"x":2,"2":"\u0061","1":"\/"}`;
    const formatted = String.raw`{"id": 9007199254740993, "n": 1e400, "d": 0.1234567890123456789, "x": 1, "x": 2, "2": "\u0061", "1": "\/"}`;
    setInput(`${record}\n-0`);
    click("各行のJSONを整形");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe(`${formatted}\n-0`);
    click("各行のJSONを圧縮");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe(`${record}\n-0`);
    click("各行のJSONを整形");
    click("各行のJSONを圧縮");
    expect(element<HTMLTextAreaElement>("#inputText").value).toBe(`${record}\n-0`);
    expect(container.querySelector(".jsonl-error-list")).toBeNull();
  });

  it("両方の変換モードと再試行で数値と重複メンバーの元表記を保つ", () => {
    const record = String.raw`{"id":9007199254740993,"n":1e400,"x":1,"x":2,"s":"\u0061\/"}`;
    const expected = String.raw`[
  {
    "id": 9007199254740993,
    "n": 1e400,
    "x": 1,
    "x": 2,
    "s": "\u0061\/"
  },
  -0
]`;
    mode("JSONL → JSON配列");
    setInput(`${record}\n-0`);
    click("JSON配列に変換");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe(expected);
    setInput(`${record}\n{ "bad": 01 }`);
    click("JSON配列に変換");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe("");
    expect(element<HTMLDivElement>(".error-message").textContent).toContain("行 2");
    mode("JSON配列 → JSONL");
    setInput(expected);
    click("JSON Linesに変換");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe(`${record}\n-0`);
    setInput(`[${record},]`);
    click("JSON Linesに変換");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe("");
    setInput(expected);
    click("JSON Linesに変換");
    expect(element<HTMLTextAreaElement>("#outputText").value).toBe(`${record}\n-0`);
    expect(container.querySelector(".error-message")).toBeNull();
  });
});
