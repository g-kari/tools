import { describe, it, expect } from "vitest";
import {
  parseSemver,
  compareSemver,
  satisfiesRange,
  incrementPatch,
  incrementMinor,
  incrementMajor,
  formatSemver,
} from "../../app/utils/semver";

describe("parseSemver", () => {
  it("基本的な MAJOR.MINOR.PATCH をパースする", () => {
    const result = parseSemver("1.2.3");
    expect(result.valid).toBe(true);
    expect(result.major).toBe(1);
    expect(result.minor).toBe(2);
    expect(result.patch).toBe(3);
    expect(result.prerelease).toBeNull();
    expect(result.buildMetadata).toBeNull();
  });

  it("プレリリース付きバージョンをパースする", () => {
    const result = parseSemver("1.0.0-alpha.1");
    expect(result.valid).toBe(true);
    expect(result.prerelease).toBe("alpha.1");
    expect(result.buildMetadata).toBeNull();
  });

  it("ビルドメタデータ付きバージョンをパースする", () => {
    const result = parseSemver("1.0.0+build.20240101");
    expect(result.valid).toBe(true);
    expect(result.prerelease).toBeNull();
    expect(result.buildMetadata).toBe("build.20240101");
  });

  it("プレリリース＋ビルドメタデータをパースする", () => {
    const result = parseSemver("1.0.0-beta.2+build.99");
    expect(result.valid).toBe(true);
    expect(result.prerelease).toBe("beta.2");
    expect(result.buildMetadata).toBe("build.99");
  });

  it("先頭の v を除去してパースする", () => {
    const result = parseSemver("v2.3.4");
    expect(result.valid).toBe(true);
    expect(result.major).toBe(2);
    expect(result.minor).toBe(3);
    expect(result.patch).toBe(4);
  });

  it("先頭の V（大文字）を除去してパースする", () => {
    const result = parseSemver("V1.0.0");
    expect(result.valid).toBe(true);
    expect(result.major).toBe(1);
  });

  it("前後の空白を除去してパースする", () => {
    const result = parseSemver("  1.0.0  ");
    expect(result.valid).toBe(true);
    expect(result.major).toBe(1);
  });

  it("ゼロのバージョンをパースする", () => {
    const result = parseSemver("0.0.0");
    expect(result.valid).toBe(true);
    expect(result.major).toBe(0);
    expect(result.minor).toBe(0);
    expect(result.patch).toBe(0);
  });

  it("不正な文字列を invalid と判定する", () => {
    expect(parseSemver("1.2").valid).toBe(false);
    expect(parseSemver("abc").valid).toBe(false);
    expect(parseSemver("").valid).toBe(false);
    expect(parseSemver("1.2.3.4").valid).toBe(false);
  });

  it("先頭ゼロを含む不正なバージョンを invalid と判定する", () => {
    expect(parseSemver("01.2.3").valid).toBe(false);
    expect(parseSemver("1.02.3").valid).toBe(false);
  });
});

describe("compareSemver", () => {
  it("MAJOR が大きい方が大きい", () => {
    const a = parseSemver("2.0.0");
    const b = parseSemver("1.9.9");
    expect(compareSemver(a, b)).toBe(1);
    expect(compareSemver(b, a)).toBe(-1);
  });

  it("MINOR が大きい方が大きい（MAJOR 同じ）", () => {
    const a = parseSemver("1.3.0");
    const b = parseSemver("1.2.9");
    expect(compareSemver(a, b)).toBe(1);
  });

  it("PATCH が大きい方が大きい（MAJOR/MINOR 同じ）", () => {
    const a = parseSemver("1.2.4");
    const b = parseSemver("1.2.3");
    expect(compareSemver(a, b)).toBe(1);
  });

  it("同じバージョンは 0 を返す", () => {
    const a = parseSemver("1.0.0");
    const b = parseSemver("1.0.0");
    expect(compareSemver(a, b)).toBe(0);
  });

  it("プレリリースなし > プレリリースあり", () => {
    const release = parseSemver("1.0.0");
    const pre = parseSemver("1.0.0-alpha");
    expect(compareSemver(release, pre)).toBe(1);
    expect(compareSemver(pre, release)).toBe(-1);
  });

  it("プレリリース同士を辞書順で比較する", () => {
    const alpha = parseSemver("1.0.0-alpha");
    const beta = parseSemver("1.0.0-beta");
    expect(compareSemver(alpha, beta)).toBe(-1);
  });

  it("プレリリースの数値識別子は数値順で比較する", () => {
    const p1 = parseSemver("1.0.0-alpha.1");
    const p2 = parseSemver("1.0.0-alpha.10");
    expect(compareSemver(p1, p2)).toBe(-1);
  });

  it("数値識別子 < 英数字識別子（semver spec §11.4.1.2）", () => {
    const numeric = parseSemver("1.0.0-1");
    const alphanum = parseSemver("1.0.0-alpha");
    expect(compareSemver(numeric, alphanum)).toBe(-1);
  });

  it("ビルドメタデータは比較で無視される（semver spec §10）", () => {
    const a = parseSemver("1.0.0+build.1");
    const b = parseSemver("1.0.0+build.2");
    expect(compareSemver(a, b)).toBe(0);
  });
});

