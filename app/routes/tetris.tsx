import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/tetris")({
  head: () => ({
    meta: [
      { title: "テトリス | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザで遊べるクラシックなテトリスゲーム。矢印キーでピースを操作してラインを消そう！スコア・ベストスコア記録対応。",
      },
      { property: "og:title", content: "テトリス | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブラウザで遊べるクラシックなテトリスゲーム。矢印キーでピースを操作してラインを消そう！スコア・ベストスコア記録対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/tetris` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "テトリス | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブラウザで遊べるクラシックなテトリスゲーム。矢印キーでピースを操作してラインを消そう！スコア・ベストスコア記録対応。",
      },
    ],
  }),
  component: TetrisGame,
});

/** ボードの幅（列数） */
export const BOARD_WIDTH = 10;
/** ボードの高さ（行数） */
export const BOARD_HEIGHT = 20;
/** セルのピクセルサイズ */
export const CELL_SIZE = 30;
/** ネクストピース表示用セルサイズ */
const NEXT_CELL_SIZE = 24;

/** セルの値（0 = 空, 1-7 = ピース種類） */
export type Cell = number;
/** ゲームボード */
export type Board = Cell[][];
/** ボード上の位置 */
export type Position = { x: number; y: number };
/** ゲームの状態 */
export type GameStatus = "idle" | "playing" | "paused" | "over";
/** テトロミノの種類 */
export type TetrominoType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** テトロミノの形状定義 */
export const TETROMINOES: Record<TetrominoType, number[][]> = {
  1: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  2: [
    [1, 1],
    [1, 1],
  ], // O
  3: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ], // T
  4: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ], // S
  5: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ], // Z
  6: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ], // J
  7: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ], // L
};

/** テトロミノの色 */
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  1: "#00f5ff", // I - シアン
  2: "#ffd000", // O - 黄色
  3: "#c000f0", // T - 紫
  4: "#00d000", // S - 緑
  5: "#f02000", // Z - 赤
  6: "#0060f0", // J - 青
  7: "#f07000", // L - オレンジ
};

/** ベストスコア保存キー */
const BEST_SCORE_KEY = "tetris-best-score";

/**
 * 空のボードを作成する
 * @returns BOARD_HEIGHT x BOARD_WIDTH のゼロ配列
 */
export function createBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(0)
  );
}

/**
 * ランダムなテトロミノ種類を取得する
 * @returns テトロミノの種類（1〜7）
 */
export function getRandomPieceType(): TetrominoType {
  const types: TetrominoType[] = [1, 2, 3, 4, 5, 6, 7];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * ピースを90度時計回りに回転する
 * @param shape - 回転前の形状
 * @returns 回転後の形状
 */
export function rotatePiece(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () =>
    Array(rows).fill(0)
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

/**
 * 指定位置にピースを配置できるか確認する
 * @param board - 現在のボード
 * @param shape - ピースの形状
 * @param pos - 配置位置
 * @returns 配置可能な場合 true
 */
export function isValidPosition(
  board: Board,
  shape: number[][],
  pos: Position
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = pos.x + c;
      const ny = pos.y + r;
      if (nx < 0 || nx >= BOARD_WIDTH) return false;
      if (ny >= BOARD_HEIGHT) return false;
      if (ny >= 0 && board[ny][nx] !== 0) return false;
    }
  }
  return true;
}

/**
 * ボードにピースを配置する（新しいボードを返す）
 * @param board - 現在のボード
 * @param shape - ピースの形状
 * @param pos - 配置位置
 * @param type - ピースの種類
 * @returns ピースが配置された新しいボード
 */
export function placePiece(
  board: Board,
  shape: number[][],
  pos: Position,
  type: TetrominoType
): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = pos.x + c;
      const y = pos.y + r;
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        newBoard[y][x] = type;
      }
    }
  }
  return newBoard;
}

/**
 * 完成したラインをクリアする
 * @param board - 現在のボード
 * @returns クリア後のボードとクリアしたライン数
 */
