import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  useState,
  useCallback,
  useRef,
  type DragEvent,
} from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import {
  parseHar,
  analyzeHar,
  formatBytes,
  formatDuration,
  getStatusCategory,
  getContentTypeLabel,
  type HarFile,
  type HarAnalysis,
  type HarEntry,
} from "~/utils/har";

export const Route = createFileRoute("/har")({
  head: () => ({
    meta: [
      { title: "HAR アナライザー | Web ツール集" },
      {
        name: "description",
        content:
          "ブラウザDevToolsからエクスポートしたHARファイルを解析。リクエスト一覧・レスポンスサイズ・タイミング・ステータス別統計を可視化。遅いリクエストや大きなリソースを素早く特定できる。",
      },
      { property: "og:title", content: "HAR アナライザー | Web ツール集" },
      {
        property: "og:description",
        content:
          "ブラウザDevToolsからエクスポートしたHARファイルを解析。リクエスト一覧・レスポンスサイズ・タイミング・ステータス別統計を可視化。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/har` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "HAR アナライザー | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ブラウザDevToolsからエクスポートしたHARファイルを解析。リクエスト一覧・レスポンスサイズ・タイミング・ステータス別統計を可視化。",
      },
    ],
  }),
  component: HarAnalyzer,
});

/** ソートキー */
type SortKey = "index" | "time" | "size";

/** ソート方向 */
type SortOrder = "asc" | "desc";

/**
 * ステータスコードに対応するCSSクラスを返す
 * @param status - HTTPステータスコード
 */
function getStatusClass(status: number): string {
  const category = getStatusCategory(status);
  if (category === "success") return "har-status-2xx";
  if (category === "redirect") return "har-status-3xx";
  if (category === "client-error") return "har-status-4xx";
  if (category === "server-error") return "har-status-5xx";
  return "";
}

/**
 * HTTPメソッドに対応するCSSクラスを返す
 * @param method - HTTPメソッド文字列
 */
function getMethodClass(method: string): string {
  const m = method.toUpperCase();
  if (m === "GET") return "har-method-get";
  if (m === "POST") return "har-method-post";
  if (m === "PUT") return "har-method-put";
  if (m === "DELETE") return "har-method-delete";
  if (m === "PATCH") return "har-method-patch";
  return "har-method-other";
}

/**
 * HAR アナライザーコンポーネント
 * HARファイルをドラッグ&ドロップまたはクリックでアップロードし、
 * リクエストの統計・一覧を表示する
 */
