import { describe, expect, it } from "vitest";
import {
  encodeRailFence,
  decodeRailFence,
  visualizeRailFence,
} from "../../app/utils/rail-fence";

describe("encodeRailFence", () => {
  describe("基本的な変換", () => {
    it("レール2でエンコードできる", () => {
      // ABCDE → ACE + BD → ACEBD
      expect(encodeRailFence("ABCDE", 2)).toBe("ACEBD");
    });

    it("レール3でエンコードできる", () => {
      // WEAREDISCOVEREDFLEEAATONCE（26文字）をレール3で変換
      // Rail0: W E C R L A C = WECRLAC
      // Rail1: E R D S O E E F E A T N E = ERDSOEEFEATNE
      // Rail2: A I V D E O = AIVDEO
      const result = encodeRailFence("WEAREDISCOVEREDFLEEAATONCE", 3);
      expect(result).toBe("WECRLACERDSOEEFEATNEAIVDEO");
    });

    it("レール2でシンプルなテキストをエンコードできる", () => {
      // HELLO → HLO + EL → HLOEL
      expect(encodeRailFence("HELLO", 2)).toBe("HLOEL");
    });
  });

  describe("境界値", () => {
    it("レール数1の場合はそのまま返す", () => {
      expect(encodeRailFence("HELLO", 1)).toBe("HELLO");
    });

    it("空文字列はそのまま返す", () => {
      expect(encodeRailFence("", 3)).toBe("");
    });

    it("1文字のテキストはそのまま返す", () => {
      expect(encodeRailFence("A", 3)).toBe("A");
    });

    it("レール数がテキスト長以上の場合は変換なし", () => {
      // テキスト長以上のレール数では各文字が別レールに入りジグザグが発生しない
      expect(encodeRailFence("AB", 10)).toBe("AB");
    });
  });

  describe("文字種", () => {
    it("小文字も変換される", () => {
      expect(encodeRailFence("hello", 2)).toBe("hloel");
    });

    it("数字も変換される", () => {
      expect(encodeRailFence("12345", 2)).toBe("135 24".replace(" ", ""));
    });

    it("スペースも変換される", () => {
      const result = encodeRailFence("A B C", 2);
      expect(typeof result).toBe("string");
      expect(result.length).toBe(5);
    });

    it("日本語も変換される", () => {
      const result = encodeRailFence("あいうえお", 2);
      expect(result.length).toBe(5);
      expect(result).toContain("あ");
    });
  });
});

describe("decodeRailFence", () => {
  it("レール2でデコードできる", () => {
    expect(decodeRailFence("ACEBD", 2)).toBe("ABCDE");
  });

  it("レール3でデコードできる（古典的な例）", () => {
    expect(decodeRailFence("WECRLACERDSOEEFEATNEAIVDEO", 3)).toBe(
      "WEAREDISCOVEREDFLEEAATONCE"
    );
  });

  it("レール数1の場合はそのまま返す", () => {
    expect(decodeRailFence("HELLO", 1)).toBe("HELLO");
  });

  it("空文字列はそのまま返す", () => {
    expect(decodeRailFence("", 3)).toBe("");
  });

  describe("往復変換", () => {
    it("レール2での往復変換が成功する", () => {
      const original = "Hello World";
      expect(decodeRailFence(encodeRailFence(original, 2), 2)).toBe(original);
    });

    it("レール3での往復変換が成功する", () => {
      const original = "The quick brown fox jumps over the lazy dog";
      expect(decodeRailFence(encodeRailFence(original, 3), 3)).toBe(original);
    });

    it("レール5での往復変換が成功する", () => {
      const original = "Rail Fence Cipher Test 12345!";
      expect(decodeRailFence(encodeRailFence(original, 5), 5)).toBe(original);
    });

    it("日本語での往復変換が成功する", () => {
      const original = "柵暗号テスト";
      expect(decodeRailFence(encodeRailFence(original, 3), 3)).toBe(original);
    });

    it("記号・数字混在での往復変換が成功する", () => {
      const original = "Hello, World! 123 #$%";
      expect(decodeRailFence(encodeRailFence(original, 4), 4)).toBe(original);
    });
  });
});

describe("visualizeRailFence", () => {
  it("レール数分の配列を返す", () => {
    const result = visualizeRailFence("HELLO", 3);
    expect(result).toHaveLength(3);
  });

  it("各行の長さはテキスト長と同じ", () => {
    const text = "ABCDEF";
    const result = visualizeRailFence(text, 3);
    for (const row of result) {
      expect(row.length).toBe(text.length);
    }
  });

  it("空位置は'·'で埋められる", () => {
    const result = visualizeRailFence("ABCDE", 3);
    for (const row of result) {
      expect(row).toMatch(/^[A-Z·]+$/);
    }
  });

  it("全行の文字（·以外）の合計がテキスト長になる", () => {
    const text = "ABCDEFG";
    const result = visualizeRailFence(text, 3);
    const totalChars = result.reduce(
      (sum, row) => sum + row.split("").filter((c) => c !== "·").length,
      0
    );
    expect(totalChars).toBe(text.length);
  });

  it("レール数1または空文字列はテキストをそのまま返す", () => {
    expect(visualizeRailFence("ABC", 1)).toEqual(["ABC"]);
    expect(visualizeRailFence("", 3)).toEqual([""]);
  });
});
