import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/sudoku")({
  head: () => ({
    meta: [
      { title: "数独ゲーム | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザで遊べる数独ゲーム。難易度3段階（簡単・普通・難しい）、ヒント機能、タイマー付き。",
      },
      { property: "og:title", content: "数独ゲーム | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブラウザで遊べる数独ゲーム。難易度3段階（簡単・普通・難しい）、ヒント機能、タイマー付き。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sudoku` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "数独ゲーム | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブラウザで遊べる数独ゲーム。難易度3段階（簡単・普通・難しい）、ヒント機能、タイマー付き。",
      },
    ],
  }),
  component: SudokuGame,
});

/** 9x9 の盤面表現（0 = 空きセル） */
export type SudokuBoard = number[][];

/** 難易度 */
export type Difficulty = "easy" | "medium" | "hard";

/** 数独パズルデータ */
export interface SudokuPuzzle {
  /** 初期盤面（0=空き） */
  puzzle: SudokuBoard;
  /** 完全解 */
  solution: SudokuBoard;
}

/** ヒントフラグ付きユーザー入力値 */
export interface CellValue {
  /** 入力された数値 */
  value: number;
  /** ヒントで埋められたかどうか */
  isHint: boolean;
}

/** 難易度ごとの除去セル数 */
const REMOVE_COUNTS: Record<Difficulty, number> = {
  easy: 35,
  medium: 45,
  hard: 55,
};

/**
 * 盤面の指定位置に数値を置けるかを検証する（行・列・3x3ブロック）
 * @param board - 現在の盤面（0=空き）
 * @param row - 行インデックス（0-8）
 * @param col - 列インデックス（0-8）
 * @param num - 配置する数値（1-9）
 * @returns 配置可能なら true
 * @example
 * const board = Array.from({ length: 9 }, () => Array(9).fill(0));
 * isValidPlacement(board, 0, 0, 5); // true
 */
export function isValidPlacement(
  board: SudokuBoard,
  row: number,
  col: number,
  num: number,
): boolean {
  // 行チェック
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // 列チェック
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // 3x3 ブロックチェック
  const blockRow = Math.floor(row / 3) * 3;
  const blockCol = Math.floor(col / 3) * 3;
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

/**
 * バックトラッキングで数独を解く（破壊的に board を変更する）
 * @param board - 解く盤面（0=空き、破壊的変更あり）
 * @returns 解が見つかれば true
 * @example
 * const board = createEmptyBoard();
 * const solved = solveSudoku(board);
 */
export function solveSudoku(board: SudokuBoard): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;
      // シャッフルして多様な解を生成
      const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of nums) {
        if (isValidPlacement(board, row, col, num)) {
          board[row][col] = num;
          if (solveSudoku(board)) return true;
          board[row][col] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/**
 * 数独パズルを生成する
 * @param difficulty - 難易度（"easy" | "medium" | "hard"）
 * @param maxAttempts - 生成を試みる最大回数（デフォルト3）
 * @returns パズルと解のペア
 * @example
 * const { puzzle, solution } = generateSudoku("easy");
 */
export function generateSudoku(difficulty: Difficulty, maxAttempts = 3): SudokuPuzzle {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = createEmptyBoard();
    // 対角線の3つの独立した3x3ブロックを先に埋める（バックトラッキング高速化）
    fillDiagonalBlocks(board);
    if (!solveSudoku(board)) continue;

    const solution = board.map((row) => [...row]);
    const puzzle = board.map((row) => [...row]);

    const removeCount = REMOVE_COUNTS[difficulty];
    const positions = shuffleArray(Array.from({ length: 81 }, (_, i) => i)).slice(0, removeCount);

    for (const pos of positions) {
      puzzle[Math.floor(pos / 9)][pos % 9] = 0;
    }

    return { puzzle, solution };
  }
  // フォールバック: 最低限の空盤面を返す
  const empty = createEmptyBoard();
  return { puzzle: empty, solution: empty };
}

/**
 * ユーザー入力と初期値を合算した盤面から競合セルのキーセットを返す
 * @param puzzle - 初期盤面（0=空き）
 * @param userValues - ユーザー入力値マップ（"row-col" → CellValue）
 * @returns 競合しているセルのキー（"row-col" 形式）の Set
 * @example
 * const conflicts = getConflictCells(puzzle, new Map([["0-0", { value: 5, isHint: false }]]));
 */
export function getConflictCells(
  puzzle: SudokuBoard,
  userValues: Map<string, CellValue>,
): Set<string> {
  // 合算盤面を構築
  const board: SudokuBoard = puzzle.map((row, r) =>
    row.map((cell, c) => {
      if (cell !== 0) return cell;
      return userValues.get(`${r}-${c}`)?.value ?? 0;
    }),
  );

  const conflicts = new Set<string>();
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = board[row][col];
      if (val === 0) continue;
      // 一時的に0にして重複チェック
      board[row][col] = 0;
      if (!isValidPlacement(board, row, col, val)) {
        conflicts.add(`${row}-${col}`);
      }
      board[row][col] = val;
    }
  }
  return conflicts;
}

