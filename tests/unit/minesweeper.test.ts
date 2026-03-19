import { describe, it, expect } from "vitest";
import {
  createEmptyBoard,
  placeMines,
  countAdjacentMines,
  revealCell,
  isGameWon,
  formatTime,
  DIFFICULTY_CONFIGS,
} from "../../app/routes/minesweeper";
import type { Board } from "../../app/routes/minesweeper";

describe("createEmptyBoard", () => {
  it("指定サイズのボードを生成すること", () => {
    const board = createEmptyBoard(9, 9);
    expect(board).toHaveLength(9);
    expect(board[0]).toHaveLength(9);
  });

  it("全セルが未開放・非地雷・隣接数0であること", () => {
    const board = createEmptyBoard(5, 5);
    for (const row of board) {
      for (const cell of row) {
        expect(cell.isMine).toBe(false);
        expect(cell.state).toBe("hidden");
        expect(cell.adjacentMines).toBe(0);
        expect(cell.isExploded).toBe(false);
      }
    }
  });

  it("異なる行・列サイズで生成できること", () => {
    const board = createEmptyBoard(16, 30);
    expect(board).toHaveLength(16);
    expect(board[0]).toHaveLength(30);
  });
});

describe("placeMines", () => {
  it("指定した数の地雷が配置されること", () => {
    const board = placeMines(9, 9, 10, 4, 4);
    let mineCount = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.isMine) mineCount++;
      }
    }
    expect(mineCount).toBe(10);
  });

  it("最初のクリック位置に地雷が配置されないこと", () => {
    for (let trial = 0; trial < 20; trial++) {
      const board = placeMines(9, 9, 10, 4, 4);
      expect(board[4][4].isMine).toBe(false);
    }
  });

  it("最初のクリック周囲3x3に地雷が配置されないこと", () => {
    for (let trial = 0; trial < 20; trial++) {
      const board = placeMines(9, 9, 10, 0, 0);
      // (0,0), (0,1), (1,0), (1,1) は安全
      expect(board[0][0].isMine).toBe(false);
      expect(board[0][1].isMine).toBe(false);
      expect(board[1][0].isMine).toBe(false);
      expect(board[1][1].isMine).toBe(false);
    }
  });

  it("隣接地雷数が正しく計算されること", () => {
    // 固定パターンで検証: (0,0)に地雷を置き、(0,1)の隣接数を確認
    const board = createEmptyBoard(3, 3);
    board[0][0].isMine = true;
    // 手動で隣接数再計算
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!board[r][c].isMine) {
          board[r][c].adjacentMines = countAdjacentMines(board, r, c, 3, 3);
        }
      }
    }
    // (0,0)が地雷なので、隣接セル(0,1),(1,0),(1,1)は隣接数1
    expect(board[0][1].adjacentMines).toBe(1);
    expect(board[1][0].adjacentMines).toBe(1);
    expect(board[1][1].adjacentMines).toBe(1);
    // (2,2)は地雷と隣接しない
    expect(board[2][2].adjacentMines).toBe(0);
  });
});

describe("countAdjacentMines", () => {
  it("隣接地雷がない場合は0を返すこと", () => {
    const board = createEmptyBoard(3, 3);
    expect(countAdjacentMines(board, 1, 1, 3, 3)).toBe(0);
  });

  it("全周囲が地雷の場合は8を返すこと", () => {
    const board = createEmptyBoard(3, 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r !== 1 || c !== 1) board[r][c].isMine = true;
      }
    }
    expect(countAdjacentMines(board, 1, 1, 3, 3)).toBe(8);
  });

  it("角セルは最大3マスしか隣接しないこと", () => {
    const board = createEmptyBoard(3, 3);
    board[0][1].isMine = true;
    board[1][0].isMine = true;
    board[1][1].isMine = true;
    expect(countAdjacentMines(board, 0, 0, 3, 3)).toBe(3);
  });
});

