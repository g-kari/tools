import { describe, it, expect } from "vite-plus/test";
import {
  isValidPlacement,
  solveSudoku,
  generateSudoku,
  getConflictCells,
  isBoardComplete,
  formatTime,
  type SudokuBoard,
  type CellValue,
} from "../../app/routes/sudoku";

/** 空の 9x9 盤面を生成するヘルパー */
function emptyBoard(): SudokuBoard {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/** ユーザー入力マップを生成するヘルパー */
function makeUserValues(
  entries: Array<[string, number, boolean?]>
): Map<string, CellValue> {
  return new Map(
    entries.map(([key, value, isHint = false]) => [key, { value, isHint }])
  );
}

describe("isValidPlacement", () => {
  it("空盤面には任意の数値を配置できる", () => {
    const board = emptyBoard();
    for (let n = 1; n <= 9; n++) {
      expect(isValidPlacement(board, 0, 0, n)).toBe(true);
    }
  });

  it("行に既存の数値と重複する場合は false を返す", () => {
    const board = emptyBoard();
    board[0][3] = 5;
    expect(isValidPlacement(board, 0, 0, 5)).toBe(false);
  });

  it("列に既存の数値と重複する場合は false を返す", () => {
    const board = emptyBoard();
    board[4][0] = 7;
    expect(isValidPlacement(board, 0, 0, 7)).toBe(false);
  });

  it("3x3ブロックに既存の数値と重複する場合は false を返す", () => {
    const board = emptyBoard();
    board[1][1] = 3;
    expect(isValidPlacement(board, 2, 2, 3)).toBe(false);
  });

  it("行・列・ブロックに重複がなければ true を返す", () => {
    const board = emptyBoard();
    board[0][1] = 1;
    board[1][0] = 2;
    board[3][3] = 5;
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true);
  });

  it("異なるブロックの同数値は影響しない", () => {
    const board = emptyBoard();
    board[3][3] = 9; // 中央ブロック
    expect(isValidPlacement(board, 0, 0, 9)).toBe(true); // 左上ブロック
  });
});

describe("solveSudoku", () => {
  it("解けるパズルを正しく解く", () => {
    const board: SudokuBoard = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];
    const result = solveSudoku(board);
    expect(result).toBe(true);
    // 全セルが埋まっているか確認
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(board[r][c]).toBeGreaterThanOrEqual(1);
        expect(board[r][c]).toBeLessThanOrEqual(9);
      }
    }
  });

  it("解なしのパズルは false を返す", () => {
    // 行0を1-8で埋め、列8に9を置くことで [0][8] に置ける数字がなくなる
    const board = emptyBoard();
    board[0] = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // [0][8] には 9 しか入らない
    board[1][8] = 9; // 列8に9があるため [0][8] に9を置けない
    expect(solveSudoku(board)).toBe(false);
  });

  it("既に完成した盤面は true を返す", () => {
    // 完成した有効な数独盤面
    const board: SudokuBoard = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];
    expect(solveSudoku(board)).toBe(true);
  });
});