/**
 * 盤面が完成しているかを判定する（全セル埋め & 競合なし）
 * @param puzzle - 初期盤面（0=空き）
 * @param userValues - ユーザー入力値マップ
 * @returns 完成していれば true
 * @example
 * const done = isBoardComplete(puzzle, userValues);
 */
export function isBoardComplete(puzzle: SudokuBoard, userValues: Map<string, CellValue>): boolean {
  // 全セルが埋まっているか
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) continue;
      if (!userValues.has(`${row}-${col}`)) return false;
    }
  }
  // 競合がないか
  return getConflictCells(puzzle, userValues).size === 0;
}

/**
 * 秒数を MM:SS 形式の文字列に変換する
 * @param seconds - 秒数（0以上）
 * @returns "MM:SS" 形式の文字列
 * @example
 * formatTime(0)    // "00:00"
 * formatTime(65)   // "01:05"
 * formatTime(3661) // "61:01"
 */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── 内部ヘルパー ────────────────────────────────────────────────────────────

/**
 * 空の 9x9 盤面を生成する
 * @returns 全要素が0の 9x9 配列
 */
function createEmptyBoard(): SudokuBoard {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/**
 * 配列をフィッシャー–イェーツアルゴリズムでシャッフルする
 * @param arr - シャッフル対象の配列（コピーして返す）
 * @returns シャッフル済みの新しい配列
 */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 3x3ブロックを1〜9でランダムに埋める
 * @param board - 更新対象の盤面（破壊的変更）
 * @param blockRow - ブロックの開始行（0, 3, 6）
 * @param blockCol - ブロックの開始列（0, 3, 6）
 */
function fillBlock(board: SudokuBoard, blockRow: number, blockCol: number): void {
  const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let idx = 0;
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      board[r][c] = nums[idx++];
    }
  }
}

/**
 * 対角線上の3つの独立した3x3ブロックをランダムに埋める
 * @param board - 更新対象の盤面（破壊的変更）
 */
function fillDiagonalBlocks(board: SudokuBoard): void {
  fillBlock(board, 0, 0);
  fillBlock(board, 3, 3);
  fillBlock(board, 6, 6);
}

// ── React コンポーネント ─────────────────────────────────────────────────────

const HINT_MAX = 3;

/**
 * 数独ゲームコンポーネント
 * 難易度選択・ヒント・タイマーを備えたブラウザ完結型の数独ゲームです。
 *
 * @returns 数独ゲームページのReactコンポーネント
 */
