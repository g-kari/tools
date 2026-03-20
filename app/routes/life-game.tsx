import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/life-game")({
  head: () => ({
    meta: [
      { title: "ライフゲーム | Web ツール集" },
      {
        name: "description",
        content:
          "Conway's Game of Life（ライフゲーム）シミュレーター。グライダー・ブリンカーなどのプリセットパターン付き。セルをクリックして編集可能。",
      },
      { property: "og:title", content: "ライフゲーム | Web ツール集" },
      {
        property: "og:description",
        content:
          "Conway's Game of Life（ライフゲーム）シミュレーター。グライダー・ブリンカーなどのプリセットパターン付き。セルをクリックして編集可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/life-game` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ライフゲーム | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "Conway's Game of Life（ライフゲーム）シミュレーター。グライダー・ブリンカーなどのプリセットパターン付き。セルをクリックして編集可能。",
      },
    ],
  }),
  component: LifeGame,
});

/** グリッドサイズ設定 */
export interface GridSize {
  /** 設定名 */
  name: string;
  /** 列数 */
  cols: number;
  /** 行数 */
  rows: number;
  /** セルのピクセルサイズ */
  cellSize: number;
}

/** グリッドサイズ一覧 */
export const GRID_SIZES: GridSize[] = [
  { name: "小", cols: 40, rows: 25, cellSize: 14 },
  { name: "中", cols: 60, rows: 38, cellSize: 10 },
  { name: "大", cols: 80, rows: 50, cellSize: 8 },
];

/** ゲーム状態 */
export type GameStatus = "idle" | "running" | "paused";

/** プリセットパターンの定義 */
export interface Pattern {
  /** パターン名 */
  name: string;
  /** セルの座標リスト（[col, row] の配列） */
  cells: [number, number][];
}

/** 組み込みプリセットパターン */
export const PRESET_PATTERNS: Pattern[] = [
  {
    name: "グライダー",
    cells: [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    name: "ブリンカー",
    cells: [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: "トード",
    cells: [
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: "ビーコン",
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [3, 2],
      [2, 3],
      [3, 3],
    ],
  },
  {
    name: "R-ペントミノ",
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  },
  {
    name: "グライダー銃",
    cells: [
      [24, 0],
      [22, 1],
      [24, 1],
      [12, 2],
      [13, 2],
      [20, 2],
      [21, 2],
      [34, 2],
      [35, 2],
      [11, 3],
      [15, 3],
      [20, 3],
      [21, 3],
      [34, 3],
      [35, 3],
      [0, 4],
      [1, 4],
      [10, 4],
      [16, 4],
      [20, 4],
      [21, 4],
      [0, 5],
      [1, 5],
      [10, 5],
      [14, 5],
      [16, 5],
      [17, 5],
      [22, 5],
      [24, 5],
      [10, 6],
      [16, 6],
      [24, 6],
      [11, 7],
      [15, 7],
      [12, 8],
      [13, 8],
    ],
  },
];

/**
 * 新しいグリッドを作成する
 * @param cols - 列数
 * @param rows - 行数
 * @returns 全セルが死んでいる（false）グリッド
 */
export function createGrid(cols: number, rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

/**
 * 指定セルの生きている近傍の数を数える
 * @param grid - 現在のグリッド
 * @param col - 列インデックス
 * @param row - 行インデックス
 * @param cols - 総列数
 * @param rows - 総行数
 * @param wrap - 端で折り返すかどうか
 * @returns 生きている近傍の数（0-8）
 */
export function countNeighbors(
  grid: boolean[][],
  col: number,
  row: number,
  cols: number,
  rows: number,
  wrap: boolean
): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      let nr = row + dr;
      let nc = col + dc;
      if (wrap) {
        nr = (nr + rows) % rows;
        nc = (nc + cols) % cols;
      } else {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      }
      if (grid[nr][nc]) count++;
    }
  }
  return count;
}

