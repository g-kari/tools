import { createServerFn } from "@tanstack/react-start";

/**
 * セキュリティヘッダーのチェック結果の重要度レベル
 */
export type SecurityLevel = "pass" | "warning" | "danger";

/**
 * 個別のセキュリティヘッダーチェック結果
 */
export interface HeaderCheck {
  /** ヘッダー名 */
  name: string;
  /** ヘッダーの値（存在する場合） */
  value?: string;
  /** チェック結果のレベル */
  level: SecurityLevel;
  /** チェック結果の説明 */
  message: string;
  /** 推奨される設定値 */
  recommendation?: string;
}

/**
 * セキュリティヘッダーチェックのレスポンス
 */
export interface SecurityHeadersResult {
  /** チェック対象のURL */
  url: string;
  /** 個別のヘッダーチェック結果 */
  checks: HeaderCheck[];
  /** 全体のセキュリティスコア（0-100） */
  score: number;
  /** エラーメッセージ（エラーが発生した場合） */
  error?: string;
}

/**
 * Content-Security-Policyヘッダーをチェック
 */
function checkCSP(value?: string): HeaderCheck {
  if (!value) {
    return {
      name: "Content-Security-Policy",
      level: "danger",
      message: "CSPヘッダーが設定されていません。XSS攻撃のリスクがあります。",
      recommendation: "default-src 'self'; script-src 'self'; object-src 'none';",
    };
  }

  // 基本的なCSPの検証
  const hasDefaultSrc = value.includes("default-src");
  const hasScriptSrc = value.includes("script-src");
  const hasUnsafeInline = value.includes("'unsafe-inline'");
  const hasUnsafeEval = value.includes("'unsafe-eval'");

  if (hasUnsafeInline || hasUnsafeEval) {
    return {
      name: "Content-Security-Policy",
      value,
      level: "warning",
      message: "unsafe-inlineまたはunsafe-evalが使用されています。セキュリティが弱まります。",
      recommendation: "nonceまたはハッシュベースのCSPの使用を検討してください。",
    };
  }

  if (!hasDefaultSrc && !hasScriptSrc) {
    return {
      name: "Content-Security-Policy",
      value,
      level: "warning",
      message: "CSPが設定されていますが、default-srcまたはscript-srcが不足しています。",
      recommendation: "default-src 'self'; script-src 'self';を追加してください。",
    };
  }

  return {
    name: "Content-Security-Policy",
    value,
    level: "pass",
    message: "適切なCSPヘッダーが設定されています。",
  };
}

/**
 * Strict-Transport-Securityヘッダーをチェック
 */
function checkHSTS(value?: string, isHttps?: boolean): HeaderCheck {
  if (!isHttps) {
    return {
      name: "Strict-Transport-Security",
      level: "warning",
      message: "HTTP接続のため、HSTSは適用されません。",
      recommendation: "HTTPSを使用してください。",
    };
  }

  if (!value) {
    return {
      name: "Strict-Transport-Security",
      level: "danger",
      message: "HSTSヘッダーが設定されていません。中間者攻撃のリスクがあります。",
      recommendation: "max-age=31536000; includeSubDomains; preload",
    };
  }

  const maxAgeMatch = value.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;
  const hasIncludeSubDomains = value.includes("includeSubDomains");
  const hasPreload = value.includes("preload");

  if (maxAge < 31536000) {
    return {
      name: "Strict-Transport-Security",
      value,
      level: "warning",
      message: `max-ageが短すぎます（${maxAge}秒）。最低1年（31536000秒）を推奨します。`,
      recommendation: "max-age=31536000; includeSubDomains; preload",
    };
  }

  if (!hasIncludeSubDomains || !hasPreload) {
    return {
      name: "Strict-Transport-Security",
      value,
      level: "warning",
      message: "includeSubDomainsまたはpreloadが設定されていません。",
      recommendation: "max-age=31536000; includeSubDomains; preload",
    };
  }

  return {
    name: "Strict-Transport-Security",
    value,
    level: "pass",
    message: "適切なHSTSヘッダーが設定されています。",
  };
}

