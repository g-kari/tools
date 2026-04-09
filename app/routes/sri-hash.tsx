import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback, type DragEvent } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import "../styles/tools/sri-hash.css";
import {
  computeAllSriHashes,
  computeAllSriHashesFromBytes,
  generateHtmlSnippet,
  formatFileSize,
  type SriAlgorithm,
  type SriResult,
  type CrossoriginValue,
} from "../utils/sri-hash";

export const Route = createFileRoute("/sri-hash")({
  head: () => ({
    meta: [
      { title: "SRI ハッシュ生成 | Web ツール集" },
      {
        name: "description",
        content:
          "Subresource Integrity (SRI) ハッシュをブラウザ内で生成するツール。SHA-256/384/512 に対応し、script・link タグ用の integrity 属性値と HTML スニペットを即座に生成。CDN リソースの改ざん検知に役立てます。",
      },
      { property: "og:title", content: "SRI ハッシュ生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "Subresource Integrity (SRI) ハッシュをブラウザ内で生成するツール。SHA-256/384/512 に対応し、integrity 属性値と HTML スニペットを生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sri-hash` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "SRI ハッシュ生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Subresource Integrity (SRI) ハッシュをブラウザ内で生成するツール。SHA-256/384/512 対応。",
      },
    ],
  }),
  component: SriHashGenerator,
});

/** SRI アルゴリズム情報 */
const SRI_ALGORITHMS: { key: SriAlgorithm; label: string; recommended?: boolean }[] = [
  { key: "sha256", label: "SHA-256" },
  { key: "sha384", label: "SHA-384", recommended: true },
  { key: "sha512", label: "SHA-512" },
];

/**
 * SRI Hash Generator コンポーネント
 * テキストまたはファイルから integrity 属性値と HTML スニペットを生成する
 */
function SriHashGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sriResults, setSriResults] = useState<SriResult[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState<"script" | "stylesheet">("script");
  const [crossorigin, setCrossorigin] = useState<CrossoriginValue>("anonymous");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const computeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // テキスト入力変更時にハッシュを計算（デバウンス付き）
  useEffect(() => {
    if (inputMode !== "text") return;

    if (computeTimerRef.current) {
      clearTimeout(computeTimerRef.current);
    }

    if (!inputText) {
      setSriResults([]);
      return;
    }

    computeTimerRef.current = setTimeout(async () => {
      setIsComputing(true);
      try {
        const results = await computeAllSriHashes(inputText);
        setSriResults(results);
      } finally {
        setIsComputing(false);
      }
    }, 150);

    return () => {
      if (computeTimerRef.current) {
        clearTimeout(computeTimerRef.current);
      }
    };
  }, [inputText, inputMode]);

  // ファイル選択時にハッシュを計算
  useEffect(() => {
    if (inputMode !== "file" || !selectedFile) {
      if (inputMode === "file") setSriResults([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      setIsComputing(true);
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const results = await computeAllSriHashesFromBytes(data);
        setSriResults(results);
        announceStatus("ファイルの SRI ハッシュ計算が完了しました");
      } finally {
        setIsComputing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, inputMode, announceStatus]);

  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSelectedFile(file);
    setSriResults([]);
  }, []);

  const handleFileDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      if (!value) return;
      const success = await copy(value);
      if (success) {
        showToast(`${label} をコピーしました`, "success");
        announceStatus(`${label} をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus],
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setSriResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleInputModeChange = useCallback((mode: "text" | "file") => {
    setInputMode(mode);
    setSriResults([]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const hasInput = inputMode === "text" ? inputText.length > 0 : selectedFile !== null;
  const hasResults = sriResults.length > 0 && !isComputing;

  // 推奨アルゴリズム（SHA-384）のintegrity値
  const recommendedIntegrity = sriResults.find((r) => r.algorithm === "sha384")?.integrity ?? "";

  return (
    <>
      <div className="tool-container">
        {/* 入力モード切り替えタブ */}
        <div className="sri-input-tabs" role="tablist" aria-label="入力モード">
          <button
            role="tab"
            aria-selected={inputMode === "text"}
            className={`sri-input-tab ${inputMode === "text" ? "active" : ""}`}
            onClick={() => handleInputModeChange("text")}
          >
            テキスト
          </button>
          <button
            role="tab"
            aria-selected={inputMode === "file"}
            className={`sri-input-tab ${inputMode === "file" ? "active" : ""}`}
            onClick={() => handleInputModeChange("file")}
          >
            ファイル
          </button>
        </div>

        {/* テキスト入力 */}
        {inputMode === "text" && (
          <div className="converter-section">
            <label htmlFor="sri-text-input" className="section-title">
              リソースのコンテンツ
            </label>
            <textarea
              id="sri-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="JS または CSS のコンテンツを貼り付けてください..."
              rows={6}
              aria-describedby="sri-text-hint"
            />
            <p id="sri-text-hint" className="text-case-hint">
              入力するとリアルタイムで SHA-256 / SHA-384 / SHA-512 の SRI ハッシュが生成されます
            </p>
          </div>
        )}

        {/* ファイル入力 */}
        {inputMode === "file" && (
          <div className="converter-section">
            <span className="section-title">ファイル選択</span>

            <div
              className={`sri-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="ファイルをドロップするか、クリックして選択"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <span className="sri-dropzone-label" aria-hidden="true">
                <span className="sri-dropzone-icon">📂</span>
                <span>ファイルをドロップ</span>
                <span className="sri-dropzone-hint">またはクリックして選択（.js / .css など）</span>
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              aria-label="ファイルを選択"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFileSelect(Array.from(files));
                }
              }}
            />

            {selectedFile && (
              <div className="sri-file-info" role="status">
                <span className="sri-file-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className="sri-file-size">{formatFileSize(selectedFile.size)}</span>
                <button
                  className="sri-file-clear-btn"
                  onClick={handleClearFile}
                  aria-label="ファイルをクリア"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* SRI ハッシュ結果 */}
        {hasInput ? (
          <div className="sri-results" role="list" aria-label="SRI ハッシュ生成結果">
            {SRI_ALGORITHMS.map((algo) => {
              const result = sriResults.find((r) => r.algorithm === algo.key);
              const integrityValue = result?.integrity ?? "";
              const isEmpty = !integrityValue || isComputing;

              return (
                <div
                  key={algo.key}
                  className="sri-result-item"
                  role="listitem"
                  aria-label={`${algo.label} SRI ハッシュ`}
                >
                  <div className="sri-result-header">
                    <span className="sri-result-algo">{algo.label}</span>
                    {algo.recommended && (
                      <span
                        className="sri-result-recommended"
                        title="SRI に推奨されるアルゴリズムです"
                        aria-label="推奨"
                      >
                        推奨
                      </span>
                    )}
                  </div>
                  <div className="sri-result-value-row">
                    <code
                      className={`sri-result-value ${isEmpty ? "sri-result-value-empty" : ""}`}
                      aria-live="polite"
                    >
                      {isComputing
                        ? "計算中..."
                        : isEmpty
                          ? "（入力してください）"
                          : integrityValue}
                    </code>
                    <button
                      className="sri-copy-btn"
                      onClick={() => handleCopy(integrityValue, `${algo.label} integrity`)}
                      disabled={isEmpty}
                      aria-label={`${algo.label} の integrity 値をコピー`}
                    >
                      コピー
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="sri-empty-state" aria-live="polite">
            <p>
              {inputMode === "text"
                ? "JS/CSS のコンテンツを入力すると SRI ハッシュが生成されます"
                : "ファイルを選択すると SRI ハッシュが計算されます"}
            </p>
          </div>
        )}

        {/* HTML スニペット生成 */}
        {hasResults && (
          <div className="converter-section">
            <h2 className="section-title">HTML スニペット生成</h2>

            {/* リソース URL */}
            <div className="form-field">
              <label htmlFor="sri-url" className="form-label">
                リソース URL（任意）
              </label>
              <input
                id="sri-url"
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://cdn.example.com/script.js"
                aria-describedby="sri-url-hint"
              />
              <p id="sri-url-hint" className="text-case-hint">
                省略すると例示 URL が使用されます
              </p>
            </div>

            {/* リソース種別 */}
            <div className="form-field">
              <span className="form-label">リソース種別</span>
              <div className="sri-crossorigin-group" role="radiogroup" aria-label="リソース種別">
                <label className="sri-radio-label">
                  <input
                    type="radio"
                    name="resource-type"
                    value="script"
                    checked={resourceType === "script"}
                    onChange={() => setResourceType("script")}
                    aria-label="JavaScript (script タグ)"
                  />
                  {"<script>"}
                </label>
                <label className="sri-radio-label">
                  <input
                    type="radio"
                    name="resource-type"
                    value="stylesheet"
                    checked={resourceType === "stylesheet"}
                    onChange={() => setResourceType("stylesheet")}
                    aria-label="CSS (link タグ)"
                  />
                  {'<link rel="stylesheet">'}
                </label>
              </div>
            </div>

            {/* crossorigin 属性 */}
            <div className="form-field">
              <span className="form-label">crossorigin 属性</span>
              <div
                className="sri-crossorigin-group"
                role="radiogroup"
                aria-label="crossorigin 属性"
              >
                <label className="sri-radio-label">
                  <input
                    type="radio"
                    name="crossorigin"
                    value="anonymous"
                    checked={crossorigin === "anonymous"}
                    onChange={() => setCrossorigin("anonymous")}
                    aria-label="anonymous（認証情報なし）"
                  />
                  anonymous
                </label>
                <label className="sri-radio-label">
                  <input
                    type="radio"
                    name="crossorigin"
                    value="use-credentials"
                    checked={crossorigin === "use-credentials"}
                    onChange={() => setCrossorigin("use-credentials")}
                    aria-label="use-credentials（認証情報あり）"
                  />
                  use-credentials
                </label>
              </div>
            </div>

            {/* スニペット一覧 */}
            <div className="sri-snippet-section" aria-label="生成された HTML スニペット">
              {SRI_ALGORITHMS.map((algo) => {
                const result = sriResults.find((r) => r.algorithm === algo.key);
                if (!result) return null;

                const snippet = generateHtmlSnippet({
                  url: resourceUrl,
                  integrity: result.integrity,
                  crossorigin,
                  resourceType,
                });

                return (
                  <div key={algo.key} className="sri-snippet-block">
                    <div className="sri-snippet-header">
                      <span className="sri-snippet-title">
                        {algo.label}
                        {algo.recommended ? " （推奨）" : ""}
                      </span>
                      <button
                        className="sri-copy-btn"
                        onClick={() => handleCopy(snippet, `${algo.label} スニペット`)}
                        aria-label={`${algo.label} の HTML スニペットをコピー`}
                      >
                        コピー
                      </button>
                    </div>
                    <code className="sri-snippet-code">{snippet}</code>
                  </div>
                );
              })}
            </div>

            {/* 推奨 integrity 値のワンクリックコピー */}
            {recommendedIntegrity && (
              <div className="form-field">
                <span className="form-label">推奨 integrity 値（SHA-384）</span>
                <div className="sri-result-value-row">
                  <code className="sri-result-value">{recommendedIntegrity}</code>
                  <button
                    className="sri-copy-btn"
                    onClick={() => handleCopy(recommendedIntegrity, "推奨 integrity 値")}
                    aria-label="推奨 integrity 値をコピー"
                  >
                    コピー
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "SRI とは",
              items: [
                "Subresource Integrity（SRI）は、CDN などから取得する外部リソースが改ざんされていないか検証する仕組みです",
                "HTML の <script> や <link> タグに integrity 属性を追加することで、ブラウザがリソースのハッシュを検証します",
                "改ざんを検知した場合、ブラウザはリソースの実行をブロックします",
              ],
            },
            {
              title: "使い方",
              items: [
                "「テキスト」タブ: JS/CSS の内容を貼り付けてリアルタイムでハッシュを生成",
                "「ファイル」タブ: ファイルをドロップまたは選択してハッシュを計算",
                "「HTML スニペット生成」でリソース URL・種別・crossorigin を設定して完成タグを取得",
                "各 integrity 値の「コピー」ボタンでクリップボードにコピー",
              ],
            },
            {
              title: "アルゴリズム選択",
              items: [
                "SHA-384（推奨）: セキュリティと実装の広さのバランスが最も良い",
                "SHA-256: 短いハッシュ値が必要な場合に使用",
                "SHA-512: 最高レベルのセキュリティが必要な場合に使用",
                "MDN では SHA-384 が推奨されています",
              ],
            },
            {
              title: "注意事項",
              items: [
                "ハッシュ計算はブラウザ内で行われ、データはサーバーに送信されません",
                "SRI を有効にするには crossorigin 属性も必須です（CDN の CORS 設定も必要）",
                "ファイルが更新された際は integrity 値を再生成してください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
