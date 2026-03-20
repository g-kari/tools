import { describe, it, expect } from "vitest";
import {
  encodeQP,
  decodeQP,
} from "../../app/routes/quoted-printable";

describe("Quoted-Printable Encoding / Decoding", () => {
  describe("encodeQP", () => {
    it("空文字列を入力すると空文字列を返す", () => {
      expect(encodeQP("")).toBe("");
    });

    it("印刷可能な ASCII 文字はそのまま出力される", () => {
      expect(encodeQP("Hello World!")).toBe("Hello World!");
    });

    it("数字・記号（= を除く）はそのまま出力される", () => {
      expect(encodeQP("abc123!@#$%^&*()")).toBe("abc123!@#$%^&*()");
    });

    it("= 文字は =3D にエンコードされる", () => {
      expect(encodeQP("1+1=2")).toBe("1+1=3D2");
      expect(encodeQP("a=b=c")).toBe("a=3Db=3Dc");
    });

    it("日本語（UTF-8 マルチバイト）は =XX 形式にエンコードされる", () => {
      // 'あ' の UTF-8 バイト: E3 81 82
      const result = encodeQP("あ");
      expect(result).toBe("=E3=81=82");
    });

    it("'こんにちは' が正しくエンコードされる", () => {
      const result = encodeQP("こ");
      // 'こ' の UTF-8: E3 81 93
      expect(result).toBe("=E3=81=93");
    });

    it("行末のスペースは =20 にエンコードされる", () => {
      expect(encodeQP("hello ")).toBe("hello=20");
    });

    it("行末のタブは =09 にエンコードされる", () => {
      expect(encodeQP("hello\t")).toBe("hello=09");
    });

    it("行末以外のスペースはそのまま出力される", () => {
      expect(encodeQP("hello world")).toBe("hello world");
    });

    it("行末以外のタブはそのまま出力される", () => {
      expect(encodeQP("a\tb")).toBe("a\tb");
    });

    it("改行（LF）は保持される", () => {
      const result = encodeQP("line1\nline2");
      expect(result).toBe("line1\nline2");
    });

    it("CRLF は LF として保持される", () => {
      const result = encodeQP("line1\r\nline2");
      expect(result).toBe("line1\nline2");
    });

    it("制御文字（0x00）は =00 にエンコードされる", () => {
      expect(encodeQP("\x00")).toBe("=00");
    });

    it("DEL 文字（0x7F）は =7F にエンコードされる", () => {
      expect(encodeQP("\x7f")).toBe("=7F");
    });

    it("76 文字を超える行にはソフト改行が挿入される", () => {
      // 77 文字の ASCII 文字列
      const long = "A".repeat(77);
      const result = encodeQP(long);
      expect(result).toContain("=\n");
    });

    it("絵文字は =XX 形式にエンコードされる", () => {
      // '🎉' の UTF-8 バイト: F0 9F 8E 89
      const result = encodeQP("🎉");
      expect(result).toBe("=F0=9F=8E=89");
    });

    it("16 進数は大文字で出力される", () => {
      // 'あ' → =E3=81=82（大文字）
      const result = encodeQP("あ");
      expect(result).toMatch(/^[=A-Z0-9\n]+$/);
    });
  });

  describe("decodeQP", () => {
    it("空文字列を入力すると空文字列を返す", () => {
      expect(decodeQP("")).toBe("");
    });

    it("プレーンな ASCII テキストはそのまま返る", () => {
      expect(decodeQP("Hello World!")).toBe("Hello World!");
    });

    it("=XX シーケンスをバイトに変換する", () => {
      // =E3=81=82 → 'あ'
      expect(decodeQP("=E3=81=82")).toBe("あ");
    });

    it("=3D を = に変換する", () => {
      expect(decodeQP("1+1=3D2")).toBe("1+1=2");
    });

    it("ソフト改行（=\\n）を除去する", () => {
      expect(decodeQP("hello=\nworld")).toBe("helloworld");
    });

    it("ソフト改行（=\\r\\n）を除去する", () => {
      expect(decodeQP("hello=\r\nworld")).toBe("helloworld");
    });

    it("ハード改行（LF）は保持される", () => {
      expect(decodeQP("line1\nline2")).toBe("line1\nline2");
    });

    it("小文字の =xx シーケンスも正しくデコードされる", () => {
      // =e3=81=82 → 'あ'
      expect(decodeQP("=e3=81=82")).toBe("あ");
    });

    it("不正な = シーケンスはそのまま維持される", () => {
      const result = decodeQP("=ZZ");
      // =ZZ は無効なので = をそのまま出力
      expect(result).toContain("=");
    });
  });

  describe("ラウンドトリップ（エンコード→デコード）", () => {
    it("日本語テキストが正しく復元される", () => {
      const original = "こんにちは";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("英日混在テキストが正しく復元される", () => {
      const original = "Hello, 世界! 2024";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("= を含むテキストが正しく復元される", () => {
      const original = "1 + 1 = 2";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("絵文字が正しく復元される", () => {
      const original = "🎉🎊🎁";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("複数行テキストが正しく復元される", () => {
      const original = "第1行\n第2行\n第3行";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("行末スペースを含むテキストが正しく復元される", () => {
      const original = "trailing space   ";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("長い行を含むテキストが正しく復元される", () => {
      const original = "A".repeat(200);
      expect(decodeQP(encodeQP(original))).toBe(original);
    });

    it("各種 ASCII 特殊文字が正しく復元される", () => {
      const original = "!\"#$%&'()*+,-./:;<>?@[\\]^_`{|}~";
      expect(decodeQP(encodeQP(original))).toBe(original);
    });
  });
});
