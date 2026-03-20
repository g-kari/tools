import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/snake")({
  head: () => ({
    meta: [
      { title: "スネークゲーム | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザで遊べるクラシックなスネークゲーム。矢印キーでヘビを操作して食べ物を集めよう！",
      },
      { property: "og:title", content: "スネークゲーム | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブラウザで遊べるクラシックなスネークゲーム。矢印キーでヘビを操作して食べ物を集めよう！",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/snake` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "スネークゲーム | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブラウザで遊べるクラシックなスネークゲーム。矢印キーでヘビを操作して食べ物を集めよう！",
      },
    ],
  }),
  component: SnakeGame,
});

/** グリッドのセル数（縦横） */
export const GRID_SIZE = 20;

/** セルのピクセルサイズ */
export const CELL_SIZE = 20;

/** 移動方向 */
export type Direction = "up" | "down" | "left" | "right";

/** グリッド上の座標 */
export type Point = { x: number; y: number };

/** ゲーム状態 */
export type GameStatus = "idle" | "playing" | "paused" | "over";

/** ベストスコア保存キー */
const BEST_SCORE_KEY = "snake-best-score";

/**
 * 次の頭の位置を計算する
 * @param head - 現在の頭の位置
 * @param direction - 移動方向
 * @returns 次の頭の位置
 */
export function getNextHead(head: Point, direction: Direction): Point {
  switch (direction) {
    case "up":
      return { x: head.x, y: head.y - 1 };
    case "down":
      return { x: head.x, y: head.y + 1 };
    case "left":
      return { x: head.x - 1, y: head.y };
    case "right":
      return { x: head.x + 1, y: head.y };
  }
}

/**
 * 壁との衝突を確認する
 * @param point - 確認する座標
 * @returns 衝突している場合 true
 */
export function isWallCollision(point: Point): boolean {
  return (
    point.x < 0 ||
    point.x >= GRID_SIZE ||
    point.y < 0 ||
    point.y >= GRID_SIZE
  );
}

/**
 * 自身との衝突を確認する
 * @param head - 頭の座標
 * @param body - 胴体（頭を除く）の座標リスト
 * @returns 衝突している場合 true
 */
export function isSelfCollision(head: Point, body: Point[]): boolean {
  return body.some((cell) => cell.x === head.x && cell.y === head.y);
}

/**
 * 方向変更が有効か確認する（逆方向への移動禁止）
 * @param current - 現在の方向
 * @param next - 次の方向
 * @returns 有効な方向変更の場合 true
 */
export function isValidDirectionChange(
  current: Direction,
  next: Direction
): boolean {
  if (current === "up" && next === "down") return false;
  if (current === "down" && next === "up") return false;
  if (current === "left" && next === "right") return false;
  if (current === "right" && next === "left") return false;
  return true;
}

/**
 * 食べ物をランダムな空きセルに生成する
 * @param snake - 現在のスネーク全体の座標リスト
 * @returns 食べ物の座標
 */
export function generateFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const available: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y });
    }
  }
  if (available.length === 0) return { x: 0, y: 0 };
  return available[Math.floor(Math.random() * available.length)];
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

/** スネークゲームコンポーネント */
function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // ゲーム状態（Ref で管理してレンダリングループを安定させる）
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const directionRef = useRef<Direction>("right");
  const nextDirectionRef = useRef<Direction>("right");
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const statusRef = useRef<GameStatus>("idle");
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  /** 速度（スコアに応じて加速） */
  const getInterval = useCallback(() => {
    return Math.max(80, 150 - scoreRef.current * 2);
  }, []);

  /** キャンバスへの描画 */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = GRID_SIZE * CELL_SIZE;
    ctx.clearRect(0, 0, W, W);

    // 背景
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, W);

    // グリッド線（薄く）
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, W);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(W, i * CELL_SIZE);
      ctx.stroke();
    }

    // 食べ物（円形）
    const food = foodRef.current;
    ctx.fillStyle = "#ff6b6b";
    ctx.shadowColor = "#ff6b6b";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // スネーク
    const snake = snakeRef.current;
    snake.forEach((cell, index) => {
      const isHead = index === 0;
      const green = isHead ? 55 : Math.max(30, 45 - index);
      ctx.fillStyle = isHead
        ? "#4ecdc4"
        : `hsl(155, 60%, ${green}%)`;
      ctx.shadowColor = isHead ? "#4ecdc4" : "transparent";
      ctx.shadowBlur = isHead ? 6 : 0;
      const pad = isHead ? 1 : 2;
      ctx.fillRect(
        cell.x * CELL_SIZE + pad,
        cell.y * CELL_SIZE + pad,
        CELL_SIZE - pad * 2,
        CELL_SIZE - pad * 2
      );
    });
    ctx.shadowBlur = 0;
  }, []);

  /** ゲームループ */
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (statusRef.current !== "playing") return;

      if (timestamp - lastTimeRef.current >= getInterval()) {
        lastTimeRef.current = timestamp;

        // 方向確定
        directionRef.current = nextDirectionRef.current;

        // 次の頭の位置を計算
        const head = snakeRef.current[0];
        const nextHead = getNextHead(head, directionRef.current);

        // 壁・自分自身との衝突チェック
        // 次フレームで消える末尾を除いた胴体と比較する
        if (
          isWallCollision(nextHead) ||
          isSelfCollision(nextHead, snakeRef.current.slice(0, -1))
        ) {
          statusRef.current = "over";
          setStatus("over");
          const finalScore = scoreRef.current;
          setBestScore((prev) => {
            const next = Math.max(prev, finalScore);
            saveBestScore(next);
            return next;
          });
          draw();
          return;
        }

        // 食べ物を食べたか確認
        const ate =
          nextHead.x === foodRef.current.x &&
          nextHead.y === foodRef.current.y;

        // スネーク更新
        const newSnake = [nextHead, ...snakeRef.current];
        if (!ate) newSnake.pop();
        snakeRef.current = newSnake;

        if (ate) {
          const newScore = scoreRef.current + 10;
          scoreRef.current = newScore;
          setScore(newScore);
          foodRef.current = generateFood(newSnake);
        }

        draw();
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    },
    [draw, getInterval]
  );

  /** ゲーム開始 */
  const startGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    directionRef.current = "right";
    nextDirectionRef.current = "right";
    scoreRef.current = 0;
    setScore(0);
    foodRef.current = generateFood(snakeRef.current);
    lastTimeRef.current = 0;

    statusRef.current = "playing";
    setStatus("playing");
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  /** 一時停止 / 再開 */
  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      statusRef.current = "paused";
      setStatus("paused");
      cancelAnimationFrame(frameRef.current);
    } else if (statusRef.current === "paused") {
      statusRef.current = "playing";
      setStatus("playing");
      lastTimeRef.current = 0;
      frameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);

  // キーボード操作
  useEffect(() => {
    const dirMap: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      KeyW: "up",
      KeyS: "down",
      KeyA: "left",
      KeyD: "right",
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = dirMap[e.code];
      if (dir) {
        e.preventDefault();
        if (isValidDirectionChange(nextDirectionRef.current, dir)) {
          nextDirectionRef.current = dir;
        }
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (
          statusRef.current === "playing" ||
          statusRef.current === "paused"
        ) {
          togglePause();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(frameRef.current);
    };
  }, [togglePause]);

  // 初期描画とベストスコードロード
  useEffect(() => {
    setBestScore(loadBestScore());
    draw();
  }, [draw]);

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">スネークゲーム</h1>
        <p className="tool-description">
          ヘビを操作して食べ物を集め、できるだけ長く生き残ろう！
        </p>
      </div>

      <div className="snake-wrapper">
        <div className="snake-header">
          <div className="snake-scores">
            <div
              className="snake-score-card"
              aria-label={`スコア: ${score}`}
            >
              <span className="snake-score-label">スコア</span>
              <span className="snake-score-value">{score}</span>
            </div>
            <div
              className="snake-score-card"
              aria-label={`ベストスコア: ${bestScore}`}
            >
              <span className="snake-score-label">ベスト</span>
              <span className="snake-score-value">{bestScore}</span>
            </div>
          </div>
          <div className="snake-controls">
            {(status === "playing" || status === "paused") && (
              <Button
                variant="outline"
                onClick={togglePause}
                aria-label={status === "playing" ? "一時停止" : "再開"}
              >
                {status === "playing" ? "一時停止" : "再開"}
              </Button>
            )}
            <Button
              onClick={startGame}
              aria-label={
                status === "idle" ? "ゲームスタート" : "新しいゲーム"
              }
            >
              {status === "idle" ? "ゲームスタート" : "新しいゲーム"}
            </Button>
          </div>
        </div>

        <div
          className="snake-canvas-wrapper"
          role="application"
          aria-label="スネークゲームボード"
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="snake-canvas"
            aria-hidden="true"
          />

          {status === "idle" && (
            <div className="snake-overlay" role="status">
              <div className="snake-overlay-content">
                <p className="snake-overlay-message">🐍</p>
                <p className="snake-overlay-sub">
                  ゲームスタートボタンでスタート
                </p>
              </div>
            </div>
          )}

          {status === "paused" && (
            <div className="snake-overlay" role="status" aria-live="polite">
              <div className="snake-overlay-content">
                <p className="snake-overlay-message">⏸ 一時停止中</p>
                <p className="snake-overlay-sub">スペースキーまたはボタンで再開</p>
              </div>
            </div>
          )}

          {status === "over" && (
            <div
              className="snake-overlay snake-overlay-over"
              role="status"
              aria-live="polite"
            >
              <div className="snake-overlay-content">
                <p className="snake-overlay-message">💀 ゲームオーバー</p>
                <p className="snake-overlay-score">スコア: {score}</p>
                <Button onClick={startGame}>もう一度プレイ</Button>
              </div>
            </div>
          )}
        </div>

        <p className="snake-instructions">
          矢印キー / WASD で操作 ・ スペースキーで一時停止
        </p>
      </div>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "「ゲームスタート」ボタンでゲームを開始します",
              "矢印キー（←↑↓→）またはWASDキーでヘビの向きを変えます",
              "赤い食べ物を食べるとヘビが1マス伸び、10点獲得します",
              "壁や自分自身にぶつかるとゲームオーバーです",
            ],
          },
          {
            title: "攻略のコツ",
            items: [
              "スネークはスコアが上がるほど速くなります",
              "行き止まりにならないよう常に逃げ道を意識しましょう",
              "ヘビが長くなるほど移動できるスペースが減るので注意が必要です",
              "逆方向への入力は無視されるため急な方向転換に注意しましょう",
            ],
          },
        ]}
      />
    </div>
  );
}
