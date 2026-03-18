import { describe, it, expect } from "vitest";
import {
  isRedirectStatus,
  getStatusLabel,
  MAX_HOPS,
} from "../../app/functions/redirect-tracer";

describe("isRedirectStatus", () => {
  it("300番台はtrueを返す", () => {
    expect(isRedirectStatus(301)).toBe(true);
    expect(isRedirectStatus(302)).toBe(true);
    expect(isRedirectStatus(303)).toBe(true);
    expect(isRedirectStatus(307)).toBe(true);
    expect(isRedirectStatus(308)).toBe(true);
    expect(isRedirectStatus(300)).toBe(true);
    expect(isRedirectStatus(399)).toBe(true);
  });

  it("300番台以外はfalseを返す", () => {
    expect(isRedirectStatus(200)).toBe(false);
    expect(isRedirectStatus(201)).toBe(false);
    expect(isRedirectStatus(204)).toBe(false);
    expect(isRedirectStatus(400)).toBe(false);
    expect(isRedirectStatus(404)).toBe(false);
    expect(isRedirectStatus(500)).toBe(false);
    expect(isRedirectStatus(0)).toBe(false);
  });
});

describe("getStatusLabel", () => {
  it("既知のステータスコードに日本語ラベルを返す", () => {
    expect(getStatusLabel(200)).toBe("成功");
    expect(getStatusLabel(201)).toBe("作成完了");
    expect(getStatusLabel(204)).toBe("コンテンツなし");
    expect(getStatusLabel(301)).toBe("恒久リダイレクト");
    expect(getStatusLabel(302)).toBe("一時リダイレクト");
    expect(getStatusLabel(303)).toBe("他を参照");
    expect(getStatusLabel(304)).toBe("未変更");
    expect(getStatusLabel(307)).toBe("一時リダイレクト (メソッド保持)");
    expect(getStatusLabel(308)).toBe("恒久リダイレクト (メソッド保持)");
    expect(getStatusLabel(400)).toBe("不正なリクエスト");
    expect(getStatusLabel(401)).toBe("認証エラー");
    expect(getStatusLabel(403)).toBe("アクセス拒否");
    expect(getStatusLabel(404)).toBe("見つからない");
    expect(getStatusLabel(500)).toBe("サーバーエラー");
    expect(getStatusLabel(502)).toBe("ゲートウェイエラー");
    expect(getStatusLabel(503)).toBe("サービス利用不可");
  });

  it("未知のステータスコードはフォールバック文字列を返す", () => {
    expect(getStatusLabel(418)).toBe("ステータス 418");
    expect(getStatusLabel(999)).toBe("ステータス 999");
    expect(getStatusLabel(0)).toBe("ステータス 0");
  });
});

describe("MAX_HOPS", () => {
  it("最大ホップ数が正の整数として定義されている", () => {
    expect(MAX_HOPS).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_HOPS)).toBe(true);
  });

  it("最大ホップ数が適切な範囲内である", () => {
    // セキュリティ・パフォーマンス上の観点から妥当な範囲をチェック
    expect(MAX_HOPS).toBeGreaterThanOrEqual(5);
    expect(MAX_HOPS).toBeLessThanOrEqual(30);
  });
});
