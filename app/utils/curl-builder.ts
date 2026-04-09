/**
 * curlコマンドビルダーユーティリティ
 * GUIからcurlコマンドを組み立てる
 */

/**
 * HTTPメソッド
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/**
 * ボディの種類
 */
export type BodyType = "none" | "json" | "text" | "form";

/**
 * 出力フォーマット
 */
export type OutputFormat = "single" | "multiline";

/**
 * HTTPヘッダー
 */
export interface Header {
  /** ユニークID */
  id: string;
  /** ヘッダー名 */
  key: string;
  /** ヘッダー値 */
  value: string;
  /** 有効/無効 */
  enabled: boolean;
}

/**
 * curlオプション
 */
export interface CurlOptions {
  /** 詳細出力 (-v) */
  verbose: boolean;
  /** サイレントモード (-s) */
  silent: boolean;
  /** 圧縮を有効にする (--compressed) */
  compressed: boolean;
  /** リダイレクトを追従する (-L) */
  followRedirects: boolean;
  /** SSL証明書の検証をスキップする (-k) */
  insecure: boolean;
  /** 出力ファイル (-o <file>) */
  outputFile: string;
}

/**
 * curlビルダーの設定
 */
export interface CurlBuilderConfig {
  /** HTTPメソッド */
  method: HttpMethod;
  /** URL */
  url: string;
  /** ヘッダー一覧 */
  headers: Header[];
  /** ボディの種類 */
  bodyType: BodyType;
  /** ボディ内容 */
  body: string;
  /** curlオプション */
  options: CurlOptions;
  /** 出力フォーマット */
  outputFormat: OutputFormat;
}

/**
 * デフォルトのcurlオプションを返す
 * @returns デフォルトのcurlオプション
 */
export function getDefaultOptions(): CurlOptions {
  return {
    verbose: false,
    silent: false,
    compressed: false,
    followRedirects: false,
    insecure: false,
    outputFile: "",
  };
}

/**
 * デフォルト設定を返す
 * @returns デフォルトのcurlビルダー設定
 */
export function getDefaultConfig(): CurlBuilderConfig {
  return {
    method: "GET",
    url: "",
    headers: [],
    bodyType: "none",
    body: "",
    options: getDefaultOptions(),
    outputFormat: "multiline",
  };
}

/**
 * シェル文字列をシングルクォートでエスケープする
 * @param str - エスケープ対象の文字列
 * @returns エスケープ済み文字列（シングルクォートで囲まれた形式）
 */
export function shellEscapeSingle(str: string): string {
  // シングルクォートを含まず、URLセーフな文字のみならそのまま
  if (/^[a-zA-Z0-9._\-/:@=%#+~,;]+$/.test(str)) {
    return str;
  }
  // シングルクォートでラップし、内部のシングルクォートをエスケープ
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

/**
 * curlコマンドを生成する
 * @param config - curlビルダーの設定
 * @returns 生成されたcurlコマンド文字列
 */
export function buildCurlCommand(config: CurlBuilderConfig): string {
  if (!config.url.trim()) {
    return "curl [URLを入力してください]";
  }

  const parts: string[] = ["curl"];

  // オプション: verbose
  if (config.options.verbose) {
    parts.push("-v");
  }

  // オプション: silent
  if (config.options.silent) {
    parts.push("-s");
  }

  // オプション: compressed
  if (config.options.compressed) {
    parts.push("--compressed");
  }

  // オプション: followRedirects
  if (config.options.followRedirects) {
    parts.push("-L");
  }

  // オプション: insecure
  if (config.options.insecure) {
    parts.push("-k");
  }

  // オプション: outputFile
  if (config.options.outputFile.trim()) {
    parts.push(`-o ${shellEscapeSingle(config.options.outputFile.trim())}`);
  }

  // メソッド
  if (config.method === "HEAD") {
    parts.push("-I");
  } else if (config.method !== "GET") {
    parts.push(`-X ${config.method}`);
  }

  // ヘッダー (enabledのものだけ)
  for (const header of config.headers) {
    if (header.enabled && header.key.trim()) {
      const headerStr = `${header.key}: ${header.value}`;
      parts.push(`-H ${shellEscapeSingle(headerStr)}`);
    }
  }

  // ボディ
  if (config.bodyType === "json" && config.body.trim()) {
    parts.push(`--data-raw ${shellEscapeSingle(config.body)}`);
  } else if (config.bodyType === "text" && config.body.trim()) {
    parts.push(`--data-raw ${shellEscapeSingle(config.body)}`);
  } else if (config.bodyType === "form" && config.body.trim()) {
    parts.push(`-d ${shellEscapeSingle(config.body)}`);
  }

  // URL (最後に追加)
  parts.push(shellEscapeSingle(config.url));

  // 出力フォーマット
  if (config.outputFormat === "multiline") {
    return parts.join(" \\\n  ");
  } else {
    return parts.join(" ");
  }
}

/**
 * サンプル設定の定義
 */
export const SAMPLE_CONFIGS: Record<string, CurlBuilderConfig> = {
  GET基本: {
    method: "GET",
    url: "https://api.example.com/users",
    headers: [{ id: "1", key: "Accept", value: "application/json", enabled: true }],
    bodyType: "none",
    body: "",
    options: {
      verbose: false,
      silent: false,
      compressed: true,
      followRedirects: true,
      insecure: false,
      outputFile: "",
    },
    outputFormat: "multiline",
  },
  "POST JSON": {
    method: "POST",
    url: "https://api.example.com/users",
    headers: [
      { id: "1", key: "Content-Type", value: "application/json", enabled: true },
      { id: "2", key: "Accept", value: "application/json", enabled: true },
      { id: "3", key: "Authorization", value: "Bearer your-token", enabled: true },
    ],
    bodyType: "json",
    body: JSON.stringify({ name: "山田太郎", email: "yamada@example.com" }, null, 2),
    options: {
      verbose: false,
      silent: false,
      compressed: true,
      followRedirects: false,
      insecure: false,
      outputFile: "",
    },
    outputFormat: "multiline",
  },
  フォーム送信: {
    method: "POST",
    url: "https://example.com/login",
    headers: [
      { id: "1", key: "Content-Type", value: "application/x-www-form-urlencoded", enabled: true },
    ],
    bodyType: "form",
    body: "username=user&password=pass",
    options: {
      verbose: false,
      silent: false,
      compressed: false,
      followRedirects: true,
      insecure: false,
      outputFile: "",
    },
    outputFormat: "multiline",
  },
  ファイルダウンロード: {
    method: "GET",
    url: "https://example.com/file.zip",
    headers: [],
    bodyType: "none",
    body: "",
    options: {
      verbose: false,
      silent: true,
      compressed: false,
      followRedirects: true,
      insecure: false,
      outputFile: "file.zip",
    },
    outputFormat: "single",
  },
};
