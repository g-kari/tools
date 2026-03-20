import { describe, it, expect } from "vitest";
import {
  BOARD_SIZE,
  WIN_VALUE,
  createBoard,
  cloneBoard,
  getEmptyCells,
  addRandomTile,
  slideRowLeft,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
  moveBoard,
  transposeBoard,
  hasValidMoves,
  hasWon,
  type Board,
} from "../../app/routes/game-2048";

describe("createBoard", () => {
  it("4x4の空ボードを生成する", () => {
    const board = createBoard();
    expect(board).toHaveLength(BOARD_SIZE);
    board.forEach((row) => {
      expect(row).toHaveLength(BOARD_SIZE);
      row.forEach((cell) => expect(cell).toBeNull());
    });
  });
});

describe("cloneBoard", () => {
  it("ボードのディープコピーを生成する", () => {
    const board: Board = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const cloned = cloneBoard(board);
    expect(cloned).toEqual(board);
    cloned[0][0] = 999;
    expect(board[0][0]).toBe(2); // 元のボードに影響しない
  });
});

describe("getEmptyCells", () => {
  it("空きセルの位置を正しく返す", () => {
    const board = createBoard();
    board[0][0] = 2;
    board[2][3] = 4;
    const empty = getEmptyCells(board);
    expect(empty).toHaveLength(BOARD_SIZE * BOARD_SIZE - 2);
    expect(empty.every((c) => !(c.row === 0 && c.col === 0))).toBe(true);
    expect(empty.every((c) => !(c.row === 2 && c.col === 3))).toBe(true);
  });

  it("全セルが埋まっている場合は空配列を返す", () => {
    const board = createBoard().map((row) => row.map(() => 2)) as Board;
    expect(getEmptyCells(board)).toHaveLength(0);
  });
});

describe("addRandomTile", () => {
  it("空きセルに2または4を追加する", () => {
    const board = createBoard();
    const { board: newBoard, added } = addRandomTile(board);
    expect(added).toBe(true);
    const nonNull = newBoard.flat().filter((v) => v !== null);
    expect(nonNull).toHaveLength(1);
    expect([2, 4]).toContain(nonNull[0]);
  });

  it("空きセルがない場合は追加しない", () => {
    const board = createBoard().map((row) => row.map(() => 2)) as Board;
    const { added } = addRandomTile(board);
    expect(added).toBe(false);
  });
});

describe("slideRowLeft", () => {
  it("タイルを左に詰める", () => {
    const { row } = slideRowLeft([null, 2, null, 4]);
    expect(row).toEqual([2, 4, null, null]);
  });

  it("同じ値のタイルを合体させる", () => {
    const { row, score } = slideRowLeft([2, 2, null, null]);
    expect(row).toEqual([4, null, null, null]);
    expect(score).toBe(4);
  });

  it("連続する3つの同じ値は2+1に合体する", () => {
    const { row, score } = slideRowLeft([2, 2, 2, null]);
    expect(row).toEqual([4, 2, null, null]);
    expect(score).toBe(4);
  });

  it("連続する4つの同じ値は2+2に合体する", () => {
    const { row, score } = slideRowLeft([2, 2, 2, 2]);
    expect(row).toEqual([4, 4, null, null]);
    expect(score).toBe(8);
  });

  it("スコアが0の場合は移動のみ", () => {
    const { row, score } = slideRowLeft([null, 2, null, 4]);
    expect(row).toEqual([2, 4, null, null]);
    expect(score).toBe(0);
  });

  it("空の行はそのまま", () => {
    const { row, score } = slideRowLeft([null, null, null, null]);
    expect(row).toEqual([null, null, null, null]);
    expect(score).toBe(0);
  });
});

describe("moveLeft", () => {
  it("全行を左に移動する", () => {
    const board: Board = [
      [null, 2, null, 2],
      [null, null, 4, 4],
      [2, 2, 2, 2],
      [null, null, null, null],
    ];
    const { board: newBoard, score, moved } = moveLeft(board);
    expect(newBoard[0]).toEqual([4, null, null, null]);
    expect(newBoard[1]).toEqual([8, null, null, null]);
    expect(newBoard[2]).toEqual([4, 4, null, null]);
    expect(newBoard[3]).toEqual([null, null, null, null]);
    expect(score).toBe(4 + 8 + 8);
    expect(moved).toBe(true);
  });

  it("移動がない場合はmoved=falseを返す", () => {
    const board: Board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    const { moved } = moveLeft(board);
    expect(moved).toBe(false);
  });
});

describe("moveRight", () => {
  it("全行を右に移動する", () => {
    const board: Board = [
      [2, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const { board: newBoard, moved } = moveRight(board);
    expect(newBoard[0]).toEqual([null, null, null, 4]);
    expect(moved).toBe(true);
  });
});

describe("transposeBoard", () => {
  it("行と列を入れ替える", () => {
    const board: Board = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const transposed = transposeBoard(board);
    expect(transposed[0]).toEqual([1, 5, 9, 13]);
    expect(transposed[1]).toEqual([2, 6, 10, 14]);
    expect(transposed[2]).toEqual([3, 7, 11, 15]);
    expect(transposed[3]).toEqual([4, 8, 12, 16]);
  });
});

describe("moveUp", () => {
  it("全列を上に移動する", () => {
    const board: Board = [
      [null, null, null, null],
      [2, null, null, null],
      [2, null, null, null],
      [null, null, null, null],
    ];
    const { board: newBoard, moved } = moveUp(board);
    expect(newBoard[0][0]).toBe(4);
    expect(newBoard[1][0]).toBeNull();
    expect(moved).toBe(true);
  });
});

describe("moveDown", () => {
  it("全列を下に移動する", () => {
    const board: Board = [
      [2, null, null, null],
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const { board: newBoard, moved } = moveDown(board);
    expect(newBoard[3][0]).toBe(4);
    expect(newBoard[2][0]).toBeNull();
    expect(moved).toBe(true);
  });
});

describe("moveBoard", () => {
  it("left方向でmoveLeftと同じ結果を返す", () => {
    const board: Board = [
      [null, 2, null, 2],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const via = moveBoard(board, "left");
    const direct = moveLeft(board);
    expect(via.board).toEqual(direct.board);
    expect(via.score).toBe(direct.score);
  });
});

describe("hasValidMoves", () => {
  it("空きセルがある場合はtrueを返す", () => {
    const board = createBoard();
    board[0][0] = 2;
    expect(hasValidMoves(board)).toBe(true);
  });

  it("隣接する同値タイルがある場合はtrueを返す", () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    board[0][0] = 2;
    board[0][1] = 2; // 同値隣接
    expect(hasValidMoves(board)).toBe(true);
  });

  it("移動不可能なボードではfalseを返す", () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(hasValidMoves(board)).toBe(false);
  });
});

describe("hasWon", () => {
  it(`${WIN_VALUE}のタイルがある場合はtrueを返す`, () => {
    const board = createBoard();
    board[0][0] = WIN_VALUE;
    expect(hasWon(board)).toBe(true);
  });

  it(`${WIN_VALUE}のタイルがない場合はfalseを返す`, () => {
    const board = createBoard();
    board[0][0] = 1024;
    expect(hasWon(board)).toBe(false);
  });

  it("空のボードではfalseを返す", () => {
    expect(hasWon(createBoard())).toBe(false);
  });
});