/**
 * X-Content-Type-Optionsヘッダーをチェック
 */
function checkXContentTypeOptions(value?: string): HeaderCheck {
  if (!value) {
    return {
      name: "X-Content-Type-Options",
      level: "danger",
      message: "X-Content-Type-Optionsヘッダーが設定されていません。MIME sniffing攻撃のリスクがあります。",
      recommendation: "nosniff",
    };
  }

  if (value.toLowerCase() !== "nosniff") {
    return {
      name: "X-Content-Type-Options",
      value,
      level: "warning",
      message: "X-Content-Type-Optionsの値が不正です。",
      recommendation: "nosniff",
    };
  }

  return {
    name: "X-Content-Type-Options",
    value,
    level: "pass",
    message: "適切に設定されています。",
  };
}

/**
 * X-Frame-Optionsヘッダーをチェック
 */
function checkXFrameOptions(value?: string): HeaderCheck {
  if (!value) {
    return {
      name: "X-Frame-Options",
      level: "danger",
      message: "X-Frame-Optionsヘッダーが設定されていません。クリックジャッキング攻撃のリスクがあります。",
      recommendation: "DENY または SAMEORIGIN",
    };
  }

  const validValues = ["DENY", "SAMEORIGIN"];
  if (!validValues.includes(value.toUpperCase())) {
    return {
      name: "X-Frame-Options",
      value,
      level: "warning",
      message: "X-Frame-Optionsの値が不正です。",
      recommendation: "DENY または SAMEORIGIN",
    };
  }

  return {
    name: "X-Frame-Options",
    value,
    level: "pass",
    message: "適切に設定されています。",
  };
}

/**
 * Referrer-Policyヘッダーをチェック
 */
function checkReferrerPolicy(value?: string): HeaderCheck {
  if (!value) {
    return {
      name: "Referrer-Policy",
      level: "warning",
      message: "Referrer-Policyヘッダーが設定されていません。",
      recommendation: "strict-origin-when-cross-origin または no-referrer",
    };
  }

  const secureValues = [
    "no-referrer",
    "no-referrer-when-downgrade",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
  ];

  if (!secureValues.includes(value.toLowerCase())) {
    return {
      name: "Referrer-Policy",
      value,
      level: "warning",
      message: "Referrer-Policyの値が安全ではありません。",
      recommendation: "strict-origin-when-cross-origin または no-referrer",
    };
  }

  return {
    name: "Referrer-Policy",
    value,
    level: "pass",
    message: "適切に設定されています。",
  };
}

/**
 * Permissions-Policyヘッダーをチェック
 */
function checkPermissionsPolicy(value?: string): HeaderCheck {
  if (!value) {
    return {
      name: "Permissions-Policy",
      level: "warning",
      message: "Permissions-Policyヘッダーが設定されていません。",
      recommendation: "geolocation=(), microphone=(), camera=()",
    };
  }

  return {
    name: "Permissions-Policy",
    value,
    level: "pass",
    message: "Permissions-Policyが設定されています。",
  };
}

/**
 * X-XSS-Protectionヘッダーをチェック（非推奨だが確認）
 */
function checkXXSSProtection(value?: string): HeaderCheck {
  if (!value) {
    return {
      name: "X-XSS-Protection",
      level: "warning",
      message: "X-XSS-Protectionヘッダーが設定されていません（非推奨のヘッダーですが、古いブラウザ対応に有用）。",
      recommendation: "0（CSPの使用を推奨）",
    };
  }

  // 現在はCSPの使用が推奨されるため、0が推奨値
  if (value === "0") {
    return {
      name: "X-XSS-Protection",
      value,
      level: "pass",
      message: "X-XSS-Protectionが無効化されています（CSP使用時の推奨設定）。",
    };
  }

  return {
    name: "X-XSS-Protection",
    value,
    level: "warning",
    message: "X-XSS-Protectionは非推奨です。CSPの使用を推奨します。",
    recommendation: "0（CSPを使用してください）",
  };
}

