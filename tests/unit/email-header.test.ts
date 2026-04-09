import { describe, it, expect } from "vite-plus/test";
import {
  parseRawHeaders,
  parseReceivedHops,
  parseAuthResults,
  parseSpamInfo,
  extractSummary,
  analyzeEmailHeaders,
  formatDeliveryTime,
  getAuthStatusLabel,
  getAuthStatusColor,
} from "../../app/utils/email-header";

const SAMPLE_HEADERS = `From: sender@example.com
To: recipient@example.org
Subject: Test Email
Date: Thu, 20 Mar 2026 10:00:00 +0900
Message-ID: <test123@example.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Return-Path: <bounce@example.com>
Authentication-Results: mx.example.org;
 spf=pass smtp.mailfrom=example.com;
 dkim=pass header.d=example.com;
 dmarc=pass action=none header.from=example.com
X-Spam-Status: No, score=-1.5 required=5.0 tests=BAYES_00,SPF_PASS
Received: from mail.example.com (mail.example.com [203.0.113.1])
 by mx.example.org with ESMTPS; Thu, 20 Mar 2026 10:00:05 +0900
Received: from smtp.example.com (smtp.example.com [203.0.113.2])
 by mail.example.com with ESMTP; Thu, 20 Mar 2026 10:00:02 +0900`;

describe("parseRawHeaders", () => {
  it("基本的なヘッダーをパースできる", () => {
    const headers = parseRawHeaders("From: test@example.com\nTo: dest@example.com");
    expect(headers).toHaveLength(2);
    expect(headers[0]).toEqual({ name: "From", value: "test@example.com" });
    expect(headers[1]).toEqual({ name: "To", value: "dest@example.com" });
  });

  it("折り畳みヘッダー（folded headers）を展開する", () => {
    const raw = "Subject: This is\n a long subject\n line";
    const headers = parseRawHeaders(raw);
    expect(headers[0].value).toBe("This is a long subject line");
  });

  it("CRLF改行に対応する", () => {
    const raw = "From: a@b.com\r\nTo: c@d.com";
    const headers = parseRawHeaders(raw);
    expect(headers).toHaveLength(2);
  });

  it("空行をスキップする", () => {
    const raw = "From: a@b.com\n\nTo: c@d.com";
    const headers = parseRawHeaders(raw);
    expect(headers).toHaveLength(2);
  });

  it("コロンなしの行をスキップする", () => {
    const raw = "invalid line\nFrom: a@b.com";
    const headers = parseRawHeaders(raw);
    expect(headers).toHaveLength(1);
    expect(headers[0].name).toBe("From");
  });

  it("サンプルヘッダーの全フィールドをパースする", () => {
    const headers = parseRawHeaders(SAMPLE_HEADERS);
    expect(headers.length).toBeGreaterThan(5);
    const from = headers.find((h) => h.name === "From");
    expect(from?.value).toBe("sender@example.com");
  });
});

describe("parseReceivedHops", () => {
  it("Receivedヘッダーが存在しない場合は空配列を返す", () => {
    const headers = parseRawHeaders("From: a@b.com");
    expect(parseReceivedHops(headers)).toHaveLength(0);
  });

  it("複数のReceivedヘッダーを解析する", () => {
    const headers = parseRawHeaders(SAMPLE_HEADERS);
    const hops = parseReceivedHops(headers);
    expect(hops).toHaveLength(2);
  });

  it("fromフィールドを抽出する", () => {
    const headers = parseRawHeaders(
      "Received: from mail.example.com by mx.org with ESMTP; Thu, 20 Mar 2026 10:00:00 +0900",
    );
    const hops = parseReceivedHops(headers);
    expect(hops[0].from).toContain("mail.example.com");
  });

  it("byフィールドを抽出する", () => {
    const headers = parseRawHeaders(
      "Received: from mail.example.com by mx.org with ESMTP; Thu, 20 Mar 2026 10:00:00 +0900",
    );
    const hops = parseReceivedHops(headers);
    expect(hops[0].by).toContain("mx.org");
  });

  it("withフィールドを抽出する", () => {
    const headers = parseRawHeaders(
      "Received: from a by b with ESMTPS; Thu, 20 Mar 2026 10:00:00 +0900",
    );
    const hops = parseReceivedHops(headers);
    expect(hops[0].with).toBe("ESMTPS");
  });

  it("日付フィールドを抽出する", () => {
    const headers = parseRawHeaders(
      "Received: from a by b with ESMTP; Thu, 20 Mar 2026 10:00:00 +0900",
    );
    const hops = parseReceivedHops(headers);
    expect(hops[0].date).toContain("20 Mar 2026");
  });
});