describe("incrementPatch", () => {
  it("PATCH をインクリメントする", () => {
    expect(incrementPatch(parseSemver("1.2.3"))).toBe("1.2.4");
  });

  it("PATCH が 0 の場合も正しくインクリメントする", () => {
    expect(incrementPatch(parseSemver("1.0.0"))).toBe("1.0.1");
  });
});

describe("incrementMinor", () => {
  it("MINOR をインクリメントして PATCH をリセットする", () => {
    expect(incrementMinor(parseSemver("1.2.3"))).toBe("1.3.0");
  });
});

describe("incrementMajor", () => {
  it("MAJOR をインクリメントして MINOR/PATCH をリセットする", () => {
    expect(incrementMajor(parseSemver("1.2.3"))).toBe("2.0.0");
  });
});

describe("formatSemver", () => {
  it("プレリリースなしの場合は MAJOR.MINOR.PATCH を返す", () => {
    expect(formatSemver(parseSemver("1.2.3"))).toBe("1.2.3");
  });

  it("プレリリースありの場合は -prerelease を付ける", () => {
    expect(formatSemver(parseSemver("1.0.0-alpha.1"))).toBe("1.0.0-alpha.1");
  });

  it("ビルドメタデータは含まない", () => {
    expect(formatSemver(parseSemver("1.0.0+build.99"))).toBe("1.0.0");
  });
});

describe("satisfiesRange", () => {
  it(">= 演算子: 以上を満たす", () => {
    expect(satisfiesRange(parseSemver("1.5.0"), ">=1.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("1.0.0"), ">=1.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("0.9.9"), ">=1.0.0").satisfied).toBe(false);
  });

  it("> 演算子: より大きいを満たす", () => {
    expect(satisfiesRange(parseSemver("1.0.1"), ">1.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("1.0.0"), ">1.0.0").satisfied).toBe(false);
  });

  it("<= 演算子: 以下を満たす", () => {
    expect(satisfiesRange(parseSemver("1.0.0"), "<=2.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("2.0.0"), "<=2.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("2.0.1"), "<=2.0.0").satisfied).toBe(false);
  });

  it("< 演算子: より小さいを満たす", () => {
    expect(satisfiesRange(parseSemver("1.9.9"), "<2.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("2.0.0"), "<2.0.0").satisfied).toBe(false);
  });

  it("= 演算子: 完全一致", () => {
    expect(satisfiesRange(parseSemver("1.0.0"), "=1.0.0").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("1.0.1"), "=1.0.0").satisfied).toBe(false);
  });

  it("演算子なし: 完全一致", () => {
    expect(satisfiesRange(parseSemver("1.2.3"), "1.2.3").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("1.2.4"), "1.2.3").satisfied).toBe(false);
  });

  it("^ 演算子: MAJOR が非ゼロなら MAJOR を固定", () => {
    expect(satisfiesRange(parseSemver("1.5.0"), "^1.2.3").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("2.0.0"), "^1.2.3").satisfied).toBe(false);
    expect(satisfiesRange(parseSemver("1.2.2"), "^1.2.3").satisfied).toBe(false);
  });

  it("^ 演算子: MAJOR=0 なら MINOR を固定", () => {
    expect(satisfiesRange(parseSemver("0.2.5"), "^0.2.3").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("0.3.0"), "^0.2.3").satisfied).toBe(false);
  });

  it("~ 演算子: MAJOR.MINOR を固定してパッチ以上", () => {
    expect(satisfiesRange(parseSemver("1.2.9"), "~1.2.3").satisfied).toBe(true);
    expect(satisfiesRange(parseSemver("1.3.0"), "~1.2.3").satisfied).toBe(false);
    expect(satisfiesRange(parseSemver("1.2.2"), "~1.2.3").satisfied).toBe(false);
  });

  it("バージョンが無効な場合は null を返す", () => {
    expect(satisfiesRange(parseSemver("invalid"), ">=1.0.0").satisfied).toBeNull();
  });

  it("範囲式のバージョンが無効な場合は null を返す", () => {
    expect(satisfiesRange(parseSemver("1.0.0"), ">=invalid").satisfied).toBeNull();
  });

  it("不明な演算子パターンは完全一致として扱う", () => {
    expect(satisfiesRange(parseSemver("1.0.0"), "1.0.0").satisfied).toBe(true);
  });
});
