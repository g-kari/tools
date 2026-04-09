import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/tic-tac-toe")({
  head: () => ({
    meta: [
      { title: "三目並べ | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザで遊べる三目並べ（Tic-Tac-Toe）。CPUとの対戦（簡単・強い）や2人対戦に対応。ミニマックスAIで最強のCPUに挑戦しよう。",
      },
      { property: "og:title", content: "三目並べ | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブラウザで遊べる三目並べ（Tic-Tac-Toe）。CPUとの対戦（簡単・強い）や2人対戦に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/tic-tac-toe` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "三目並べ | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブラウザで遊べる三目並べ（Tic-Tac-Toe）。CPUとの対戦（簡単・強い）や2人対戦に対応。",
      },
    ],
  }),
  component: TicTacToeGame,
});

/** プレイヤーの型 */
export type Player = "X" | "O";

/** セルの値の型 */
export type CellValue = Player | null;

/** ボードの型（9マスの配列） */
export type Board = CellValue[];

/** ゲームの難易度 */
export type Difficulty = "easy" | "hard";

/** ゲームモード */
export type GameMode = "vs-cpu" | "vs-player";

/** ゲームの状態 */
export type GameStatus = "playing" | "won" | "draw";

/** スコア情報 */
export interface Score {
  /** Xプレイヤーの勝利数 */
  x: number;
  /** Oプレイヤーの勝利数 */
  o: number;
  /** 引き分け数 */
  draw: number;
}

/** 勝利パターン（行・列・斜め） */
export const WIN_PATTERNS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * 空のボードを作成する
 * @returns 空のボード（9マスすべてnull）
 */
export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

/**
 * ゲーム結果を判定する
 * @param board - ボード状態
 * @returns ゲーム状態・勝者・勝利ラインの情報
 */
export function getGameResult(board: Board): {
  status: GameStatus;
  winner: Player | null;
  line: number[] | null;
} {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        status: "won",
        winner: board[a] as Player,
        line: [a, b, c],
      };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { status: "draw", winner: null, line: null };
  }
  return { status: "playing", winner: null, line: null };
}

/**
 * 利用可能な手（空きセルのインデックス）を取得する
 * @param board - ボード状態
 * @returns 空きセルのインデックス配列
 */
export function getAvailableMoves(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

/**
 * minimax アルゴリズムでボードを評価する
 * @param board - ボード状態
 * @param depth - 探索の深さ
 * @param isMaximizing - 最大化プレイヤーのターンかどうか
 * @param aiPlayer - AIのプレイヤー記号
 * @returns 評価スコア
 */
export function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
): number {
  const humanPlayer: Player = aiPlayer === "O" ? "X" : "O";
  const result = getGameResult(board);

  if (result.status === "won") {
    return result.winner === aiPlayer ? 10 - depth : depth - 10;
  }
  if (result.status === "draw") {
    return 0;
  }

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const newBoard = [...board] as Board;
      newBoard[move] = aiPlayer;
      best = Math.max(best, minimax(newBoard, depth + 1, false, aiPlayer));
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newBoard = [...board] as Board;
      newBoard[move] = humanPlayer;
      best = Math.min(best, minimax(newBoard, depth + 1, true, aiPlayer));
    }
    return best;
  }
}

/**
 * 難易度に応じたAIの手を取得する
 * @param board - ボード状態
 * @param aiPlayer - AIのプレイヤー記号
 * @param difficulty - 難易度
 * @returns AIが選択したセルのインデックス（空きなければ -1）
 */
