import { describe, it, expect } from "vite-plus/test";
import {
  buildCorsHeaders,
  generateExpressCode,
  generateNginxCode,
  generateWorkersCode,
} from "../../app/routes/cors-builder";

describe("buildCorsHeaders", () => {
  describe("ワイルドカードモード", () => {
    it("Access-Control-Allow-Origin が * になる", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], ["Content-Type"], false, 0, []);
      expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("Vary ヘッダーは含まれない", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 0, []);
      expect(headers["Vary"]).toBeUndefined();
    });
  });

  describe("特定オリジンモード", () => {
    it("指定したオリジンが設定される", () => {
      const headers = buildCorsHeaders(
        "specific",
        "https://example.com",
        ["GET"],
        [],
        false,
        0,
        [],
      );
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
    });

    it("空白がトリムされる", () => {
      const headers = buildCorsHeaders(
        "specific",
        "  https://example.com  ",
        ["GET"],
        [],
        false,
        0,
        [],
      );
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
    });

    it("空文字の場合は Origin ヘッダーが含まれない", () => {
      const headers = buildCorsHeaders("specific", "", ["GET"], [], false, 0, []);
      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });
  });

  describe("オリジンリストモード", () => {
    it("最初のオリジンが設定され Vary ヘッダーが追加される", () => {
      const headers = buildCorsHeaders(
        "list",
        "https://a.example.com\nhttps://b.example.com",
        ["GET"],
        [],
        false,
        0,
        [],
      );
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://a.example.com");
      expect(headers["Vary"]).toBe("Origin");
    });

    it("空行がスキップされる", () => {
      const headers = buildCorsHeaders(
        "list",
        "\nhttps://example.com\n",
        ["GET"],
        [],
        false,
        0,
        [],
      );
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
    });

    it("リストが空の場合は Origin ヘッダーが含まれない", () => {
      const headers = buildCorsHeaders("list", "\n\n", ["GET"], [], false, 0, []);
      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });
  });

  describe("メソッド設定", () => {
    it("複数のメソッドがカンマ区切りで設定される", () => {
      const headers = buildCorsHeaders(
        "wildcard",
        "",
        ["GET", "POST", "OPTIONS"],
        [],
        false,
        0,
        [],
      );
      expect(headers["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
    });

    it("メソッドが空の場合はヘッダーが含まれない", () => {
      const headers = buildCorsHeaders("wildcard", "", [], [], false, 0, []);
      expect(headers["Access-Control-Allow-Methods"]).toBeUndefined();
    });
  });

  describe("ヘッダー設定", () => {
    it("複数のヘッダーがカンマ区切りで設定される", () => {
      const headers = buildCorsHeaders(
        "wildcard",
        "",
        ["GET"],
        ["Content-Type", "Authorization"],
        false,
        0,
        [],
      );
      expect(headers["Access-Control-Allow-Headers"]).toBe("Content-Type, Authorization");
    });

    it("ヘッダーが空の場合は含まれない", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 0, []);
      expect(headers["Access-Control-Allow-Headers"]).toBeUndefined();
    });
  });

  describe("クレデンシャル設定", () => {
    it('credentials が true のとき "true" が設定される', () => {
      const headers = buildCorsHeaders("specific", "https://example.com", ["GET"], [], true, 0, []);
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    });

    it("credentials が false のときヘッダーが含まれない", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 0, []);
      expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined();
    });
  });

  describe("Max-Age 設定", () => {
    it("maxAge > 0 のとき文字列で設定される", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 86400, []);
      expect(headers["Access-Control-Max-Age"]).toBe("86400");
    });

    it("maxAge が 0 のときヘッダーが含まれない", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 0, []);
      expect(headers["Access-Control-Max-Age"]).toBeUndefined();
    });
  });

  describe("Expose-Headers 設定", () => {
    it("複数のヘッダーがカンマ区切りで設定される", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 0, [
        "X-Request-Id",
        "X-Total-Count",
      ]);
      expect(headers["Access-Control-Expose-Headers"]).toBe("X-Request-Id, X-Total-Count");
    });

    it("exposeHeaders が空のときヘッダーが含まれない", () => {
      const headers = buildCorsHeaders("wildcard", "", ["GET"], [], false, 0, []);
      expect(headers["Access-Control-Expose-Headers"]).toBeUndefined();
    });
  });
});