/**
 * セキュリティスコアを計算
 */
function calculateScore(checks: HeaderCheck[]): number {
  const weights = {
    "Content-Security-Policy": 25,
    "Strict-Transport-Security": 20,
    "X-Content-Type-Options": 15,
    "X-Frame-Options": 15,
    "Referrer-Policy": 10,
    "Permissions-Policy": 10,
    "X-XSS-Protection": 5,
  };

  let totalScore = 0;

  for (const check of checks) {
    const weight = weights[check.name as keyof typeof weights] || 0;
    if (check.level === "pass") {
      totalScore += weight;
    } else if (check.level === "warning") {
      totalScore += weight * 0.5;
    }
  }

  return Math.round(totalScore);
}

/**
 * SSRF攻撃を防ぐためのプライベートIP・ローカルホストチェック
 * @param hostname - チェックするホスト名
 * @returns プライベートIPまたはローカルホストの場合true
 */
function isPrivateOrLocalhost(hostname: string): boolean {
  // ローカルホストのチェック
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  ) {
    return true;
  }

  // プライベートIPレンジのチェック
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);

  if (match) {
    const [, a, b, c, d] = match.map(Number);

    // 10.0.0.0/8
    if (a === 10) return true;

    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    // 127.0.0.0/8 (localhost)
    if (a === 127) return true;

    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true;

    // 各オクテットの範囲チェック
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;
  }

  // IPv6プライベート・ローカルアドレス
  if (
    hostname.startsWith("::1") ||
    hostname.startsWith("fc00:") ||
    hostname.startsWith("fd00:") ||
    hostname.startsWith("fe80:")
  ) {
    return true;
  }

  return false;
}

/**
 * URLからHTTPヘッダーを取得してセキュリティチェックを実行
 */
export const checkSecurityHeaders = createServerFn({ method: "GET" })
  .inputValidator((data: string) => {
    try {
      const url = new URL(data);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("HTTPまたはHTTPSのURLを入力してください");
      }

      // SSRF対策: プライベートIP・ローカルホストへのアクセスを拒否
      if (isPrivateOrLocalhost(url.hostname)) {
        throw new Error(
          "セキュリティ上の理由により、ローカルホストやプライベートIPアドレスへのアクセスはできません"
        );
      }

      return data;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("無効なURL形式です");
    }
  })
  .handler(async ({ data: url }): Promise<SecurityHeadersResult> => {
    try {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === "https:";

      // タイムアウト設定（10秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const headers = response.headers;

      const checks: HeaderCheck[] = [
        checkCSP(headers.get("content-security-policy") || undefined),
        checkHSTS(
          headers.get("strict-transport-security") || undefined,
          isHttps
        ),
        checkXContentTypeOptions(
          headers.get("x-content-type-options") || undefined
        ),
        checkXFrameOptions(headers.get("x-frame-options") || undefined),
        checkReferrerPolicy(headers.get("referrer-policy") || undefined),
        checkPermissionsPolicy(
          headers.get("permissions-policy") || undefined
        ),
        checkXXSSProtection(headers.get("x-xss-protection") || undefined),
      ];

      const score = calculateScore(checks);

      return {
        url,
        checks,
        score,
      };
    } catch (err) {
      // AbortErrorの場合はタイムアウトメッセージ
      if (err instanceof Error && err.name === "AbortError") {
        return {
          url,
          checks: [],
          score: 0,
          error: "リクエストがタイムアウトしました（10秒）",
        };
      }

      return {
        url,
        checks: [],
        score: 0,
        error:
          err instanceof Error
            ? err.message
            : "セキュリティヘッダーの取得に失敗しました",
      };
    }
  });
