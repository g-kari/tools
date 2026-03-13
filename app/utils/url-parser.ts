/**
 * URLパーサー/ビルダーユーティリティ
 * ブラウザ標準のURL APIを使用してURLの解析と組み立てを行う
 */

/**
 * URLの各コンポーネントを表す型
 */
export interface ParsedUrl {
  /** URLが有効かどうか */
  isValid: boolean;
  /** プロトコル（例: "https:"） */
  protocol: string;
  /** ユーザー名（例: "user"） */
  username: string;
  /** パスワード（例: "pass"） */
  password: string;
  /** ホスト名（例: "example.com"） */
  hostname: string;
  /** ポート番号（例: "8080"、省略時は空文字） */
  port: string;
  /** ホスト名+ポート（例: "example.com:8080"） */
  host: string;
  /** パス（例: "/path/to/page"） */
  pathname: string;
  /** クエリ文字列（例: "?key=value"） */
  search: string;
  /** フラグメント（例: "#section"） */
  hash: string;
  /** パースされたクエリパラメータの配列 */
  queryParams: QueryParam[];
  /** 元のURL文字列 */
  href: string;
}

/**
 * クエリパラメータの1件分
 */
export interface QueryParam {
  /** パラメータのキー */
  key: string;
  /** パラメータの値 */
  value: string;
}

/**
 * URLビルダーの入力型
 */
export interface UrlBuildInput {
  /** プロトコル（例: "https"） */
  protocol: string;
  /** ユーザー名（省略可） */
  username?: string;
  /** パスワード（省略可） */
  password?: string;
  /** ホスト名（例: "example.com"） */
  hostname: string;
  /** ポート番号（省略可） */
  port?: string;
  /** パス（例: "/path/to/page"、省略可） */
  pathname?: string;
  /** クエリパラメータ配列（省略可） */
  queryParams?: QueryParam[];
  /** フラグメント（例: "section"、"#" なし、省略可） */
  hash?: string;
}

/**
 * クエリ文字列をQueryParam配列に変換する
 * @param search - クエリ文字列（例: "?key=value&lang=ja"）
 * @returns QueryParam配列。空の場合は空配列
 * @example
 * parseQueryString("?key=value&lang=ja")
 * // => [{key: "key", value: "value"}, {key: "lang", value: "ja"}]
 */
export function parseQueryString(search: string): QueryParam[] {
  if (!search) return [];
  const params = new URLSearchParams(search);
  const result: QueryParam[] = [];
  params.forEach((value, key) => {
    result.push({ key, value });
  });
  return result;
}

/**
 * QueryParam配列をクエリ文字列に変換する
 * キーが空のパラメータは除外される
 * @param params - QueryParam配列
 * @returns クエリ文字列（例: "?key=value&lang=ja"）。パラメータなしは空文字
 * @example
 * buildQueryString([{key: "key", value: "value"}, {key: "lang", value: "ja"}])
 * // => "?key=value&lang=ja"
 */
export function buildQueryString(params: QueryParam[]): string {
  const validParams = params.filter((p) => p.key.trim() !== "");
  if (validParams.length === 0) return "";
  const searchParams = new URLSearchParams();
  validParams.forEach(({ key, value }) => {
    searchParams.append(key, value);
  });
  return "?" + searchParams.toString();
}

/**
 * URL文字列をパースしてParsedUrlオブジェクトを返す
 * @param urlString - パース対象のURL文字列
 * @returns ParsedUrlオブジェクト。無効なURLの場合はisValid: falseで他フィールドは空文字
 * @example
 * parseUrl("https://example.com/path?key=value#section")
 * // => { isValid: true, protocol: "https:", hostname: "example.com", ... }
 */
export function parseUrl(urlString: string): ParsedUrl {
  const empty: ParsedUrl = {
    isValid: false,
    protocol: "",
    username: "",
    password: "",
    hostname: "",
    port: "",
    host: "",
    pathname: "",
    search: "",
    hash: "",
    queryParams: [],
    href: "",
  };

  if (!urlString || !urlString.trim()) return empty;

  try {
    const url = new URL(urlString.trim());
    return {
      isValid: true,
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      port: url.port,
      host: url.host,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      queryParams: parseQueryString(url.search),
      href: url.href,
    };
  } catch {
    return empty;
  }
}

/**
 * UrlBuildInputからURL文字列を組み立てる
 * @param input - URLビルダーの入力
 * @returns 組み立てられたURL文字列。hostnameが空の場合は空文字
 * @example
 * buildUrl({ protocol: "https", hostname: "example.com", pathname: "/path" })
 * // => "https://example.com/path"
 */
export function buildUrl(input: UrlBuildInput): string {
  if (!input.hostname) return "";
  try {
    const protocol = input.protocol.endsWith(":")
      ? input.protocol
      : input.protocol + ":";
    const host = input.port
      ? `${input.hostname}:${input.port}`
      : input.hostname;
    const pathname = input.pathname || "/";
    const queryString = buildQueryString(input.queryParams || []);
    const hash = input.hash
      ? input.hash.startsWith("#")
        ? input.hash
        : "#" + input.hash
      : "";

    // URL APIを使用してユーザー情報を安全にエンコード
    const url = new URL(`${protocol}//${host}${pathname}`);
    if (input.username) url.username = input.username;
    if (input.password) url.password = input.password;

    // url.hrefからqueryStringとhashを除いたベースURLを取得
    const baseUrl = url.href.replace(/\?.*$/, "").replace(/#.*$/, "");
    return baseUrl + queryString + hash;
  } catch {
    return "";
  }
}

/**
 * URL文字列が有効かどうかを判定する
 * @param urlString - 検証対象のURL文字列
 * @returns 有効なURLの場合true、それ以外はfalse
 * @example
 * isValidUrl("https://example.com") // => true
 * isValidUrl("not-a-url") // => false
 */
export function isValidUrl(urlString: string): boolean {
  return parseUrl(urlString).isValid;
}

/**
 * サンプルURLを返す（サンプル読込ボタン用）
 * @returns サンプルURL文字列
 */
export function getSampleUrl(): string {
  return "https://user:pass@sub.example.com:8080/api/v1/users?page=1&limit=10&lang=ja#results";
}
