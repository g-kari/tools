// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/json-to-sql";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("JSON→SQL列名衝突の実コンポーネント", () => {
  let container: HTMLDivElement;
  let root: Root;
  let externalFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    externalFetch = vi.fn(() => {
      throw new Error("Unexpected external fetch in JSON→SQL fixture");
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

  const input = () => container.querySelector<HTMLTextAreaElement>("#jsonInput")!;
  const output = () =>
    container.querySelector('[role="region"][aria-label="生成されたCREATE TABLE文"]')!;
  const error = () => container.querySelector('.error-message[role="alert"]');
  const copy = () =>
    container.querySelector<HTMLButtonElement>(
      'button[aria-label="生成されたSQL文をクリップボードにコピーする"]',
    )!;
  function enter(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }
  function generate() {
    act(() =>
      container
        .querySelector<HTMLButtonElement>('button[aria-label="CREATE TABLE文を生成する"]')!
        .click(),
    );
  }
  function setAddId(checked: boolean) {
    const node = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[1];
    act(() => {
      node.checked = checked;
      Simulate.change(node);
    });
  }

  it.each(["postgresql", "mysql", "sqlite"])(
    "%s の成功後の衝突で入力を保持し、旧SQLとCopyを無効にして修復する",
    (dialect) => {
      const select = container.querySelector<HTMLElement & { value: string }>("#jtsql-dialect")!;
      act(() => {
        select.value = dialect;
        Simulate.change(select);
      });
      enter('{"name":"demo"}');
      generate();
      expect(output().textContent).toContain("CREATE TABLE");
      expect(copy().disabled).toBe(false);

      const node = input();
      const invalid = '{"userName":1,"user_name":2}';
      enter(invalid);
      generate();
      expect(input()).toBe(node);
      expect(input().value).toBe(invalid);
      expect(output().textContent).not.toContain("CREATE TABLE");
      expect(copy().disabled).toBe(true);
      expect(error()?.textContent).toContain("userName");
      expect(error()?.textContent).toContain("user_name");
      expect(error()?.textContent).toContain("入力キーを変更");

      enter('{"userName":1,"displayName":2}');
      generate();
      expect(error()).toBeNull();
      expect(output().textContent).toContain("user_name");
      expect(output().textContent).toContain("display_name");
      expect(copy().disabled).toBe(false);
    },
  );

  it("サンプルと追加idの衝突後、オプションをオフにして同じ入力で回復する", () => {
    act(() =>
      container
        .querySelector<HTMLButtonElement>('button[aria-label="サンプルJSONを読み込む"]')!
        .click(),
    );
    const sample = input().value;
    setAddId(true);
    generate();
    expect(input().value).toBe(sample);
    expect(output().textContent).not.toContain("CREATE TABLE");
    expect(copy().disabled).toBe(true);
    expect(error()?.textContent).toContain("id カラムを追加する");
    expect(error()?.textContent).toContain("オフ");

    setAddId(false);
    generate();
    expect(input().value).toBe(sample);
    expect(error()).toBeNull();
    expect(output().textContent).toContain('"id" INTEGER');
    expect(output().textContent).not.toContain("PRIMARY KEY");
    expect(copy().disabled).toBe(false);
  });
});
