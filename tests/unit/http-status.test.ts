import { describe, it, expect } from "vite-plus/test";
import {
  HTTP_STATUS_CODES,
  filterStatusCodes,
  getStatusCategory,
  getCategoryLabel,
  getCategoryColor,
  type HttpStatusCode,
} from "../../app/routes/http-status";

describe("HTTP_STATUS_CODES", () => {
  it("全データが定義されている", () => {
    expect(HTTP_STATUS_CODES).toBeDefined();
    expect(Array.isArray(HTTP_STATUS_CODES)).toBe(true);
    expect(HTTP_STATUS_CODES.length).toBeGreaterThan(0);
  });

  it("各コードはcode, name, description, categoryを持つ", () => {
    HTTP_STATUS_CODES.forEach((item) => {
      expect(typeof item.code).toBe("number");
      expect(typeof item.name).toBe("string");
      expect(typeof item.description).toBe("string");
      expect(["1xx", "2xx", "3xx", "4xx", "5xx"]).toContain(item.category);
    });
  });

  it("1xxカテゴリのコードが含まれている", () => {
    const codes1xx = HTTP_STATUS_CODES.filter((c) => c.category === "1xx");
    expect(codes1xx.length).toBeGreaterThanOrEqual(4);
    const codeNums = codes1xx.map((c) => c.code);
    expect(codeNums).toContain(100);
    expect(codeNums).toContain(101);
    expect(codeNums).toContain(102);
    expect(codeNums).toContain(103);
  });

  it("2xxカテゴリのコードが含まれている", () => {
    const codes2xx = HTTP_STATUS_CODES.filter((c) => c.category === "2xx");
    expect(codes2xx.length).toBeGreaterThanOrEqual(8);
    const codeNums = codes2xx.map((c) => c.code);
    expect(codeNums).toContain(200);
    expect(codeNums).toContain(201);
    expect(codeNums).toContain(202);
    expect(codeNums).toContain(204);
    expect(codeNums).toContain(206);
    expect(codeNums).toContain(207);
    expect(codeNums).toContain(208);
    expect(codeNums).toContain(226);
  });

  it("3xxカテゴリのコードが含まれている", () => {
    const codes3xx = HTTP_STATUS_CODES.filter((c) => c.category === "3xx");
    expect(codes3xx.length).toBeGreaterThanOrEqual(7);
    const codeNums = codes3xx.map((c) => c.code);
    expect(codeNums).toContain(300);
    expect(codeNums).toContain(301);
    expect(codeNums).toContain(302);
    expect(codeNums).toContain(303);
    expect(codeNums).toContain(304);
    expect(codeNums).toContain(307);
    expect(codeNums).toContain(308);
  });

  it("4xxカテゴリのコードが含まれている", () => {
    const codes4xx = HTTP_STATUS_CODES.filter((c) => c.category === "4xx");
    expect(codes4xx.length).toBeGreaterThanOrEqual(15);
    const codeNums = codes4xx.map((c) => c.code);
    expect(codeNums).toContain(400);
    expect(codeNums).toContain(401);
    expect(codeNums).toContain(403);
    expect(codeNums).toContain(404);
    expect(codeNums).toContain(405);
    expect(codeNums).toContain(408);
    expect(codeNums).toContain(409);
    expect(codeNums).toContain(410);
    expect(codeNums).toContain(413);
    expect(codeNums).toContain(414);
    expect(codeNums).toContain(415);
    expect(codeNums).toContain(422);
    expect(codeNums).toContain(429);
    expect(codeNums).toContain(431);
    expect(codeNums).toContain(451);
  });

  it("5xxカテゴリのコードが含まれている", () => {
    const codes5xx = HTTP_STATUS_CODES.filter((c) => c.category === "5xx");
    expect(codes5xx.length).toBeGreaterThanOrEqual(9);
    const codeNums = codes5xx.map((c) => c.code);
    expect(codeNums).toContain(500);
    expect(codeNums).toContain(501);
    expect(codeNums).toContain(502);
    expect(codeNums).toContain(503);
    expect(codeNums).toContain(504);
    expect(codeNums).toContain(505);
    expect(codeNums).toContain(507);
    expect(codeNums).toContain(508);
    expect(codeNums).toContain(511);
  });

  it("コードの重複がない", () => {
    const codes = HTTP_STATUS_CODES.map((c) => c.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it("各コードは名前と説明が空でない", () => {
    HTTP_STATUS_CODES.forEach((item) => {
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(item.description.trim().length).toBeGreaterThan(0);
    });
  });
});

describe("getStatusCategory", () => {
  it("100-199は1xxを返す", () => {
    expect(getStatusCategory(100)).toBe("1xx");
    expect(getStatusCategory(199)).toBe("1xx");
    expect(getStatusCategory(103)).toBe("1xx");
  });

  it("200-299は2xxを返す", () => {
    expect(getStatusCategory(200)).toBe("2xx");
    expect(getStatusCategory(299)).toBe("2xx");
    expect(getStatusCategory(201)).toBe("2xx");
  });

  it("300-399は3xxを返す", () => {
    expect(getStatusCategory(300)).toBe("3xx");
    expect(getStatusCategory(399)).toBe("3xx");
    expect(getStatusCategory(301)).toBe("3xx");
  });

  it("400-499は4xxを返す", () => {
    expect(getStatusCategory(400)).toBe("4xx");
    expect(getStatusCategory(499)).toBe("4xx");
    expect(getStatusCategory(404)).toBe("4xx");
  });

  it("500以上は5xxを返す", () => {
    expect(getStatusCategory(500)).toBe("5xx");
    expect(getStatusCategory(599)).toBe("5xx");
    expect(getStatusCategory(503)).toBe("5xx");
  });
});

describe("getCategoryLabel", () => {
  it("allはすべてを返す", () => {
    expect(getCategoryLabel("all")).toBe("すべて");
  });

  it("1xxは正しいラベルを返す", () => {
    expect(getCategoryLabel("1xx")).toBe("1xx 情報");
  });

  it("2xxは正しいラベルを返す", () => {
    expect(getCategoryLabel("2xx")).toBe("2xx 成功");
  });

  it("3xxは正しいラベルを返す", () => {
    expect(getCategoryLabel("3xx")).toBe("3xx リダイレクト");
  });

  it("4xxは正しいラベルを返す", () => {
    expect(getCategoryLabel("4xx")).toBe("4xx クライアントエラー");
  });

  it("5xxは正しいラベルを返す", () => {
    expect(getCategoryLabel("5xx")).toBe("5xx サーバーエラー");
  });

  it("未知のカテゴリはそのまま返す", () => {
    expect(getCategoryLabel("unknown")).toBe("unknown");
  });
});

describe("getCategoryColor", () => {
  it("1xxは正しいクラス名を返す", () => {
    expect(getCategoryColor("1xx")).toBe("http-status-cat-1xx");
  });

  it("2xxは正しいクラス名を返す", () => {
    expect(getCategoryColor("2xx")).toBe("http-status-cat-2xx");
  });

  it("3xxは正しいクラス名を返す", () => {
    expect(getCategoryColor("3xx")).toBe("http-status-cat-3xx");
  });

  it("4xxは正しいクラス名を返す", () => {
    expect(getCategoryColor("4xx")).toBe("http-status-cat-4xx");
  });

  it("5xxは正しいクラス名を返す", () => {
    expect(getCategoryColor("5xx")).toBe("http-status-cat-5xx");
  });

  it("未知のカテゴリは空文字を返す", () => {
    expect(getCategoryColor("unknown")).toBe("");
  });
});

describe("filterStatusCodes", () => {
  const sampleCodes: HttpStatusCode[] = [
    {
      code: 200,
      name: "OK",
      description: "リクエストが成功しました",
      category: "2xx",
    },
    {
      code: 404,
      name: "Not Found",
      description: "リソースが見つかりません",
      category: "4xx",
    },
    {
      code: 500,
      name: "Internal Server Error",
      description: "サーバー内部エラー",
      category: "5xx",
    },
    {
      code: 301,
      name: "Moved Permanently",
      description: "恒久的なリダイレクト",
      category: "3xx",
    },
  ];

  it("空のクエリとallカテゴリは全件返す", () => {
    const result = filterStatusCodes(sampleCodes, "", "all");
    expect(result).toHaveLength(sampleCodes.length);
  });

  it("カテゴリフィルタが機能する", () => {
    const result = filterStatusCodes(sampleCodes, "", "4xx");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(404);
  });

  it("コード番号での検索が機能する", () => {
    const result = filterStatusCodes(sampleCodes, "200", "all");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(200);
  });

  it("名前での検索が機能する（大文字小文字を区別しない）", () => {
    const result = filterStatusCodes(sampleCodes, "not found", "all");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(404);
  });

  it("説明での検索が機能する", () => {
    const result = filterStatusCodes(sampleCodes, "リダイレクト", "all");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(301);
  });

  it("カテゴリとキーワードの組み合わせが機能する", () => {
    const result = filterStatusCodes(sampleCodes, "error", "5xx");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(500);
  });

  it("マッチしない検索は空配列を返す", () => {
    const result = filterStatusCodes(sampleCodes, "xyznotfound", "all");
    expect(result).toHaveLength(0);
  });

  it("カテゴリ不一致は空配列を返す", () => {
    const result = filterStatusCodes(sampleCodes, "200", "5xx");
    expect(result).toHaveLength(0);
  });

  it("スペースのみのクエリは全件返す", () => {
    const result = filterStatusCodes(sampleCodes, "   ", "all");
    expect(result).toHaveLength(sampleCodes.length);
  });

  it("コード番号の部分一致が機能する", () => {
    const result = filterStatusCodes(sampleCodes, "50", "all");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(500);
  });
});
