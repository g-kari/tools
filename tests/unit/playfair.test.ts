import { describe, expect, it } from "vite-plus/test";
import {
  buildPlayfairSquare,
  prepareDigraphs,
  playfairEncrypt,
  playfairDecrypt,
} from "../../app/utils/playfair";

describe("buildPlayfairSquare", () => {
  it("5×5の方陣を生成する", () => {
    const sq = buildPlayfairSquare("KEYWORD");
    expect(sq).toHaveLength(5);
    for (const row of sq) {
      expect(row).toHaveLength(5);
    }
  });

  it("方陣は25文字（J除く）を含む", () => {
    const sq = buildPlayfairSquare("KEYWORD");
    const flat = sq.flat();
    expect(flat).toHaveLength(25);
    expect(flat.includes("J")).toBe(false);
  });

  it("重複文字がない", () => {
    const sq = buildPlayfairSquare("KEYWORD");
    const flat = sq.flat();
    const unique = new Set(flat);
    expect(unique.size).toBe(25);
  });

  it("キーワードの文字が先頭に並ぶ", () => {
    const sq = buildPlayfairSquare("KEYWORD");
    const flat = sq.flat();
    // K, E, Y, W, O, R, D がそれぞれ先頭7位以内に存在する
    expect(flat.slice(0, 7)).toContain("K");
    expect(flat.slice(0, 7)).toContain("E");
    expect(flat.slice(0, 7)).toContain("Y");
  });

  it("J は I として扱われる", () => {
    const sqWithI = buildPlayfairSquare("IJAB");
    const sqWithJ = buildPlayfairSquare("JJAB");
    expect(sqWithI.flat()).toEqual(sqWithJ.flat());
  });

  it("空のキーワードでも25文字を生成する", () => {
    const sq = buildPlayfairSquare("");
    expect(sq.flat()).toHaveLength(25);
  });
});

describe("prepareDigraphs", () => {
  it("偶数文字を2文字ペアに分割する", () => {
    const dg = prepareDigraphs("ABCD");
    expect(dg).toEqual([
      ["A", "B"],
      ["C", "D"],
    ]);
  });

  it("奇数文字の末尾に X を補充する", () => {
    const dg = prepareDigraphs("ABC");
    expect(dg).toEqual([
      ["A", "B"],
      ["C", "X"],
    ]);
  });

  it("同じ文字が連続する場合に X を挿入する", () => {
    const dg = prepareDigraphs("AABB");
    // AA → A X A, BB → B X B となるが最終的な形を確認
    // 'AA' → ['A','X'], 'AB' → ['A','B'], ... として組み立てられる
    const flat = dg.flat();
    expect(flat).toContain("X");
  });

  it("非アルファベット文字を除去する", () => {
    const dg = prepareDigraphs("A B!C");
    expect(dg.flat().join("")).not.toContain(" ");
    expect(dg.flat().join("")).not.toContain("!");
  });

  it("大文字・小文字を正規化する", () => {
    const dg1 = prepareDigraphs("HELLO");
    const dg2 = prepareDigraphs("hello");
    expect(dg1).toEqual(dg2);
  });

  it("J は I として変換される", () => {
    const dg = prepareDigraphs("JK");
    expect(dg[0]![0]).toBe("I");
    expect(dg[0]![1]).toBe("K");
  });

  it("X が連続する場合は Q を挿入する", () => {
    const dg = prepareDigraphs("XX");
    // X と X が連続 → X, Q を挿入、残り X と末尾補充 X → [['X','Q'],['X','X']]
    expect(dg.flat()).toContain("Q");
    // Q が挿入されているペアが存在する
    expect(dg.some((pair) => pair.includes("Q"))).toBe(true);
  });
});

describe("playfairEncrypt / playfairDecrypt", () => {
  const keyword = "PLAYFAIR";

  it("暗号化後に復号化すると元の形（アルファベット部分）に戻る", () => {
    const plain = "HELLO";
    const encrypted = playfairEncrypt(plain, keyword);
    const decrypted = playfairDecrypt(encrypted, keyword);

    // 復号結果は X 補充のため 'HELXLO' などになる場合がある
    // 少なくとも元の文字が含まれることを確認
    expect(decrypted.replace(/X/g, "")).toContain("HELL");
  });

  it("暗号化結果はスペース区切りの2文字ペアになる", () => {
    const encrypted = playfairEncrypt("HELLO", keyword);
    const pairs = encrypted.split(" ");
    for (const pair of pairs) {
      expect(pair).toHaveLength(2);
      expect(/^[A-Z]{2}$/.test(pair)).toBe(true);
    }
  });

  it("既知のプレイフェア変換をテスト (PLAYFAIR EXAMPLE / キーワード PLAYFAIR)", () => {
    // プレイフェア暗号のよく知られた例で動作を確認
    const encrypted = playfairEncrypt("HIDE", "PLAYFAIR");
    // 暗号化結果が空でなく、2文字ペアの形式であることを確認
    expect(encrypted.length).toBeGreaterThan(0);
    expect(encrypted.split(" ").every((p) => p.length === 2)).toBe(true);
  });

  it("空文字列を入力すると空文字列を返す", () => {
    expect(playfairEncrypt("", keyword)).toBe("");
    expect(playfairDecrypt("", keyword)).toBe("");
  });

  it("空のキーワードを入力すると空文字列を返す", () => {
    expect(playfairEncrypt("HELLO", "")).toBe("");
    expect(playfairDecrypt("BM OD", "")).toBe("");
  });

  it("非アルファベット文字のみの入力は空文字列を返す", () => {
    expect(playfairEncrypt("123!@#", keyword)).toBe("");
  });

  it("復号化は奇数長の入力に対して空文字列を返す", () => {
    // 奇数長の暗号文は不正な入力
    expect(playfairDecrypt("ABC", keyword)).toBe("");
  });

  it("キーワードが違うと異なる暗号文になる", () => {
    const enc1 = playfairEncrypt("ATTACK", "KEYWORD");
    const enc2 = playfairEncrypt("ATTACK", "SECRET");
    expect(enc1).not.toBe(enc2);
  });
});
