import { describe, it, expect } from "vite-plus/test";
import {
  isValidBase64,
  isValidDataUri,
  getMimeTypeFromDataUri,
  pureBase64ToDataUri,
  dataUriToPureBase64,
} from "../../app/routes/base64-image";

describe("Base64画像デコード - ユーティリティ関数", () => {
  describe("isValidBase64", () => {
    it("有効なBase64文字列を正しく検証する", () => {
      expect(isValidBase64("SGVsbG8=")).toBe(true);
      expect(isValidBase64("dGVzdA==")).toBe(true);
      expect(isValidBase64("AAAA")).toBe(true);
      expect(isValidBase64("iVBORw0KGgo=")).toBe(true);
    });

    it("空文字列を無効と判定する", () => {
      expect(isValidBase64("")).toBe(false);
      expect(isValidBase64("   ")).toBe(false);
    });

    it("無効な文字を含む文字列を拒否する", () => {
      expect(isValidBase64("invalid!!!")).toBe(false);
      expect(isValidBase64("abc@def")).toBe(false);
      expect(isValidBase64("あいう")).toBe(false);
    });

    it("パディングが不正な文字列を拒否する", () => {
      // 長さが4の倍数でない（かつパディングなし）
      expect(isValidBase64("abc")).toBe(false);
      expect(isValidBase64("ab")).toBe(false);
      expect(isValidBase64("a")).toBe(false);
    });

    it("正しいパディングがある文字列を受け入れる", () => {
      expect(isValidBase64("YQ==")).toBe(true); // 'a'
      expect(isValidBase64("YWI=")).toBe(true); // 'ab'
      expect(isValidBase64("YWJj")).toBe(true); // 'abc'
    });
  });

  describe("isValidDataUri", () => {
    it("PNGのData URIを正しく検証する", () => {
      expect(isValidDataUri("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    });

    it("JPEGのData URIを正しく検証する", () => {
      expect(isValidDataUri("data:image/jpeg;base64,/9j/4AAQ==")).toBe(true);
    });

    it("GIFのData URIを正しく検証する", () => {
      expect(isValidDataUri("data:image/gif;base64,R0lGOD==")).toBe(true);
    });

    it("WebPのData URIを正しく検証する", () => {
      expect(isValidDataUri("data:image/webp;base64,UklGRg==")).toBe(true);
    });

    it("SVGのData URIを正しく検証する", () => {
      expect(isValidDataUri("data:image/svg+xml;base64,PHN2Zy==")).toBe(true);
    });

    it("非画像のData URIを拒否する", () => {
      expect(isValidDataUri("data:text/plain;base64,dGVzdA==")).toBe(false);
      expect(isValidDataUri("data:application/json;base64,e30=")).toBe(false);
    });

    it("不完全なData URIを拒否する", () => {
      expect(isValidDataUri("iVBORw0KGgo=")).toBe(false);
      expect(isValidDataUri("data:image/png")).toBe(false);
      expect(isValidDataUri("")).toBe(false);
    });
  });

  describe("getMimeTypeFromDataUri", () => {
    it("PNGのMIMEタイプを正しく抽出する", () => {
      expect(getMimeTypeFromDataUri("data:image/png;base64,AAAA")).toBe(
        "image/png"
      );
    });

    it("JPEGのMIMEタイプを正しく抽出する", () => {
      expect(getMimeTypeFromDataUri("data:image/jpeg;base64,AAAA")).toBe(
        "image/jpeg"
      );
    });

    it("GIFのMIMEタイプを正しく抽出する", () => {
      expect(getMimeTypeFromDataUri("data:image/gif;base64,AAAA")).toBe(
        "image/gif"
      );
    });

    it("WebPのMIMEタイプを正しく抽出する", () => {
      expect(getMimeTypeFromDataUri("data:image/webp;base64,AAAA")).toBe(
        "image/webp"
      );
    });

    it("SVGのMIMEタイプを正しく抽出する", () => {
      expect(getMimeTypeFromDataUri("data:image/svg+xml;base64,AAAA")).toBe(
        "image/svg+xml"
      );
    });

    it("無効なData URIに対してデフォルト値を返す", () => {
      expect(getMimeTypeFromDataUri("invalid")).toBe("image/png");
      expect(getMimeTypeFromDataUri("")).toBe("image/png");
    });
  });

  describe("pureBase64ToDataUri", () => {
    it("デフォルトMIMEタイプでData URIを生成する", () => {
      expect(pureBase64ToDataUri("AAAA")).toBe("data:image/png;base64,AAAA");
    });

    it("指定したMIMEタイプでData URIを生成する", () => {
      expect(pureBase64ToDataUri("AAAA", "image/jpeg")).toBe(
        "data:image/jpeg;base64,AAAA"
      );
      expect(pureBase64ToDataUri("AAAA", "image/gif")).toBe(
        "data:image/gif;base64,AAAA"
      );
      expect(pureBase64ToDataUri("AAAA", "image/webp")).toBe(
        "data:image/webp;base64,AAAA"
      );
      expect(pureBase64ToDataUri("AAAA", "image/svg+xml")).toBe(
        "data:image/svg+xml;base64,AAAA"
      );
    });

    it("前後のスペースをトリムする", () => {
      expect(pureBase64ToDataUri("  AAAA  ")).toBe(
        "data:image/png;base64,AAAA"
      );
    });
  });

  describe("dataUriToPureBase64", () => {
    it("Data URIからBase64部分を正しく抽出する", () => {
      expect(dataUriToPureBase64("data:image/png;base64,iVBORw0KGgo=")).toBe(
        "iVBORw0KGgo="
      );
      expect(dataUriToPureBase64("data:image/jpeg;base64,/9j/4AAQ==")).toBe(
        "/9j/4AAQ=="
      );
    });

    it("無効なData URIに対して空文字列を返す", () => {
      expect(dataUriToPureBase64("invalid")).toBe("");
      expect(dataUriToPureBase64("")).toBe("");
    });

    it("pureBase64ToDataUri との往復変換が一致する", () => {
      const original = "iVBORw0KGgo=";
      const dataUri = pureBase64ToDataUri(original, "image/png");
      const extracted = dataUriToPureBase64(dataUri);
      expect(extracted).toBe(original);
    });

    it("各MIMEタイプで往復変換が一致する", () => {
      const base64 = "R0lGOD==";
      const mimeTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      mimeTypes.forEach((mime) => {
        const dataUri = pureBase64ToDataUri(base64, mime);
        const extracted = dataUriToPureBase64(dataUri);
        expect(extracted).toBe(base64.trim());
      });
    });
  });
});
