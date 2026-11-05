// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route as CharRoute } from "../../app/routes/char-frequency";
import { Route as WordRoute } from "../../app/routes/word-frequency";
import { Route as EntropyRoute } from "../../app/routes/entropy";

describe("text-analysis route controls and exported results", () => {
  let container: HTMLDivElement;
  let root: Root;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  const writeText = vi.fn<(text: string) => Promise<void>>();
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    writeText.mockReset().mockResolvedValue(undefined);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
  });
  function mount(component: unknown) {
    act(() =>
      root.render(
        createElement(ToastProvider, { children: createElement(component as ComponentType) }),
      ),
    );
  }
  function get<T extends Element = HTMLElement>(selector: string): T {
    const found = container.querySelector<T>(selector);
    expect(found, selector).not.toBeNull();
    return found!;
  }
  function change(selector: string, value: string) {
    const input = get(selector);
    act(() => {
      Reflect.set(input, "value", value);
      if (input instanceof HTMLSelectElement)
        input.dispatchEvent(new Event("change", { bubbles: true }));
      else Simulate.change(input);
    });
  }
  function click(label: string) {
    const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (candidate) =>
        candidate.getAttribute("aria-label") === label || candidate.textContent?.trim() === label,
    );
    expect(button, label).toBeDefined();
    act(() => button!.click());
  }
  function toggle(label: string) {
    act(() => Simulate.change(get(`input[aria-label="${label}"]`)));
  }
  async function copy(label: string) {
    await act(async () => click(label));
  }

  it("counts actual characters, applies every option, sorts both ways and copies the displayed CSV", async () => {
    mount(CharRoute.options.component);
    expect(container.querySelector("tbody")).toBeNull();
    change("textarea", "Aa b\n1😀");
    expect(get('[data-testid="total-chars"]').textContent).toBe("7");
    expect(get('[data-testid="unique-chars"]').textContent).toBe("7");
    toggle("大文字・小文字を区別しない");
    expect(get('[data-testid="unique-chars"]').textContent).toBe("6");
    toggle("スペース・改行を除外");
    expect(get('[data-testid="total-chars"]').textContent).toBe("5");
    toggle("英字・数字・かなのみ対象");
    expect(get('[data-testid="total-chars"]').textContent).toBe("4");
    click("文字コード順に切り替え");
    expect(get("tbody tr td").textContent).toBe("1");
    click("頻度順に切り替え");
    expect(get("tbody tr td").textContent).toBe("a");
    await copy("結果をCSVとしてクリップボードにコピー");
    expect(writeText.mock.calls[0][0]).toContain('"a",2,50.00');
    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    await copy("結果をCSVとしてクリップボードにコピー");
    expect(container.textContent).toContain("コピーに失敗");
    click("入力テキストをクリア");
    expect(get<HTMLTextAreaElement>("textarea").value).toBe("");
    expect(document.activeElement).toBe(get("textarea"));
  });

  it("updates word totals, case/punctuation/stopword/length settings and real CSV output", async () => {
    mount(WordRoute.options.component);
    change("textarea", "The cat, cat CAT dog a");
    expect(get('[data-testid="total-words"]').textContent).toBe("6");
    expect(get('[data-testid="unique-words"]').textContent).toBe("4");
    toggle("大文字・小文字を区別しない");
    expect(get('[data-testid="unique-words"]').textContent).toBe("5");
    toggle("大文字・小文字を区別しない");
    toggle("句読点・記号を除去してから分割");
    expect(get('[data-testid="unique-words"]').textContent).toBe("5");
    toggle("句読点・記号を除去してから分割");
    toggle("ストップワード（頻出機能語）を除外");
    expect(get('[data-testid="total-words"]').textContent).toBe("4");
    change("#wf-min-length", "4");
    expect(get('[data-testid="total-words"]').textContent).toBe("0");
    change("#wf-min-length", "1");
    click("単語順に切り替え");
    click("頻度順に切り替え");
    await copy("結果をCSVとしてクリップボードにコピー");
    expect(writeText.mock.calls[0][0]).toContain('"cat",3,75.00');
    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    await copy("結果をCSVとしてクリップボードにコピー");
    expect(container.textContent).toContain("コピーに失敗");
    click("入力テキストをクリア");
    expect(get<HTMLTextAreaElement>("textarea").value).toBe("");
  });

  it("expands a large word-frequency table without changing its complete CSV", async () => {
    mount(WordRoute.options.component);
    const corpus = Array.from({ length: 55 }, (_, i) => `word${i}`).join(" ");
    change("textarea", corpus);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(50);
    const more = get<HTMLButtonElement>('[aria-label="さらに50件表示"]');
    act(() => more.click());
    expect(container.querySelectorAll("tbody tr")).toHaveLength(55);
    await copy("結果をCSVとしてクリップボードにコピー");
    expect(writeText.mock.calls[0][0].split("\n")).toHaveLength(56);
  });

  it("computes entropy, displays control characters, expands frequencies and handles clipboard recovery", async () => {
    mount(EntropyRoute.options.component);
    change("#entropy-input", "aabb");
    expect(get('[aria-label="エントロピー計算結果"]').textContent).toContain("1.0000");
    await copy("計算結果をコピー");
    expect(writeText.mock.calls[0][0]).toContain("エントロピー: 1.0000 bits/文字");
    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    await copy("計算結果をコピー");
    expect(container.textContent).toContain("コピーに失敗");
    change("#entropy-input", " \n\t\r\u0001\u007fabcdefghijk");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(10);
    const more = get<HTMLButtonElement>(".entropy-show-more-btn");
    act(() => more.click());
    // Native textarea values normalize CR to LF before React reads them.
    expect(container.querySelectorAll("tbody tr")).toHaveLength(16);
    for (const token of ["␣", "↵", "⇥", "U+0001", "U+007F"])
      expect(get("tbody").textContent).toContain(token);
    click("折りたたむ");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(10);
    for (const sample of [
      "ランダム文字列",
      "繰り返し文字列",
      "英文（低エントロピー）",
      "日本語テキスト",
    ])
      click(`サンプル「${sample}」を入力`);
    expect(get<HTMLTextAreaElement>("#entropy-input").value).toContain("吾輩");
    change("#entropy-input", "");
    expect(container.querySelector("tbody")).toBeNull();
  });
});
