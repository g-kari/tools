import { describe, it, expect } from "vitest";
import {
  formatKeyEventInfo,
  getKeyDisplayName,
  isModifierKey,
} from "../../app/utils/keycode";

describe("formatKeyEventInfo", () => {
  it("KeyboardEvent から KeyEventInfo を正しく取得する", () => {
    const mockEvent = {
      key: "a",
      code: "KeyA",
      keyCode: 65,
      which: 65,
      charCode: 0,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      type: "keydown",
    } as KeyboardEvent;

    const result = formatKeyEventInfo(mockEvent);

    expect(result.key).toBe("a");
    expect(result.code).toBe("KeyA");
    expect(result.keyCode).toBe(65);
    expect(result.which).toBe(65);
    expect(result.charCode).toBe(0);
    expect(result.ctrlKey).toBe(false);
    expect(result.shiftKey).toBe(false);
    expect(result.altKey).toBe(false);
    expect(result.metaKey).toBe(false);
    expect(result.type).toBe("keydown");
  });

  it("修飾キーが押されている場合、正しく取得する", () => {
    const mockEvent = {
      key: "A",
      code: "KeyA",
      keyCode: 65,
      which: 65,
      charCode: 0,
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      type: "keydown",
    } as KeyboardEvent;

    const result = formatKeyEventInfo(mockEvent);

    expect(result.ctrlKey).toBe(true);
    expect(result.shiftKey).toBe(true);
    expect(result.altKey).toBe(false);
    expect(result.metaKey).toBe(false);
  });

  it("Enter キーのイベントを正しく取得する", () => {
    const mockEvent = {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      charCode: 0,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      type: "keydown",
    } as KeyboardEvent;

    const result = formatKeyEventInfo(mockEvent);

    expect(result.key).toBe("Enter");
    expect(result.code).toBe("Enter");
    expect(result.keyCode).toBe(13);
  });
});

describe("getKeyDisplayName", () => {
  it("スペースキーを 'Space' に変換する", () => {
    expect(getKeyDisplayName(" ")).toBe("Space");
  });

  it("Enter キーに矢印アイコンを付与する", () => {
    expect(getKeyDisplayName("Enter")).toBe("↵ Enter");
  });

  it("Backspace キーに削除アイコンを付与する", () => {
    expect(getKeyDisplayName("Backspace")).toBe("⌫ Backspace");
  });

  it("Tab キーに矢印アイコンを付与する", () => {
    expect(getKeyDisplayName("Tab")).toBe("⇥ Tab");
  });

  it("Escape キーを 'Esc' に変換する", () => {
    expect(getKeyDisplayName("Escape")).toBe("Esc");
  });

  it("矢印キーに方向アイコンを付与する", () => {
    expect(getKeyDisplayName("ArrowUp")).toBe("↑ ArrowUp");
    expect(getKeyDisplayName("ArrowDown")).toBe("↓ ArrowDown");
    expect(getKeyDisplayName("ArrowLeft")).toBe("← ArrowLeft");
    expect(getKeyDisplayName("ArrowRight")).toBe("→ ArrowRight");
  });

  it("通常のキーはそのまま返す", () => {
    expect(getKeyDisplayName("a")).toBe("a");
    expect(getKeyDisplayName("A")).toBe("A");
    expect(getKeyDisplayName("1")).toBe("1");
    expect(getKeyDisplayName("F1")).toBe("F1");
  });

  it("Control キーの表示名を返す", () => {
    expect(getKeyDisplayName("Control")).toBe("⌃ Control");
  });

  it("Shift キーの表示名を返す", () => {
    expect(getKeyDisplayName("Shift")).toBe("⇧ Shift");
  });

  it("Alt キーの表示名を返す", () => {
    expect(getKeyDisplayName("Alt")).toBe("⌥ Alt");
  });

  it("Meta キーの表示名を返す", () => {
    expect(getKeyDisplayName("Meta")).toBe("⌘ Meta");
  });

  it("CapsLock キーの表示名を返す", () => {
    expect(getKeyDisplayName("CapsLock")).toBe("⇪ CapsLock");
  });
});

describe("isModifierKey", () => {
  it("Control は修飾キーと判定する", () => {
    expect(isModifierKey("Control")).toBe(true);
  });

  it("Shift は修飾キーと判定する", () => {
    expect(isModifierKey("Shift")).toBe(true);
  });

  it("Alt は修飾キーと判定する", () => {
    expect(isModifierKey("Alt")).toBe(true);
  });

  it("Meta は修飾キーと判定する", () => {
    expect(isModifierKey("Meta")).toBe(true);
  });

  it("CapsLock は修飾キーと判定する", () => {
    expect(isModifierKey("CapsLock")).toBe(true);
  });

  it("NumLock は修飾キーと判定する", () => {
    expect(isModifierKey("NumLock")).toBe(true);
  });

  it("ScrollLock は修飾キーと判定する", () => {
    expect(isModifierKey("ScrollLock")).toBe(true);
  });

  it("通常のキーは修飾キーではない", () => {
    expect(isModifierKey("a")).toBe(false);
    expect(isModifierKey("Enter")).toBe(false);
    expect(isModifierKey(" ")).toBe(false);
    expect(isModifierKey("F1")).toBe(false);
    expect(isModifierKey("ArrowUp")).toBe(false);
    expect(isModifierKey("1")).toBe(false);
  });

  it("空文字列は修飾キーではない", () => {
    expect(isModifierKey("")).toBe(false);
  });
});
