import { describe, it, expect } from "vite-plus/test";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINOES,
  createBoard,
  getRandomPieceType,
  rotatePiece,
  isValidPosition,
  placePiece,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropSpeed,
  getGhostY,
} from "../../app/routes/tetris";

describe("createBoard", () => {
  it("正しいサイズのボードを作成する", () => {
    const board = createBoard();
    expect(board.length).toBe(BOARD_HEIGHT);
    expect(board[0].length).toBe(BOARD_WIDTH);
  });

  it("すべてのセルがゼロで初期化される", () => {
    const board = createBoard();
    expect(board.every((row) => row.every((cell) => cell === 0))).toBe(true);
  });
});

describe("getRandomPieceType", () => {
  it("1〜7の範囲のピース種類を返す", () => {
    for (let i = 0; i < 30; i++) {
      const type = getRandomPieceType();
      expect(type).toBeGreaterThanOrEqual(1);
      expect(type).toBeLessThanOrEqual(7);
    }
  });

  it("ランダム性がある（複数回で異なる値が出る）", () => {
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(getRandomPieceType());
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("rotatePiece", () => {
  it("Iピースを正しく回転する", () => {
    const I = TETROMINOES[1]; // [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]
    const rotated = rotatePiece(I);
    expect(rotated.length).toBe(4); // 列数が行数になる
    expect(rotated[0].length).toBe(4);
    // 回転後: 2列目に縦1が並ぶ
    expect(rotated[0][2]).toBe(1);
    expect(rotated[1][2]).toBe(1);
    expect(rotated[2][2]).toBe(1);
    expect(rotated[3][2]).toBe(1);
  });

  it("Oピースを回転しても形が変わらない", () => {
    const O = TETROMINOES[2]; // [[1,1],[1,1]]
    const rotated = rotatePiece(O);
    expect(rotated).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });

  it("4回回転すると元の形に戻る", () => {
    const T = TETROMINOES[3];
    let shape = T;
    for (let i = 0; i < 4; i++) shape = rotatePiece(shape);
    expect(shape).toEqual(T);
  });

  it("回転行列のサイズが正しい（cols×rows）", () => {
    const L = TETROMINOES[7]; // 3x3
    const rotated = rotatePiece(L);
    expect(rotated.length).toBe(L[0].length);
    expect(rotated[0].length).toBe(L.length);
  });
});

describe("isValidPosition", () => {
  const board = createBoard();

  it("ボード中央に配置できる", () => {
    const shape = TETROMINOES[3]; // T
    expect(isValidPosition(board, shape, { x: 4, y: 5 })).toBe(true);
  });

  it("左端を超えると無効", () => {
    const shape = TETROMINOES[3];
    expect(isValidPosition(board, shape, { x: -1, y: 5 })).toBe(false);
  });

  it("右端を超えると無効", () => {
    const shape = TETROMINOES[3]; // 3列幅
    expect(isValidPosition(board, shape, { x: BOARD_WIDTH - 2, y: 5 })).toBe(false);
  });

  it("下端を超えると無効", () => {
    const shape = TETROMINOES[2]; // O (2行)
    expect(isValidPosition(board, shape, { x: 4, y: BOARD_HEIGHT })).toBe(false);
  });

  it("他のピースと重なると無効", () => {
    const filledBoard = createBoard();
    filledBoard[5][4] = 1; // (4,5)に配置済みセル
    const _shape = TETROMINOES[2]; // O: (x,y),(x+1,y),(x,y+1),(x+1,y+1)
    // Tピースの(1,1)が(4,5)に当たる位置に配置
    expect(isValidPosition(filledBoard, TETROMINOES[3], { x: 3, y: 4 })).toBe(false);
  });

  it("Y座標がマイナス（盤外上部）でも有効な場合がある", () => {
    const shape = TETROMINOES[3];
    // y=-1でも形の一部がボード内であれば有効
    expect(isValidPosition(board, shape, { x: 4, y: -1 })).toBe(true);
  });
});

describe("placePiece", () => {
  it("ピースをボードに正しく配置する", () => {
    const board = createBoard();
    const shape = TETROMINOES[2]; // O: [[1,1],[1,1]]
    const result = placePiece(board, shape, { x: 4, y: 5 }, 2);
    expect(result[5][4]).toBe(2);
    expect(result[5][5]).toBe(2);
    expect(result[6][4]).toBe(2);
    expect(result[6][5]).toBe(2);
  });

  it("元のボードを変更しない（イミュータブル）", () => {
    const board = createBoard();
    const original = board.map((row) => [...row]);
    placePiece(board, TETROMINOES[3], { x: 4, y: 5 }, 3);
    expect(board).toEqual(original);
  });

  it("ピースの種類番号が正しく格納される", () => {
    const board = createBoard();
    const result = placePiece(board, TETROMINOES[1], { x: 3, y: 10 }, 1);
    // Iピースは行インデックス1に水平に並ぶ
    expect(result[11][3]).toBe(1);
    expect(result[11][4]).toBe(1);
    expect(result[11][5]).toBe(1);
    expect(result[11][6]).toBe(1);
  });

  it("ボード外のセルは無視される", () => {
    const board = createBoard();
    // Y座標が-1の位置に配置（上部はみ出し）
    const result = placePiece(board, TETROMINOES[3], { x: 4, y: -1 }, 3);
    // y=-1のセルはスキップされ、y=0以降のみ配置
    expect(result[0][4]).toBe(3); // shape[1][1]=1 → y=0
  });
});

describe("clearLines", () => {
  it("空のボードではラインをクリアしない", () => {
    const board = createBoard();
    const { board: result, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(0);
    expect(result).toEqual(board);
  });

  it("完成した1ラインをクリアする", () => {
    const board = createBoard();
    board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1);
    const { board: result, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(1);
    expect(result.length).toBe(BOARD_HEIGHT);
    expect(result[BOARD_HEIGHT - 1].every((c) => c === 0)).toBe(true);
  });

  it("4ライン同時クリア（テトリス）", () => {
    const board = createBoard();
    for (let r = BOARD_HEIGHT - 4; r < BOARD_HEIGHT; r++) {
      board[r] = Array(BOARD_WIDTH).fill(1);
    }
    const { board: result, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(4);
    expect(result.length).toBe(BOARD_HEIGHT);
    expect(result.slice(0, 4).every((row) => row.every((c) => c === 0))).toBe(true);
  });

  it("未完成ラインは保持される", () => {
    const board = createBoard();
    board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1);
    board[BOARD_HEIGHT - 2][0] = 1; // 未完成ライン
    const { board: result, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(1);
    expect(result[BOARD_HEIGHT - 1][0]).toBe(1); // 未完成ラインは残る
  });
});

describe("calculateScore", () => {
  it("クリアなし(0ライン)はスコア0", () => {
    expect(calculateScore(0, 0)).toBe(0);
    expect(calculateScore(0, 5)).toBe(0);
  });

  it("1ライン = 100 × (level+1)", () => {
    expect(calculateScore(1, 0)).toBe(100);
    expect(calculateScore(1, 1)).toBe(200);
    expect(calculateScore(1, 9)).toBe(1000);
  });

  it("2ライン = 300 × (level+1)", () => {
    expect(calculateScore(2, 0)).toBe(300);
    expect(calculateScore(2, 2)).toBe(900);
  });

  it("3ライン = 500 × (level+1)", () => {
    expect(calculateScore(3, 0)).toBe(500);
  });

  it("4ライン（テトリス）= 800 × (level+1)", () => {
    expect(calculateScore(4, 0)).toBe(800);
    expect(calculateScore(4, 1)).toBe(1600);
  });
});

describe("calculateLevel", () => {
  it("0ラインでレベル0", () => {
    expect(calculateLevel(0)).toBe(0);
  });

  it("10ライン毎にレベルアップ", () => {
    expect(calculateLevel(9)).toBe(0);
    expect(calculateLevel(10)).toBe(1);
    expect(calculateLevel(19)).toBe(1);
    expect(calculateLevel(20)).toBe(2);
    expect(calculateLevel(100)).toBe(10);
  });
});

describe("getDropSpeed", () => {
  it("レベル0は1000ms", () => {
    expect(getDropSpeed(0)).toBe(1000);
  });

  it("レベルが上がるほど速くなる", () => {
    expect(getDropSpeed(1)).toBeLessThan(getDropSpeed(0));
    expect(getDropSpeed(5)).toBeLessThan(getDropSpeed(1));
  });

  it("最低速度は100ms", () => {
    expect(getDropSpeed(100)).toBe(100);
    expect(getDropSpeed(20)).toBe(100);
  });
});

describe("getGhostY", () => {
  it("空のボードではボード底まで落下する", () => {
    const board = createBoard();
    const shape = TETROMINOES[2]; // O (2行2列)
    // 最初のY位置0から、底まで落ちるとy=18 (20-2)
    const ghostY = getGhostY(board, shape, { x: 4, y: 0 });
    expect(ghostY).toBe(BOARD_HEIGHT - shape.length);
  });

  it("障害物があればその上で止まる", () => {
    const board = createBoard();
    board[15][4] = 1;
    board[15][5] = 1;
    const shape = TETROMINOES[2]; // O (2行)
    // y=13で止まる（shape.length=2, 15-2=13）
    const ghostY = getGhostY(board, shape, { x: 4, y: 0 });
    expect(ghostY).toBe(13);
  });

  it("すでに最下部にいる場合は同じY位置を返す", () => {
    const board = createBoard();
    const shape = TETROMINOES[2];
    const startY = BOARD_HEIGHT - shape.length; // 18
    const ghostY = getGhostY(board, shape, { x: 4, y: startY });
    expect(ghostY).toBe(startY);
  });
});