export function clearLines(board: Board): {
  board: Board;
  linesCleared: number;
} {
  const remaining = board.filter((row) => row.some((cell) => cell === 0));
  const linesCleared = BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: linesCleared }, () =>
    Array(BOARD_WIDTH).fill(0)
  );
  return { board: [...emptyRows, ...remaining], linesCleared };
}

/**
 * スコアを計算する（テトリス公式スコアリング）
 * @param linesCleared - クリアしたライン数
 * @param level - 現在のレベル
 * @returns 獲得スコア
 */
export function calculateScore(linesCleared: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[Math.min(linesCleared, 4)] ?? 0) * (level + 1);
}

/**
 * レベルを計算する
 * @param totalLines - 累計クリアライン数
 * @returns 現在のレベル（0始まり）
 */
export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / 10);
}

/**
 * ドロップ速度（ms/行）を計算する
 * @param level - 現在のレベル
 * @returns ドロップ間隔（ミリ秒）
 */
export function getDropSpeed(level: number): number {
  return Math.max(100, 1000 - level * 80);
}

/**
 * ゴーストピースのY位置を計算する（ハードドロップ先）
 * @param board - 現在のボード
 * @param shape - ピースの形状
 * @param pos - 現在のピース位置
 * @returns ゴーストピースのY座標
 */
export function getGhostY(
  board: Board,
  shape: number[][],
  pos: Position
): number {
  let ghostY = pos.y;
  while (isValidPosition(board, shape, { x: pos.x, y: ghostY + 1 })) {
    ghostY++;
  }
  return ghostY;
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
    // ストレージアクセスが禁止されている環境では無視する
  }
}

/** アクティブなピースの型 */
interface ActivePiece {
  shape: number[][];
  type: TetrominoType;
  pos: Position;
}