function HarAnalyzer() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [harFile, setHarFile] = useState<HarFile | null>(null);
  const [analysis, setAnalysis] = useState<HarAnalysis | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // フィルター状態
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterContentType, setFilterContentType] = useState<string>("all");

  // ソート状態
  const [sortKey, setSortKey] = useState<SortKey>("index");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** ファイルを読み込んでHARを解析する */
  const loadFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".har")) {
        showToast("拡張子が .har のファイルを選択してください", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = parseHar(text);
          const result = analyzeHar(parsed);
          setHarFile(parsed);
          setAnalysis(result);
          setFileName(file.name);
          setFileSize(file.size);
          setFilterMethod("all");
          setFilterStatus("all");
          setFilterContentType("all");
          setSortKey("index");
          setSortOrder("asc");
          announceStatus(
            `HARファイルを読み込みました。${result.totalRequests}件のリクエストが見つかりました。`
          );
        } catch (err) {
          showToast(
            err instanceof Error
              ? err.message
              : "HARファイルの解析に失敗しました",
            "error"
          );
        }
      };
      reader.readAsText(file);
    },
    [showToast, announceStatus]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleZoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    []
  );

  const handleClear = useCallback(() => {
    setHarFile(null);
    setAnalysis(null);
    setFileName("");
    setFileSize(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleSortChange = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortOrder("desc");
      }
    },
    [sortKey]
  );

  // コンテンツタイプ一覧（フィルター用）
  const contentTypeOptions =
    analysis ? Object.keys(analysis.contentTypeDistribution).sort() : [];

  // エントリーのフィルタリングとソート
  const filteredEntries: { entry: HarEntry; originalIndex: number }[] = [];
  if (harFile) {
    harFile.log.entries.forEach((entry, idx) => {
      if (
        filterMethod !== "all" &&
        entry.request.method.toUpperCase() !== filterMethod
      )
        return;
      if (filterStatus !== "all") {
        const statusGroup = `${Math.floor(entry.response.status / 100)}xx`;
        if (statusGroup !== filterStatus) return;
      }
      if (filterContentType !== "all") {
        const label = getContentTypeLabel(entry.response.content.mimeType ?? "");
        if (label !== filterContentType) return;
      }
      filteredEntries.push({ entry, originalIndex: idx + 1 });
    });
  }

  // ソート
  if (sortKey !== "index") {
    filteredEntries.sort((a, b) => {
      let va = 0;
      let vb = 0;
      if (sortKey === "time") {
        va = a.entry.time ?? 0;
        vb = b.entry.time ?? 0;
      } else if (sortKey === "size") {
        va = a.entry.response.content.size ?? 0;
        vb = b.entry.response.content.size ?? 0;
      }
      return sortOrder === "asc" ? va - vb : vb - va;
    });
  } else if (sortOrder === "desc") {
    filteredEntries.reverse();
  }

  // タイミング最大値（バー表示用）
  const maxTime =
    harFile
      ? Math.max(...harFile.log.entries.map((e) => e.time ?? 0), 1)
      : 1;

  const sortIcon = (key: SortKey): string => {
    if (sortKey !== key) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <>
      <div className="tool-container">
        <h2 className="tool-title">HAR アナライザー</h2>
        <p className="tool-description">
          ブラウザの開発者ツールからエクスポートした .har
          ファイルを解析し、リクエスト一覧・サイズ・タイミングを可視化します。
        </p>

        {/* ファイルアップロードゾーン */}
        {!harFile && (
          <div
            className={`har-upload-zone${isDragging ? " dragging" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="HARファイルをドロップするか、クリックして選択"
            onClick={handleZoneClick}
            onKeyDown={handleZoneKeyDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="har-upload-zone-icon" aria-hidden="true">
              📊
            </span>
            <span className="har-upload-zone-text">
              .har ファイルをドロップ
            </span>
            <span className="har-upload-zone-hint">
              またはクリックして選択
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".har"
          className="sr-only"
          aria-label="HARファイルを選択"
          onChange={handleFileChange}
        />

        {/* ファイル情報とクリアボタン */}
        {harFile && analysis && (
          <>
            <div className="har-file-info" role="status">
              <span className="har-file-name" title={fileName}>
                {fileName}
              </span>
              <span className="har-file-size">{formatBytes(fileSize)}</span>
              <button
                className="har-clear-btn"
                onClick={handleClear}
                aria-label="HARファイルをクリアして最初に戻る"
              >
                クリア
              </button>
            </div>

            {/* サマリーグリッド */}
            <div
              className="har-summary-grid"
              role="region"
              aria-label="解析サマリー"
            >
              <div className="har-summary-card">
                <div className="har-summary-card-value">
                  {analysis.totalRequests}
                </div>
                <div className="har-summary-card-label">リクエスト数</div>
              </div>
              <div className="har-summary-card">
                <div className="har-summary-card-value">
                  {formatBytes(analysis.totalSize)}
                </div>
                <div className="har-summary-card-label">総サイズ</div>
              </div>
              <div className="har-summary-card">
                <div className="har-summary-card-value">
                  {formatBytes(analysis.totalTransferSize)}
                </div>
                <div className="har-summary-card-label">転送サイズ</div>
              </div>
              <div className="har-summary-card">
                <div className="har-summary-card-value">
                  {formatDuration(analysis.totalTime)}
                </div>
                <div className="har-summary-card-label">総時間</div>
              </div>
              <div
                className={`har-summary-card${analysis.errorCount > 0 ? " har-summary-card-error" : ""}`}
              >
                <div className="har-summary-card-value">
                  {analysis.errorCount}
                </div>
                <div className="har-summary-card-label">エラー数</div>
              </div>
            </div>

            {/* フィルターバー */}
            <div
              className="har-filter-bar"
              role="group"
              aria-label="リクエストフィルター"
            >
              <label className="har-filter-label" htmlFor="filter-method">
                メソッド
              </label>
              <select
                id="filter-method"
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                aria-label="メソッドフィルター"
              >
                <option value="all">すべて</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>

              <label className="har-filter-label" htmlFor="filter-status">
                ステータス
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="ステータスフィルター"
              >
                <option value="all">すべて</option>
                <option value="2xx">2xx 成功</option>
                <option value="3xx">3xx リダイレクト</option>
                <option value="4xx">4xx クライアントエラー</option>
                <option value="5xx">5xx サーバーエラー</option>
              </select>

              {contentTypeOptions.length > 0 && (
                <>
                  <label
                    className="har-filter-label"
                    htmlFor="filter-content-type"
                  >
                    種別
                  </label>
                  <select
                    id="filter-content-type"
                    value={filterContentType}
                    onChange={(e) => setFilterContentType(e.target.value)}
                    aria-label="コンテンツタイプフィルター"
                  >
                    <option value="all">すべて</option>
                    {contentTypeOptions.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <span className="har-filter-count" aria-live="polite">
                {filteredEntries.length} / {analysis.totalRequests} 件
              </span>
            </div>

            {/* リクエストテーブル */}
            {filteredEntries.length > 0 ? (
              <div className="har-table-wrapper" role="region" aria-label="リクエスト一覧">
                <table className="har-table" aria-label="HARリクエスト一覧">
                  <thead>
                    <tr>
                      <th
                        className={`sortable${sortKey === "index" ? " sorted" : ""}`}
                        onClick={() => handleSortChange("index")}
                        aria-sort={
                          sortKey === "index"
                            ? sortOrder === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        #
                        <span className="har-sort-icon" aria-hidden="true">
                          {sortIcon("index")}
                        </span>
                      </th>
                      <th>メソッド</th>
                      <th>URL</th>
                      <th>ステータス</th>
                      <th>種別</th>
                      <th>サイズ</th>
                      <th
                        className={`sortable${sortKey === "time" ? " sorted" : ""}`}
                        onClick={() => handleSortChange("time")}
                        aria-sort={
                          sortKey === "time"
                            ? sortOrder === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        時間
                        <span className="har-sort-icon" aria-hidden="true">
                          {sortIcon("time")}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map(({ entry, originalIndex }) => {
                      const status = entry.response.status;
                      const method = entry.request.method;
                      const url = entry.request.url;
                      const contentSize = entry.response.content.size ?? 0;
                      const time = entry.time ?? 0;
                      const mimeType = entry.response.content.mimeType ?? "";
                      const typeLabel = getContentTypeLabel(mimeType);
                      const timePercent = Math.min(
                        (time / maxTime) * 100,
                        100
                      );

                      return (
                        <tr key={originalIndex}>
                          <td className="har-num-cell">{originalIndex}</td>
                          <td>
                            <span
                              className={`har-method-badge ${getMethodClass(method)}`}
                            >
                              {method}
                            </span>
                          </td>
                          <td>
                            <span
                              className="har-url-cell"
                              title={url}
                            >
                              {url}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`har-status-badge ${getStatusClass(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>{typeLabel}</td>
                          <td>{formatBytes(contentSize)}</td>
                          <td>
                            <div className="har-timing-bar">
                              <div className="har-timing-bar-track">
                                <div
                                  className="har-timing-bar-fill"
                                  style={{ width: `${timePercent}%` }}
                                  role="presentation"
                                />
                              </div>
                              <span className="har-timing-bar-value">
                                {formatDuration(time)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="har-empty-state" aria-live="polite">
                <div className="har-empty-state-icon" aria-hidden="true">
                  🔍
                </div>
                <p>フィルター条件に一致するリクエストがありません</p>
              </div>
            )}
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "HARファイルのエクスポート方法",
              items: [
                "Chrome/Edge: 開発者ツール → Network タブ → 右クリック → Save all as HAR",
                "Firefox: 開発者ツール → ネットワーク → 歯車アイコン → すべてをHARとして保存",
                "Safari: 開発者ツール → ネットワーク → すべてをHARとして書き出す",
              ],
            },
            {
              title: "使い方",
              items: [
                ".har ファイルをドロップするか、クリックして選択してください",
                "メソッド・ステータス・種別でリクエストをフィルタリングできます",
                "時間・サイズのヘッダーをクリックするとソートできます",
                "解析はすべてブラウザ内で行われ、データは送信されません",
              ],
            },
            {
              title: "活用例",
              items: [
                "遅いAPIリクエストを「時間」列でソートして特定",
                "大きなリソースを「サイズ」列でソートして確認",
                "4xx/5xxでフィルタリングしてエラーのあるリクエストを検出",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
