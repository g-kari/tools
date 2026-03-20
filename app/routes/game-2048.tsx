import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/game-2048")({
  head: () => ({
    meta: [
      { title: "2048 | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザで遊べる2048パズルゲーム。矢印キーまたはスワイプで同じ数字のタイルを合体させ、2048を目指そう！",
      },
      { property: "og:title", content: "2048 | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブラウザで遊べる2048パズルゲーム。矢印キーまたはスワイプで同じ数字のタイルを合体させ、2048を目指そう！",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/game-2048` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "2048 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブラウザで遊べる2048パズルゲーム。矢印キーまたはスワイプで同じ数字のタイルを合体させ、2048を目指そう！",
      },
    ],
  }),
  component: Game2048,
});

/** ゲームボード（4x4、null = 空きセル） */
export type Board = (number | null)[][];

/** 移動方向 */
export type Direction = "left" | "right" | "up" | "down";

/** ゲームの状態 */
export type GameStatus = "playing" | "won" | "lost";

/** ボードサイズ */
export const BOARD_SIZE = 4;

/** 勝利値 */
export const WIN_VALUE = 2048;

/** ベストスコア保存キー */
const BEST_SCORE_KEY = "game-2048-best-score";

/** 空の4x4ボードを生成する */
export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array<number | null>(BOARD_SIZE).fill(null)
  );
}

/** ボードのディープコピーを生成する */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** 空きセルの位置一覧を返す */
export function getEmptyCells(board: Board): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * ランダムなタイル（2: 90%, 4: 10%）を追加する
 * @param board - 現在のボード
 * @returns 新しいボードと追加成否
 */
export function addRandomTile(board: Board): { board: Board; added: boolean } {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return { board, added: false };
  const { row, col } =
    emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = cloneBoard(board);
  newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
  return { board: newBoard, added: true };
}

/**
 * 一行を左にスライドしてスコア増加分を返す
 * @param row - 処理対象の行
 * @returns スライド後の行とスコア
 */
export function slideRowLeft(row: (number | null)[]): {
  row: (number | null)[];
  score: number;
} {
  const tiles = row.filter((v): v is number => v !== null);
  const result: (number | null)[] = [];
  let score = 0;
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      result.push(merged);
      score += merged;
      i += 2;
    } else {
      result.push(tiles[i]);
      i++;
    }
  }
  while (result.length < BOARD_SIZE) result.push(null);
  return { row: result, score };
}

/**
 * ボードを左に移動する
 * @param board - 現在のボード
 * @returns 移動後のボード、スコア増加、移動有無
 */
export function moveLeft(board: Board): {
  board: Board;
  score: number;
  moved: boolean;
} {
  const newBoard = createBoard();
  let totalScore = 0;
  let moved = false;
  for (let row = 0; row < BOARD_SIZE; row++) {
    const { row: newRow, score } = slideRowLeft(board[row]);
    newBoard[row] = newRow;
    totalScore += score;
    if (newRow.some((v, i) => v !== board[row][i])) moved = true;
  }
  return { board: newBoard, score: totalScore, moved };
}

/**
 * ボードを右に移動する
 * @param board - 現在のボード
 * @returns 移動後のボード、スコア増加、移動有無
 */
export function moveRight(board: Board): {
  board: Board;
  score: number;
  moved: boolean;
} {
  const reversed = board.map((row) => [...row].reverse());
  const { board: movedBoard, score, moved } = moveLeft(reversed);
  return { board: movedBoard.map((row) => [...row].reverse()), score, moved };
}

/**
 * ボードを転置する（行と列を入れ替える）
 * @param board - 現在のボード
 * @returns 転置したボード
 */
export function transposeBoard(board: Board): Board {
  return Array.from({ length: BOARD_SIZE }, (_, col) =>
    Array.from({ length: BOARD_SIZE }, (__, row) => board[row][col])
  );
}

/**
 * ボードを上に移動する
 * @param board - 現在のボード
 * @returns 移動後のボード、スコア増加、移動有無
 */
export function moveUp(board: Board): {
  board: Board;
  score: number;
  moved: boolean;
} {
  const { board: movedBoard, score, moved } = moveLeft(transposeBoard(board));
  return { board: transposeBoard(movedBoard), score, moved };
}

/**
 * ボードを下に移動する
 * @param board - 現在のボード
 * @returns 移動後のボード、スコア増加、移動有無
 */
export function moveDown(board: Board): {
  board: Board;
  score: number;
  moved: boolean;
} {
  const { board: movedBoard, score, moved } = moveRight(transposeBoard(board));
  return { board: transposeBoard(movedBoard), score, moved };
}

/**
 * ボードを指定した方向に移動する
 * @param board - 現在のボード
 * @param direction - 移動方向
 * @returns 移動後のボード、スコア増加、移動有無
 */
export function moveBoard(
  board: Board,
  direction: Direction
): { board: Board; score: number; moved: boolean } {
  switch (direction) {
    case "left":
      return moveLeft(board);
    case "right":
      return moveRight(board);
    case "up":
      return moveUp(board);
    case "down":
      return moveDown(board);
  }
}

/**
 * 有効な移動が残っているか確認する
 * @param board - 現在のボード
 * @returns 有効な移動がある場合 true
 */
export function hasValidMoves(board: Board): boolean {
  if (getEmptyCells(board).length > 0) return true;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const val = board[row][col];
      if (col + 1 < BOARD_SIZE && board[row][col + 1] === val) return true;
      if (row + 1 < BOARD_SIZE && board[row + 1][col] === val) return true;
    }
  }
  return false;
}

/**
 * 勝利条件を確認する（WIN_VALUE のタイルが存在するか）
 * @param board - 現在のボード
 * @returns 勝利している場合 true
 */
export function hasWon(board: Board): boolean {
  return board.some((row) => row.some((cell) => cell === WIN_VALUE));
}

// ----- ゲームステート -----

interface GameState {
  board: Board;
  score: number;
  bestScore: number;
  status: GameStatus;
  keepPlaying: boolean;
}

function loadBestScore(): number {
  try {
    return parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, score.toString());
  } catch {
    // ストレージへのアクセスが禁止されている環境では無視する
  }
}

function initGame(bestScore: number): GameState {
  let board = createBoard();
  board = addRandomTile(board).board;
  board = addRandomTile(board).board;
  return { board, score: 0, bestScore, status: "playing", keepPlaying: false };
}

/** タイルの CSS クラス名を返す */
function getTileClass(value: number): string {
  const known = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  if (known.includes(value)) return `g2048-cell g2048-tile g2048-tile-${value}`;
  return "g2048-cell g2048-tile g2048-tile-super";
}

/** 2048 ゲームコンポーネント */
function Game2048() {
  const [state, setState] = useState<GameState>(() =>
    initGame(loadBestScore())
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((direction: Direction) => {
    setState((prev) => {
      if (prev.status === "lost") return prev;
      if (prev.status === "won" && !prev.keepPlaying) return prev;

      const { board: newBoard, score: gained, moved } = moveBoard(prev.board, direction);
      if (!moved) return prev;

      const { board: boardWithTile } = addRandomTile(newBoard);
      const newScore = prev.score + gained;
      const newBestScore = Math.max(prev.bestScore, newScore);
      if (newBestScore > prev.bestScore) saveBestScore(newBestScore);

      let newStatus: GameStatus = prev.status;
      if (!prev.keepPlaying && hasWon(boardWithTile)) {
        newStatus = "won";
      } else if (!hasValidMoves(boardWithTile)) {
        newStatus = "lost";
      }

      return {
        board: boardWithTile,
        score: newScore,
        bestScore: newBestScore,
        status: newStatus,
        keepPlaying: prev.keepPlaying,
      };
    });
  }, []);

  const handleNewGame = useCallback(() => {
    setState((prev) => initGame(prev.bestScore));
  }, []);

  const handleKeepPlaying = useCallback(() => {
    setState((prev) => ({ ...prev, status: "playing", keepPlaying: true }));
  }, []);

  // キーボード操作
  useEffect(() => {
    const directionMap: Record<string, Direction> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = directionMap[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // タッチ/スワイプ操作
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    },
    [handleMove]
  );

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">2048</h1>
        <p className="tool-description">
          同じ数字のタイルをスライドして合体させ、2048を目指しましょう！
        </p>
      </div>

      <div className="g2048-wrapper">
        <div className="g2048-header">
          <div className="g2048-scores">
            <div
              className="g2048-score-card"
              aria-label={`スコア: ${state.score}`}
            >
              <span className="g2048-score-label">スコア</span>
              <span className="g2048-score-value">{state.score}</span>
            </div>
            <div
              className="g2048-score-card"
              aria-label={`ベストスコア: ${state.bestScore}`}
            >
              <span className="g2048-score-label">ベスト</span>
              <span className="g2048-score-value">{state.bestScore}</span>
            </div>
          </div>
          <Button onClick={handleNewGame} aria-label="新しいゲームを開始">
            新しいゲーム
          </Button>
        </div>

        <div
          className="g2048-board"
          role="grid"
          aria-label="2048ゲームボード"
          aria-describedby="g2048-instructions"
          tabIndex={0}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {state.board.map((row, rowIdx) =>
            row.map((val, colIdx) =>
              val !== null ? (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={getTileClass(val)}
                  role="gridcell"
                  aria-label={`${val}`}
                >
                  {val}
                </div>
              ) : (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="g2048-cell"
                  role="gridcell"
                  aria-label="空きセル"
                />
              )
            )
          )}

          {state.status === "won" && (
            <div
              className="g2048-overlay g2048-overlay-won"
              role="status"
              aria-live="polite"
            >
              <div className="g2048-overlay-content">
                <p className="g2048-overlay-message">🎉 2048達成！</p>
                <div className="g2048-overlay-actions">
                  <Button variant="outline" onClick={handleKeepPlaying}>
                    続けてプレイ
                  </Button>
                  <Button onClick={handleNewGame}>新しいゲーム</Button>
                </div>
              </div>
            </div>
          )}

          {state.status === "lost" && (
            <div
              className="g2048-overlay g2048-overlay-lost"
              role="status"
              aria-live="polite"
            >
              <div className="g2048-overlay-content">
                <p className="g2048-overlay-message">😞 ゲームオーバー</p>
                <p className="g2048-overlay-score">スコア: {state.score}</p>
                <Button onClick={handleNewGame}>もう一度プレイ</Button>
              </div>
            </div>
          )}
        </div>

        <p id="g2048-instructions" className="g2048-instructions">
          矢印キーまたはスワイプで操作。同じ数字のタイルが隣り合うと合体します。
        </p>
      </div>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "矢印キー（←↑↓→）またはスマートフォンのスワイプでタイルを移動します",
              "同じ数字のタイルが隣り合うと合体して2倍の値になります",
              "2048のタイルを作れば勝利です。その後も続けてプレイできます",
              "移動できる場所がなくなるとゲームオーバーです",
            ],
          },
          {
            title: "攻略のコツ",
            items: [
              "大きな数字を角（コーナー）に集めると有利です",
              "常に同じ方向（例：左・下）を優先して動かすと整列しやすくなります",
              "スコアは合体した数字の合計で増加します",
              "4のタイルは約10%の確率で出現します",
            ],
          },
        ]}
      />
    </div>
  );
}
