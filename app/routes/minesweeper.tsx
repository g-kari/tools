import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/minesweeper")({
  head: () => ({
    meta: [
      { title: "マインスイーパー | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザで遊べるマインスイーパー。難易度3段階（初級・中級・上級）、タイマー・地雷カウンター付き。右クリックでフラグを立てられます。",
      },
      {
        property: "og:title",
        content: "マインスイーパー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "ブラウザで遊べるマインスイーパー。難易度3段階（初級・中級・上級）、タイマー・地雷カウンター付き。右クリックでフラグを立てられます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/minesweeper` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "マインスイーパー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "ブラウザで遊べるマインスイーパー。難易度3段階（初級・中級・上級）、タイマー・地雷カウンター付き。右クリックでフラグを立てられます。",
      },
    ],
  }),
  component: Minesweeper,
});

/** 難易度 */
export type Difficulty = "easy" | "medium" | "hard";

/** セルの状態 */
export type CellState = "hidden" | "revealed" | "flagged";

/** ゲームの状態 */
export type GameStatus = "idle" | "playing" | "won" | "lost";

/** セル情報 */
export interface Cell {
  /** 地雷かどうか */
  isMine: boolean;
  /** セルの状態 */
  state: CellState;
  /** 隣接する地雷の数（0-8） */
  adjacentMines: number;
  /** ゲームオーバー時の爆発セルかどうか */
  isExploded: boolean;
}

/** ゲームボード（行×列の2次元配列） */
export type Board = Cell[][];

/** 難易度設定 */
export interface DifficultyConfig {
  /** 列数 */
  cols: number;
  /** 行数 */
  rows: number;
  /** 地雷数 */
  mines: number;
}

/** 難易度別設定 */
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { cols: 9, rows: 9, mines: 10 },
  medium: { cols: 16, rows: 16, mines: 40 },
  hard: { cols: 30, rows: 16, mines: 99 },
};

/**
 * 空のゲームボードを生成する
 * @param rows - 行数
 * @param cols - 列数
 * @returns 全セルが未開放・非地雷の初期ボード
 * @example
 * const board = createEmptyBoard(9, 9);
 */
export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      state: "hidden" as CellState,
      adjacentMines: 0,
      isExploded: false,
    }))
  );
}

/**
 * 地雷を配置してボードを初期化する（最初のクリック位置とその周囲は安全）
 * @param rows - 行数
 * @param cols - 列数
 * @param mineCount - 地雷数
 * @param safeRow - 安全にする行インデックス（最初のクリック位置）
 * @param safeCol - 安全にする列インデックス（最初のクリック位置）
 * @returns 地雷配置済みボード
 * @example
 * const board = placeMines(9, 9, 10, 4, 4);
 */
export function placeMines(
  rows: number,
  cols: number,
  mineCount: number,
  safeRow: number,
  safeCol: number
): Board {
  const board = createEmptyBoard(rows, cols);

  // 安全ゾーン（最初のクリック周囲3x3）
  const safeZone = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeRow + dr;
      const c = safeCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        safeZone.add(`${r},${c}`);
      }
    }
  }

  // 地雷を配置できる位置のリストを作成
  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeZone.has(`${r},${c}`)) {
        candidates.push([r, c]);
      }
    }
  }

  // フィッシャー–イェーツシャッフルで地雷をランダム配置
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const minesPlaced = Math.min(mineCount, candidates.length);
  for (let i = 0; i < minesPlaced; i++) {
    const [r, c] = candidates[i];
    board[r][c].isMine = true;
  }

  // 隣接地雷数を計算
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        board[r][c].adjacentMines = countAdjacentMines(board, r, c, rows, cols);
      }
    }
  }

  return board;
}

/**
 * 指定セルの隣接地雷数を数える
 * @param board - 現在のボード
 * @param row - 行インデックス
 * @param col - 列インデックス
 * @param rows - 総行数
 * @param cols - 総列数
 * @returns 隣接する地雷の数（0-8）
 * @example
 * const count = countAdjacentMines(board, 4, 4, 9, 9);
 */
export function countAdjacentMines(
  board: Board,
  row: number,
  col: number,
  rows: number,
  cols: number
): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].isMine) {
        count++;
      }
    }
  }
  return count;
}

/**
 * セルを開放する（隣接地雷0のセルは連鎖的に開放するフラッドフィル）
 * @param board - 更新対象ボード（破壊的変更）
 * @param row - 開放する行インデックス
 * @param col - 開放する列インデックス
 * @param rows - 総行数
 * @param cols - 総列数
 * @example
 * revealCell(board, 0, 0, 9, 9);
 */
export function revealCell(
  board: Board,
  row: number,
  col: number,
  rows: number,
  cols: number
): void {
  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const cell = board[r][c];
    if (cell.state !== "hidden") continue;
    cell.state = "revealed";
    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            board[nr][nc].state === "hidden"
          ) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }
}

/**
 * ゲームクリア（全非地雷セルが開放済み）かどうかを判定する
 * @param board - 現在のボード
 * @param mineCount - 地雷の総数
 * @returns クリアしていれば true
 * @example
 * const won = isGameWon(board, 10);
 */
export function isGameWon(board: Board, mineCount: number): boolean {
  let hiddenCount = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state !== "revealed") hiddenCount++;
    }
  }
  return hiddenCount === mineCount;
}

/**
 * 秒数を SS または MM:SS 形式に変換する
 * @param seconds - 秒数（0以上）
 * @returns 秒数が60未満なら "SS秒"、60以上なら "MM:SS" 形式
 * @example
 * formatTime(5)   // "05"
 * formatTime(65)  // "01:05"
 */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return String(sec).padStart(2, "0");
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── React コンポーネント ─────────────────────────────────────────────────────

/** 隣接地雷数に対応する CSS クラス名 */
const NUMBER_CLASS: Record<number, string> = {
  1: "n1",
  2: "n2",
  3: "n3",
  4: "n4",
  5: "n5",
  6: "n6",
  7: "n7",
  8: "n8",
};

/** ゲーム状態に対応するリセットボタンの絵文字 */
function getResetEmoji(status: GameStatus, isMouseDown: boolean): string {
  if (isMouseDown) return "😮";
  if (status === "won") return "😎";
  if (status === "lost") return "😵";
  return "🙂";
}

/**
 * マインスイーパーゲームコンポーネント
 * 難易度3段階・フラグ機能・タイマー・地雷カウンターを備えたブラウザ完結型のマインスイーパーです。
 *
 * @returns マインスイーパーゲームページのReactコンポーネント
 */
function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Board | null>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [minesLeft, setMinesLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstClickRef = useRef(true);

  // タイマー制御
  useEffect(() => {
    if (status === "playing") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => Math.min(s + 1, 999));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const startGame = useCallback(
    (diff: Difficulty = difficulty) => {
      const config = DIFFICULTY_CONFIGS[diff];
      setBoard(createEmptyBoard(config.rows, config.cols));
      setStatus("idle");
      setMinesLeft(config.mines);
      setElapsedSeconds(0);
      setSelectedCell(null);
      isFirstClickRef.current = true;
    },
    [difficulty]
  );

  // 難易度変更時にゲームをリセット
  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff);
    startGame(diff);
  };

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (status === "won" || status === "lost") return;
      if (!board) return;

      const cell = board[row][col];
      if (cell.state === "flagged" || cell.state === "revealed") return;

      const config = DIFFICULTY_CONFIGS[difficulty];
      let currentBoard = board.map((r) => r.map((c) => ({ ...c })));

      // 初回クリック時に地雷を配置
      if (isFirstClickRef.current) {
        isFirstClickRef.current = false;
        currentBoard = placeMines(
          config.rows,
          config.cols,
          config.mines,
          row,
          col
        );
        setStatus("playing");
      }

      // 地雷をクリックした場合
      if (currentBoard[row][col].isMine) {
        currentBoard[row][col].isExploded = true;
        // 全地雷を開放
        for (let r = 0; r < config.rows; r++) {
          for (let c = 0; c < config.cols; c++) {
            const c_ = currentBoard[r][c];
            if (c_.isMine && !c_.isExploded) {
              c_.state = "revealed";
            }
            // 誤フラグを表示
            if (!c_.isMine && c_.state === "flagged") {
              c_.state = "revealed";
              c_.isExploded = true; // 誤フラグマーク用に流用
            }
          }
        }
        currentBoard[row][col].state = "revealed";
        setBoard(currentBoard);
        setStatus("lost");
        return;
      }

      // 通常セルを開放
      revealCell(currentBoard, row, col, config.rows, config.cols);

      if (isGameWon(currentBoard, config.mines)) {
        // 残り未フラグ地雷を自動フラグ
        for (let r = 0; r < config.rows; r++) {
          for (let c = 0; c < config.cols; c++) {
            if (currentBoard[r][c].isMine && currentBoard[r][c].state === "hidden") {
              currentBoard[r][c].state = "flagged";
            }
          }
        }
        setBoard(currentBoard);
        setStatus("won");
        setMinesLeft(0);
      } else {
        setBoard(currentBoard);
      }
    },
    [board, difficulty, status]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      if (status === "won" || status === "lost") return;
      if (!board) return;

      const cell = board[row][col];
      if (cell.state === "revealed") return;

      const newBoard = board.map((r) => r.map((c) => ({ ...c })));
      if (cell.state === "hidden") {
        newBoard[row][col].state = "flagged";
        setMinesLeft((m) => m - 1);
      } else {
        newBoard[row][col].state = "hidden";
        setMinesLeft((m) => m + 1);
      }
      setBoard(newBoard);
    },
    [board, status]
  );

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!board || status === "won" || status === "lost") return;
      const config = DIFFICULTY_CONFIGS[difficulty];

      if (!selectedCell) {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          e.preventDefault();
          setSelectedCell([0, 0]);
        }
        return;
      }

      const [row, col] = selectedCell;
      if (e.key === "ArrowUp" && row > 0) {
        e.preventDefault();
        setSelectedCell([row - 1, col]);
      } else if (e.key === "ArrowDown" && row < config.rows - 1) {
        e.preventDefault();
        setSelectedCell([row + 1, col]);
      } else if (e.key === "ArrowLeft" && col > 0) {
        e.preventDefault();
        setSelectedCell([row, col - 1]);
      } else if (e.key === "ArrowRight" && col < config.cols - 1) {
        e.preventDefault();
        setSelectedCell([row, col + 1]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCellClick(row, col);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        const syntheticEvent = {
          preventDefault: () => {},
        } as React.MouseEvent;
        handleRightClick(syntheticEvent, row, col);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board, difficulty, selectedCell, status, handleCellClick, handleRightClick]);

  const config = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="tool-container">
      <h1 className="tool-title">マインスイーパー</h1>
      <p className="tool-description">
        地雷を踏まずに全てのセルを開放するゲームです。数字は隣接する地雷の数を示しています。右クリック（またはキーボードの F キー）でフラグを立てて地雷をマークできます。
      </p>

      {/* 難易度選択 */}
      <section className="ms-controls" aria-label="ゲーム設定">
        <div
          className="ms-difficulty-group"
          role="group"
          aria-label="難易度選択"
        >
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`ms-difficulty-btn ${difficulty === d ? "active" : ""}`}
              onClick={() => handleDifficultyChange(d)}
              aria-pressed={difficulty === d}
            >
              {d === "easy" ? "初級" : d === "medium" ? "中級" : "上級"}
            </button>
          ))}
        </div>
        <Button onClick={() => startGame()}>
          {board ? "新しいゲーム" : "ゲームスタート"}
        </Button>
      </section>

      {/* ステータスバー */}
      {board && (
        <>
          <div
            className="ms-status-bar"
            aria-label="ゲームステータス"
            style={{ maxWidth: config.cols * 34 + 16 + "px" }}
          >
            <span
              className="ms-counter mines"
              aria-label={`残り地雷数 ${minesLeft}`}
              aria-live="polite"
              aria-atomic="true"
            >
              🚩{String(minesLeft).padStart(3, "\u2007")}
            </span>
            <button
              className="ms-reset-btn"
              onClick={() => startGame()}
              aria-label="ゲームをリセット"
              onMouseDown={() => setIsMouseDown(true)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
            >
              {getResetEmoji(status, isMouseDown)}
            </button>
            <time
              className="ms-counter timer"
              aria-label={`経過時間 ${elapsedSeconds}秒`}
              aria-live="off"
            >
              ⏱{String(Math.min(elapsedSeconds, 999)).padStart(3, "\u2007")}
            </time>
          </div>

          {/* クリア・ゲームオーバーバナー */}
          {status === "won" && (
            <div
              className="ms-result win"
              role="status"
              aria-live="assertive"
              aria-atomic="true"
            >
              <span className="ms-result-icon">🎉</span>
              <p className="ms-result-title">クリア！</p>
              <p className="ms-result-time">タイム: {formatTime(elapsedSeconds)}</p>
              <Button onClick={() => startGame()}>もう一度</Button>
            </div>
          )}
          {status === "lost" && (
            <div
              className="ms-result lose"
              role="status"
              aria-live="assertive"
              aria-atomic="true"
            >
              <span className="ms-result-icon">💣</span>
              <p className="ms-result-title">ゲームオーバー</p>
              <p className="ms-result-time">タイム: {formatTime(elapsedSeconds)}</p>
              <Button onClick={() => startGame()}>もう一度</Button>
            </div>
          )}

          {/* ゲームボード */}
          <div className="ms-board-wrapper">
            <div
              className="ms-board"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, 32px)`,
              }}
              role="grid"
              aria-label="マインスイーパーボード"
            >
              {board.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  const isSelected =
                    selectedCell?.[0] === rowIdx &&
                    selectedCell?.[1] === colIdx;
                  const cellClass = getCellClass(cell, isSelected);
                  const cellLabel = getCellAriaLabel(cell, rowIdx, colIdx);

                  return (
                    <button
                      key={`${rowIdx}-${colIdx}`}
                      className={cellClass}
                      role="gridcell"
                      aria-label={cellLabel}
                      aria-pressed={
                        cell.state === "flagged" ? true : undefined
                      }
                      tabIndex={
                        isSelected
                          ? 0
                          : selectedCell === null && rowIdx === 0 && colIdx === 0
                            ? 0
                            : -1
                      }
                      onClick={() => {
                        setSelectedCell([rowIdx, colIdx]);
                        handleCellClick(rowIdx, colIdx);
                      }}
                      onContextMenu={(e) => handleRightClick(e, rowIdx, colIdx)}
                      onMouseDown={() => setIsMouseDown(true)}
                      onMouseUp={() => setIsMouseDown(false)}
                      onFocus={() => setSelectedCell([rowIdx, colIdx])}
                    >
                      {getCellContent(cell)}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      <TipsCard
        tips={[
          "左クリックでセルを開放、右クリック（または F キー）でフラグを立てます。",
          "最初のクリックでは必ず安全なセルが開放されます。",
          "数字はその周囲8マスに存在する地雷の数を示しています。",
          "矢印キーでセル移動、Enter / Space で開放、F でフラグの切り替えができます。",
          "全ての非地雷セルを開放するとクリアです。",
        ]}
      />
    </div>
  );
}

/**
 * セルの表示内容を返す
 * @param cell - セル情報
 * @returns セルに表示する文字列または絵文字
 */
function getCellContent(cell: Cell): string {
  if (cell.state === "flagged") return "🚩";
  if (cell.state === "hidden") return "";
  if (cell.isMine) {
    return cell.isExploded ? "💥" : "💣";
  }
  if (cell.adjacentMines === 0) return "";
  return String(cell.adjacentMines);
}

/**
 * セルに付与するCSSクラス名を組み立てる
 * @param cell - セル情報
 * @param isSelected - キーボードフォーカスで選択中かどうか
 * @returns スペース区切りのCSSクラス名文字列
 */
function getCellClass(cell: Cell, isSelected: boolean): string {
  const classes = ["ms-cell"];

  if (cell.state === "flagged") {
    classes.push("flagged");
  } else if (cell.state === "hidden") {
    classes.push("hidden");
    if (isSelected) classes.push("selected");
  } else {
    // revealed
    if (cell.isMine) {
      classes.push(cell.isExploded ? "mine-exploded" : "mine-revealed");
    } else if (!cell.isMine && cell.state === "revealed") {
      // 誤フラグ（isExploded を流用）
      classes.push("revealed");
      if (cell.adjacentMines > 0) {
        classes.push(NUMBER_CLASS[cell.adjacentMines] ?? "");
      }
    }
  }

  // 誤フラグの場合（isMine=false, isExploded=true）
  if (!cell.isMine && cell.isExploded) {
    classes.splice(classes.indexOf("revealed"), 1);
    classes.push("mine-wrong-flag");
  }

  return classes.filter(Boolean).join(" ");
}

/**
 * セルのARIAラベルを生成する
 * @param cell - セル情報
 * @param row - 行インデックス（0始まり）
 * @param col - 列インデックス（0始まり）
 * @returns スクリーンリーダー向けのラベル文字列
 */
function getCellAriaLabel(cell: Cell, row: number, col: number): string {
  const pos = `行${row + 1}列${col + 1}`;
  if (cell.state === "flagged") return `${pos} フラグ`;
  if (cell.state === "hidden") return `${pos} 未開放`;
  if (cell.isMine) return `${pos} 地雷`;
  if (cell.adjacentMines === 0) return `${pos} 安全`;
  return `${pos} 隣接地雷${cell.adjacentMines}`;
}
