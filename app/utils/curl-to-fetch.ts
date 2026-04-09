/**
 * cURL → fetch / axios 変換ユーティリティ
 *
 * cURLコマンドを解析し、JavaScript Fetch API または axios のコードに変換する。
 */

/** 解析済みcURLコマンドの構造 */
export interface ParsedCurl {
  /** HTTPメソッド */
  method: string;
  /** リクエストURL */
  url: string;
  /** HTTPヘッダー */
  headers: Record<string, string>;
  /** リクエストボディ（null = なし） */
  body: string | null;
  /** リダイレクト追従フラグ */
  followRedirects: boolean;
  /** SSL検証スキップフラグ */
  insecure: boolean;
}

/** 変換オプション */
export interface ConvertOptions {
  /** 出力ライブラリ */
  mode: "fetch" | "axios";
  /** TypeScriptの型注釈を追加するか */
  typescript: boolean;
}

/** 変換結果 */
export interface ConvertResult {
  /** 生成されたコード */
  code: string;
  /** 警告メッセージ */
  warnings: string[];
}

/**
 * シェルスタイルのトークン列を生成する
 *
 * シングルクォート・ダブルクォート・ANSI-Cクォート（$'...'）に対応。
 * バックスラッシュ＋改行の行継続も処理する。
 *
 * @param command cURLコマンド文字列
 * @returns トークンの配列
 */
export function tokenize(command: string): string[] {
  // バックスラッシュ＋改行（行継続）を空白に置換
  const normalized = command.replace(/\\\n/g, " ").trim();

  const tokens: string[] = [];
  let i = 0;

  while (i < normalized.length) {
    // 空白をスキップ
    while (i < normalized.length && /\s/.test(normalized[i])) i++;
    if (i >= normalized.length) break;

    const ch = normalized[i];

    if (ch === "$" && normalized[i + 1] === "'") {
      // ANSI-Cクォート $'...' の処理
      i += 2;
      let s = "";
      while (i < normalized.length && normalized[i] !== "'") {
        if (normalized[i] === "\\") {
          i++;
          switch (normalized[i]) {
            case "n":
              s += "\n";
              break;
            case "t":
              s += "\t";
              break;
            case "r":
              s += "\r";
              break;
            case "'":
              s += "'";
              break;
            case "\\":
              s += "\\";
              break;
            default:
              s += "\\" + (normalized[i] ?? "");
          }
        } else {
          s += normalized[i];
        }
        i++;
      }
      i++; // 閉じクォートをスキップ
      tokens.push(s);
    } else if (ch === "'") {
      // シングルクォート: エスケープなし
      i++;
      let s = "";
      while (i < normalized.length && normalized[i] !== "'") {
        s += normalized[i++];
      }
      i++; // 閉じクォートをスキップ
      tokens.push(s);
    } else if (ch === '"') {
      // ダブルクォート: バックスラッシュエスケープあり
      i++;
      let s = "";
      while (i < normalized.length && normalized[i] !== '"') {
        if (normalized[i] === "\\" && i + 1 < normalized.length) {
          i++;
          switch (normalized[i]) {
            case "n":
              s += "\n";
              break;
            case "t":
              s += "\t";
              break;
            case "r":
              s += "\r";
              break;
            case '"':
              s += '"';
              break;
            case "\\":
              s += "\\";
              break;
            default:
              s += "\\" + normalized[i];
          }
        } else {
          s += normalized[i];
        }
        i++;
      }
      i++; // 閉じクォートをスキップ
      tokens.push(s);
    } else {
      // クォートなしトークン（空白で区切られるまで）
      let s = "";
      while (i < normalized.length && !/\s/.test(normalized[i])) {
        s += normalized[i++];
      }
      if (s) tokens.push(s);
    }
  }

  return tokens;
}

/**
 * cURLコマンドを解析して構造化データに変換する
 *
 * @param command cURLコマンド文字列（"curl " プレフィックスあり/なし両対応）
 * @returns 解析済みcURLデータと警告メッセージ
 */