/** テトリスゲームコンポーネント */
function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // ゲーム状態（Refで管理してループを安定させる）
  const boardRef = useRef<Board>(createBoard());
  const currentRef = useRef<ActivePiece | null>(null);
  const nextTypeRef = useRef<TetrominoType>(getRandomPieceType());
  const statusRef = useRef<GameStatus>("idle");
  const scoreRef = useRef(0);
  const levelRef = useRef(0);
  const totalLinesRef = useRef(0);
  const frameRef = useRef(0);
  const lastDropRef = useRef(0);

  const { announce, announcerProps } = useStatusAnnouncement();

  useEffect(() => {
    setBestScore(loadBestScore());
  }, []);

  /** ネクストピースを描画する */
  const drawNext = useCallback((type: TetrominoType) => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shape = TETROMINOES[type];
    const color = TETROMINO_COLORS[type];
    const offsetX = Math.floor(
      (canvas.width - shape[0].length * NEXT_CELL_SIZE) / 2
    );
    const offsetY = Math.floor(
      (canvas.height - shape.length * NEXT_CELL_SIZE) / 2
    );

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const x = offsetX + c * NEXT_CELL_SIZE;
        const y = offsetY + r * NEXT_CELL_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, NEXT_CELL_SIZE - 2, NEXT_CELL_SIZE - 2);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(x + 1, y + 1, NEXT_CELL_SIZE - 2, 3);
        ctx.fillRect(x + 1, y + 1, 3, NEXT_CELL_SIZE - 2);
      }
    }
  }, []);

  /** ボードを描画する */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const board = boardRef.current;
    const current = currentRef.current;
    const W = BOARD_WIDTH * CELL_SIZE;
    const H = BOARD_HEIGHT * CELL_SIZE;

    // 背景
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    // グリッド線
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, H);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(W, y * CELL_SIZE);
      ctx.stroke();
    }

    // ゴーストピース
    if (current) {
      const ghostY = getGhostY(board, current.shape, current.pos);
      if (ghostY > current.pos.y) {
        const color = TETROMINO_COLORS[current.type];
        for (let r = 0; r < current.shape.length; r++) {
          for (let c = 0; c < current.shape[r].length; c++) {
            if (!current.shape[r][c]) continue;
            const x = (current.pos.x + c) * CELL_SIZE;
            const y = (ghostY + r) * CELL_SIZE;
            ctx.fillStyle = color + "38";
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            ctx.strokeStyle = color + "70";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        }
      }
    }

    // ボードのセルを描画する
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const cell = board[r][c];
        if (!cell) continue;
        drawCell(ctx, c * CELL_SIZE, r * CELL_SIZE, TETROMINO_COLORS[cell as TetrominoType]);
      }
    }

    // 現在のピースを描画する
    if (current) {
      const color = TETROMINO_COLORS[current.type];
      for (let r = 0; r < current.shape.length; r++) {
        for (let c = 0; c < current.shape[r].length; c++) {
          if (!current.shape[r][c]) continue;
          drawCell(
            ctx,
            (current.pos.x + c) * CELL_SIZE,
            (current.pos.y + r) * CELL_SIZE,
            color
          );
        }
      }
    }
  }, []);

  /** セルを描画するヘルパー */
  function drawCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, 4);
    ctx.fillRect(x + 1, y + 1, 4, CELL_SIZE - 2);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 1, y + CELL_SIZE - 4, CELL_SIZE - 2, 3);
    ctx.fillRect(x + CELL_SIZE - 4, y + 1, 3, CELL_SIZE - 2);
  }

  /** 新しいピースをスポーンする */
  const spawnPiece = useCallback(() => {
    const type = nextTypeRef.current;
    const shape = TETROMINOES[type];
    const pos: Position = {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };

    if (!isValidPosition(boardRef.current, shape, pos)) {
      // ゲームオーバー
      statusRef.current = "over";
      setStatus("over");
      currentRef.current = null;
      const finalScore = scoreRef.current;
      setBestScore((prev) => {
        const next = Math.max(prev, finalScore);
        saveBestScore(next);
        return next;
      });
      announce(`ゲームオーバー！スコア: ${finalScore}`);
      draw();
      return;
    }

    currentRef.current = { shape, type, pos };
    const next = getRandomPieceType();
    nextTypeRef.current = next;
    drawNext(next);
  }, [draw, drawNext, announce]);

  /** ゲームループ */
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (statusRef.current !== "playing") return;

      // 自動落下
      const speed = getDropSpeed(levelRef.current);
      if (timestamp - lastDropRef.current >= speed) {
        lastDropRef.current = timestamp;

        const current = currentRef.current;
        if (!current) {
          spawnPiece();
          draw();
          frameRef.current = requestAnimationFrame(gameLoop);
          return;
        }

        const newPos = { x: current.pos.x, y: current.pos.y + 1 };
        if (isValidPosition(boardRef.current, current.shape, newPos)) {
          currentRef.current = { ...current, pos: newPos };
        } else {
          // ピースを固定する
          const newBoard = placePiece(
            boardRef.current,
            current.shape,
            current.pos,
            current.type
          );
          const { board: clearedBoard, linesCleared } = clearLines(newBoard);
          boardRef.current = clearedBoard;
          currentRef.current = null;

          if (linesCleared > 0) {
            const newTotal = totalLinesRef.current + linesCleared;
            const newLevel = calculateLevel(newTotal);
            const points = calculateScore(linesCleared, levelRef.current);
            scoreRef.current += points;
            levelRef.current = newLevel;
            totalLinesRef.current = newTotal;
            setScore(scoreRef.current);
            setLevel(newLevel);
            setTotalLines(newTotal);
          }

          spawnPiece();
        }

        draw();
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    },
    [draw, spawnPiece]
  );

  /** ゲーム開始 */
  const startGame = useCallback(() => {
    boardRef.current = createBoard();
    currentRef.current = null;
    nextTypeRef.current = getRandomPieceType();
    scoreRef.current = 0;
    levelRef.current = 0;
    totalLinesRef.current = 0;
    lastDropRef.current = 0;
    statusRef.current = "playing";

    setScore(0);
    setLevel(0);
    setTotalLines(0);
    setStatus("playing");

    cancelAnimationFrame(frameRef.current);

    // 最初のピースをスポーン
    const type = nextTypeRef.current;
    const shape = TETROMINOES[type];
    const pos: Position = {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
    currentRef.current = { shape, type, pos };
    const next = getRandomPieceType();
    nextTypeRef.current = next;
    drawNext(next);
    draw();

    frameRef.current = requestAnimationFrame((ts) => {
      lastDropRef.current = ts;
      gameLoop(ts);
    });
    announce("ゲーム開始！");
  }, [draw, drawNext, gameLoop, announce]);

  /** 一時停止・再開 */
  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      statusRef.current = "paused";
      setStatus("paused");
      cancelAnimationFrame(frameRef.current);
      announce("一時停止");
    } else if (statusRef.current === "paused") {
      statusRef.current = "playing";
      setStatus("playing");
      lastDropRef.current = 0;
      frameRef.current = requestAnimationFrame((ts) => {
        lastDropRef.current = ts;
        gameLoop(ts);
      });
      announce("再開");
    }
  }, [gameLoop, announce]);

  /** キーボード入力 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (statusRef.current !== "playing" && e.code !== "KeyP") return;
      const current = currentRef.current;

      switch (e.code) {
        case "ArrowLeft": {
          e.preventDefault();
          if (!current) return;
          const newPos = { x: current.pos.x - 1, y: current.pos.y };
          if (isValidPosition(boardRef.current, current.shape, newPos)) {
            currentRef.current = { ...current, pos: newPos };
            draw();
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (!current) return;
          const newPos = { x: current.pos.x + 1, y: current.pos.y };
          if (isValidPosition(boardRef.current, current.shape, newPos)) {
            currentRef.current = { ...current, pos: newPos };
            draw();
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (!current) return;
          const newPos = { x: current.pos.x, y: current.pos.y + 1 };
          if (isValidPosition(boardRef.current, current.shape, newPos)) {
            currentRef.current = { ...current, pos: newPos };
            lastDropRef.current = performance.now();
            draw();
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (!current) return;
          const rotated = rotatePiece(current.shape);
          // ウォールキック: 通常位置→左シフト→右シフトの順で試す
          const kicks = [0, -1, 1, -2, 2];
          for (const dx of kicks) {
            const newPos = { x: current.pos.x + dx, y: current.pos.y };
            if (isValidPosition(boardRef.current, rotated, newPos)) {
              currentRef.current = { ...current, shape: rotated, pos: newPos };
              draw();
              break;
            }
          }
          break;
        }
        case "Space": {
          e.preventDefault();
          if (!current) return;
          // ハードドロップ
          const ghostY = getGhostY(boardRef.current, current.shape, current.pos);
          const newBoard = placePiece(
            boardRef.current,
            current.shape,
            { x: current.pos.x, y: ghostY },
            current.type
          );
          const { board: clearedBoard, linesCleared } = clearLines(newBoard);
          boardRef.current = clearedBoard;
          currentRef.current = null;

          if (linesCleared > 0) {
            const newTotal = totalLinesRef.current + linesCleared;
            const newLevel = calculateLevel(newTotal);
            const points = calculateScore(linesCleared, levelRef.current);
            scoreRef.current += points;
            levelRef.current = newLevel;
            totalLinesRef.current = newTotal;
            setScore(scoreRef.current);
            setLevel(newLevel);
            setTotalLines(newTotal);
          }

          spawnPiece();
          draw();
          lastDropRef.current = performance.now();
          break;
        }
        case "KeyP":
          togglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [draw, spawnPiece, togglePause]);

  // クリーンアップ
  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="tool-container">
      <h1 className="tool-title">テトリス</h1>
      <p className="tool-description">
        ブラウザで遊べるクラシックなテトリスゲーム。ピースを操作してラインを消そう！
      </p>

      <StatusAnnouncer {...announcerProps} />

      <div className="tetris-wrapper">
        {/* スコアヘッダー */}
        <div className="tetris-header">
          <div className="tetris-scores">
            <div className="tetris-score-card" aria-label={`スコア: ${score}`}>
              <span className="tetris-score-label">SCORE</span>
              <span className="tetris-score-value">{score.toLocaleString()}</span>
            </div>
            <div
              className="tetris-score-card"
              aria-label={`ベストスコア: ${bestScore}`}
            >
              <span className="tetris-score-label">BEST</span>
              <span className="tetris-score-value">
                {bestScore.toLocaleString()}
              </span>
            </div>
            <div className="tetris-score-card" aria-label={`レベル: ${level}`}>
              <span className="tetris-score-label">LEVEL</span>
              <span className="tetris-score-value">{level}</span>
            </div>
            <div
              className="tetris-score-card"
              aria-label={`ライン: ${totalLines}`}
            >
              <span className="tetris-score-label">LINES</span>
              <span className="tetris-score-value">{totalLines}</span>
            </div>
          </div>
          <div className="tetris-controls">
            {status === "idle" || status === "over" ? (
              <Button size="sm" onClick={startGame}>
                {status === "over" ? "もう一度" : "ゲームスタート"}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={togglePause}>
                  {status === "paused" ? "再開" : "一時停止"}
                </Button>
                <Button size="sm" variant="outline" onClick={startGame}>
                  新しいゲーム
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ゲームエリア */}
        <div className="tetris-game-area">
          {/* メインボード */}
          <div className="tetris-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH * CELL_SIZE}
              height={BOARD_HEIGHT * CELL_SIZE}
              className="tetris-canvas"
              role="application"
              aria-label="テトリスゲームボード"
            />

            {/* オーバーレイ */}
            {status !== "playing" && (
              <div
                className={`tetris-overlay${status === "over" ? " tetris-overlay-over" : ""}`}
              >
                <div className="tetris-overlay-content">
                  {status === "idle" && (
                    <>
                      <p className="tetris-overlay-message">テトリス</p>
                      <p className="tetris-overlay-sub">
                        ゲームスタートを押してプレイ！
                      </p>
                      <Button onClick={startGame}>ゲームスタート</Button>
                    </>
                  )}
                  {status === "paused" && (
                    <>
                      <p className="tetris-overlay-message">一時停止</p>
                      <Button onClick={togglePause}>再開</Button>
                    </>
                  )}
                  {status === "over" && (
                    <>
                      <p className="tetris-overlay-message">ゲームオーバー</p>
                      <p className="tetris-overlay-score">
                        スコア: {score.toLocaleString()}
                      </p>
                      {score >= bestScore && score > 0 && (
                        <p className="tetris-overlay-best">🏆 ベスト更新！</p>
                      )}
                      <Button onClick={startGame}>もう一度</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* サイドパネル */}
          <div className="tetris-side">
            <div className="tetris-next-panel">
              <p className="tetris-next-label">NEXT</p>
              <canvas
                ref={nextCanvasRef}
                width={120}
                height={96}
                className="tetris-next-canvas"
                aria-label="ネクストピース"
              />
            </div>
          </div>
        </div>

        {/* 操作説明 */}
        <p className="tetris-instructions">
          ← → 移動 ／ ↑ 回転 ／ ↓ ソフトドロップ ／ Space ハードドロップ ／ P 一時停止
        </p>
      </div>

      <TipsCard
        tips={[
          "テトリス（4ライン同時消去）で最大得点を狙おう！",
          "Iピース（水色）は縦に積み重ねたときに特に効果的です。",
          "ゴースト（半透明）を見てハードドロップで素早く積もう。",
          "レベルが上がるとピースの落下速度が上がります。",
        ]}
      />
    </div>
  );
}