describe("parseAuthResults", () => {
  it("Authentication-Resultsが存在しない場合はnullを返す", () => {
    const headers = parseRawHeaders("From: a@b.com");
    expect(parseAuthResults(headers)).toBeNull();
  });

  it("SPFのpassを検出する", () => {
    const headers = parseRawHeaders(
      "Authentication-Results: mx.example.org; spf=pass smtp.mailfrom=example.com",
    );
    const result = parseAuthResults(headers);
    expect(result?.spf).toBe("pass");
  });

  it("DKIMのpassを検出する", () => {
    const headers = parseRawHeaders(
      "Authentication-Results: mx.example.org; dkim=pass header.d=example.com",
    );
    const result = parseAuthResults(headers);
    expect(result?.dkim).toBe("pass");
  });

  it("DMARCのpassを検出する", () => {
    const headers = parseRawHeaders("Authentication-Results: mx.example.org; dmarc=pass");
    const result = parseAuthResults(headers);
    expect(result?.dmarc).toBe("pass");
  });

  it("failを検出する", () => {
    const headers = parseRawHeaders("Authentication-Results: mx.example.org; spf=fail");
    const result = parseAuthResults(headers);
    expect(result?.spf).toBe("fail");
  });

  it("softfailを検出する", () => {
    const headers = parseRawHeaders("Authentication-Results: mx.example.org; spf=softfail");
    const result = parseAuthResults(headers);
    expect(result?.spf).toBe("softfail");
  });

  it("存在しないプロトコルはnoneを返す", () => {
    const headers = parseRawHeaders("Authentication-Results: mx.example.org; spf=pass");
    const result = parseAuthResults(headers);
    expect(result?.dkim).toBe("none");
    expect(result?.dmarc).toBe("none");
  });

  it("サンプルヘッダーの全認証結果を解析する", () => {
    const headers = parseRawHeaders(SAMPLE_HEADERS);
    const result = parseAuthResults(headers);
    expect(result?.spf).toBe("pass");
    expect(result?.dkim).toBe("pass");
    expect(result?.dmarc).toBe("pass");
  });
});

describe("parseSpamInfo", () => {
  it("スパムヘッダーが存在しない場合はデフォルト値を返す", () => {
    const headers = parseRawHeaders("From: a@b.com");
    const result = parseSpamInfo(headers);
    expect(result.status).toBeNull();
    expect(result.score).toBeNull();
    expect(result.isSpam).toBe(false);
  });

  it("スパム判定「No」を検出する", () => {
    const headers = parseRawHeaders("X-Spam-Status: No, score=-1.5 required=5.0");
    const result = parseSpamInfo(headers);
    expect(result.isSpam).toBe(false);
  });

  it("スパム判定「Yes」を検出する", () => {
    const headers = parseRawHeaders("X-Spam-Status: Yes, score=8.3 required=5.0");
    const result = parseSpamInfo(headers);
    expect(result.isSpam).toBe(true);
  });

  it("スコアを抽出する", () => {
    const headers = parseRawHeaders("X-Spam-Status: No, score=-1.5 required=5.0");
    const result = parseSpamInfo(headers);
    expect(result.score).toBe(-1.5);
  });

  it("閾値を抽出する", () => {
    const headers = parseRawHeaders("X-Spam-Status: No, score=-1.5 required=5.0");
    const result = parseSpamInfo(headers);
    expect(result.threshold).toBe(5.0);
  });

  it("適用テスト一覧を抽出する", () => {
    const headers = parseRawHeaders(
      "X-Spam-Status: No, score=-1.5 required=5.0 tests=BAYES_00,SPF_PASS",
    );
    const result = parseSpamInfo(headers);
    expect(result.tests).toContain("BAYES_00");
    expect(result.tests).toContain("SPF_PASS");
  });
});

describe("extractSummary", () => {
  it("主要ヘッダーを抽出する", () => {
    const headers = parseRawHeaders(SAMPLE_HEADERS);
    const summary = extractSummary(headers);
    expect(summary.from).toBe("sender@example.com");
    expect(summary.to).toBe("recipient@example.org");
    expect(summary.subject).toBe("Test Email");
    expect(summary.messageId).toBe("<test123@example.com>");
    expect(summary.returnPath).toBe("<bounce@example.com>");
  });

  it("存在しないヘッダーは空文字を返す", () => {
    const headers = parseRawHeaders("From: a@b.com");
    const summary = extractSummary(headers);
    expect(summary.to).toBe("");
    expect(summary.subject).toBe("");
  });
});

describe("analyzeEmailHeaders", () => {
  it("空文字列を渡しても例外を投げない", () => {
    expect(() => analyzeEmailHeaders("")).not.toThrow();
  });

  it("サンプルヘッダーを総合解析する", () => {
    const result = analyzeEmailHeaders(SAMPLE_HEADERS);
    expect(result.headers.length).toBeGreaterThan(0);
    expect(result.receivedHops).toHaveLength(2);
    expect(result.auth).not.toBeNull();
    expect(result.auth?.spf).toBe("pass");
    expect(result.spam.isSpam).toBe(false);
    expect(result.summary.from).toBe("sender@example.com");
  });
});

describe("formatDeliveryTime", () => {
  it("1秒未満はmsで表示する", () => {
    expect(formatDeliveryTime(500)).toBe("500ms");
  });

  it("1秒以上1分未満は秒で表示する", () => {
    expect(formatDeliveryTime(3500)).toBe("3.5秒");
  });

  it("1分以上1時間未満は分で表示する", () => {
    expect(formatDeliveryTime(90000)).toBe("2分");
  });

  it("1時間以上は時間で表示する", () => {
    expect(formatDeliveryTime(3600000)).toBe("1.0時間");
  });
});

describe("getAuthStatusLabel", () => {
  it("passに対して✓ passを返す", () => {
    expect(getAuthStatusLabel("pass")).toBe("✓ pass");
  });

  it("failに対して✗ failを返す", () => {
    expect(getAuthStatusLabel("fail")).toBe("✗ fail");
  });

  it("noneに対して- なしを返す", () => {
    expect(getAuthStatusLabel("none")).toBe("- なし");
  });
});

describe("getAuthStatusColor", () => {
  it("passにauth-passを返す", () => {
    expect(getAuthStatusColor("pass")).toBe("auth-pass");
  });

  it("failにauth-failを返す", () => {
    expect(getAuthStatusColor("fail")).toBe("auth-fail");
  });

  it("unknownにauth-unknownを返す", () => {
    expect(getAuthStatusColor("unknown")).toBe("auth-unknown");
  });
});