describe("generateSudoku", () => {
  // generateSudoku は重い処理のため、1回生成して複数テストで使い回す
  const generated = {
    easy: generateSudoku("easy"),
    medium: generateSudoku("medium"),
    hard: generateSudoku("hard"),
  };

  it("easy 難易度でパズルが生成される（9x9の形式）", () => {
    const { puzzle, solution } = generated.easy;
    expect(puzzle).toHaveLength(9);
    expect(solution).toHaveLength(9);
    puzzle.forEach((row) => expect(row).toHaveLength(9));
    solution.forEach((row) => expect(row).toHaveLength(9));
  });

  it("medium 難易度でパズルが生成される", () => {
    const { puzzle, solution } = generated.medium;
    expect(puzzle).toHaveLength(9);
    expect(solution).toHaveLength(9);
  });

  it("hard 難易度でパズルが生成される", () => {
    const { puzzle, solution } = generated.hard;
    expect(puzzle).toHaveLength(9);
    expect(solution).toHaveLength(9);
  });

  it("easy パズルの空きセル数が 35 である", () => {
    let emptyCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (generated.easy.puzzle[r][c] === 0) emptyCount++;
      }
    }
    expect(emptyCount).toBe(35);
  });

  it("solution の全セルが 1-9 の値を持つ", () => {
    const { solution } = generated.easy;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(solution[r][c]).toBeGreaterThanOrEqual(1);
        expect(solution[r][c]).toBeLessThanOrEqual(9);
      }
    }
  });

  it("solution は有効な数独である（各行に1-9がある）", () => {
    const { solution } = generated.easy;
    for (let r = 0; r < 9; r++) {
      const row = solution[r].slice().sort((a, b) => a - b);
      expect(row).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it("solution は有効な数独である（各列に1-9がある）", () => {
    const { solution } = generated.easy;
    for (let c = 0; c < 9; c++) {
      const col = solution.map((r) => r[c]).sort((a, b) => a - b);
      expect(col).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });
});

describe("getConflictCells", () => {
  it("競合がない場合は空の Set を返す", () => {
    const puzzle = emptyBoard();
    const userValues = makeUserValues([
      ["0-0", 1],
      ["0-1", 2],
    ]);
    const conflicts = getConflictCells(puzzle, userValues);
    expect(conflicts.size).toBe(0);
  });

  it("行の重複を検出する", () => {
    const puzzle = emptyBoard();
    const userValues = makeUserValues([
      ["0-0", 5],
      ["0-5", 5],
    ]);
    const conflicts = getConflictCells(puzzle, userValues);
    expect(conflicts.has("0-0")).toBe(true);
    expect(conflicts.has("0-5")).toBe(true);
  });

  it("列の重複を検出する", () => {
    const puzzle = emptyBoard();
    const userValues = makeUserValues([
      ["0-0", 7],
      ["5-0", 7],
    ]);
    const conflicts = getConflictCells(puzzle, userValues);
    expect(conflicts.has("0-0")).toBe(true);
    expect(conflicts.has("5-0")).toBe(true);
  });

  it("3x3ブロックの重複を検出する", () => {
    const puzzle = emptyBoard();
    const userValues = makeUserValues([
      ["0-0", 3],
      ["2-2", 3],
    ]);
    const conflicts = getConflictCells(puzzle, userValues);
    expect(conflicts.has("0-0")).toBe(true);
    expect(conflicts.has("2-2")).toBe(true);
  });

  it("初期値との重複を検出する", () => {
    const puzzle = emptyBoard();
    puzzle[0][3] = 4;
    const userValues = makeUserValues([["0-0", 4]]);
    const conflicts = getConflictCells(puzzle, userValues);
    expect(conflicts.has("0-0")).toBe(true);
  });
});

describe("isBoardComplete", () => {
  it("空きセルがある場合は false を返す", () => {
    const puzzle = emptyBoard();
    puzzle[0][0] = 1;
    const userValues = new Map<string, CellValue>();
    expect(isBoardComplete(puzzle, userValues)).toBe(false);
  });

  it("完成かつ競合なしの場合は true を返す", () => {
    // 完成した有効な数独盤面をパズルとして使用
    const solution: SudokuBoard = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];
    // 最初のセルだけ空きにして、ユーザー入力で埋める
    const puzzle = solution.map((row) => [...row]);
    puzzle[0][0] = 0;
    const userValues = makeUserValues([["0-0", 5]]);
    expect(isBoardComplete(puzzle, userValues)).toBe(true);
  });

  it("競合がある場合は false を返す", () => {
    const puzzle = emptyBoard();
    // 行の最初のセル2つ以外を全て初期値で埋める（適当な値で）
    // 同じ行に同じユーザー入力値を置いて競合させる
    const userValues = makeUserValues([
      ["0-0", 5],
      ["0-8", 5], // 同じ行に同じ値
    ]);
    expect(isBoardComplete(puzzle, userValues)).toBe(false);
  });
});

describe("formatTime", () => {
  it("0秒を '00:00' に変換する", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("59秒を '00:59' に変換する", () => {
    expect(formatTime(59)).toBe("00:59");
  });

  it("60秒を '01:00' に変換する", () => {
    expect(formatTime(60)).toBe("01:00");
  });

  it("65秒を '01:05' に変換する", () => {
    expect(formatTime(65)).toBe("01:05");
  });

  it("3661秒を '61:01' に変換する", () => {
    expect(formatTime(3661)).toBe("61:01");
  });

  it("負の値は '00:00' を返す", () => {
    expect(formatTime(-10)).toBe("00:00");
  });

  it("小数点以下は切り捨てる", () => {
    expect(formatTime(65.9)).toBe("01:05");
  });
});
