// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Route as PomodoroRoute } from "../../app/routes/pomodoro";
import { Route as TypingRoute } from "../../app/routes/typing-speed";
import { Route as TicTacToeRoute } from "../../app/routes/tic-tac-toe";
import { Route as WordleRoute } from "../../app/routes/wordle";
import { Route as SnakeRoute } from "../../app/routes/snake";
import { Route as LifeRoute } from "../../app/routes/life-game";

describe("interactive games and timers", () => {
  let container: HTMLDivElement;
  let root: Root;
  let frame: FrameRequestCallback | undefined;
  const paint = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-29T00:00:00Z"));
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
  function element<T extends Element = HTMLElement>(selector: string): T {
    const result = container.querySelector<T>(selector);
    expect(result, selector).not.toBeNull();
    return result!;
  }
  function click(label: string) {
    const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (candidate) =>
        candidate.getAttribute("aria-label") === label || candidate.textContent?.trim() === label,
    );
    expect(button, label).toBeDefined();
    act(() => button!.click());
  }
  function change(selector: string, value: string) {
    const input = element<HTMLInputElement>(selector);
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
  }
  function key(value: string, code = value, extra: KeyboardEventInit = {}) {
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: value, code, bubbles: true, ...extra }),
      );
    });
  }
  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it("completes four work sessions, short and long breaks, pauses and resets without stray ticks", () => {
    const oscillator = {
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gain = {
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    };
    vi.stubGlobal(
      "AudioContext",
      class {
        currentTime = 0;
        destination = {};
        createOscillator = () => oscillator;
        createGain = () => gain;
      },
    );
    mount(PomodoroRoute.options.component);
    change("#work-minutes", "0");
    expect(element<HTMLInputElement>("#work-minutes").value).toBe("25");
    change("#work-minutes", "-1");
    expect(element<HTMLInputElement>("#work-minutes").value).toBe("1");
    change("#short-break-minutes", "100");
    expect(element<HTMLInputElement>("#short-break-minutes").value).toBe("30");
    change("#short-break-minutes", "1");
    change("#long-break-minutes", "1");
    click("開始");
    expect(element<HTMLInputElement>("#work-minutes").disabled).toBe(true);
    advance(1000);
    expect(element(".pomodoro-time").textContent).toBe("00:59");
    click("一時停止");
    advance(3000);
    expect(element(".pomodoro-time").textContent).toBe("00:59");
    click("現在のフェーズをリセット");
    for (let session = 1; session <= 4; session++) {
      click("開始");
      advance(60000);
      expect(element(".pomodoro-phase-label").textContent).toBe(
        session === 4 ? "長い休憩" : "短い休憩",
      );
      expect(element(".pomodoro-sessions-count").textContent).toContain(
        `${session} セッション完了`,
      );
      click("開始");
      advance(60000);
      expect(element(".pomodoro-phase-label").textContent).toBe("作業");
    }
    expect(oscillator.start).toHaveBeenCalledTimes(8);
    click("全てをリセット（セッション数も含む）");
    expect(element(".pomodoro-sessions-count").textContent).toContain("0 セッション完了");
    advance(5000);
    expect(element(".pomodoro-time").textContent).toBe("01:00");
  });

  it("records typing completion and timeout results, rejects excessive input, and cancels with Escape", () => {
    mount(TypingRoute.options.component);
    click("15秒");
    click("テスト開始");
    advance(1000);
    const target = element(".typing-text-display").textContent!.replaceAll("\u00a0", " ");
    change('[data-testid="typing-input"]', "#");
    expect(element(".typing-count-incorrect").textContent).toBe("1");
    change('[data-testid="typing-input"]', target + "extra");
    expect(element<HTMLInputElement>('[data-testid="typing-input"]').value).toBe("#");
    change('[data-testid="typing-input"]', target);
    expect(element(".typing-result-card").textContent).toContain("100%");
    expect(element(".typing-count-correct").textContent).toBe(String(target.length));
    click("もう一度");
    click("テスト開始");
    advance(15000);
    expect(element(".typing-result-card").textContent).toContain("0");
    expect(container.querySelectorAll(".typing-history-item")).toHaveLength(2);
    click("もう一度");
    const categories = Array.from(
      element('[aria-label="テキスト種類選択"]').querySelectorAll<HTMLButtonElement>("button"),
    );
    act(() => categories[1].click());
    expect(categories[1].getAttribute("aria-pressed")).toBe("true");
    click("テスト開始");
    act(() => Simulate.keyDown(element('[data-testid="typing-input"]'), { key: "Escape" }));
    expect(element<HTMLInputElement>('[data-testid="typing-input"]').disabled).toBe(true);
    expect(container.textContent).toContain("テスト開始");
  });

  it("scores player wins and a draw, locks finished cells, and resets scores when switching modes", () => {
    mount(TicTacToeRoute.options.component);
    click("2人対戦");
    const move = (index: number) =>
      act(() => container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')[index].click());
    for (const index of [0, 3, 1, 4, 2]) move(index);
    expect(element('[aria-label="ゲーム状態"]').textContent).toContain("プレイヤー X の勝ち");
    expect(element('[aria-label="X: 1勝"]').textContent).toBe("1");
    expect(
      Array.from(container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')).every(
        (cell) => cell.disabled,
      ),
    ).toBe(true);
    click("ゲームをリセット");
    for (const index of [0, 3, 1, 4, 8, 5]) move(index);
    expect(element('[aria-label="ゲーム状態"]').textContent).toContain("プレイヤー O の勝ち");
    click("ゲームをリセット");
    for (const index of [0, 1, 2, 4, 3, 5, 7, 6, 8]) move(index);
    expect(element('[aria-label="ゲーム状態"]').textContent).toContain("引き分け");
    expect(element('[aria-label="引き分け: 1回"]').textContent).toBe("1");
    click("スコアをリセット");
    click("CPU対戦");
    click("かんたん");
    vi.spyOn(Math, "random").mockReturnValue(0);
    move(4);
    expect(element('[aria-label="ゲーム状態"]').textContent).toContain("考え中");
    advance(400);
    expect(container.querySelectorAll(".ttt-cell--o")).toHaveLength(1);
    click("強い");
    expect(container.querySelectorAll(".ttt-cell--o")).toHaveLength(0);
    move(0);
    advance(400);
    expect(container.querySelectorAll(".ttt-cell--o")).toHaveLength(1);
  });

  it("validates Wordle keyboard input, wins and loses, and starts a clean subsequent game", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // The first documented word is ABOUT.
    mount(WordleRoute.options.component);
    key("Enter");
    expect(element(".wordle-row").className).toContain("shake");
    advance(600);
    key("a", "KeyA", { ctrlKey: true });
    expect(element(".wordle-cell").textContent).toBe("");
    key("z");
    key("Backspace");
    for (const letter of "ABOUT") click(letter);
    click("ENTER");
    expect(element('[role="alert"]').textContent).toContain("クリア");
    expect(element(".wordle-score-win").textContent).toContain("1勝");
    key("a");
    expect(container.querySelectorAll(".wordle-cell-correct")).toHaveLength(5);
    click("新しいゲームを開始");
    for (let guess = 0; guess < 6; guess++) {
      for (const letter of "XXXXX") key(letter);
      key("Enter");
    }
    expect(element('[role="alert"]').textContent).toContain("ゲームオーバー");
    expect(element(".wordle-score-lose").textContent).toContain("1敗");
    click("新しいゲームを開始");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelectorAll(".wordle-cell-input")).toHaveLength(0);
  });

  it("draws Snake, handles pause and direction keys, ends on a wall and can restart", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    mount(SnakeRoute.options.component);
    expect(paint.fillRect).toHaveBeenCalled();
    click("ゲームスタート");
    key(" ", "Space");
    expect(container.textContent).toContain("一時停止中");
    key(" ", "Space");
    key("a", "KeyA"); // Reversing into the body is ignored.
    for (let tick = 1; tick <= 10; tick++) {
      const callback = frame;
      expect(callback).toBeDefined();
      act(() => callback!(tick * 151));
    }
    expect(container.textContent).toContain("ゲームオーバー");
    expect(localStorage.getItem("snake-best-score")).not.toBeNull();
    click("新しいゲーム");
    key("w", "KeyW");
    act(() => frame!(151));
    click("一時停止");
    click("再開");
    expect(container.querySelector(".snake-overlay-over")).toBeNull();
  });

  it("edits Life cells, applies patterns, advances, pauses and clears on size changes", () => {
    mount(LifeRoute.options.component);
    const canvas = element<HTMLCanvasElement>("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: canvas.width,
      height: canvas.height,
      right: canvas.width,
      bottom: canvas.height,
      toJSON: () => ({}),
    });
    Object.defineProperty(canvas, "setPointerCapture", { value: vi.fn(), configurable: true });
    const pointerData: NonNullable<Parameters<typeof Simulate.pointerDown>[1]> & {
      pointerId: number;
    } = { pointerId: 1, clientX: 5, clientY: 5 };
    act(() => Simulate.pointerDown(canvas, pointerData));
    act(() => Simulate.pointerMove(canvas, { ...pointerData, clientX: 25 }));
    act(() => Simulate.pointerUp(canvas));
    expect(element(".life-game-stats").textContent).toContain("個体数2");
    click("リセット");
    const preset = element<HTMLButtonElement>(".life-game-preset-btn");
    act(() => preset.click());
    expect(element(".life-game-stats").textContent).not.toContain("個体数0");
    click("1ステップ進める");
    expect(element(".life-game-stats").textContent).toContain("世代1");
    click("開始");
    advance(1000);
    click("一時停止");
    const paused = element(".life-game-stats").textContent;
    advance(1000);
    expect(element(".life-game-stats").textContent).toBe(paused);
    const sizeButtons = container.querySelectorAll<HTMLButtonElement>(
      ".life-game-option-group:first-child button",
    );
    act(() => sizeButtons[0].click());
    expect(element(".life-game-stats").textContent).toContain("世代0");
    expect(element(".life-game-stats").textContent).toContain("個体数0");
    const wrap = element<HTMLInputElement>('[aria-label="端で折り返す"]');
    act(() => {
      wrap.checked = false;
      Simulate.change(wrap);
    });
    vi.spyOn(Math, "random").mockReturnValue(0);
    click("ランダム配置");
    expect(element(".life-game-stats").textContent).not.toContain("個体数0");
    click("リセット");
    expect(element(".life-game-stats").textContent).toContain("個体数0");
  });
});
