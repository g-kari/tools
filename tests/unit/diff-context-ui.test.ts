// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route, computeDiff } from "../../app/routes/diff";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("Diff context view in the actual component", () => {
  let container: HTMLDivElement;
  let root: Root;
  let writeText: ReturnType<typeof vi.fn>;
  let fetch: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    fetch = vi.fn(() => {
      throw new Error("Unexpected external request");
    });
    vi.stubGlobal("fetch", fetch);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() =>
      root.render(
        createElement(ToastProvider, null, createElement(Route.options.component as ComponentType)),
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  const button = (label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const mode = () => container.querySelector<HTMLInputElement>("#diff-context-only")!;
  const rows = () => [...container.querySelectorAll<HTMLTableRowElement>("tr.diff-line")];
  const gaps = () => [...container.querySelectorAll<HTMLButtonElement>(".diff-context-toggle")];
  function click(node: HTMLElement) {
    act(() => node.click());
  }
  function input(oldText: string, newText: string) {
    act(() => {
      for (const [id, value] of [
        ["oldText", oldText],
        ["newText", newText],
      ]) {
        const area = container.querySelector<HTMLTextAreaElement>(`#${id}`)!;
        area.value = value;
        Simulate.change(area);
      }
    });
  }
  function compare() {
    click(button("差分を比較"));
  }
  function contextOnly() {
    click(mode());
  }
  const fixture = () => {
    const old = Array.from({ length: 30 }, (_, i) => `same-${i + 1}`);
    const next = [...old];
    next[14] = "changed-15";
    return [old.join("\n"), next.join("\n")] as const;
  };

  it("offers a three-line context view without changing either input", () => {
    const [old, next] = fixture();
    input(old, next);
    compare();
    expect(rows()).toHaveLength(31);
    expect(mode().checked).toBe(false);
    contextOnly();
    expect(rows()).toHaveLength(8);
    expect(gaps().map((b) => b.textContent)).toEqual(["未変更の11行を表示", "未変更の12行を表示"]);
    expect(rows().map((r) => r.querySelector(".diff-line-value")!.textContent)).toEqual([
      "same-12",
      "same-13",
      "same-14",
      "same-15",
      "changed-15",
      "same-16",
      "same-17",
      "same-18",
    ]);
    expect(container.querySelector<HTMLTextAreaElement>("#oldText")!.value).toBe(old);
    expect(container.querySelector<HTMLTextAreaElement>("#newText")!.value).toBe(next);
  });

  it("labels old/new line numbers, including additions and removals", () => {
    input("keep\nremove\nlast", "keep\nlast\nadd");
    compare();
    expect(
      rows().map((r) => [
        r.children[0].textContent,
        r.children[1].textContent,
        r.querySelector(".diff-line-value")!.textContent,
      ]),
    ).toEqual([
      ["1", "1", "keep"],
      ["2", "", "remove"],
      ["3", "2", "last"],
      ["", "3", "add"],
    ]);
    expect(container.querySelector("table")!.getAttribute("aria-label")).toBe(
      "元と新しい行番号付きの差分",
    );
    expect([...container.querySelectorAll("thead th")].map((n) => n.textContent)).toEqual([
      "元",
      "新",
      "変更",
      "内容",
    ]);
    expect(rows()[1].children[2].textContent).toBe("−削除");
    expect(rows()[3].children[2].textContent).toBe("+追加");
  });

  it("keeps the disclosure focused and exposes its controlled rows and expanded state", () => {
    input(...fixture());
    compare();
    contextOnly();
    const first = gaps()[0];
    first.focus();
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(first.getAttribute("aria-label")).toContain("元1〜11行、新1〜11行");
    const id = first.getAttribute("aria-controls")!;
    expect(container.querySelector(`#${id}`)?.hasAttribute("hidden")).toBe(true);
    click(first);
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(first.textContent).toBe("未変更の11行を折りたたむ");
    expect(container.querySelector(`#${id}`)?.hasAttribute("hidden")).toBe(false);
    expect(rows()).toHaveLength(19);
    click(first);
    expect(rows()).toHaveLength(8);
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("copies the complete original-format result even when lines are omitted", async () => {
    const [old, next] = fixture();
    input(old, next);
    compare();
    contextOnly();
    await act(async () => button("差分結果をクリップボードにコピー").click());
    const expected = computeDiff(old, next)
      .map((l) => `${l.type === "added" ? "+" : l.type === "removed" ? "-" : " "} ${l.value}`)
      .join("\n");
    expect(writeText).toHaveBeenCalledExactlyOnceWith(expected);
    expect(expected).toContain("  same-1\n");
    expect(expected).toContain("  same-30");
    expect(expected).not.toContain("未変更");
  });

  it("resets disclosures on repeated comparison and clears them on clear/sample", () => {
    input(...fixture());
    compare();
    contextOnly();
    click(gaps()[0]);
    expect(rows()).toHaveLength(19);
    compare();
    expect(gaps().every((b) => b.getAttribute("aria-expanded") === "false")).toBe(true);
    click(gaps()[1]);
    contextOnly();
    expect(rows()).toHaveLength(31);
    contextOnly();
    expect(gaps()[1].getAttribute("aria-expanded")).toBe("true");
    click(button("入力と結果をクリア"));
    expect(container.querySelector("table")).toBeNull();
    expect(document.activeElement).toBe(container.querySelector("#oldText"));
    click(button("サンプルデータを読み込む"));
    compare();
    expect(gaps()).toHaveLength(0);
    input(...fixture());
    compare();
    expect(gaps().every((b) => b.getAttribute("aria-expanded") === "false")).toBe(true);
  });

  it("supports one empty side and no-change results without meaningless omissions", () => {
    input("", "\n  日本語\t\n");
    compare();
    expect(
      rows().map((r) => [
        r.children[0].textContent,
        r.children[1].textContent,
        r.querySelector(".diff-line-value")!.textContent,
      ]),
    ).toEqual([
      ["", "1", ""],
      ["", "2", "  日本語\t"],
      ["", "3", ""],
    ]);
    contextOnly();
    expect(gaps()).toHaveLength(0);
    expect(rows()).toHaveLength(3);
    input("same", "same");
    compare();
    expect(container.querySelector(".diff-no-changes")!.textContent).toBe("差分はありません");
    expect(container.querySelector("table")).toBeNull();
    input("", "");
    compare();
    expect(document.activeElement).toBe(container.querySelector("#oldText"));
  });

  it("retains Ctrl+Enter comparison and resets expanded rows for its next result", () => {
    input(...fixture());
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      );
    });
    contextOnly();
    click(gaps()[0]);
    expect(gaps()[0].getAttribute("aria-expanded")).toBe("true");
    input("old", "new");
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      );
    });
    expect(gaps()).toHaveLength(0);
    expect(rows().map((r) => r.querySelector(".diff-line-value")!.textContent)).toEqual([
      "old",
      "new",
    ]);
  });
});