export function parseCurl(command: string): {
  parsed: ParsedCurl;
  warnings: string[];
} {
  const warnings: string[] = [];
  const tokens = tokenize(command.trim());

  let idx = 0;

  // "curl" コマンド名をスキップ
  if (tokens[0]?.toLowerCase() === "curl") idx++;

  const result: ParsedCurl = {
    method: "GET",
    url: "",
    headers: {},
    body: null,
    followRedirects: false,
    insecure: false,
  };

  let hasExplicitMethod = false;

  while (idx < tokens.length) {
    const token = tokens[idx];

    if (token === "-X" || token === "--request") {
      idx++;
      const method = tokens[idx];
      if (method) {
        result.method = method.toUpperCase();
        hasExplicitMethod = true;
      }
    } else if (token === "-H" || token === "--header") {
      idx++;
      const header = tokens[idx] ?? "";
      const colonIdx = header.indexOf(":");
      if (colonIdx > -1) {
        const name = header.slice(0, colonIdx).trim();
        const value = header.slice(colonIdx + 1).trim();
        result.headers[name] = value;
      }
    } else if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-ascii"
    ) {
      idx++;
      result.body = tokens[idx] ?? "";
      if (!hasExplicitMethod) result.method = "POST";
    } else if (token === "--data-binary") {
      idx++;
      result.body = tokens[idx] ?? "";
      if (!hasExplicitMethod) result.method = "POST";
      warnings.push(
        "--data-binary は fetch では body: として扱います。バイナリデータの場合は手動で調整してください。",
      );
    } else if (token === "--data-urlencode") {
      idx++;
      const raw = tokens[idx] ?? "";
      // name=value 形式の URL エンコード
      if (!hasExplicitMethod) result.method = "POST";
      const encodedParts = raw.includes("=")
        ? (() => {
            const eqIdx = raw.indexOf("=");
            const name = encodeURIComponent(raw.slice(0, eqIdx));
            const value = encodeURIComponent(raw.slice(eqIdx + 1));
            return `${name}=${value}`;
          })()
        : encodeURIComponent(raw);
      result.body = result.body ? `${result.body}&${encodedParts}` : encodedParts;
      if (!result.headers["Content-Type"]) {
        result.headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
    } else if (token === "--json") {
      // --json は -d と -H Content-Type: application/json の組み合わせ
      idx++;
      result.body = tokens[idx] ?? "";
      if (!hasExplicitMethod) result.method = "POST";
      result.headers["Content-Type"] ??= "application/json";
      result.headers["Accept"] ??= "application/json";
    } else if (token === "-u" || token === "--user") {
      idx++;
      const userpass = tokens[idx] ?? "";
      result.headers["Authorization"] = `Basic ${btoa(userpass)}`;
    } else if (token === "-b" || token === "--cookie") {
      idx++;
      result.headers["Cookie"] = tokens[idx] ?? "";
    } else if (token === "-A" || token === "--user-agent") {
      idx++;
      result.headers["User-Agent"] = tokens[idx] ?? "";
    } else if (token === "-e" || token === "--referer") {
      idx++;
      result.headers["Referer"] = tokens[idx] ?? "";
    } else if (token === "--compressed") {
      result.headers["Accept-Encoding"] ??= "gzip, deflate, br";
    } else if (token === "-L" || token === "--location") {
      result.followRedirects = true;
    } else if (token === "-k" || token === "--insecure") {
      result.insecure = true;
      warnings.push(
        "--insecure (SSL検証スキップ) は ブラウザの fetch では設定できません。Node.js では https.Agent の rejectUnauthorized: false が必要です。",
      );
    } else if (token === "--oauth2-bearer") {
      idx++;
      result.headers["Authorization"] = `Bearer ${tokens[idx] ?? ""}`;
    } else if (
      token === "-s" ||
      token === "--silent" ||
      token === "-v" ||
      token === "--verbose" ||
      token === "-i" ||
      token === "--include" ||
      token === "-I" ||
      token === "--head" ||
      token === "-f" ||
      token === "--fail" ||
      token === "-o" ||
      token === "--output" ||
      token === "-w" ||
      token === "--write-out" ||
      token === "--retry" ||
      token === "--max-time" ||
      token === "-m" ||
      token === "--connect-timeout" ||
      token === "--limit-rate" ||
      token === "-c" ||
      token === "--cookie-jar"
    ) {
      // 値を持つフラグ or 値不要なフラグをスキップ
      if (token === "-I" || token === "--head") {
        result.method = "HEAD";
        hasExplicitMethod = true;
      }
      const valueFlags = [
        "-o",
        "--output",
        "-w",
        "--write-out",
        "--retry",
        "--max-time",
        "-m",
        "--connect-timeout",
        "--limit-rate",
        "-c",
        "--cookie-jar",
      ];
      if (valueFlags.includes(token)) {
        idx++; // 値をスキップ
      }
    } else if (!token.startsWith("-")) {
      // URL の候補（クォートなし、フラグでない）
      if (!result.url) {
        result.url = token;
      }
    } else {
      // 未知のフラグ：次のトークンが値かもしれないのでスキップ候補
      // ここでは安全のため値をスキップしない
    }

    idx++;
  }

  return { parsed: result, warnings };
}

/**
 * 文字列内のシングルクォートをエスケープする
 *
 * @param s 元の文字列
 * @returns エスケープ済み文字列
 */
function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * ヘッダーオブジェクトの文字列表現を生成する（インデント付き）
 *
 * @param headers ヘッダーオブジェクト
 * @param indent インデント文字列
 * @returns コード文字列
 */
