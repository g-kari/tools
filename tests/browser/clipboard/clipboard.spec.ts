import { test, expect, type Page } from "@playwright/test";

type Mode = "native" | "false" | "throw" | "modern-success" | "modern-denial";
type Probe = {
  temporaryAdded: number;
  temporaryRemoved: number;
  fallbackCalls: number;
  writes: string[];
  copyEvents: { clipboardText: string; selectedText: string }[];
  pasteEvents: string[];
};
type ProbeWindow = Window & { clipboardProbe: Probe };

const payload = "synthetic clipboard payload α🙂\nline two";
const externalRequests = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  externalRequests.set(page, attempts);
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4195") {
      attempts.push(url.origin);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/");
  await expect(page.getByTestId("result")).toHaveText("0:idle");
});

test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
  // Two fixture textareas must remain; no temporary fallback node may leak.
  await expect(page.locator("textarea")).toHaveCount(2);
  await expect(page.locator("body > textarea")).toHaveCount(0);
});

/** Observe native copying without cancelling its default action or granting permissions. */
async function configure(page: Page, mode: Mode) {
  await page.evaluate((selectedMode) => {
    const probe: Probe = {
      temporaryAdded: 0,
      temporaryRemoved: 0,
      fallbackCalls: 0,
      writes: [],
      copyEvents: [],
      pasteEvents: [],
    };
    (window as unknown as ProbeWindow).clipboardProbe = probe;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: selectedMode.startsWith("modern-")
        ? {
            writeText: async (text: string) => {
              probe.writes.push(text);
              if (selectedMode === "modern-denial") {
                throw new DOMException("Synthetic permission denial", "NotAllowedError");
              }
            },
          }
        : undefined,
    });
    // Success uses Chromium's unmodified native execCommand. Only failure branches are stubbed.
    if (selectedMode === "false" || selectedMode === "throw") {
      document.execCommand = () => {
        probe.fallbackCalls++;
        if (selectedMode === "throw") throw new Error("Synthetic execCommand failure");
        return false;
      };
    }
    document.addEventListener("copy", (event) => {
      const active = document.activeElement;
      const selectedText =
        active instanceof HTMLTextAreaElement
          ? active.value.slice(active.selectionStart, active.selectionEnd)
          : (window.getSelection()?.toString() ?? "");
      probe.copyEvents.push({
        clipboardText: event.clipboardData?.getData("text/plain") ?? "",
        selectedText,
      });
    });
    document.addEventListener("paste", (event) => {
      probe.pasteEvents.push(event.clipboardData?.getData("text/plain") ?? "");
    });
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLTextAreaElement && !node.id) probe.temporaryAdded++;
        }
        for (const node of record.removedNodes) {
          if (node instanceof HTMLTextAreaElement && !node.id) probe.temporaryRemoved++;
        }
      }
    }).observe(document.body, { childList: true });
  }, mode);
}

/** Capture focus, DOM selection endpoints, form selection direction and scroll offsets. */
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const nodePath = (node: Node | null): string | null => {
      if (!node) return null;
      if (node instanceof Element && node.id) return `#${node.id}`;
      const parent = node.parentNode;
      if (!parent) return node.nodeName;
      return `${nodePath(parent)}/${Array.prototype.indexOf.call(parent.childNodes, node)}`;
    };
    const selection = window.getSelection();
    const ranges = [];
    if (selection) {
      for (let index = 0; index < selection.rangeCount; index++) {
        const range = selection.getRangeAt(index);
        ranges.push({
          start: nodePath(range.startContainer),
          startOffset: range.startOffset,
          end: nodePath(range.endContainer),
          endOffset: range.endOffset,
        });
      }
    }
    const controls = ["input", "textarea"].map((id) => {
      const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
      return {
        id,
        value: element.value,
        start: element.selectionStart,
        end: element.selectionEnd,
        direction: element.selectionDirection,
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
      };
    });
    return {
      active: nodePath(document.activeElement),
      controls,
      documentSelection: {
        text: selection?.toString() ?? "",
        anchor: nodePath(selection?.anchorNode ?? null),
        anchorOffset: selection?.anchorOffset ?? 0,
        focus: nodePath(selection?.focusNode ?? null),
        focusOffset: selection?.focusOffset ?? 0,
        ranges,
      },
      scroll: { x: window.scrollX, y: window.scrollY },
    };
  });
}

/** Prepare an actual browser form selection and nonzero scroll without changing copy behavior. */
async function selectControl(page: Page, id: string, direction: "forward" | "backward") {
  await page.evaluate(
    ({ controlId, selectionDirection }) => {
      window.getSelection()?.removeAllRanges();
      const control = document.getElementById(controlId) as HTMLInputElement | HTMLTextAreaElement;
      control.focus({ preventScroll: true });
      control.setSelectionRange(8, 21, selectionDirection);
      control.scrollLeft = 120;
      if (control instanceof HTMLTextAreaElement) control.scrollTop = 160;
      window.scrollTo(0, 90);
    },
    { controlId: id, selectionDirection: direction },
  );
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const state = await snapshot(page);
  const control = state.controls.find((candidate) => candidate.id === id)!;
  expect(state.active).toBe(`#${id}`);
  expect(control.direction).toBe(direction);
  expect(control.scrollLeft).toBeGreaterThan(0);
  if (id === "textarea") expect(control.scrollTop).toBeGreaterThan(0);
  expect(state.scroll.y).toBeGreaterThan(0);
  return state;
}

