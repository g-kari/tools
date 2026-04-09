/**
 * Cookieパーサーユーティリティ
 * Cookieリクエストヘッダーとして Set-Cookieレスポンスヘッダーのパース・生成を提供する
 */

/** パースされたCookieエントリー（Cookieリクエストヘッダー用） */
export interface CookieEntry {
  /** Cookie名 */
  name: string;
  /** Cookie値 */
  value: string;
}

/** Set-Cookieヘッダーの属性 */
export interface SetCookieAttributes {
  /** Cookie名 */
  name: string;
  /** Cookie値 */
  value: string;
  /** 有効期限（Expires属性） */
  expires?: string;
  /** 最大存続時間（Max-Age属性、秒） */
  maxAge?: number;
  /** ドメイン（Domain属性） */
  domain?: string;
  /** パス（Path属性） */
  path?: string;
  /** Secure属性（HTTPSのみで送信） */
  secure: boolean;
  /** HttpOnly属性（JavaScriptからアクセス不可） */
  httpOnly: boolean;
  /** SameSite属性 */
  sameSite?: string;
  /** 未知の属性（仕様外のカスタム属性など） */
  unknown: Array<{ key: string; value?: string }>;
}

/** セキュリティ警告の重要度 */
export type WarningLevel = "error" | "warning" | "info";

/** セキュリティ警告 */
export interface SecurityWarning {
  /** 重要度 */
  level: WarningLevel;
  /** 警告メッセージ */
  message: string;
}

/**
 * CookieリクエストヘッダーをパースしてCookieエントリーの配列を返す
 * @param header - Cookie: ヘッダー値（"name1=val1; name2=val2"形式）
 * @returns パースされたCookieエントリーの配列
 */
export function parseCookieHeader(header: string): CookieEntry[] {
  if (!header.trim()) return [];

  return header
    .split(";")
    .map((pair) => pair.trim())
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) {
        return { name: pair.trim(), value: "" };
      }
      return {
        name: pair.slice(0, eqIndex).trim(),
        value: pair.slice(eqIndex + 1).trim(),
      };
    })
    .filter((entry) => entry.name.length > 0);
}

/**
 * Set-CookieレスポンスヘッダーをパースしてSetCookieAttributesを返す
 * @param header - Set-Cookie: ヘッダー値（"name=value; Path=/; ..."形式）
 * @returns パースされたSet-Cookie属性、またはパース失敗時にnull
 */
export function parseSetCookieHeader(header: string): SetCookieAttributes | null {
  if (!header.trim()) return null;

  const parts = header
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return null;

  // 最初のセグメントが "name=value"
  const firstPart = parts[0];
  const eqIndex = firstPart.indexOf("=");

  let name: string;
  let value: string;

  if (eqIndex === -1) {
    name = firstPart.trim();
    value = "";
  } else {
    name = firstPart.slice(0, eqIndex).trim();
    value = firstPart.slice(eqIndex + 1).trim();
  }

  if (!name) return null;

  const result: SetCookieAttributes = {
    name,
    value,
    secure: false,
    httpOnly: false,
    unknown: [],
  };

  // 残りの属性をパース
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const eqIdx = part.indexOf("=");
    const attrKey = (eqIdx === -1 ? part : part.slice(0, eqIdx)).trim().toLowerCase();
    const attrVal = eqIdx === -1 ? undefined : part.slice(eqIdx + 1).trim();

    switch (attrKey) {
      case "expires":
        result.expires = attrVal;
        break;
      case "max-age":
        result.maxAge = attrVal !== undefined ? Number(attrVal) : undefined;
        break;
      case "domain":
        result.domain = attrVal;
        break;
      case "path":
        result.path = attrVal;
        break;
      case "secure":
        result.secure = true;
        break;
      case "httponly":
        result.httpOnly = true;
        break;
      case "samesite":
        result.sameSite = attrVal;
        break;
      default:
        result.unknown.push({
          key: eqIdx === -1 ? part.trim() : part.slice(0, eqIdx).trim(),
          value: attrVal,
        });
    }
  }

  return result;
}