function buildHeadersCode(headers: Record<string, string>, indent: string): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) return "";
  const lines = entries.map(([k, v]) => `${indent}  '${k}': '${escapeStr(v)}'`);
  return `${indent}headers: {\n${lines.join(",\n")},\n${indent}}`;
}

/**
 * ボディの文字列表現を生成する
 *
 * JSON形式の場合は JSON.stringify() 呼び出しに変換する。
 *
 * @param body リクエストボディ
 * @param indent インデント文字列
 * @param mode 'fetch' | 'axios'
 * @returns コード文字列
 */
function buildBodyCode(body: string, indent: string, mode: "fetch" | "axios"): string {
  // JSON として解析を試みる
  try {
    const parsed = JSON.parse(body);
    const jsonStr = JSON.stringify(parsed, null, 2)
      .split("\n")
      .join("\n" + indent + "  ");
    if (mode === "axios") {
      return `${indent}data: ${jsonStr}`;
    }
    return `${indent}body: JSON.stringify(${jsonStr})`;
  } catch {
    // JSON でなければ文字列として扱う
    if (mode === "axios") {
      return `${indent}data: '${escapeStr(body)}'`;
    }
    return `${indent}body: '${escapeStr(body)}'`;
  }
}

/**
 * 解析済みcURLデータを fetch() コードに変換する
 *
 * @param parsed 解析済みcURLデータ
 * @param opts 変換オプション
 * @returns 生成されたコード
 */
export function toFetchCode(parsed: ParsedCurl, opts: ConvertOptions): string {
  const { method, url, headers, body, followRedirects } = parsed;
  const indent = "  ";
  const lines: string[] = [];

  // init オブジェクトのプロパティを収集
  const initProps: string[] = [];

  if (method !== "GET") {
    initProps.push(`${indent}method: '${method}'`);
  }

  const headerCode = buildHeadersCode(headers, indent);
  if (headerCode) initProps.push(headerCode);

  if (body !== null) {
    initProps.push(buildBodyCode(body, indent, "fetch"));
  }

  if (followRedirects) {
    initProps.push(`${indent}redirect: 'follow'`);
  }

  const displayUrl = url || "https://example.com/api";
  const typeAnnotation = opts.typescript ? ": Response" : "";

  if (initProps.length === 0) {
    lines.push(`const response${typeAnnotation} = await fetch('${displayUrl}');`);
  } else {
    lines.push(`const response${typeAnnotation} = await fetch('${displayUrl}', {`);
    for (let i = 0; i < initProps.length; i++) {
      lines.push(initProps[i] + (i < initProps.length - 1 ? "," : ","));
    }
    lines.push("});");
  }

  lines.push("");
  lines.push("if (!response.ok) {");
  lines.push(`${indent}throw new Error(\`HTTP error! status: \${response.status}\`);`);
  lines.push("}");
  lines.push("");
  lines.push("const data = await response.json();");
  lines.push("console.log(data);");

  return lines.join("\n");
}

/**
 * 解析済みcURLデータを axios コードに変換する
 *
 * @param parsed 解析済みcURLデータ
 * @param opts 変換オプション
 * @returns 生成されたコード
 */
export function toAxiosCode(parsed: ParsedCurl, opts: ConvertOptions): string {
  const { method, url, headers, body } = parsed;
  const indent = "  ";
  const lines: string[] = [];

  // axios のインポート
  lines.push("import axios from 'axios';");
  lines.push("");

  const configProps: string[] = [];
  const displayUrl = url || "https://example.com/api";

  configProps.push(`${indent}method: '${method.toLowerCase()}'`);
  configProps.push(`${indent}url: '${displayUrl}'`);

  const headerCode = buildHeadersCode(headers, indent);
  if (headerCode) configProps.push(headerCode);

  if (body !== null) {
    configProps.push(buildBodyCode(body, indent, "axios"));
  }

  const typeAnnotation = opts.typescript ? "<unknown>" : "";

  lines.push(`const response = await axios${typeAnnotation}({`);
  for (let i = 0; i < configProps.length; i++) {
    lines.push(configProps[i] + (i < configProps.length - 1 ? "," : ","));
  }
  lines.push("});");
  lines.push("");
  lines.push("console.log(response.data);");

  return lines.join("\n");
}

/**
 * cURLコマンドを指定のライブラリコードに変換する
 *
 * @param command cURLコマンド文字列
 * @param opts 変換オプション
 * @returns 変換結果（コードと警告メッセージ）
 */
export function convertCurl(command: string, opts: ConvertOptions): ConvertResult {
  if (!command.trim()) {
    return { code: "", warnings: [] };
  }

  const { parsed, warnings } = parseCurl(command);

  const code = opts.mode === "axios" ? toAxiosCode(parsed, opts) : toFetchCode(parsed, opts);

  return { code, warnings };
}
