import { describe, test, expect } from "vite-plus/test";
import {
  filterReleases,
  collectTypes,
  typeLabels,
  releases,
  type Release,
  type ReleaseType,
} from "../../app/routes/release-notes";

const sample: Release[] = [
  {
    version: "1.0.0",
    date: "2026-04-17",
    entries: [
      { type: "feat", title: "F1" },
      { type: "fix", title: "X1" },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-04-01",
    entries: [{ type: "security", title: "S1" }],
  },
];

describe("filterReleases", () => {
  test("type=null のときは全件をそのまま返す", () => {
    expect(filterReleases(sample, null)).toEqual(sample);
  });

  test("指定タイプのエントリのみが残る", () => {
    const result = filterReleases(sample, "feat");
    expect(result).toHaveLength(1);
    expect(result[0]!.entries).toHaveLength(1);
    expect(result[0]!.entries[0]!.title).toBe("F1");
  });

  test("該当エントリが無いリリースはリストから除外される", () => {
    const result = filterReleases(sample, "security");
    expect(result).toHaveLength(1);
    expect(result[0]!.version).toBe("0.9.0");
  });

  test("該当タイプが全く無い場合は空配列", () => {
    const result = filterReleases(sample, "docs");
    expect(result).toEqual([]);
  });
});

describe("collectTypes", () => {
  test("使用されているタイプの集合を返す（重複なし）", () => {
    const types = collectTypes(sample);
    expect(types.sort()).toEqual(["feat", "fix", "security"].sort());
  });

  test("空配列を渡すと空配列を返す", () => {
    expect(collectTypes([])).toEqual([]);
  });

  test("同じタイプが複数あっても1回だけ含まれる", () => {
    const dup: Release[] = [
      {
        version: "x",
        date: "2026-04-17",
        entries: [
          { type: "feat", title: "a" },
          { type: "feat", title: "b" },
        ],
      },
    ];
    expect(collectTypes(dup)).toEqual(["feat"]);
  });
});

describe("typeLabels", () => {
  test("すべてのタイプに日本語ラベルが定義されている", () => {
    const allTypes: ReleaseType[] = [
      "feat",
      "fix",
      "security",
      "refactor",
      "test",
      "chore",
      "docs",
    ];
    for (const type of allTypes) {
      expect(typeLabels[type]).toBeTruthy();
      expect(typeof typeLabels[type]).toBe("string");
    }
  });
});

describe("releases data", () => {
  test("1件以上のリリースが存在する", () => {
    expect(releases.length).toBeGreaterThan(0);
  });

  test("各リリースは version / date / entries を持つ", () => {
    for (const release of releases) {
      expect(release.version).toBeTruthy();
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.entries.length).toBeGreaterThan(0);
    }
  });

  test("各エントリは type / title を持ち、type は既知の値である", () => {
    const validTypes: ReleaseType[] = [
      "feat",
      "fix",
      "security",
      "refactor",
      "test",
      "chore",
      "docs",
    ];
    for (const release of releases) {
      for (const entry of release.entries) {
        expect(entry.title).toBeTruthy();
        expect(validTypes).toContain(entry.type);
      }
    }
  });

  test("リリースは日付降順で並んでいる", () => {
    for (let i = 1; i < releases.length; i++) {
      expect(releases[i - 1]!.date >= releases[i]!.date).toBe(true);
    }
  });
});
