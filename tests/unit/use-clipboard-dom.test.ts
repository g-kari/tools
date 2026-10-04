// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useClipboard } from "../../app/hooks/useClipboard";

describe("useClipboard の実DOMフォールバック", () => {
  let container: HTMLDivElement;
  let root: Root;
  let copy: (text: string) => Promise<boolean>;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("navigator", { clipboard: undefined });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    function Fixture() {
      copy = useClipboard().copy;
      return createElement("button", {}, "コピー");
    }
    act(() => root.render(createElement(Fixture)));
    execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.replaceChildren();
    document.getSelection()?.removeAllRanges();
    delete (document as Partial<Document>).execCommand;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([true, false, "throw"])(
    "結果 %s でもコピー前のボタンフォーカスを戻す",
    async (outcome) => {
      const button = container.querySelector("button")!;
      button.focus();
      execCommand.mockImplementation(() => {
        const temporary = document.activeElement as HTMLTextAreaElement;
        expect(temporary.tagName).toBe("TEXTAREA");
        expect(temporary.value).toBe("日本語🎉\n2行目");
        expect(temporary.selectionStart).toBe(0);
        expect(temporary.selectionEnd).toBe(temporary.value.length);
        if (outcome === "throw") throw new Error("copy unavailable");
        return outcome;
      });
      expect(await copy("日本語🎉\n2行目")).toBe(outcome === true);
      expect(document.activeElement).toBe(button);
      expect(document.querySelectorAll("textarea")).toHaveLength(0);
      expect(execCommand).toHaveBeenCalledWith("copy");
    },
  );

  it.each(["input", "textarea"] as const)(
    "%s の後方選択とスクロール位置を保持する",
    async (tag) => {
      const input = document.createElement(tag);
      input.value = "0123456789";
      container.appendChild(input);
      input.focus();
      input.setSelectionRange(2, 8, "backward");
      input.scrollTop = 30;
      input.scrollLeft = 15;
      expect(await copy("新しいコピー値")).toBe(true);
      expect(document.activeElement).toBe(input);
      expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).toEqual([
        2,
        8,
        "backward",
      ]);
      expect(input.value).toBe("0123456789");
      expect([input.scrollTop, input.scrollLeft]).toEqual([30, 15]);
      expect(document.querySelectorAll("textarea")).toHaveLength(tag === "textarea" ? 1 : 0);
    },
  );

  it("通常テキストの選択範囲を復元する", async () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "前半 選択する 後半";
    container.appendChild(paragraph);
    const text = paragraph.firstChild!;
    const selection = document.getSelection()!;
    selection.setBaseAndExtent(text, 9, text, 3);
    execCommand.mockImplementation(() => {
      selection.removeAllRanges();
      selection.selectAllChildren(document.activeElement!);
      return true;
    });
    expect(await copy("コピー値")).toBe(true);
    expect(selection.toString()).toBe("選択する 後");
    expect([
      selection.anchorNode,
      selection.anchorOffset,
      selection.focusNode,
      selection.focusOffset,
    ]).toEqual([text, 9, text, 3]);
  });

  it("選択範囲なしの状態を保持する", async () => {
    const selection = document.getSelection()!;
    selection.removeAllRanges();
    execCommand.mockImplementation(() => {
      selection.selectAllChildren(document.activeElement!);
      return true;
    });
    expect(await copy("コピー値")).toBe(true);
    expect(selection.rangeCount).toBe(0);
  });

  it("copyイベントで別の操作へフォーカスを移した場合は奪い返さない", async () => {
    const next = document.createElement("button");
    container.appendChild(next);
    execCommand.mockImplementation(() => {
      next.focus();
      return true;
    });
    expect(await copy("コピー値")).toBe(true);
    expect(document.activeElement).toBe(next);
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  it("コピー元が途中で取り除かれても例外を漏らさない", async () => {
    const button = document.createElement("button");
    container.appendChild(button);
    button.focus();
    execCommand.mockImplementation(() => {
      button.remove();
      return true;
    });
    expect(await copy("コピー値")).toBe(true);
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  it("失敗後の再試行と空文字コピーでも一時要素を残さない", async () => {
    const button = container.querySelector("button")!;
    button.focus();
    execCommand.mockImplementationOnce(() => {
      throw new Error("first attempt");
    });
    expect(await copy("最初")).toBe(false);
    expect(await copy("")).toBe(true);
    expect(await copy("再試行")).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  it("Modern API はDOMとフォーカスを変更しない", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const button = container.querySelector("button")!;
    button.focus();
    expect(await copy("コピー値")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("コピー値");
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });

  it("Modern API の拒否は拒否のままで、別のコピー経路を試さない", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const button = container.querySelector("button")!;
    button.focus();
    expect(await copy("コピー値")).toBe(false);
    expect(execCommand).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    expect(document.querySelectorAll("textarea")).toHaveLength(0);
  });
});
