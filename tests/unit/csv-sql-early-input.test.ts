// @vitest-environment jsdom

import { act, createElement, StrictMode, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Simulate } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/csv-sql";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

// Workers Element.remove() conflicts with HTMLSelectElement.remove(); use the needed DOM API.
type ValueControl = Element & Pick<HTMLInputElement | HTMLSelectElement, "value">;

/** Exercise the real route, parser and providers, including native edits before handlers exist. */
describe("CSV SQL input across server rendering and hydration", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;
  let recoverableErrors: unknown[];

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
    expect(recoverableErrors).toEqual([]);
  });

  async function hydrate(early: string, strict = false, firstAction?: () => void) {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    recoverableErrors = [];
    const route = createElement(Route.options.component as () => ReactNode);
    const app = createElement(ToastProvider, null, route);
    const element = strict ? createElement(StrictMode, null, app) : app;
    container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(element);
    const ssrInput = input();
    expect(ssrInput.value).toBe("");
    ssrInput.value = early;
    ssrInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    expect(ssrInput.value).toBe(early);
    expect(output()).toBeNull();
    expect(button("入力をクリア").disabled).toBe(true);
    expect(button("SQLをコピー").disabled).toBe(true);
    await act(async () => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      // Native discrete events here must hydrate the root before normal async hydration runs.
      firstAction?.();
    });
    expect(input()).toBe(ssrInput);
  }

  function input() {
    return container.querySelector<HTMLTextAreaElement>("#csv-sql-input")!;
  }
  function output() {
    return container.querySelector<HTMLTextAreaElement>(".csv-sql-textarea-output");
  }
  function error() {
    return container.querySelector('[role="alert"][aria-label="エラー"]');
  }
  function statistics() {
    return container.querySelector('[aria-label="生成結果の統計"]');
  }
  function button(name: string) {
    return container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  }
  function edit(value: string) {
    act(() => {
      input().value = value;
      Simulate.change(input());
    });
  }
  function changeOption(id: string, value: string) {
    act(() => {
      const option = container.querySelector<ValueControl>(`#${id}`)!;
      option.value = value;
      Simulate.change(option);
    });
  }
  function click(name: string) {
    act(() => button(name).click());
  }
  function expectEmpty() {
    expect(input().value).toBe("");
    expect(output()).toBeNull();
    expect(statistics()).toBeNull();
    expect(error()).toBeNull();
    expect(button("入力をクリア").disabled).toBe(true);
    expect(button("SQLをコピー").disabled).toBe(true);
  }

  it.each([false, true])(
    "generates SQL, statistics and button states from exact early input (StrictMode %s)",
    async (strict) => {
      const early = 'id,name,note\n7,"早い入力😀,alpha","line1\n""line2"""\n8,beta,';
      await hydrate(early, strict);
      expect(input().value).toBe(early);
      expect(output()?.value).toBe(
        "INSERT INTO `my_table` (`id`, `name`, `note`)\nVALUES (7, '早い入力😀,alpha', 'line1\n\"line2\"');\n\n" +
          "INSERT INTO `my_table` (`id`, `name`, `note`)\nVALUES (8, 'beta', NULL);",
      );
      expect(statistics()?.textContent).toBe("2 行3 列2 文");
      expect(error()).toBeNull();
      expect(button("入力をクリア").disabled).toBe(false);
      expect(button("SQLをコピー").disabled).toBe(false);
    },
  );

  it.each([false, true])(
    "honors a first sample click that itself forces hydration (StrictMode %s)",
    async (strict) => {
      await hydrate("id,name\n1,discard-me", strict, () => {
        button("サンプルデータを読み込む").click();
      });
      expect(input().value).toContain("田中 太郎");
      expect(input().value).not.toContain("discard-me");
      expect(output()?.value).toContain("田中 太郎");
      expect(statistics()?.textContent).toBe("5 行6 列5 文");
      expect(container.querySelector('[role="status"]')?.textContent).toBe(
        "サンプルデータを読み込みました",
      );
      click("入力をクリア");
      expectEmpty();
      changeOption("csv-sql-table", "after_clear");
      expectEmpty();
    },
  );

  it.each([false, true])(
    "retains early CSV when a native option event forces hydration (StrictMode %s)",
    async (strict) => {
      const early = "id,name\n1,early";
      await hydrate(early, strict, () => {
        const select = container.querySelector<ValueControl>("#csv-sql-dialect")!;
        select.value = "postgresql";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(input().value).toBe(early);
      expect(output()?.value).toBe('INSERT INTO "my_table" ("id", "name")\nVALUES (1, \'early\');');
      expect(error()).toBeNull();
    },
  );

  it.each([false, true])(
    "uses the latest native input when that event forces hydration (StrictMode %s)",
    async (strict) => {
      const latest = "id,name\n2,latest-action";
      await hydrate("id,name\n1,old", strict, () => {
        input().value = latest;
        input().dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
      });
      expect(input().value).toBe(latest);
      expect(output()?.value).toBe(
        "INSERT INTO `my_table` (`id`, `name`)\nVALUES (2, 'latest-action');",
      );
    },
  );

  it("retains input through later table, dialect, batch and NULL option changes", async () => {
    const early = "id,name\n1,alpha\n2,";
    await hydrate(early);
    changeOption("csv-sql-table", "early_rows");
    changeOption("csv-sql-dialect", "postgresql");
    changeOption("csv-sql-batch", "2");
    act(() => {
      container
        .querySelector<HTMLInputElement>('[aria-label="空値・NULLをSQL NULLに変換"]')!
        .click();
    });
    expect(input().value).toBe(early);
    expect(output()?.value).toBe(
      'INSERT INTO "early_rows" ("id", "name")\nVALUES\n  (1, \'alpha\'),\n  (2, \'\');',
    );
    expect(statistics()?.textContent).toBe("2 行2 列1 文");
  });

  it.each([false, true])(
    "uses later edits, Clear and samples without resurrecting early input (StrictMode %s)",
    async (strict) => {
      await hydrate("id,name\n1,old", strict);
      edit("id,name\n2,latest");
      expect(output()?.value).toBe("INSERT INTO `my_table` (`id`, `name`)\nVALUES (2, 'latest');");
      click("入力をクリア");
      expectEmpty();
      changeOption("csv-sql-table", "after_clear");
      expectEmpty();
      click("サンプルデータを読み込む");
      expect(input().value).toContain("田中 太郎");
      expect(output()?.value).toContain("INSERT INTO `after_clear`");
      expect(statistics()?.textContent).toBe("5 行6 列5 文");
      click("入力をクリア");
      expectEmpty();
      edit("id,name\n3,after-clear");
      expect(output()?.value).toBe(
        "INSERT INTO `after_clear` (`id`, `name`)\nVALUES (3, 'after-clear');",
      );
    },
  );

  it.each([
    ['id,name\n1,"alpha', "2番目のレコードの2列目: 引用符が閉じていません"],
    ['id,name\n1,al"pha', "2番目のレコードの2列目: 引用符を含む値は全体を引用符で囲み"],
    ['id,name\n1,"alpha"x', "2番目のレコードの2列目: 閉じた引用符の後には"],
    ["id,name\n1,alpha,extra", "2番目のレコードは3列"],
    ["id,name", "データ行がありません"],
  ])("preserves early invalid input %j and regenerates after repair", async (early, message) => {
    await hydrate(early);
    expect(input().value).toBe(early);
    expect(error()?.textContent).toContain(message);
    expect(output()).toBeNull();
    expect(statistics()).toBeNull();
    expect(button("SQLをコピー").disabled).toBe(true);
    expect(button("入力をクリア").disabled).toBe(false);
    edit("id,name\n1,repaired");
    expect(error()).toBeNull();
    expect(output()?.value).toBe("INSERT INTO `my_table` (`id`, `name`)\nVALUES (1, 'repaired');");
    expect(button("SQLをコピー").disabled).toBe(false);
  });

  it.each(["", " \n\t "])("keeps early blank input %j without a result or error", async (early) => {
    await hydrate(early);
    expect(input().value).toBe(early);
    expect(output()).toBeNull();
    expect(statistics()).toBeNull();
    expect(error()).toBeNull();
    expect(button("SQLをコピー").disabled).toBe(true);
    expect(button("入力をクリア").disabled).toBe(!early);
    edit("id,name\n1,new");
    expect(output()?.value).toContain("(1, 'new')");
  });
});