/**
 * 次の世代のグリッドを計算する
 * ルール:
 *   1. 生きているセルで近傍が2または3なら生存
 *   2. 死んでいるセルで近傍がちょうど3なら誕生
 *   3. それ以外は死亡または維持
 * @param grid - 現在のグリッド
 * @param cols - 列数
 * @param rows - 行数
 * @param wrap - 端で折り返すかどうか
 * @returns 次世代のグリッド
 */
export function nextGeneration(
  grid: boolean[][],
  cols: number,
  rows: number,
  wrap: boolean
): boolean[][] {
  const next = createGrid(cols, rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const neighbors = countNeighbors(grid, c, r, cols, rows, wrap);
      if (grid[r][c]) {
        next[r][c] = neighbors === 2 || neighbors === 3;
      } else {
        next[r][c] = neighbors === 3;
      }
    }
  }
  return next;
}

/**
 * ランダムなグリッドを生成する
 * @param cols - 列数
 * @param rows - 行数
 * @param density - 生きているセルの密度（0.0〜1.0）
 * @returns ランダム生成されたグリッド
 */
export function fillRandom(
  cols: number,
  rows: number,
  density: number
): boolean[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() < density)
  );
}

/**
 * グリッドの生きているセル数を数える
 * @param grid - グリッド
 * @returns 生きているセルの総数
 */
export function countPopulation(grid: boolean[][]): number {
  return grid.reduce(
    (sum, row) => sum + row.filter(Boolean).length,
    0
  );
}

/**
 * グリッドにパターンを配置する（グリッド中央に配置）
 * @param cols - 列数
 * @param rows - 行数
 * @param pattern - 配置するパターン
 * @returns パターンが適用されたグリッド
 */
export function applyPattern(
  cols: number,
  rows: number,
  pattern: Pattern
): boolean[][] {
  const grid = createGrid(cols, rows);
  if (pattern.cells.length === 0) return grid;

  const maxCol = Math.max(...pattern.cells.map(([c]) => c));
  const maxRow = Math.max(...pattern.cells.map(([, r]) => r));
  const offsetC = Math.floor((cols - maxCol) / 2);
  const offsetR = Math.floor((rows - maxRow) / 2);

  for (const [c, r] of pattern.cells) {
    const gc = offsetC + c;
    const gr = offsetR + r;
    if (gc >= 0 && gc < cols && gr >= 0 && gr < rows) {
      grid[gr][gc] = true;
    }
  }
  return grid;
}

/** シミュレーション速度（ms/ステップ） */
const SPEED_OPTIONS = [
  { label: "遅い", ms: 400 },
  { label: "普通", ms: 150 },
  { label: "速い", ms: 50 },
];

/** 初期グリッドサイズインデックス */
const DEFAULT_SIZE_IDX = 1;

/**
 * ライフゲームコンポーネント
 */
function LifeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX);
  const [grid, setGrid] = useState<boolean[][]>(() => {
    const { cols, rows } = GRID_SIZES[DEFAULT_SIZE_IDX];
    return createGrid(cols, rows);
  });
  const [status, setStatus] = useState<GameStatus>("idle");
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [wrap, setWrap] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef(grid);
  const isDrawingRef = useRef(false);
  const drawValueRef = useRef<boolean>(true);

  const { cols, rows, cellSize } = GRID_SIZES[sizeIdx];

  /** gridRef を常に最新に保つ */
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  /** グリッドをキャンバスに描画する */
  const drawGrid = useCallback(
    (g: boolean[][]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // グリッド線
      ctx.strokeStyle = "#21262d";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, rows * cellSize);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(cols * cellSize, r * cellSize);
        ctx.stroke();
      }

      // 生きているセル
      ctx.fillStyle = "#3fb950";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (g[r][c]) {
            ctx.fillRect(
              c * cellSize + 1,
              r * cellSize + 1,
              cellSize - 1,
              cellSize - 1
            );
          }
        }
      }
    },
    [cols, rows, cellSize]
  );

  /** グリッドが変わったら再描画 */
  useEffect(() => {
    drawGrid(grid);
    setPopulation(countPopulation(grid));
  }, [grid, drawGrid]);

  /** サイズ変更時にリセット */
  useEffect(() => {
    stopSimulation();
    const { cols: c, rows: r } = GRID_SIZES[sizeIdx];
    const newGrid = createGrid(c, r);
    setGrid(newGrid);
    setGeneration(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeIdx]);

  /** 1ステップ進める */
  const step = useCallback(() => {
    setGrid((prev) => {
      const next = nextGeneration(prev, cols, rows, wrap);
      return next;
    });
    setGeneration((g) => g + 1);
  }, [cols, rows, wrap]);

  /** シミュレーション開始 */
  const startSimulation = useCallback(() => {
    setStatus("running");
  }, []);

  /** シミュレーション停止 */
  const stopSimulation = useCallback(() => {
    setStatus("paused");
    if (intervalRef.current !== null) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** 実行中のタイマー管理 */
  useEffect(() => {
    if (status === "running") {
      const tick = () => {
        step();
        intervalRef.current = setTimeout(tick, SPEED_OPTIONS[speedIdx].ms);
      };
      intervalRef.current = setTimeout(tick, SPEED_OPTIONS[speedIdx].ms);
      return () => {
        if (intervalRef.current !== null) {
          clearTimeout(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [status, speedIdx, step]);

  /** リセット */
  const reset = useCallback(() => {
    stopSimulation();
    setGrid(createGrid(cols, rows));
    setGeneration(0);
    setStatus("idle");
  }, [cols, rows, stopSimulation]);

  /** ランダム配置 */
  const randomize = useCallback(() => {
    stopSimulation();
    setGrid(fillRandom(cols, rows, 0.3));
    setGeneration(0);
    setStatus("idle");
  }, [cols, rows, stopSimulation]);

  /** プリセット適用 */
  const applyPreset = useCallback(
    (pattern: Pattern) => {
      stopSimulation();
      setGrid(applyPattern(cols, rows, pattern));
      setGeneration(0);
      setStatus("idle");
    },
    [cols, rows, stopSimulation]
  );

  /** キャンバス座標をグリッド座標に変換 */
  const canvasToGrid = useCallback(
    (
      canvas: HTMLCanvasElement,
      clientX: number,
      clientY: number
    ): { c: number; r: number } | null => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const c = Math.floor(x / cellSize);
      const r = Math.floor(y / cellSize);
      if (c < 0 || c >= cols || r < 0 || r >= rows) return null;
      return { c, r };
    },
    [cellSize, cols, rows]
  );

  /** セルをトグルまたは描画 */
  const toggleCell = useCallback(
    (clientX: number, clientY: number, forceValue?: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pos = canvasToGrid(canvas, clientX, clientY);
      if (!pos) return;
      const { c, r } = pos;
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        const value = forceValue !== undefined ? forceValue : !prev[r][c];
        next[r][c] = value;
        return next;
      });
    },
    [canvasToGrid]
  );

  /** マウス/タッチイベントハンドラ */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (status === "running") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pos = canvasToGrid(canvas, e.clientX, e.clientY);
      if (!pos) return;
      const { c, r } = pos;
      drawValueRef.current = !gridRef.current[r][c];
      toggleCell(e.clientX, e.clientY, drawValueRef.current);
    },
    [status, canvasToGrid, toggleCell]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || status === "running") return;
      toggleCell(e.clientX, e.clientY, drawValueRef.current);
    },
    [status, toggleCell]
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const isRunning = status === "running";

  return (
    <div className="life-game-wrapper">
      <h1 className="life-game-title">ライフゲーム</h1>
      <p className="life-game-subtitle">
        Conway&apos;s Game of Life — セルをクリックして編集し、シミュレーションを観察しよう
      </p>

      {/* コントロールバー */}
      <div className="life-game-controls">
        <div className="life-game-controls-left">
          <Button
            onClick={isRunning ? stopSimulation : startSimulation}
            aria-label={isRunning ? "一時停止" : "開始"}
          >
            {isRunning ? "⏸ 一時停止" : "▶ 開始"}
          </Button>
          <Button
            onClick={step}
            disabled={isRunning}
            aria-label="1ステップ進める"
          >
            ⏭ ステップ
          </Button>
          <Button
            onClick={randomize}
            disabled={isRunning}
            aria-label="ランダム配置"
          >
            🎲 ランダム
          </Button>
          <Button
            onClick={reset}
            disabled={isRunning}
            aria-label="リセット"
          >
            🗑 クリア
          </Button>
        </div>

        <div className="life-game-controls-right">
          {/* グリッドサイズ */}
          <div className="life-game-option-group">
            <span className="life-game-option-label">サイズ</span>
            {GRID_SIZES.map((s, i) => (
              <button
                key={s.name}
                className={`life-game-option-btn${sizeIdx === i ? " active" : ""}`}
                onClick={() => setSizeIdx(i)}
                disabled={isRunning}
                aria-pressed={sizeIdx === i}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* 速度 */}
          <div className="life-game-option-group">
            <span className="life-game-option-label">速度</span>
            {SPEED_OPTIONS.map((s, i) => (
              <button
                key={s.label}
                className={`life-game-option-btn${speedIdx === i ? " active" : ""}`}
                onClick={() => setSpeedIdx(i)}
                aria-pressed={speedIdx === i}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 端折り返し */}
          <label className="life-game-wrap-toggle">
            <input
              type="checkbox"
              checked={wrap}
              onChange={(e) => setWrap(e.target.checked)}
              aria-label="端で折り返す"
            />
            <span>端で折り返す</span>
          </label>
        </div>
      </div>

      {/* プリセット */}
      <div className="life-game-presets">
        <span className="life-game-presets-label">プリセット:</span>
        {PRESET_PATTERNS.map((p) => (
          <button
            key={p.name}
            className="life-game-preset-btn"
            onClick={() => applyPreset(p)}
            disabled={isRunning}
            aria-label={`${p.name}パターンを配置`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 統計バー */}
      <div className="life-game-stats" aria-live="polite" aria-atomic="true">
        <span className="life-game-stat">
          <span className="life-game-stat-label">世代</span>
          <span className="life-game-stat-value">{generation}</span>
        </span>
        <span className="life-game-stat">
          <span className="life-game-stat-label">個体数</span>
          <span className="life-game-stat-value">{population}</span>
        </span>
        <span className="life-game-stat">
          <span className="life-game-stat-label">グリッド</span>
          <span className="life-game-stat-value">
            {cols}×{rows}
          </span>
        </span>
      </div>

      {/* キャンバス */}
      <div className="life-game-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={cols * cellSize}
          height={rows * cellSize}
          className="life-game-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          aria-label="ライフゲームグリッド。クリックしてセルを切り替えられます。"
          role="img"
        />
      </div>

      <TipsCard
        sections={[
          {
            title: "遊び方",
            items: [
              "セルをクリック（またはドラッグ）して生死を切り替える",
              "「開始」でシミュレーションを実行、「一時停止」で停止",
              "「ステップ」で1世代ずつ手動進行",
              "プリセットパターンから有名な形を試せる",
            ],
          },
          {
            title: "ライフゲームのルール",
            items: [
              "生きているセルで近傍（8方向）が2または3なら生存",
              "死んでいるセルで近傍がちょうど3なら誕生",
              "それ以外の生きているセルは死亡",
            ],
          },
          {
            title: "プリセットパターン",
            items: [
              "グライダー: 斜め方向に移動するパターン",
              "ブリンカー: 縦横を繰り返す最小振動子",
              "グライダー銃: グライダーを連続生成する固定パターン",
              "R-ペントミノ: 1000世代以上展開し続ける混沌パターン",
            ],
          },
        ]}
      />
    </div>
  );
}