/**
 * CookieエントリーをCookieリクエストヘッダー文字列に変換する
 * @param entries - Cookieエントリーの配列
 * @returns Cookie: ヘッダー値
 */
export function buildCookieHeader(entries: CookieEntry[]): string {
  return entries
    .filter((e) => e.name.trim())
    .map((e) => (e.value ? `${e.name}=${e.value}` : e.name))
    .join("; ");
}

/**
 * Set-Cookie属性をSet-CookieレスポンスヘッダーE字列に変換する
 * @param attrs - Set-Cookie属性
 * @returns Set-Cookie: ヘッダー値
 */
export function buildSetCookieHeader(attrs: SetCookieAttributes): string {
  const parts: string[] = [];

  parts.push(`${attrs.name}=${attrs.value}`);

  if (attrs.path !== undefined) parts.push(`Path=${attrs.path}`);
  if (attrs.domain !== undefined) parts.push(`Domain=${attrs.domain}`);
  if (attrs.expires !== undefined) parts.push(`Expires=${attrs.expires}`);
  if (attrs.maxAge !== undefined) parts.push(`Max-Age=${attrs.maxAge}`);
  if (attrs.sameSite !== undefined) parts.push(`SameSite=${attrs.sameSite}`);
  if (attrs.secure) parts.push("Secure");
  if (attrs.httpOnly) parts.push("HttpOnly");

  return parts.join("; ");
}

/**
 * Set-Cookie属性のセキュリティ警告を生成する
 * @param attrs - Set-Cookie属性
 * @returns セキュリティ警告の配列
 */
export function getCookieSecurityWarnings(attrs: SetCookieAttributes): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  if (!attrs.secure) {
    warnings.push({
      level: "warning",
      message:
        "Secure属性が設定されていません。HTTPSのみで送信されるようにSecure属性を追加することを推奨します。",
    });
  }

  if (!attrs.httpOnly) {
    warnings.push({
      level: "warning",
      message:
        "HttpOnly属性が設定されていません。JavaScriptからCookieにアクセスできる状態です。セッションCookieにはHttpOnly属性の付与を推奨します。",
    });
  }

  if (!attrs.sameSite) {
    warnings.push({
      level: "warning",
      message:
        "SameSite属性が設定されていません。CSRF攻撃のリスクがあります。SameSite=Lax またはSameSite=Strictを推奨します。",
    });
  } else if (attrs.sameSite.toLowerCase() === "none" && !attrs.secure) {
    warnings.push({
      level: "error",
      message:
        "SameSite=Noneを使用する場合はSecure属性が必須です。Secure属性がないとブラウザに拒否されます。",
    });
  }

  if (attrs.maxAge !== undefined && attrs.expires !== undefined) {
    warnings.push({
      level: "info",
      message: "Max-AgeとExpires両方が指定されています。Max-Ageが優先されます。",
    });
  }

  return warnings;
}

/**
 * Cookieの有効期限の説明文字列を返す
 * @param attrs - Set-Cookie属性
 * @returns 期限の説明文字列、または期限未設定の場合null
 */
export function getCookieExpiration(attrs: SetCookieAttributes): string | null {
  if (attrs.maxAge !== undefined) {
    if (attrs.maxAge <= 0) return "セッション終了時または即時削除";
    const seconds = attrs.maxAge;
    if (seconds < 60) return `${seconds}秒後`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分後`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}時間後`;
    return `${Math.floor(seconds / 86400)}日後`;
  }
  if (attrs.expires) {
    try {
      const date = new Date(attrs.expires);
      if (!isNaN(date.getTime())) {
        const diff = date.getTime() - Date.now();
        if (diff < 0) return "期限切れ";
        const days = Math.floor(diff / 86400000);
        if (days > 0) return `約${days}日後 (${date.toLocaleDateString("ja-JP")})`;
        const hours = Math.floor(diff / 3600000);
        if (hours > 0) return `約${hours}時間後`;
        return `約${Math.floor(diff / 60000)}分後`;
      }
    } catch {
      return attrs.expires;
    }
  }
  return null;
}