describe("revealCell", () => {
  it("指定セルが開放されること", () => {
    const board = createEmptyBoard(3, 3);
    // 中央セル周囲に地雷を配置して連鎖しないようにする
    board[0][0].isMine = true;
    board[1][1].adjacentMines = 1;
    revealCell(board, 1, 1, 3, 3);
    expect(board[1][1].state).toBe("revealed");
  });

  it("隣接地雷0のセルはフラッドフィルで連鎖開放されること", () => {
    const board = createEmptyBoard(3, 3);
    // 全セル隣接数0（地雷なし）で連鎖開放
    revealCell(board, 1, 1, 3, 3);
    for (const row of board) {
      for (const cell of row) {
        expect(cell.state).toBe("revealed");
      }
    }
  });

  it("フラグ付きセルは開放されないこと", () => {
    const board = createEmptyBoard(3, 3);
    board[0][0].state = "flagged";
    revealCell(board, 1, 1, 3, 3);
    // フラグセルはフラッドフィルでも開放されない
    expect(board[0][0].state).toBe("flagged");
  });

  it("既に開放済みのセルは再処理されないこと", () => {
    const board = createEmptyBoard(3, 3);
    board[0][0].state = "revealed";
    revealCell(board, 0, 0, 3, 3); // 既に revealed
    expect(board[0][0].state).toBe("revealed");
  });
});

describe("isGameWon", () => {
  const makeBoard = (rows: number, cols: number): Board =>
    createEmptyBoard(rows, cols);

  it("全非地雷セルが開放済みならtrueを返すこと", () => {
    const board = makeBoard(2, 2);
    board[0][0].isMine = true;
    // 残り3セルを開放
    board[0][1].state = "revealed";
    board[1][0].state = "revealed";
    board[1][1].state = "revealed";
    expect(isGameWon(board, 1)).toBe(true);
  });

  it("未開放セルが残っている場合はfalseを返すこと", () => {
    const board = makeBoard(2, 2);
    board[0][0].isMine = true;
    board[0][1].state = "revealed";
    board[1][0].state = "revealed";
    // board[1][1]は未開放
    expect(isGameWon(board, 1)).toBe(false);
  });

  it("地雷セルがフラグ付きでも非地雷が未開放ならfalseを返すこと", () => {
    const board = makeBoard(2, 2);
    board[0][0].isMine = true;
    board[0][0].state = "flagged";
    board[0][1].state = "revealed";
    // board[1][0], board[1][1] は未開放
    expect(isGameWon(board, 1)).toBe(false);
  });

  it("地雷数と同数のhiddenセルしかない場合はtrueを返すこと", () => {
    const board = makeBoard(2, 2);
    board[0][0].isMine = true;
    board[0][1].state = "revealed";
    board[1][0].state = "revealed";
    board[1][1].state = "revealed";
    // hidden は board[0][0]（地雷）のみ = mineCount と一致
    expect(isGameWon(board, 1)).toBe(true);
  });
});

describe("formatTime", () => {
  it("0秒は '00' を返すこと", () => {
    expect(formatTime(0)).toBe("00");
  });

  it("59秒未満は秒のみを返すこと", () => {
    expect(formatTime(5)).toBe("05");
    expect(formatTime(59)).toBe("59");
  });

  it("60秒以上は MM:SS 形式を返すこと", () => {
    expect(formatTime(60)).toBe("01:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3661)).toBe("61:01");
  });

  it("負の値は '00' を返すこと", () => {
    expect(formatTime(-5)).toBe("00");
  });

  it("999秒の上限を正しくフォーマットすること", () => {
    expect(formatTime(999)).toBe("16:39");
  });
});

describe("DIFFICULTY_CONFIGS", () => {
  it("初級は 9x9 で10地雷であること", () => {
    expect(DIFFICULTY_CONFIGS.easy).toEqual({ cols: 9, rows: 9, mines: 10 });
  });

  it("中級は 16x16 で40地雷であること", () => {
    expect(DIFFICULTY_CONFIGS.medium).toEqual({
      cols: 16,
      rows: 16,
      mines: 40,
    });
  });

  it("上級は 30x16 で99地雷であること", () => {
    expect(DIFFICULTY_CONFIGS.hard).toEqual({ cols: 30, rows: 16, mines: 99 });
  });
});