function SudokuGame() {
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
  const [userValues, setUserValues] = useState<Map<string, CellValue>>(new Map());
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintCount, setHintCount] = useState(HINT_MAX);
  const boardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タイマー制御
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!puzzle || isComplete) return;
      if (!selectedCell) return;
      const [row, col] = selectedCell;

      if (e.key === "ArrowUp" && row > 0) {
        e.preventDefault();
        setSelectedCell([row - 1, col]);
      } else if (e.key === "ArrowDown" && row < 8) {
        e.preventDefault();
        setSelectedCell([row + 1, col]);
      } else if (e.key === "ArrowLeft" && col > 0) {
        e.preventDefault();
        setSelectedCell([row, col - 1]);
      } else if (e.key === "ArrowRight" && col < 8) {
        e.preventDefault();
        setSelectedCell([row, col + 1]);
      } else if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        handleInput(row, col, parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        handleInput(row, col, 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [puzzle, selectedCell, isComplete, userValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(
    (row: number, col: number, num: number) => {
      if (!puzzle) return;
      if (puzzle.puzzle[row][col] !== 0) return; // 初期値セルは変更不可
      if (isComplete) return;

      const key = `${row}-${col}`;
      const next = new Map(userValues);
      if (num === 0) {
        next.delete(key);
      } else {
        next.set(key, { value: num, isHint: false });
      }
      setUserValues(next);

      const conflicts = getConflictCells(puzzle.puzzle, next);
      setConflictCells(conflicts);

      if (isBoardComplete(puzzle.puzzle, next)) {
        setIsComplete(true);
        setIsRunning(false);
      }
    },
    [puzzle, userValues, isComplete],
  );

  const handleStart = () => {
    const newPuzzle = generateSudoku(difficulty);
    setPuzzle(newPuzzle);
    setUserValues(new Map());
    setConflictCells(new Set());
    setSelectedCell(null);
    setIsComplete(false);
    setElapsedSeconds(0);
    setIsRunning(true);
    setHintCount(HINT_MAX);
  };

  const handleReset = () => {
    if (!puzzle) return;
    setUserValues(new Map());
    setConflictCells(new Set());
    setSelectedCell(null);
    setIsComplete(false);
    setElapsedSeconds(0);
    setIsRunning(true);
    setHintCount(HINT_MAX);
  };

  const handleHint = () => {
    if (!puzzle || hintCount <= 0 || isComplete) return;
    // 空きセルをランダムに1つ選んで解を埋める
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.puzzle[r][c] === 0 && !userValues.has(`${r}-${c}`)) {
          emptyCells.push([r, c]);
        }
      }
    }
    if (emptyCells.length === 0) return;

    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const next = new Map(userValues);
    next.set(`${r}-${c}`, {
      value: puzzle.solution[r][c],
      isHint: true,
    });
    setUserValues(next);
    setHintCount((h) => h - 1);
    setSelectedCell([r, c]);

    const conflicts = getConflictCells(puzzle.puzzle, next);
    setConflictCells(conflicts);

    if (isBoardComplete(puzzle.puzzle, next)) {
      setIsComplete(true);
      setIsRunning(false);
    }
  };

  const selectedValue =
    selectedCell && puzzle
      ? puzzle.puzzle[selectedCell[0]][selectedCell[1]] ||
        userValues.get(`${selectedCell[0]}-${selectedCell[1]}`)?.value
      : null;

  return (
    <div className="tool-container">
      <h1 className="tool-title">数独ゲーム</h1>
      <p className="tool-description">
        ブラウザで遊べる数独ゲームです。9×9のグリッドに1〜9の数字を入れて、縦・横・3×3ブロックに同じ数字が重複しないように完成させましょう。
      </p>

      {/* 難易度選択 & スタートボタン */}
      <section className="sudoku-controls" aria-label="ゲーム設定">
        <div className="sudoku-difficulty-group" role="group" aria-label="難易度選択">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`sudoku-difficulty-btn ${difficulty === d ? "active" : ""}`}
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
            >
              {d === "easy" ? "簡単" : d === "medium" ? "普通" : "難しい"}
            </button>
          ))}
        </div>
        <Button className="sudoku-start-btn" onClick={handleStart}>
          {puzzle ? "新しいゲーム" : "ゲームスタート"}
        </Button>
      </section>

      {/* ボードエリア */}
      {puzzle && (
        <>
          {/* タイマー & ヒント */}
          <div className="sudoku-board-header">
            <time
              className="sudoku-timer"
              aria-live="off"
              aria-label={`経過時間 ${formatTime(elapsedSeconds)}`}
            >
              {formatTime(elapsedSeconds)}
            </time>
            <div className="sudoku-actions">
              <Button
                variant="outline"
                className="sudoku-hint-btn"
                onClick={handleHint}
                disabled={hintCount <= 0 || isComplete}
                aria-label={`ヒント（残り${hintCount}回）`}
              >
                💡 ヒント（{hintCount}）
              </Button>
              <Button
                variant="outline"
                className="sudoku-reset-btn"
                onClick={handleReset}
                aria-label="リセット"
              >
                ↺ リセット
              </Button>
            </div>
          </div>

          {/* 数独ボード */}
          <div ref={boardRef} className="sudoku-board" role="grid" aria-label="数独ボード">
            {puzzle.puzzle.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const key = `${rowIdx}-${colIdx}`;
                const userCell = userValues.get(key);
                const displayValue = cell !== 0 ? cell : (userCell?.value ?? null);
                const isGiven = cell !== 0;
                const isSelected = selectedCell?.[0] === rowIdx && selectedCell?.[1] === colIdx;
                const isConflict = conflictCells.has(key);
                const isHint = userCell?.isHint ?? false;
                const isSameNumber =
                  selectedValue !== null &&
                  selectedValue !== undefined &&
                  displayValue === selectedValue &&
                  !isSelected;

                const classNames = [
                  "sudoku-cell",
                  isGiven ? "given" : "",
                  isSelected ? "selected" : "",
                  isConflict ? "conflict" : "",
                  isHint ? "hint" : "",
                  isSameNumber ? "same-number" : "",
                  // 3x3ブロック境界
                  colIdx % 3 === 0 ? "block-left" : "",
                  colIdx % 3 === 2 ? "block-right" : "",
                  rowIdx % 3 === 0 ? "block-top" : "",
                  rowIdx % 3 === 2 ? "block-bottom" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={key}
                    className={classNames}
                    role="gridcell"
                    tabIndex={isSelected ? 0 : -1}
                    aria-label={`行${rowIdx + 1}列${colIdx + 1}${displayValue ? ` 値${displayValue}` : " 空"}`}
                    aria-selected={isSelected}
                    aria-readonly={isGiven}
                    aria-invalid={isConflict}
                    onClick={() => {
                      if (!isComplete) setSelectedCell([rowIdx, colIdx]);
                    }}
                  >
                    {displayValue ?? ""}
                  </div>
                );
              }),
            )}
          </div>

          {/* 数字入力パッド */}
          {!isComplete && (
            <div className="sudoku-numpad" role="group" aria-label="数字入力パッド">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  className="sudoku-numpad-btn"
                  onClick={() => {
                    if (selectedCell) {
                      handleInput(selectedCell[0], selectedCell[1], n);
                    }
                  }}
                  aria-label={`${n}を入力`}
                >
                  {n}
                </button>
              ))}
              <button
                className="sudoku-numpad-btn sudoku-numpad-clear"
                onClick={() => {
                  if (selectedCell) {
                    handleInput(selectedCell[0], selectedCell[1], 0);
                  }
                }}
                aria-label="クリア"
              >
                ✕
              </button>
            </div>
          )}

          {/* クリアバナー */}
          {isComplete && (
            <div className="sudoku-complete" role="status" aria-live="assertive" aria-atomic="true">
              <span className="sudoku-complete-icon">🎉</span>
              <p className="sudoku-complete-title">クリア！</p>
              <p className="sudoku-complete-time">タイム: {formatTime(elapsedSeconds)}</p>
              <Button className="sudoku-start-btn" onClick={handleStart}>
                もう一度
              </Button>
            </div>
          )}
        </>
      )}

      <TipsCard
        tips={[
          "矢印キーでセルを移動し、数字キーで入力できます。",
          "Backspace / Delete キーで入力をクリアできます。",
          "同じ数字のセルが薄くハイライトされます。",
          "競合（重複）しているセルは赤でハイライトされます。",
          `ヒントは最大${HINT_MAX}回まで使用できます。`,
        ]}
      />
    </div>
  );
}
