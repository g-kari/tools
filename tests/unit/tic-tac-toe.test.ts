import { describe, it, expect } from "vite-plus/test";
import {
  createEmptyBoard,
  getGameResult,
  getAvailableMoves,
  minimax,
  getAIMove,
  WIN_PATTERNS,
  type Board,
  type Player,
} from "../../app/routes/tic-tac-toe";

describe("三目並べ - createEmptyBoard", () => {
  it("9マスすべてnullの空ボードを返す", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(9);
    expect(board.every((cell) => cell === null)).toBe(true);
  });
});

describe("三目並べ - WIN_PATTERNS", () => {
  it("8つの勝利パターンが定義されている", () => {
    expect(WIN_PATTERNS).toHaveLength(8);
  });

  it("各パターンは3つのインデックスで構成される", () => {
    WIN_PATTERNS.forEach((pattern) => {
      expect(pattern).toHaveLength(3);
    });
  });
});

describe("三目並べ - getGameResult", () => {
  it("空のボードはplaying状態を返す", () => {
    const board = createEmptyBoard();
    const result = getGameResult(board);
    expect(result.status).toBe("playing");
    expect(result.winner).toBeNull();
    expect(result.line).toBeNull();
  });

  it("Xが横1行目に並んだらXの勝ち", () => {
    const board: Board = ["X", "X", "X", null, null, null, null, null, null];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("X");
    expect(result.line).toEqual([0, 1, 2]);
  });

  it("Oが横2行目に並んだらOの勝ち", () => {
    const board: Board = [null, null, null, "O", "O", "O", null, null, null];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("O");
    expect(result.line).toEqual([3, 4, 5]);
  });

  it("Xが横3行目に並んだらXの勝ち", () => {
    const board: Board = [null, null, null, null, null, null, "X", "X", "X"];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("X");
    expect(result.line).toEqual([6, 7, 8]);
  });

  it("Xが縦1列目に並んだらXの勝ち", () => {
    const board: Board = ["X", null, null, "X", null, null, "X", null, null];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("X");
    expect(result.line).toEqual([0, 3, 6]);
  });

  it("Oが縦2列目に並んだらOの勝ち", () => {
    const board: Board = [null, "O", null, null, "O", null, null, "O", null];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("O");
    expect(result.line).toEqual([1, 4, 7]);
  });

  it("Xが縦3列目に並んだらXの勝ち", () => {
    const board: Board = [null, null, "X", null, null, "X", null, null, "X"];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("X");
    expect(result.line).toEqual([2, 5, 8]);
  });

  it("Xが左上から右下の斜めに並んだらXの勝ち", () => {
    const board: Board = ["X", null, null, null, "X", null, null, null, "X"];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("X");
    expect(result.line).toEqual([0, 4, 8]);
  });

  it("Oが右上から左下の斜めに並んだらOの勝ち", () => {
    const board: Board = [null, null, "O", null, "O", null, "O", null, null];
    const result = getGameResult(board);
    expect(result.status).toBe("won");
    expect(result.winner).toBe("O");
    expect(result.line).toEqual([2, 4, 6]);
  });

  it("全マスが埋まって勝者なしは引き分け", () => {
    // XOX
    // OXO
    // OXO
    const board: Board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];
    const result = getGameResult(board);
    expect(result.status).toBe("draw");
    expect(result.winner).toBeNull();
    expect(result.line).toBeNull();
  });

  it("ゲーム途中で勝者なしはplaying状態", () => {
    const board: Board = ["X", "O", null, null, "X", null, null, null, null];
    const result = getGameResult(board);
    expect(result.status).toBe("playing");
  });
});

describe("三目並べ - getAvailableMoves", () => {
  it("空ボードでは全9マスが利用可能", () => {
    const board = createEmptyBoard();
    const moves = getAvailableMoves(board);
    expect(moves).toHaveLength(9);
    expect(moves).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("埋まったマスは除外される", () => {
    const board: Board = ["X", null, "O", null, "X", null, null, null, null];
    const moves = getAvailableMoves(board);
    expect(moves).not.toContain(0);
    expect(moves).not.toContain(2);
    expect(moves).not.toContain(4);
    expect(moves).toContain(1);
    expect(moves).toContain(3);
    expect(moves).toContain(5);
  });

  it("全マス埋まりの場合は空配列を返す", () => {
    const board: Board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];
    const moves = getAvailableMoves(board);
    expect(moves).toHaveLength(0);
  });
});

describe("三目並べ - minimax", () => {
  it("AIが勝てる局面では正のスコアを返す", () => {
    // O が次の手で勝てる局面
    // OO_
    // X_X
    // ___
    const board: Board = ["O", "O", null, "X", null, "X", null, null, null];
    const score = minimax(board, 0, true, "O");
    expect(score).toBeGreaterThan(0);
  });

  it("AIが負ける局面では負のスコアを返す", () => {
    // XXO
    // O__
    // _X_
    const board: Board = ["X", "X", "O", "O", null, null, null, "X", null];
    const score = minimax(board, 0, false, "O");
    expect(score).toBeLessThan(0);
  });

  it("引き分け局面では0を返す", () => {
    // XOX
    // OXO
    // OXO - 全マス埋まり
    const board: Board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];
    const score = minimax(board, 0, true, "O");
    expect(score).toBe(0);
  });
});

describe("三目並べ - getAIMove", () => {
  it("空きがなければ -1 を返す", () => {
    const board: Board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];
    const move = getAIMove(board, "O", "hard");
    expect(move).toBe(-1);
  });

  it("easyモードで有効な手を返す", () => {
    const board: Board = ["X", null, null, null, null, null, null, null, null];
    const move = getAIMove(board, "O", "easy");
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
    expect(board[move]).toBeNull();
  });

  it("hardモードで有効な手を返す", () => {
    const board: Board = ["X", null, null, null, null, null, null, null, null];
    const move = getAIMove(board, "O", "hard");
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
    expect(board[move]).toBeNull();
  });

  it("hardモードでOが勝てる手を選ぶ", () => {
    // OO_ -> O が index 2 を選んで勝つはず
    // X_X
    // ___
    const board: Board = ["O", "O", null, "X", null, "X", null, null, null];
    const move = getAIMove(board, "O", "hard");
    expect(move).toBe(2);
  });

  it("hardモードでXの勝ちを阻止する手を選ぶ", () => {
    // XX_ -> O が index 2 に置かないと X が勝つ
    // O__
    // ___
    const board: Board = ["X", "X", null, "O", null, null, null, null, null];
    const move = getAIMove(board, "O", "hard");
    expect(move).toBe(2);
  });

  it("hardモードの空ボードで有効な手を返す", () => {
    const board = createEmptyBoard();
    const aiPlayer: Player = "O";
    const move = getAIMove(board, aiPlayer, "hard");
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
  });
});