/** Prepare a forward/backward DOM range across two text nodes. */
async function selectContent(page: Page, id: string, direction: "forward" | "backward") {
  await page.evaluate(
    ({ contentId, selectionDirection }) => {
      const content = document.getElementById(contentId)!;
      content.focus({ preventScroll: true });
      const start = document.getElementById(`${contentId}-start`)!.firstChild!;
      const end = document.getElementById(`${contentId}-end`)!.firstChild!;
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      if (selectionDirection === "backward") selection.setBaseAndExtent(end, 12, start, 3);
      else selection.setBaseAndExtent(start, 3, end, 12);
      window.scrollTo(0, 90);
    },
    { contentId: id, selectionDirection: direction },
  );
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const state = await snapshot(page);
  expect(state.active).toBe(`#${id}`);
  expect(state.documentSelection.text).not.toBe("");
  expect(state.documentSelection.ranges).toHaveLength(1);
  expect(state.documentSelection.anchor).toBe(
    `#${id}-${direction === "backward" ? "end" : "start"}/0`,
  );
  return state;
}

/** Invoke the real hook from a browser keyboard event while the original control retains focus. */
async function shortcutCopy(page: Page, sequence: number, expected: boolean) {
  await page.keyboard.press("Control+Alt+c");
  await expect(page.getByTestId("result")).toHaveText(`${sequence}:${expected}`);
  await expect(page.locator("body > textarea")).toHaveCount(0);
}

/** Check one temporary textarea lifecycle per fallback operation and native copy payloads. */
async function expectFallback(page: Page, mode: Mode, count: number) {
  const probe = await page.evaluate(() => (window as unknown as ProbeWindow).clipboardProbe);
  expect(probe.temporaryAdded).toBe(count);
  expect(probe.temporaryRemoved).toBe(count);
  expect(probe.writes).toEqual([]);
  if (mode === "native") {
    expect(probe.copyEvents).toHaveLength(count);
    expect(probe.copyEvents.map((event) => event.selectedText)).toEqual(
      Array.from({ length: count }, () => payload),
    );
    expect(probe.fallbackCalls).toBe(0);
  } else {
    expect(probe.fallbackCalls).toBe(count);
    expect(probe.copyEvents).toEqual([]);
  }
}

for (const mode of ["native", "false", "throw"] as const) {
  test(`${mode}: keyboard button activation restores focus and cleans up repeated copies`, async ({
    page,
  }) => {
    await configure(page, mode);
    const button = page.getByRole("button", { name: "Copy synthetic text" });
    // Reach the button through normal Tab navigation, then use Enter and Space.
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    const before = await snapshot(page);
    await button.press("Enter");
    await expect(page.getByTestId("result")).toHaveText(`1:${mode === "native"}`);
    expect(await snapshot(page)).toEqual(before);
    await button.press("Space");
    await expect(page.getByTestId("result")).toHaveText(`2:${mode === "native"}`);
    expect(await snapshot(page)).toEqual(before);
    await expectFallback(page, mode, 2);
    if (mode === "native") {
      // A click drives native execCommand and trusted paste verifies the exact copied payload.
      await button.click();
      await expect(page.getByTestId("result")).toHaveText("3:true");
      await expect(button).toBeFocused();
      await page.locator("#paste").focus();
      await page.keyboard.press("Control+v");
      await expect(page.locator("#paste")).toHaveValue(payload);
      const probe = await page.evaluate(() => (window as unknown as ProbeWindow).clipboardProbe);
      expect(probe.pasteEvents).toEqual([payload]);
      await expectFallback(page, mode, 3);
    }
  });

  test(`${mode}: input and textarea keep forward/backward selection and scroll`, async ({
    page,
  }) => {
    await configure(page, mode);
    let sequence = 0;
    for (const id of ["input", "textarea"]) {
      for (const direction of ["forward", "backward"] as const) {
        const before = await selectControl(page, id, direction);
        // Two operations catch stale selection snapshots and leaked fallback nodes.
        for (let repeat = 0; repeat < 2; repeat++) {
          await shortcutCopy(page, ++sequence, mode === "native");
          expect(await snapshot(page)).toEqual(before);
        }
      }
    }
    await expectFallback(page, mode, sequence);
  });

  test(`${mode}: DOM and contenteditable ranges preserve direction, endpoints and focus`, async ({
    page,
  }) => {
    await configure(page, mode);
    let sequence = 0;
    for (const id of ["content", "editable"]) {
      for (const direction of ["forward", "backward"] as const) {
        const before = await selectContent(page, id, direction);
        for (let repeat = 0; repeat < 2; repeat++) {
          await shortcutCopy(page, ++sequence, mode === "native");
          expect(await snapshot(page)).toEqual(before);
        }
      }
    }
    await expectFallback(page, mode, sequence);
  });
}

for (const mode of ["modern-success", "modern-denial"] as const) {
  test(`${mode}: Clipboard API preserves focus/selection and never enters fallback`, async ({
    page,
  }) => {
    await configure(page, mode);
    let sequence = 0;
    for (const id of ["input", "textarea"]) {
      const before = await selectControl(page, id, "backward");
      await shortcutCopy(page, ++sequence, mode === "modern-success");
      expect(await snapshot(page)).toEqual(before);
    }
    for (const id of ["content", "editable"]) {
      const before = await selectContent(page, id, "backward");
      await shortcutCopy(page, ++sequence, mode === "modern-success");
      expect(await snapshot(page)).toEqual(before);
    }
    const probe = await page.evaluate(() => (window as unknown as ProbeWindow).clipboardProbe);
    expect(probe.writes).toEqual(Array.from({ length: sequence }, () => payload));
    expect(probe.temporaryAdded).toBe(0);
    expect(probe.temporaryRemoved).toBe(0);
    expect(probe.fallbackCalls).toBe(0);
    expect(probe.copyEvents).toEqual([]);
  });
}