export function getAIMove(board: Board, aiPlayer: Player, difficulty: Difficulty): number {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return -1;

  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // hard: minimax で最善手を探索
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const newBoard = [...board] as Board;
    newBoard[move] = aiPlayer;
    const score = minimax(newBoard, 0, false, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/** 三目並べゲームのメインコンポーネント */
function TicTacToeGame() {
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameMode, setGameMode] = useState<GameMode>("vs-cpu");
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [score, setScore] = useState<Score>({ x: 0, o: 0, draw: 0 });
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<Player | null>(null);
  /** CPUが先手（O）かどうか。プレイヤーがXで、CPUはO */
  const cpuPlayer: Player = "O";
  const humanPlayer: Player = "X";

  const isThinking = useRef(false);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer("X");
    setWinLine(null);
    setGameStatus("playing");
    setWinner(null);
    isThinking.current = false;
  }, []);

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameStatus !== "playing" || board[index] !== null || isThinking.current) return;
      if (gameMode === "vs-cpu" && currentPlayer === cpuPlayer) return;

      const newBoard = [...board] as Board;
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const result = getGameResult(newBoard);
      if (result.status === "won") {
        setGameStatus("won");
        setWinner(result.winner);
        setWinLine(result.line);
        setScore((prev) => ({
          ...prev,
          [result.winner!.toLowerCase()]: prev[result.winner!.toLowerCase() as keyof Score] + 1,
        }));
        announceStatus(`${result.winner === humanPlayer ? "あなた" : "CPU"} の勝利です！`);
        return;
      }
      if (result.status === "draw") {
        setGameStatus("draw");
        setScore((prev) => ({ ...prev, draw: prev.draw + 1 }));
        announceStatus("引き分けです！");
        return;
      }

      setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
    },
    [board, currentPlayer, gameMode, gameStatus, announceStatus, cpuPlayer, humanPlayer],
  );

  // CPU の思考処理
  useEffect(() => {
    if (
      gameMode !== "vs-cpu" ||
      gameStatus !== "playing" ||
      currentPlayer !== cpuPlayer ||
      isThinking.current
    )
      return;

    isThinking.current = true;
    const timer = setTimeout(() => {
      const move = getAIMove(board, cpuPlayer, difficulty);
      if (move === -1) {
        isThinking.current = false;
        return;
      }

      const newBoard = [...board] as Board;
      newBoard[move] = cpuPlayer;
      setBoard(newBoard);

      const result = getGameResult(newBoard);
      if (result.status === "won") {
        setGameStatus("won");
        setWinner(result.winner);
        setWinLine(result.line);
        setScore((prev) => ({
          ...prev,
          [result.winner!.toLowerCase()]: prev[result.winner!.toLowerCase() as keyof Score] + 1,
        }));
        announceStatus("CPU の勝利です！");
      } else if (result.status === "draw") {
        setGameStatus("draw");
        setScore((prev) => ({ ...prev, draw: prev.draw + 1 }));
        announceStatus("引き分けです！");
      } else {
        setCurrentPlayer("X");
      }
      isThinking.current = false;
    }, 400);

    return () => clearTimeout(timer);
  }, [board, currentPlayer, gameMode, gameStatus, difficulty, announceStatus, cpuPlayer]);

  const handleModeChange = useCallback(
    (mode: GameMode) => {
      setGameMode(mode);
      resetGame();
      setScore({ x: 0, o: 0, draw: 0 });
    },
    [resetGame],
  );

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      resetGame();
      setScore({ x: 0, o: 0, draw: 0 });
    },
    [resetGame],
  );

  const isCpuThinking =
    gameMode === "vs-cpu" && currentPlayer === cpuPlayer && gameStatus === "playing";

  const statusText = (() => {
    if (gameStatus === "won") {
      if (gameMode === "vs-cpu") {
        return winner === humanPlayer ? "あなたの勝ち！🎉" : "CPUの勝ち！😢";
      }
      return `プレイヤー ${winner} の勝ち！🎉`;
    }
    if (gameStatus === "draw") return "引き分け！🤝";
    if (isCpuThinking) return "CPUが考え中...";
    if (gameMode === "vs-cpu") {
      return currentPlayer === humanPlayer ? "あなたのターン（X）" : "CPUのターン（O）";
    }
    return `プレイヤー ${currentPlayer} のターン`;
  })();

  return (
    <>
      <div className="tool-container">
        {/* 設定セクション */}
        <div className="converter-section">
          <h2 className="section-title">ゲーム設定</h2>
          <div className="ttt-settings">
            <div className="ttt-setting-group">
              <label className="ttt-setting-label">モード</label>
              <div className="ttt-button-group" role="group" aria-label="ゲームモード選択">
                <button
                  type="button"
                  className={`ttt-mode-btn${gameMode === "vs-cpu" ? " ttt-mode-btn--active" : ""}`}
                  onClick={() => handleModeChange("vs-cpu")}
                  aria-pressed={gameMode === "vs-cpu"}
                >
                  CPU対戦
                </button>
                <button
                  type="button"
                  className={`ttt-mode-btn${gameMode === "vs-player" ? " ttt-mode-btn--active" : ""}`}
                  onClick={() => handleModeChange("vs-player")}
                  aria-pressed={gameMode === "vs-player"}
                >
                  2人対戦
                </button>
              </div>
            </div>

            {gameMode === "vs-cpu" && (
              <div className="ttt-setting-group">
                <label className="ttt-setting-label">難易度</label>
                <div className="ttt-button-group" role="group" aria-label="CPU難易度選択">
                  <button
                    type="button"
                    className={`ttt-mode-btn${difficulty === "easy" ? " ttt-mode-btn--active" : ""}`}
                    onClick={() => handleDifficultyChange("easy")}
                    aria-pressed={difficulty === "easy"}
                  >
                    かんたん
                  </button>
                  <button
                    type="button"
                    className={`ttt-mode-btn${difficulty === "hard" ? " ttt-mode-btn--active" : ""}`}
                    onClick={() => handleDifficultyChange("hard")}
                    aria-pressed={difficulty === "hard"}
                  >
                    強い
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* スコアボード */}
        <div className="converter-section">
          <div className="ttt-scoreboard" aria-label="スコア">
            <div className="ttt-score-item">
              <span className="ttt-score-label">{gameMode === "vs-cpu" ? "あなた (X)" : "X"}</span>
              <span className="ttt-score-value ttt-score-x" aria-label={`X: ${score.x}勝`}>
                {score.x}
              </span>
            </div>
            <div className="ttt-score-item ttt-score-draw-item">
              <span className="ttt-score-label">引き分け</span>
              <span className="ttt-score-value" aria-label={`引き分け: ${score.draw}回`}>
                {score.draw}
              </span>
            </div>
            <div className="ttt-score-item">
              <span className="ttt-score-label">{gameMode === "vs-cpu" ? "CPU (O)" : "O"}</span>
              <span className="ttt-score-value ttt-score-o" aria-label={`O: ${score.o}勝`}>
                {score.o}
              </span>
            </div>
          </div>
        </div>

        {/* ゲームボード */}
        <div className="converter-section">
          <div className="ttt-status" aria-live="polite" aria-label="ゲーム状態">
            {statusText}
          </div>

          <div className="ttt-board" role="grid" aria-label="三目並べボード">
            {board.map((cell, index) => {
              const isWinCell = winLine?.includes(index) ?? false;
              const row = Math.floor(index / 3) + 1;
              const col = (index % 3) + 1;
              return (
                <button
                  key={index}
                  type="button"
                  className={[
                    "ttt-cell",
                    cell === "X" ? "ttt-cell--x" : "",
                    cell === "O" ? "ttt-cell--o" : "",
                    isWinCell ? "ttt-cell--win" : "",
                    !cell && gameStatus === "playing" && !isCpuThinking ? "ttt-cell--empty" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleCellClick(index)}
                  disabled={
                    cell !== null ||
                    gameStatus !== "playing" ||
                    isCpuThinking ||
                    (gameMode === "vs-cpu" && currentPlayer === cpuPlayer)
                  }
                  aria-label={`${row}行${col}列: ${cell ?? "空き"}`}
                  role="gridcell"
                >
                  {cell && (
                    <span className="ttt-cell-symbol" aria-hidden="true">
                      {cell}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ttt-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={resetGame}
              aria-label="ゲームをリセット"
            >
              もう一度
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                resetGame();
                setScore({ x: 0, o: 0, draw: 0 });
              }}
              aria-label="スコアをリセット"
            >
              スコアリセット
            </button>
          </div>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "遊び方",
            items: [
              "3×3のマスに交互にXとOを置いていきます",
              "縦・横・斜めのいずれかに3つ並べたプレイヤーの勝ちです",
              "全マスが埋まっても決着がつかない場合は引き分けです",
              "CPU対戦では「強い」モードにするとミニマックスAIが最善手を指します",
            ],
          },
          {
            title: "戦略のコツ",
            items: [
              "中央（5マス目）を取ると有利な展開が多くなります",
              "相手の勝利を妨害しながら自分の勝ちルートを確保しましょう",
              "「強い」CPUは理論的に最善手を指すため、先手（X）でも後手（O）でも引き分けが最善です",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
