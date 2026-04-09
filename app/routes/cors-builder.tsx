import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import "../styles/tools/cors-builder.css";

export const Route = createFileRoute("/cors-builder")({
  head: () => ({
    meta: [
      { title: "CORS ヘッダービルダー | Web ツール集" },
      {
        name: "description",
        content:
          "Cross-Origin Resource Sharing (CORS) ヘッダーをGUIで構築するツール。許可するオリジン・メソッド・ヘッダーを設定し、Access-Control-* ヘッダーを生成。Express・nginx・Apache・Cloudflare Workers 向けの設定コードも出力。",
      },
      { property: "og:title", content: "CORS ヘッダービルダー | Web ツール集" },
      {
        property: "og:description",
        content:
          "CORS ヘッダーをGUIで構築。許可オリジン・メソッド・ヘッダーを設定し、各種フレームワーク向けのコードを生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/cors-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "CORS ヘッダービルダー | Web ツール集" },
      {
        name: "twitter:description",
        content: "CORS ヘッダーをGUIで構築。各種フレームワーク向けのコードも生成。",
      },
    ],
  }),
  component: CorsBuilderPage,
});

/** オリジンモード */
type OriginMode = "wildcard" | "specific" | "list";

/** HTTPメソッド */
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

/** よく使うリクエストヘッダー */
const COMMON_REQUEST_HEADERS = [
  "Content-Type",
  "Authorization",
  "Accept",
  "X-Requested-With",
  "X-CSRF-Token",
  "X-API-Key",
  "Cache-Control",
];

/** よく使うレスポンスヘッダー（Expose用） */
const COMMON_EXPOSE_HEADERS = [
  "X-Request-Id",
  "X-Rate-Limit-Remaining",
  "X-Rate-Limit-Reset",
  "X-Total-Count",
  "Link",
];

/** CORSプリセット定義 */
interface CorsPreset {
  label: string;
  description: string;
  originMode: OriginMode;
  origins: string;
  methods: HttpMethod[];
  headers: string[];
  credentials: boolean;
  maxAge: number;
  exposeHeaders: string[];
}

const PRESETS: CorsPreset[] = [
  {
    label: "公開API",
    description: "誰でもアクセス可能なパブリックAPI",
    originMode: "wildcard",
    origins: "*",
    methods: ["GET", "POST", "OPTIONS"],
    headers: ["Content-Type", "Accept"],
    credentials: false,
    maxAge: 86400,
    exposeHeaders: [],
  },
  {
    label: "プライベートAPI",
    description: "特定オリジンのみ許可する認証付きAPI",
    originMode: "specific",
    origins: "https://example.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 3600,
    exposeHeaders: ["X-Request-Id"],
  },
  {
    label: "開発環境",
    description: "ローカル開発用（全許可）",
    originMode: "wildcard",
    origins: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    headers: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    credentials: false,
    maxAge: 0,
    exposeHeaders: [],
  },
];

/**
 * CORSヘッダーを生成する
 */
export function buildCorsHeaders(
  originMode: OriginMode,
  origins: string,
  methods: HttpMethod[],
  headers: string[],
  credentials: boolean,
  maxAge: number,
  exposeHeaders: string[],
): Record<string, string> {
  const result: Record<string, string> = {};

  // Access-Control-Allow-Origin
  if (originMode === "wildcard") {
    result["Access-Control-Allow-Origin"] = "*";
  } else if (originMode === "specific") {
    const trimmed = origins.trim();
    if (trimmed) result["Access-Control-Allow-Origin"] = trimmed;
  } else {
    // list mode: use first origin as representative (runtime must reflect)
    const list = origins
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
    if (list.length > 0) {
      result["Access-Control-Allow-Origin"] = list[0];
      result["Vary"] = "Origin";
    }
  }

  // Access-Control-Allow-Methods
  if (methods.length > 0) {
    result["Access-Control-Allow-Methods"] = methods.join(", ");
  }

  // Access-Control-Allow-Headers
  if (headers.length > 0) {
    result["Access-Control-Allow-Headers"] = headers.join(", ");
  }

  // Access-Control-Allow-Credentials
  if (credentials) {
    result["Access-Control-Allow-Credentials"] = "true";
  }

  // Access-Control-Max-Age
  if (maxAge > 0) {
    result["Access-Control-Max-Age"] = String(maxAge);
  }

  // Access-Control-Expose-Headers
  if (exposeHeaders.length > 0) {
    result["Access-Control-Expose-Headers"] = exposeHeaders.join(", ");
  }

  return result;
}

/**
 * Express.js 向けコードを生成する
 */
export function generateExpressCode(
  originMode: OriginMode,
  origins: string,
  methods: HttpMethod[],
  headers: string[],
  credentials: boolean,
  maxAge: number,
  exposeHeaders: string[],
): string {
  const originList =
    originMode === "list"
      ? origins
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

  const originValue =
    originMode === "wildcard"
      ? "'*'"
      : originList
        ? `[${originList.map((o) => `'${o}'`).join(", ")}]`
        : `'${origins.trim()}'`;

  const lines = [
    `import cors from 'cors';`,
    ``,
    `app.use(cors({`,
    `  origin: ${originValue},`,
    `  methods: [${methods.map((m) => `'${m}'`).join(", ")}],`,
    `  allowedHeaders: [${headers.map((h) => `'${h}'`).join(", ")}],`,
  ];

  if (credentials) lines.push(`  credentials: true,`);
  if (maxAge > 0) lines.push(`  maxAge: ${maxAge},`);
  if (exposeHeaders.length > 0) {
    lines.push(`  exposedHeaders: [${exposeHeaders.map((h) => `'${h}'`).join(", ")}],`);
  }

  lines.push(`}));`);
  return lines.join("\n");
}

/**
 * nginx 向けコードを生成する
 */
export function generateNginxCode(
  originMode: OriginMode,
  origins: string,
  methods: HttpMethod[],
  headers: string[],
  credentials: boolean,
  maxAge: number,
  exposeHeaders: string[],
): string {
  const originList =
    originMode === "list"
      ? origins
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

  const lines: string[] = ["# nginx CORS 設定", "location / {"];

  if (originMode === "wildcard") {
    lines.push(`  add_header 'Access-Control-Allow-Origin' '*' always;`);
  } else if (originList && originList.length > 1) {
    lines.push(`  # 複数オリジンは map を使用`);
    lines.push(`  # http ブロックに以下を追加:`);
    lines.push(`  # map $http_origin $cors_origin {`);
    originList.forEach((o) => lines.push(`  #   ${o} $http_origin;`));
    lines.push(`  # }`);
    lines.push(`  add_header 'Access-Control-Allow-Origin' $cors_origin always;`);
    lines.push(`  add_header 'Vary' 'Origin' always;`);
  } else {
    lines.push(`  add_header 'Access-Control-Allow-Origin' '${origins.trim()}' always;`);
  }

  lines.push(`  add_header 'Access-Control-Allow-Methods' '${methods.join(", ")}' always;`);
  if (headers.length > 0) {
    lines.push(`  add_header 'Access-Control-Allow-Headers' '${headers.join(", ")}' always;`);
  }
  if (credentials) {
    lines.push(`  add_header 'Access-Control-Allow-Credentials' 'true' always;`);
  }
  if (maxAge > 0) {
    lines.push(`  add_header 'Access-Control-Max-Age' '${maxAge}' always;`);
  }
  if (exposeHeaders.length > 0) {
    lines.push(
      `  add_header 'Access-Control-Expose-Headers' '${exposeHeaders.join(", ")}' always;`,
    );
  }

  lines.push(``, `  if ($request_method = 'OPTIONS') {`);
  lines.push(`    return 204;`);
  lines.push(`  }`);
  lines.push(`}`);
  return lines.join("\n");
}

/**
 * Cloudflare Workers 向けコードを生成する
 */
export function generateWorkersCode(
  originMode: OriginMode,
  origins: string,
  methods: HttpMethod[],
  headers: string[],
  credentials: boolean,
  maxAge: number,
  exposeHeaders: string[],
): string {
  const originList =
    originMode === "list"
      ? origins
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

  const lines = [
    `export default {`,
    `  async fetch(request: Request): Promise<Response> {`,
    `    const origin = request.headers.get('Origin') ?? '';`,
    ``,
  ];

  if (originMode === "wildcard") {
    lines.push(`    const allowedOrigin = '*';`);
  } else if (originList && originList.length > 1) {
    lines.push(`    const allowedOrigins = [${originList.map((o) => `'${o}'`).join(", ")}];`);
    lines.push(`    const allowedOrigin = allowedOrigins.includes(origin) ? origin : '';`);
  } else {
    lines.push(`    const allowedOrigin = '${origins.trim()}';`);
  }

  lines.push(
    ``,
    `    const corsHeaders = {`,
    `      'Access-Control-Allow-Origin': allowedOrigin,`,
    `      'Access-Control-Allow-Methods': '${methods.join(", ")}',`,
    `      'Access-Control-Allow-Headers': '${headers.join(", ")}',`,
  );

  if (credentials) {
    lines.push(`      'Access-Control-Allow-Credentials': 'true',`);
  }
  if (maxAge > 0) {
    lines.push(`      'Access-Control-Max-Age': '${maxAge}',`);
  }
  if (exposeHeaders.length > 0) {
    lines.push(`      'Access-Control-Expose-Headers': '${exposeHeaders.join(", ")}',`);
  }

  lines.push(
    `    };`,
    ``,
    `    if (request.method === 'OPTIONS') {`,
    `      return new Response(null, { status: 204, headers: corsHeaders });`,
    `    }`,
    ``,
    `    // 通常のレスポンスにCORSヘッダーを付加`,
    `    const response = await handleRequest(request);`,
    `    const newResponse = new Response(response.body, response);`,
    `    Object.entries(corsHeaders).forEach(([k, v]) => newResponse.headers.set(k, v));`,
    `    return newResponse;`,
    `  },`,
    `};`,
  );

  return lines.join("\n");
}

/** CORSビルダーページ */
function CorsBuilderPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  // オリジン設定
  const [originMode, setOriginMode] = useState<OriginMode>("wildcard");
  const [origins, setOrigins] = useState("");

  // メソッド設定
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>(["GET", "POST", "OPTIONS"]);

  // ヘッダー設定
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>(["Content-Type"]);
  const [customHeader, setCustomHeader] = useState("");

  // クレデンシャル
  const [credentials, setCredentials] = useState(false);

  // Max-Age
  const [maxAge, setMaxAge] = useState(86400);
  const [enableMaxAge, setEnableMaxAge] = useState(true);

  // Expose-Headers
  const [selectedExposeHeaders, setSelectedExposeHeaders] = useState<string[]>([]);
  const [customExposeHeader, setCustomExposeHeader] = useState("");

  // 出力タブ
  const [activeTab, setActiveTab] = useState<"headers" | "express" | "nginx" | "workers">(
    "headers",
  );

  /** メソッドのトグル */
  const toggleMethod = useCallback((method: HttpMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  }, []);

  /** ヘッダーのトグル */
  const toggleHeader = useCallback((header: string) => {
    setSelectedHeaders((prev) =>
      prev.includes(header) ? prev.filter((h) => h !== header) : [...prev, header],
    );
  }, []);

  /** カスタムヘッダーの追加 */
  const addCustomHeader = useCallback(() => {
    const trimmed = customHeader.trim();
    if (!trimmed) return;
    if (!selectedHeaders.includes(trimmed)) {
      setSelectedHeaders((prev) => [...prev, trimmed]);
    }
    setCustomHeader("");
  }, [customHeader, selectedHeaders]);

  /** Expose-Headersのトグル */
  const toggleExposeHeader = useCallback((header: string) => {
    setSelectedExposeHeaders((prev) =>
      prev.includes(header) ? prev.filter((h) => h !== header) : [...prev, header],
    );
  }, []);

  /** カスタムExpose-Headerの追加 */
  const addCustomExposeHeader = useCallback(() => {
    const trimmed = customExposeHeader.trim();
    if (!trimmed) return;
    if (!selectedExposeHeaders.includes(trimmed)) {
      setSelectedExposeHeaders((prev) => [...prev, trimmed]);
    }
    setCustomExposeHeader("");
  }, [customExposeHeader, selectedExposeHeaders]);

  /** プリセット適用 */
  const applyPreset = useCallback((preset: CorsPreset) => {
    setOriginMode(preset.originMode);
    setOrigins(preset.origins);
    setSelectedMethods(preset.methods);
    setSelectedHeaders(preset.headers);
    setCredentials(preset.credentials);
    setMaxAge(preset.maxAge);
    setEnableMaxAge(preset.maxAge > 0);
    setSelectedExposeHeaders(preset.exposeHeaders);
  }, []);

  const effectiveMaxAge = enableMaxAge ? maxAge : 0;

  /** 生成されたヘッダー */
  const corsHeaders = useMemo(
    () =>
      buildCorsHeaders(
        originMode,
        origins,
        selectedMethods,
        selectedHeaders,
        credentials,
        effectiveMaxAge,
        selectedExposeHeaders,
      ),
    [
      originMode,
      origins,
      selectedMethods,
      selectedHeaders,
      credentials,
      effectiveMaxAge,
      selectedExposeHeaders,
    ],
  );

  /** 出力テキスト */
  const outputText = useMemo(() => {
    if (activeTab === "headers") {
      return Object.entries(corsHeaders)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }
    if (activeTab === "express") {
      return generateExpressCode(
        originMode,
        origins,
        selectedMethods,
        selectedHeaders,
        credentials,
        effectiveMaxAge,
        selectedExposeHeaders,
      );
    }
    if (activeTab === "nginx") {
      return generateNginxCode(
        originMode,
        origins,
        selectedMethods,
        selectedHeaders,
        credentials,
        effectiveMaxAge,
        selectedExposeHeaders,
      );
    }
    return generateWorkersCode(
      originMode,
      origins,
      selectedMethods,
      selectedHeaders,
      credentials,
      effectiveMaxAge,
      selectedExposeHeaders,
    );
  }, [
    activeTab,
    corsHeaders,
    originMode,
    origins,
    selectedMethods,
    selectedHeaders,
    credentials,
    effectiveMaxAge,
    selectedExposeHeaders,
  ]);

  /** コピー処理 */
  const handleCopy = useCallback(async () => {
    await copy(outputText);
    showToast("コピーしました", "success");
  }, [copy, outputText, showToast]);

  /** credentials と wildcard の競合警告 */
  const credentialsWarning = credentials && originMode === "wildcard";

  return (
    <div className="tool-container">
      <h1 className="tool-title">CORS ヘッダービルダー</h1>
      <p className="tool-description">
        Cross-Origin Resource Sharing (CORS) ヘッダーをGUIで構築します。
        許可するオリジン・メソッド・ヘッダーを設定し、各種フレームワーク向けのコードを生成します。
      </p>

      {/* プリセット */}
      <section className="cors-section" aria-labelledby="cors-presets-heading">
        <h2 id="cors-presets-heading" className="cors-section-title">
          プリセット
        </h2>
        <div className="cors-presets-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="cors-preset-btn"
              onClick={() => applyPreset(preset)}
            >
              <span className="cors-preset-label">{preset.label}</span>
              <span className="cors-preset-desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* オリジン設定 */}
      <section className="cors-section" aria-labelledby="cors-origin-heading">
        <h2 id="cors-origin-heading" className="cors-section-title">
          Access-Control-Allow-Origin
        </h2>
        <div className="cors-origin-modes">
          {(
            [
              { value: "wildcard", label: "ワイルドカード (*)", hint: "全オリジンを許可" },
              { value: "specific", label: "特定オリジン", hint: "1つのオリジンを指定" },
              { value: "list", label: "オリジンリスト", hint: "複数オリジン（実行時に動的判定）" },
            ] as const
          ).map((mode) => (
            <label key={mode.value} className="cors-radio-label">
              <input
                type="radio"
                name="originMode"
                value={mode.value}
                checked={originMode === mode.value}
                onChange={() => setOriginMode(mode.value)}
              />
              <span className="cors-radio-text">
                <span className="cors-radio-title">{mode.label}</span>
                <span className="cors-radio-hint">{mode.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {originMode === "specific" && (
          <input
            type="text"
            className="cors-input"
            placeholder="https://example.com"
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            aria-label="許可するオリジン"
          />
        )}
        {originMode === "list" && (
          <textarea
            className="cors-textarea"
            placeholder={"https://example.com\nhttps://app.example.com"}
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            rows={3}
            aria-label="許可するオリジンリスト（1行1オリジン）"
          />
        )}
        {credentialsWarning && (
          <p className="cors-warning" role="alert">
            ⚠ <strong>警告:</strong> <code>Access-Control-Allow-Credentials: true</code> と{" "}
            <code>Access-Control-Allow-Origin: *</code> の組み合わせはブラウザに拒否されます。
            クレデンシャルを使用する場合は特定オリジンを指定してください。
          </p>
        )}
      </section>

      {/* メソッド設定 */}
      <section className="cors-section" aria-labelledby="cors-methods-heading">
        <h2 id="cors-methods-heading" className="cors-section-title">
          Access-Control-Allow-Methods
        </h2>
        <div className="cors-methods-grid" role="group" aria-label="許可するHTTPメソッド">
          {HTTP_METHODS.map((method) => (
            <label key={method} className="cors-checkbox-label">
              <input
                type="checkbox"
                checked={selectedMethods.includes(method)}
                onChange={() => toggleMethod(method)}
                aria-label={`${method} を許可`}
              />
              <span className={`cors-method-badge cors-method-${method.toLowerCase()}`}>
                {method}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* ヘッダー設定 */}
      <section className="cors-section" aria-labelledby="cors-headers-heading">
        <h2 id="cors-headers-heading" className="cors-section-title">
          Access-Control-Allow-Headers
        </h2>
        <div className="cors-checkboxes" role="group" aria-label="許可するリクエストヘッダー">
          {COMMON_REQUEST_HEADERS.map((header) => (
            <label key={header} className="cors-checkbox-label">
              <input
                type="checkbox"
                checked={selectedHeaders.includes(header)}
                onChange={() => toggleHeader(header)}
              />
              <code>{header}</code>
            </label>
          ))}
          {selectedHeaders
            .filter((h) => !COMMON_REQUEST_HEADERS.includes(h))
            .map((header) => (
              <label key={header} className="cors-checkbox-label cors-custom-item">
                <input type="checkbox" checked onChange={() => toggleHeader(header)} />
                <code>{header}</code>
                <span className="cors-custom-badge">カスタム</span>
              </label>
            ))}
        </div>
        <div className="cors-add-row">
          <input
            type="text"
            className="cors-input cors-input-sm"
            placeholder="カスタムヘッダー名"
            value={customHeader}
            onChange={(e) => setCustomHeader(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomHeader()}
            aria-label="カスタムリクエストヘッダーを追加"
          />
          <button type="button" className="btn-secondary" onClick={addCustomHeader}>
            追加
          </button>
        </div>
      </section>

      {/* クレデンシャル */}
      <section className="cors-section" aria-labelledby="cors-credentials-heading">
        <h2 id="cors-credentials-heading" className="cors-section-title">
          Access-Control-Allow-Credentials
        </h2>
        <label className="cors-checkbox-label">
          <input
            type="checkbox"
            checked={credentials}
            onChange={(e) => setCredentials(e.target.checked)}
          />
          <span>Cookie・Authorization ヘッダーなどのクレデンシャルを含むリクエストを許可する</span>
        </label>
      </section>

      {/* Max-Age */}
      <section className="cors-section" aria-labelledby="cors-maxage-heading">
        <h2 id="cors-maxage-heading" className="cors-section-title">
          Access-Control-Max-Age
        </h2>
        <label className="cors-checkbox-label">
          <input
            type="checkbox"
            checked={enableMaxAge}
            onChange={(e) => setEnableMaxAge(e.target.checked)}
          />
          <span>プリフライトキャッシュを有効にする</span>
        </label>
        {enableMaxAge && (
          <div className="cors-maxage-row">
            <input
              type="number"
              className="cors-input cors-input-sm"
              value={maxAge}
              min={0}
              max={86400}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              aria-label="Max-Age（秒）"
            />
            <span className="cors-maxage-hint">
              秒{maxAge >= 3600 && ` (${Math.round(maxAge / 3600)}時間)`}
              {maxAge > 0 && maxAge < 3600 && ` (${Math.round(maxAge / 60)}分)`}
            </span>
            <div className="cors-maxage-presets">
              {[
                { label: "1時間", value: 3600 },
                { label: "1日", value: 86400 },
                { label: "1週間", value: 604800 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="cors-tag-btn"
                  onClick={() => setMaxAge(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Expose-Headers */}
      <section className="cors-section" aria-labelledby="cors-expose-heading">
        <h2 id="cors-expose-heading" className="cors-section-title">
          Access-Control-Expose-Headers <span className="cors-optional">(任意)</span>
        </h2>
        <p className="cors-hint-text">
          ブラウザのJavaScriptから読み取れるレスポンスヘッダーを指定します。
        </p>
        <div className="cors-checkboxes" role="group" aria-label="公開するレスポンスヘッダー">
          {COMMON_EXPOSE_HEADERS.map((header) => (
            <label key={header} className="cors-checkbox-label">
              <input
                type="checkbox"
                checked={selectedExposeHeaders.includes(header)}
                onChange={() => toggleExposeHeader(header)}
              />
              <code>{header}</code>
            </label>
          ))}
          {selectedExposeHeaders
            .filter((h) => !COMMON_EXPOSE_HEADERS.includes(h))
            .map((header) => (
              <label key={header} className="cors-checkbox-label cors-custom-item">
                <input type="checkbox" checked onChange={() => toggleExposeHeader(header)} />
                <code>{header}</code>
                <span className="cors-custom-badge">カスタム</span>
              </label>
            ))}
        </div>
        <div className="cors-add-row">
          <input
            type="text"
            className="cors-input cors-input-sm"
            placeholder="カスタムヘッダー名"
            value={customExposeHeader}
            onChange={(e) => setCustomExposeHeader(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomExposeHeader()}
            aria-label="カスタム公開ヘッダーを追加"
          />
          <button type="button" className="btn-secondary" onClick={addCustomExposeHeader}>
            追加
          </button>
        </div>
      </section>

      {/* 出力 */}
      <section className="cors-section cors-output-section" aria-labelledby="cors-output-heading">
        <div className="cors-output-header">
          <h2 id="cors-output-heading" className="cors-section-title">
            生成結果
          </h2>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopy}
            aria-label="生成結果をコピー"
          >
            コピー
          </button>
        </div>

        {/* タブ */}
        <div className="cors-tabs" role="tablist" aria-label="出力形式">
          {(
            [
              { id: "headers", label: "HTTPヘッダー" },
              { id: "express", label: "Express.js" },
              { id: "nginx", label: "nginx" },
              { id: "workers", label: "CF Workers" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`cors-tab ${activeTab === tab.id ? "cors-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ヘッダー一覧（バッジ表示） */}
        {activeTab === "headers" && (
          <div className="cors-headers-list">
            {Object.entries(corsHeaders).length === 0 ? (
              <p className="cors-empty">設定を選択するとヘッダーが生成されます。</p>
            ) : (
              Object.entries(corsHeaders).map(([name, value]) => (
                <div key={name} className="cors-header-row">
                  <span className="cors-header-name">{name}:</span>
                  <span className="cors-header-value">{value}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* コードブロック */}
        {activeTab !== "headers" && (
          <pre className="cors-code-block">
            <code>{outputText}</code>
          </pre>
        )}
      </section>

      <TipsCard
        tips={[
          "CORSプリフライトリクエスト（OPTIONS）は必ずメソッドに含めてください。",
          "credentials: true を使う場合、Access-Control-Allow-Origin にワイルドカード * は使えません。",
          "Access-Control-Max-Age でプリフライトをキャッシュすると、不要なOPTIONSリクエストを削減できます。",
          "開発環境ではワイルドカードを使っても問題ありませんが、本番環境では必ず特定のオリジンを指定してください。",
          "Cloudflare Workersではリクエストごとにオリジンを動的に確認するロジックが必要です。",
        ]}
      />
    </div>
  );
}
