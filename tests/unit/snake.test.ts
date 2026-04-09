import { describe, it, expect } from "vite-plus/test";
import {
  getNextHead,
  isWallCollision,
  isSelfCollision,
  isValidDirectionChange,
  generateFood,
  GRID_SIZE,
} from "../../app/routes/snake";

describe("getNextHead", () => {
  it("上方向に移動する", () => {
    expect(getNextHead({ x: 5, y: 5 }, "up")).toEqual({ x: 5, y: 4 });
  });

  it("下方向に移動する", () => {
    expect(getNextHead({ x: 5, y: 5 }, "down")).toEqual({ x: 5, y: 6 });
  });

  it("左方向に移動する", () => {
    expect(getNextHead({ x: 5, y: 5 }, "left")).toEqual({ x: 4, y: 5 });
  });

  it("右方向に移動する", () => {
    expect(getNextHead({ x: 5, y: 5 }, "right")).toEqual({ x: 6, y: 5 });
  });

  it("境界座標でも正しく計算する", () => {
    expect(getNextHead({ x: 0, y: 0 }, "up")).toEqual({ x: 0, y: -1 });
    expect(getNextHead({ x: 0, y: 0 }, "left")).toEqual({ x: -1, y: 0 });
  });
});

describe("isWallCollision", () => {
  it("グリッド内はfalseを返す", () => {
    expect(isWallCollision({ x: 0, y: 0 })).toBe(false);
    expect(isWallCollision({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })).toBe(
      false
    );
    expect(isWallCollision({ x: 10, y: 10 })).toBe(false);
  });

  it("左壁の外はtrueを返す", () => {
    expect(isWallCollision({ x: -1, y: 5 })).toBe(true);
  });

  it("右壁の外はtrueを返す", () => {
    expect(isWallCollision({ x: GRID_SIZE, y: 5 })).toBe(true);
  });

  it("上壁の外はtrueを返す", () => {
    expect(isWallCollision({ x: 5, y: -1 })).toBe(true);
  });

  it("下壁の外はtrueを返す", () => {
    expect(isWallCollision({ x: 5, y: GRID_SIZE })).toBe(true);
  });
});

describe("isSelfCollision", () => {
  const body = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ];

  it("胴体と衝突するとtrueを返す", () => {
    expect(isSelfCollision({ x: 5, y: 5 }, body)).toBe(true);
    expect(isSelfCollision({ x: 4, y: 5 }, body)).toBe(true);
    expect(isSelfCollision({ x: 3, y: 5 }, body)).toBe(true);
  });

  it("衝突しない場合はfalseを返す", () => {
    expect(isSelfCollision({ x: 6, y: 5 }, body)).toBe(false);
    expect(isSelfCollision({ x: 5, y: 6 }, body)).toBe(false);
    expect(isSelfCollision({ x: 0, y: 0 }, body)).toBe(false);
  });

  it("空の胴体の場合はfalseを返す", () => {
    expect(isSelfCollision({ x: 5, y: 5 }, [])).toBe(false);
  });

  it("末尾（次フレームで消えるセル）を除くと衝突しない", () => {
    // snake: [head, body, tail] で tail 位置に nextHead が来るケース
    // slice(0, -1) で tail を除いた場合は false（有効な移動）
    const tail = { x: 3, y: 5 };
    const bodyWithoutTail = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    expect(isSelfCollision(tail, bodyWithoutTail)).toBe(false);
  });
});

describe("isValidDirectionChange", () => {
  it("上から下への変更はfalseを返す", () => {
    expect(isValidDirectionChange("up", "down")).toBe(false);
  });

  it("下から上への変更はfalseを返す", () => {
    expect(isValidDirectionChange("down", "up")).toBe(false);
  });

  it("左から右への変更はfalseを返す", () => {
    expect(isValidDirectionChange("left", "right")).toBe(false);
  });

  it("右から左への変更はfalseを返す", () => {
    expect(isValidDirectionChange("right", "left")).toBe(false);
  });

  it("有効な直角方向変更はtrueを返す", () => {
    expect(isValidDirectionChange("up", "left")).toBe(true);
    expect(isValidDirectionChange("up", "right")).toBe(true);
    expect(isValidDirectionChange("down", "left")).toBe(true);
    expect(isValidDirectionChange("down", "right")).toBe(true);
    expect(isValidDirectionChange("left", "up")).toBe(true);
    expect(isValidDirectionChange("left", "down")).toBe(true);
    expect(isValidDirectionChange("right", "up")).toBe(true);
    expect(isValidDirectionChange("right", "down")).toBe(true);
  });

  it("同じ方向への変更はtrueを返す", () => {
    expect(isValidDirectionChange("up", "up")).toBe(true);
    expect(isValidDirectionChange("down", "down")).toBe(true);
    expect(isValidDirectionChange("left", "left")).toBe(true);
    expect(isValidDirectionChange("right", "right")).toBe(true);
  });
});

describe("generateFood", () => {
  it("スネークの占有セル以外に食べ物を生成する", () => {
    const snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    const food = generateFood(snake);
    expect(snake.some((p) => p.x === food.x && p.y === food.y)).toBe(false);
  });

  it("グリッド内の座標を返す", () => {
    const snake = [{ x: 10, y: 10 }];
    const food = generateFood(snake);
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(GRID_SIZE);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeLessThan(GRID_SIZE);
  });

  it("グリッドが満杯の場合は {x:0,y:0} を返す", () => {
    const snake: { x: number; y: number }[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        snake.push({ x, y });
      }
    }
    const food = generateFood(snake);
    expect(food).toEqual({ x: 0, y: 0 });
  });

  it("生成結果はランダム性がある（複数回実行で異なる結果が出る）", () => {
    const snake: { x: number; y: number }[] = [];
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const food = generateFood(snake);
      results.add(`${food.x},${food.y}`);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
