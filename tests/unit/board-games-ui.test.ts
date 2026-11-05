// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Route as MinesRoute, placeMines } from "../../app/routes/minesweeper";
import { Route as SudokuRoute, solveSudoku } from "../../app/routes/sudoku";
import { Route as TetrisRoute } from "../../app/routes/tetris";

describe("board-game state transitions through actual controls", () => {
  let container: HTMLDivElement;
  let root: Root;
  let frame: FrameRequestCallback | undefined;
  const paint = {
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frame = callback;
        return 1;
      }),
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn(() => {
        frame = undefined;
      }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      paint as unknown as CanvasRenderingContext2D,
    );
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    frame = undefined;
  });
  function mount(component: unknown) {
    act(() => root.render(createElement(component as ComponentType)));
  }
  function get<T extends Element = HTMLElement>(selector: string): T {
    const found = container.querySelector<T>(selector);
    expect(found, selector).not.toBeNull();
    return found!;
  }
  function click(label: string) {
    const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (candidate) =>
        candidate.getAttribute("aria-label") === label || candidate.textContent?.trim() === label,
    );
    expect(button, label).toBeDefined();
    act(() => button!.click());
  }
  function key(key: string, code = key) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true }));
    });
  }
  const mineCell = (row: number, col: number) =>
    container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')[row * 9 + col];

  it("navigates and flags Minesweeper, protects first click, loses on a mine and resets all state", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    mount(MinesRoute.options.component);
    key("ArrowDown"); // No board yet.
    click("ゲームスタート");
    key("ArrowDown");
    key("ArrowRight");
    key("ArrowDown");
    key("ArrowLeft");
    key("ArrowUp");
    key("f");
    expect(mineCell(0, 0).getAttribute("aria-pressed")).toBe("true");
    key("Enter");
    expect(mineCell(0, 0).getAttribute("aria-pressed")).toBe("true");
    key("F");
    key(" ");
    expect(mineCell(0, 0).getAttribute("aria-label")).not.toContain("未開封");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(get("time").getAttribute("aria-label")).toBe("経過時間 2秒");
    const expected = placeMines(9, 9, 10, 0, 0);
    let mine: [number, number] | undefined;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (expected[r][c].isMine) mine = [r, c];
    act(() => mineCell(mine![0], mine![1]).click());
    expect(get(".ms-result.lose").textContent).toContain("ゲームオーバー");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(get("time").getAttribute("aria-label")).toBe("経過時間 2秒");
    click("ゲームをリセット");
    expect(container.querySelector(".ms-result")).toBeNull();
    const reset = get<HTMLButtonElement>('[aria-label="ゲームをリセット"]');
    act(() => Simulate.mouseDown(reset));
    expect(reset.textContent).toBe("😮");
    act(() => Simulate.mouseLeave(reset));
    expect(reset.textContent).toBe("🙂");
    click("中級");
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(256);
    click("上級");
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(480);
  });

  it("wins Minesweeper after every non-mine cell is revealed and automatically flags mines", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    mount(MinesRoute.options.component);
    click("ゲームスタート");
    const expected = placeMines(9, 9, 10, 0, 0);
    act(() => mineCell(0, 0).click());
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        if (!expected[r][c].isMine) act(() => mineCell(r, c).click());
      }
    expect(get(".ms-result.win").textContent).toContain("クリア");
    expect(container.querySelectorAll('[role="gridcell"][aria-pressed="true"]')).toHaveLength(10);
    expect(get('[aria-label="残り地雷数 0"]').textContent).toContain("0");
    click("もう一度");
    expect(container.querySelector(".ms-result")).toBeNull();
  });

  it("keeps Sudoku clues immutable, handles keyboard and number-pad edits, hints, completion and restart", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.4);
    mount(SudokuRoute.options.component);
    key("1");
    click("普通");
    click("簡単");
    click("ゲームスタート");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(get("time").textContent).toBe("00:02");
    const cells = () => Array.from(container.querySelectorAll<HTMLElement>(".sudoku-cell"));
    const board = Array.from({ length: 9 }, (_, r) =>
      cells()
        .slice(r * 9, r * 9 + 9)
        .map((cell) => Number(cell.textContent)),
    );
    const solution = board.map((row) => [...row]);
    expect(solveSudoku(solution)).toBe(true);
    const clue = cells().find((cell) => cell.getAttribute("aria-readonly") === "true")!;
    const original = clue.textContent;
    act(() => clue.click());
    key(original === "1" ? "2" : "1");
    expect(clue.textContent).toBe(original);
    const blank = cells().find((cell) => cell.textContent === "")!;
    act(() => blank.click());
    for (const direction of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) key(direction);
    act(() => blank.click());
    click("1を入力");
    expect(blank.textContent).toBe("1");
    click("クリア");
    expect(blank.textContent).toBe("");
    key("2");
    key("Delete");
    expect(blank.textContent).toBe("");
    for (let remaining = 3; remaining > 0; remaining--) click(`ヒント（残り${remaining}回）`);
    expect(get<HTMLButtonElement>('[aria-label="ヒント（残り0回）"]').disabled).toBe(true);
    expect(container.querySelectorAll(".sudoku-cell.hint")).toHaveLength(3);
    click("リセット");
    expect(container.querySelectorAll(".sudoku-cell.hint")).toHaveLength(0);
    for (let i = 0; i < 81; i++)
      if (board[Math.floor(i / 9)][i % 9] === 0) {
        act(() => cells()[i].click());
        key(String(solution[Math.floor(i / 9)][i % 9]));
      }
    expect(container.querySelector(".sudoku-numpad")).toBeNull();
    expect(container.textContent).toContain("クリア");
    const completedTime = get("time").textContent;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(get("time").textContent).toBe(completedTime);
    click("新しいゲーム");
    expect(container.querySelector(".sudoku-numpad")).not.toBeNull();
    expect(get("time").textContent).toBe("00:00");
  });

  it("renders Tetris, clears lines with real hard drops, pauses, advances gravity and ends a stacked game", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2); // O pieces make a deterministic playable board.
    mount(TetrisRoute.options.component);
    key("ArrowLeft");
    click("ゲームスタート");
    for (const displacement of [-4, -2, 0, 2, 4]) {
      for (let step = 0; step < Math.abs(displacement); step++)
        key("", displacement < 0 ? "ArrowLeft" : "ArrowRight");
      key("", "Space");
    }
    expect(get('[aria-label="ライン: 2"]').textContent).toContain("2");
    expect(get('[aria-label="スコア: 300"]').textContent).toContain("300");
    key("", "ArrowUp");
    key("", "ArrowDown");
    key("p", "KeyP");
    expect(container.textContent).toContain("一時停止");
    key("p", "KeyP");
    expect(frame).toBeDefined();
    act(() => frame!(1000));
    for (let tick = 2; tick < 25; tick++) {
      const callback = frame!;
      act(() => callback(tick * 1001));
    }
    expect(paint.strokeRect).toHaveBeenCalled();
    click("新しいゲーム");
    for (let piece = 0; piece < 11; piece++) key("", "Space");
    expect(container.textContent).toContain("ゲームオーバー");
    expect(localStorage.getItem("tetris-best-score")).not.toBeNull();
    click("もう一度");
    expect(get('[aria-label="スコア: 0"]').textContent).toContain("0");
  });
});
