// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/xml-json";

describe("XML/JSON テキスト変換ページ", () => {
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

  const input = () => container.querySelector<HTMLTextAreaElement>("#input-text")!;
  const output = () => container.querySelector<HTMLTextAreaElement>("#output-text")!;

  function fill(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }

  function convert() {
    act(() => container.querySelector<HTMLButtonElement>("#convert-btn")!.click());
  }

  function switchToJson() {
    act(() => container.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click());
  }

  it("CDATAと子要素に挟まれたテキストを繰り返し変換しても保持する", () => {
    const source = "<root>before<child><![CDATA[<&>]]></child>after</root>";
    fill(source);
    convert();
    expect(JSON.parse(output().value) as unknown).toEqual({
      root: { child: "<&>", "#text": "beforeafter" },
    });
    const first = output().value;
    convert();
    expect(output().value).toBe(first);
    expect(input().value).toBe(source);
  });

  it("JSONモードで #text と子要素をエスケープし、繰り返し変換しても保持する", () => {
    switchToJson();
    const source = JSON.stringify({ root: { "#text": "a < b & c", child: "value" } });
    const expected =
      '<?xml version="1.0" encoding="UTF-8"?>\n<root>a &lt; b &amp; c<child>value</child></root>';
    fill(source);
    convert();
    expect(output().value).toBe(expected);
    convert();
    expect(output().value).toBe(expected);
    expect(input().value).toBe(source);
  });

  it("不正なXMLで結果をクリアし、有効なCDATA入力から再開する", () => {
    fill("<root><![CDATA[value]]></root>");
    convert();
    expect(output().value).toContain("value");
    fill("<root>");
    convert();
    expect(output().value).toBe("");
    expect(container.querySelector(".error-message")).not.toBeNull();
    fill("<root><![CDATA[recovered]]></root>");
    convert();
    expect(JSON.parse(output().value) as unknown).toEqual({ root: "recovered" });
    expect(container.querySelector(".error-message")).toBeNull();
  });

  it("変換表現の空白・順序・テキスト位置の制約を案内する", () => {
    expect(container.textContent).toContain("前後の空白を除いた");
    expect(container.textContent).toContain("元の位置や異なる名前の子要素の順序は保持しません");
    expect(container.textContent).toContain("子要素の前に出力");
  });
});
