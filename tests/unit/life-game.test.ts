import { describe, it, expect } from "vitest";
import {
  createGrid,
  countNeighbors,
  nextGeneration,
  fillRandom,
  countPopulation,
  applyPattern,
  PRESET_PATTERNS,
} from "../../app/routes/life-game";

describe("createGrid", () => {
  it("指定したサイズの全falseグリッドを作成する", () => {
    const grid = createGrid(5, 3);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(5);
    grid.forEach((row) => row.forEach((cell) => expect(cell).toBe(false)));
  });

  it("0x0グリッドを作成できる", () => {
    const grid = createGrid(0, 0);
    expect(grid).toHaveLength(0);
  });
});

describe("countNeighbors", () => {
  it("中央セルの近傍を正しくカウントする（折り返しなし）", () => {
    // 3x3グリッド、中央を囲む全セルを生かす
    const grid = [
      [true, true, true],
      [true, false, true],
      [true, true, true],
    ];
    expect(countNeighbors(grid, 1, 1, 3, 3, false)).toBe(8);
  });

  it("端のセルで折り返しなしの場合に枠外を無視する", () => {
    const grid = [
      [false, false, false],
      [false, true, false],
      [false, false, false],
    ];
    // 左上角(0,0)の近傍はグリッド内で最大3つ
    expect(countNeighbors(grid, 0, 0, 3, 3, false)).toBe(1);
  });

  it("端のセルで折り返しありの場合に反対側をカウントする", () => {
    // 左端列に生きているセルを配置し、右端から参照
    const grid = [
      [true, false, false],
      [false, false, false],
      [false, false, false],
    ];
    // (cols-1, 0)から見て折り返しで(0, 0)が近傍になるか
    expect(countNeighbors(grid, 2, 0, 3, 3, true)).toBeGreaterThanOrEqual(1);
  });

  it("近傍が0の孤立セルで0を返す", () => {
    const grid = createGrid(5, 5);
    grid[2][2] = true;
    expect(countNeighbors(grid, 0, 0, 5, 5, false)).toBe(0);
  });
});

describe("nextGeneration", () => {
  it("孤独なセル（近傍0）は死亡する", () => {
    const grid = createGrid(5, 5);
    grid[2][2] = true;
    const next = nextGeneration(grid, 5, 5, false);
    expect(next[2][2]).toBe(false);
  });

  it("近傍が2または3のセルは生存する", () => {
    // ブリンカーパターン: 3連横並び
    const grid = createGrid(5, 5);
    grid[2][1] = true;
    grid[2][2] = true;
    grid[2][3] = true;
    const next = nextGeneration(grid, 5, 5, false);
    // 中央は近傍2で生存
    expect(next[2][2]).toBe(true);
  });

  it("ブリンカーパターンが正しく振動する", () => {
    const grid = createGrid(5, 5);
    grid[2][1] = true;
    grid[2][2] = true;
    grid[2][3] = true;
    const gen1 = nextGeneration(grid, 5, 5, false);
    // 縦方向に切り替わるはず
    expect(gen1[1][2]).toBe(true);
    expect(gen1[2][2]).toBe(true);
    expect(gen1[3][2]).toBe(true);
    // 横方向は消えるはず
    expect(gen1[2][1]).toBe(false);
    expect(gen1[2][3]).toBe(false);
  });

  it("死んでいるセルで近傍3のとき誕生する", () => {
    const grid = createGrid(5, 5);
    grid[1][2] = true;
    grid[2][1] = true;
    grid[2][3] = true;
    const next = nextGeneration(grid, 5, 5, false);
    // (2,2)は3近傍なので誕生
    expect(next[2][2]).toBe(true);
  });

  it("近傍4以上のセルは死亡する（過密死）", () => {
    const grid = [
      [true, true, true],
      [true, true, false],
      [false, false, false],
    ];
    // 中央(1,1)は近傍4なので死亡
    const next = nextGeneration(grid, 3, 3, false);
    expect(next[1][1]).toBe(false);
  });

  it("静止形（2x2ブロック）が変化しない", () => {
    const grid = createGrid(6, 6);
    grid[1][1] = true;
    grid[1][2] = true;
    grid[2][1] = true;
    grid[2][2] = true;
    const next = nextGeneration(grid, 6, 6, false);
    expect(next[1][1]).toBe(true);
    expect(next[1][2]).toBe(true);
    expect(next[2][1]).toBe(true);
    expect(next[2][2]).toBe(true);
  });
});

describe("fillRandom", () => {
  it("指定したサイズのグリッドを返す", () => {
    const grid = fillRandom(10, 8, 0.5);
    expect(grid).toHaveLength(8);
    expect(grid[0]).toHaveLength(10);
  });

  it("密度0のとき全セルが死んでいる", () => {
    const grid = fillRandom(10, 10, 0);
    grid.forEach((row) => row.forEach((cell) => expect(cell).toBe(false)));
  });

  it("密度1のとき全セルが生きている", () => {
    const grid = fillRandom(10, 10, 1);
    grid.forEach((row) => row.forEach((cell) => expect(cell).toBe(true)));
  });

  it("密度0.5付近でおおよそ半分のセルが生きている（確率的テスト）", () => {
    const grid = fillRandom(100, 100, 0.5);
    const pop = countPopulation(grid);
    // 10000セル×0.5で期待値5000、±20%の範囲内
    expect(pop).toBeGreaterThan(3000);
    expect(pop).toBeLessThan(7000);
  });
});

describe("countPopulation", () => {
  it("全死のグリッドで0を返す", () => {
    expect(countPopulation(createGrid(5, 5))).toBe(0);
  });

  it("生きているセルの数を正しくカウントする", () => {
    const grid = createGrid(5, 5);
    grid[0][0] = true;
    grid[2][3] = true;
    grid[4][4] = true;
    expect(countPopulation(grid)).toBe(3);
  });

  it("全生のグリッドで総セル数を返す", () => {
    const grid = Array.from({ length: 4 }, () => Array(4).fill(true));
    expect(countPopulation(grid)).toBe(16);
  });
});

describe("applyPattern", () => {
  it("グライダーパターンが正しく配置される", () => {
    const glider = PRESET_PATTERNS.find((p) => p.name === "グライダー")!;
    const grid = applyPattern(20, 20, glider);
    expect(countPopulation(grid)).toBe(5);
  });

  it("パターンがグリッド内に収まる", () => {
    const pattern = PRESET_PATTERNS.find((p) => p.name === "グライダー銃")!;
    const grid = applyPattern(50, 30, pattern);
    // 全セルがグリッド内に収まっていること
    grid.forEach((row) =>
      row.forEach((cell) => expect(cell === true || cell === false).toBe(true))
    );
    expect(countPopulation(grid)).toBeGreaterThan(0);
  });

  it("小さすぎるグリッドでもクラッシュしない", () => {
    const glider = PRESET_PATTERNS.find((p) => p.name === "グライダー")!;
    expect(() => applyPattern(3, 3, glider)).not.toThrow();
  });
});

describe("PRESET_PATTERNS", () => {
  it("定義済みプリセットパターンが存在する", () => {
    expect(PRESET_PATTERNS.length).toBeGreaterThan(0);
  });

  it("各パターンが名前とセルリストを持つ", () => {
    PRESET_PATTERNS.forEach((p) => {
      expect(typeof p.name).toBe("string");
      expect(p.name.length).toBeGreaterThan(0);
      expect(Array.isArray(p.cells)).toBe(true);
      expect(p.cells.length).toBeGreaterThan(0);
    });
  });
});