describe("generateExpressCode", () => {
  it('ワイルドカードの場合 origin が "*" になる', () => {
    const code = generateExpressCode("wildcard", "", ["GET"], ["Content-Type"], false, 0, []);
    expect(code).toContain("origin: '*'");
  });

  it("特定オリジンが含まれる", () => {
    const code = generateExpressCode(
      "specific",
      "https://example.com",
      ["GET"],
      ["Content-Type"],
      false,
      0,
      [],
    );
    expect(code).toContain("origin: 'https://example.com'");
  });

  it("リストモードで配列形式になる", () => {
    const code = generateExpressCode(
      "list",
      "https://a.com\nhttps://b.com",
      ["GET"],
      [],
      false,
      0,
      [],
    );
    expect(code).toContain("['https://a.com', 'https://b.com']");
  });

  it("credentials: true が含まれる", () => {
    const code = generateExpressCode("specific", "https://example.com", ["GET"], [], true, 0, []);
    expect(code).toContain("credentials: true");
  });

  it("maxAge が含まれる", () => {
    const code = generateExpressCode("wildcard", "", ["GET"], [], false, 3600, []);
    expect(code).toContain("maxAge: 3600");
  });

  it("maxAge が 0 のとき含まれない", () => {
    const code = generateExpressCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).not.toContain("maxAge");
  });

  it("exposedHeaders が含まれる", () => {
    const code = generateExpressCode("wildcard", "", ["GET"], [], false, 0, ["X-Request-Id"]);
    expect(code).toContain("exposedHeaders");
    expect(code).toContain("X-Request-Id");
  });

  it("cors import 文が含まれる", () => {
    const code = generateExpressCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).toContain("import cors from 'cors'");
  });
});

describe("generateNginxCode", () => {
  it("ワイルドカードの場合 * が含まれる", () => {
    const code = generateNginxCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).toContain("'Access-Control-Allow-Origin' '*'");
  });

  it("特定オリジンが含まれる", () => {
    const code = generateNginxCode("specific", "https://example.com", ["GET"], [], false, 0, []);
    expect(code).toContain("'Access-Control-Allow-Origin' 'https://example.com'");
  });

  it("複数オリジンの場合 map コメントが含まれる", () => {
    const code = generateNginxCode(
      "list",
      "https://a.com\nhttps://b.com",
      ["GET"],
      [],
      false,
      0,
      [],
    );
    expect(code).toContain("map");
    expect(code).toContain("Vary");
  });

  it("credentials が含まれる", () => {
    const code = generateNginxCode("specific", "https://example.com", ["GET"], [], true, 0, []);
    expect(code).toContain("'Access-Control-Allow-Credentials' 'true'");
  });

  it("maxAge が含まれる", () => {
    const code = generateNginxCode("wildcard", "", ["GET"], [], false, 3600, []);
    expect(code).toContain("'Access-Control-Max-Age' '3600'");
  });

  it("OPTIONS の return 204 が含まれる", () => {
    const code = generateNginxCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).toContain("return 204");
  });

  it("location / { が含まれる", () => {
    const code = generateNginxCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).toContain("location / {");
  });
});

describe("generateWorkersCode", () => {
  it('ワイルドカードの場合 allowedOrigin が "*" になる', () => {
    const code = generateWorkersCode("wildcard", "", ["GET"], ["Content-Type"], false, 0, []);
    expect(code).toContain("const allowedOrigin = '*'");
  });

  it("特定オリジンが含まれる", () => {
    const code = generateWorkersCode("specific", "https://example.com", ["GET"], [], false, 0, []);
    expect(code).toContain("const allowedOrigin = 'https://example.com'");
  });

  it("リストモードで allowedOrigins 配列が含まれる", () => {
    const code = generateWorkersCode(
      "list",
      "https://a.com\nhttps://b.com",
      ["GET"],
      [],
      false,
      0,
      [],
    );
    expect(code).toContain("allowedOrigins");
    expect(code).toContain("https://a.com");
    expect(code).toContain("https://b.com");
  });

  it("credentials: true が含まれる", () => {
    const code = generateWorkersCode("specific", "https://example.com", ["GET"], [], true, 0, []);
    expect(code).toContain("'Access-Control-Allow-Credentials': 'true'");
  });

  it("maxAge が含まれる", () => {
    const code = generateWorkersCode("wildcard", "", ["GET"], [], false, 3600, []);
    expect(code).toContain("'Access-Control-Max-Age': '3600'");
  });

  it("OPTIONS の 204 レスポンスが含まれる", () => {
    const code = generateWorkersCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).toContain("status: 204");
  });

  it("export default が含まれる", () => {
    const code = generateWorkersCode("wildcard", "", ["GET"], [], false, 0, []);
    expect(code).toContain("export default");
  });

  it("exposeHeaders が含まれる", () => {
    const code = generateWorkersCode("wildcard", "", ["GET"], [], false, 0, ["X-Request-Id"]);
    expect(code).toContain("'Access-Control-Expose-Headers'");
    expect(code).toContain("X-Request-Id");
  });
});
