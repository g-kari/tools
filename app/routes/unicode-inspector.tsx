import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  analyzeText,
  countByCategory,
  filterChars,
  type CharInfo,
} from "~/utils/unicode-inspector";
import "~/styles/tools/unicode-inspector.css";

export const Route = createFileRoute("/unicode-inspector")({
  head: () => ({
    meta: [
      { title: "Unicodeコードポイント検査 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストを入力すると各文字のUnicodeコードポイント・UTF-8バイト列・UTF-16コードユニット・HTMLエンティティ・カテゴリをリアルタイムで表示するツール。絵文字・漢字・特殊文字の解析に便利。",
      },
      { property: "og:title", content: "Unicodeコードポイント検査 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストを入力すると各文字のUnicodeコードポイント・UTF-8バイト列・UTF-16コードユニット・HTMLエンティティ・カテゴリをリアルタイムで表示するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/unicode-inspector` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Unicodeコードポイント検査 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "各文字のUnicodeコードポイント・UTF-8バイト列・HTMLエンティティをリアルタイムで表示するツール。",
      },
    ],
  }),
  component: UnicodeInspector,
});

/** 1ページあたりの表示件数 */
const PAGE_SIZE = 50;
/** 解析可能な最大文字数 */
const MAX_CHARS = 1000;

/** 制御文字の略称マップ */
const CONTROL_ABBR: Record<number, string> = {
  0: "NUL",
  1: "SOH",
  2: "STX",
  3: "ETX",
  4: "EOT",
  5: "ENQ",
  6: "ACK",
  7: "BEL",
  8: "BS",
  9: "HT",
  10: "LF",
  11: "VT",
  12: "FF",
  13: "CR",
  14: "SO",
  15: "SI",
  16: "DLE",
  17: "DC1",
  18: "DC2",
  19: "DC3",
  20: "DC4",
  21: "NAK",
  22: "SYN",
  23: "ETB",
  24: "CAN",
  25: "EM",
  26: "SUB",
  27: "ESC",
  28: "FS",
  29: "GS",
  30: "RS",
  31: "US",
  32: "SP",
  127: "DEL",
};

/** 文字プレビューコンポーネント */
function CharPreview({ info }: { info: CharInfo }) {
  const abbr = CONTROL_ABBR[info.codePoint];
  if (abbr || info.category === "Control") {
    return (
      <span
        className="uchi-char-preview uchi-char-control"
        aria-label={`制御文字: ${info.codePointHex}`}
        title={`制御文字 (${info.codePointHex})`}
      >
        {abbr ?? "CTRL"}
      </span>
    );
  }
  if (info.category === "Separator" && info.codePoint !== 0x20) {
    return (
      <span
        className="uchi-char-preview uchi-char-control"
        aria-label={`区切り文字: ${info.codePointHex}`}
        title={`区切り文字 (${info.codePointHex})`}
      >
        SEP
      </span>
    );
  }
  return (
    <span className="uchi-char-preview" aria-label={`文字: ${info.char}`} lang="und">
      {info.char}
    </span>
  );
}

/** テーブル行コンポーネント */
function CharRow({
  info,
  index,
  onCopy,
}: {
  info: CharInfo;
  index: number;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <tr className="uchi-table-row" aria-rowindex={index + 2}>
      {/* # */}
      <td className="uchi-mono-muted">{index + 1}</td>

      {/* 文字プレビュー */}
      <td>
        <CharPreview info={info} />
      </td>

      {/* コードポイント */}
      <td>
        <div className="uchi-codepoint-row">
          <span className="uchi-codepoint">{info.codePointHex}</span>
          <button
            type="button"
            className="uchi-copy-btn"
            onClick={() => onCopy(info.codePointHex, "コードポイント")}
            aria-label={`${info.codePointHex} をコピー`}
            title="コードポイントをコピー"
          >
            📋
          </button>
        </div>
        <div className="uchi-codepoint-decimal">{info.codePoint}</div>
      </td>

      {/* UTF-8 */}
      <td>
        <div className="uchi-bytes">
          {info.utf8Bytes.map((b, i) => (
            <span key={i} className="uchi-byte-chip">
              {b}
            </span>
          ))}
        </div>
      </td>

      {/* UTF-16 */}
      <td>
        <div className="uchi-bytes">
          {info.utf16Units.map((u, i) => (
            <span key={i} className="uchi-byte-chip">
              {u}
            </span>
          ))}
          {info.isSurrogatePair && (
            <span className="uchi-surrogate-label" title="サロゲートペア（補助文字）">
              SP
            </span>
          )}
        </div>
      </td>

      {/* HTMLエンティティ */}
      <td>
        <div className="uchi-entity-row">
          {info.namedEntity ? (
            <span className="uchi-entity uchi-entity-named">{info.namedEntity}</span>
          ) : (
            <span className="uchi-entity">{info.numericEntity}</span>
          )}
          <button
            type="button"
            className="uchi-copy-btn"
            onClick={() => onCopy(info.namedEntity ?? info.numericEntity, "HTMLエンティティ")}
            aria-label={`${info.namedEntity ?? info.numericEntity} をコピー`}
            title="HTMLエンティティをコピー"
          >
            📋
          </button>
        </div>
      </td>

      {/* カテゴリ */}
      <td>
        <span className={`uchi-category-badge uchi-category-${info.category}`}>
          {info.categoryLabel}
        </span>
      </td>
    </tr>
  );
}

/** Unicodeコードポイント検査メインコンポーネント */
function UnicodeInspector() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputText, setInputText] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(0);

  // テキスト解析（上限あり）
  const allChars = useMemo(() => {
    if (!inputText) return [];
    const truncated = [...inputText].slice(0, MAX_CHARS).join("");
    return analyzeText(truncated);
  }, [inputText]);

  // フィルタリング
  const filteredChars = useMemo(() => filterChars(allChars, filterQuery), [allChars, filterQuery]);

  // ページネーション
  const totalPages = Math.max(1, Math.ceil(filteredChars.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageChars = filteredChars.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // カテゴリ集計
  const categoryStats = useMemo(() => countByCategory(allChars), [allChars]);

  const handleCopy = useCallback(
    async (value: string, label: string) => {
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

  const handleClear = useCallback(() => {
    setInputText("");
    setFilterQuery("");
    setPage(0);
    announceStatus("入力をクリアしました");
    textareaRef.current?.focus();
  }, [announceStatus]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(e.target.value);
    setPage(0);
  }, []);

  const isTruncated = [...inputText].length > MAX_CHARS;

  return (
    <>
      <div className="tool-container">
        <div className="uchi-container">
          {/* テキスト入力 */}
          <div className="uchi-input-section">
            <label htmlFor="uchi-text-input" className="uchi-input-label">
              解析するテキスト
            </label>
            <textarea
              id="uchi-text-input"
              ref={textareaRef}
              className="uchi-textarea"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setPage(0);
              }}
              placeholder="テキスト、絵文字、漢字など何でも貼り付けてください..."
              aria-describedby="uchi-input-hint"
              rows={4}
              autoFocus
            />
            <p id="uchi-input-hint" className="uchi-input-hint">
              最大 {MAX_CHARS.toLocaleString()} 文字まで解析できます
            </p>
          </div>

          {/* 上限超過警告 */}
          {isTruncated && (
            <div className="uchi-limit-notice" role="alert">
              <span aria-hidden="true">⚠️</span>
              入力が {MAX_CHARS.toLocaleString()} 文字を超えているため、最初の{" "}
              {MAX_CHARS.toLocaleString()} 文字のみ解析しています
            </div>
          )}

          {/* 統計バー */}
          {allChars.length > 0 && (
            <div className="uchi-stats-bar" role="status" aria-label="文字統計" aria-live="polite">
              <div className="uchi-stat-chip">
                <span className="uchi-stat-chip-label">合計</span>
                <span className="uchi-stat-chip-value">
                  {allChars.length.toLocaleString()} 文字
                </span>
              </div>
              {[...categoryStats.entries()].map(([label, count]) => (
                <div key={label} className="uchi-stat-chip">
                  <span className="uchi-stat-chip-label">{label}</span>
                  <span className="uchi-stat-chip-value">{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* ツールバー（フィルター＋クリア） */}
          {allChars.length > 0 && (
            <div className="uchi-toolbar">
              <input
                type="text"
                className="uchi-filter-input"
                value={filterQuery}
                onChange={handleFilterChange}
                placeholder="文字・U+XXXX・カテゴリで絞り込み..."
                aria-label="文字を絞り込み"
              />
              <span className="uchi-count-label" aria-live="polite">
                {filteredChars.length.toLocaleString()} 件
              </span>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                aria-label="入力と絞り込みをクリア"
              >
                クリア
              </button>
            </div>
          )}

          {/* テーブル or 空の状態 */}
          {allChars.length === 0 ? (
            <div className="uchi-empty-state" aria-live="polite">
              <span className="uchi-empty-icon" aria-hidden="true">
                🔍
              </span>
              <p>テキストを入力するとUnicode情報が表示されます</p>
              <p className="uchi-empty-hint">
                絵文字・漢字・制御文字など、あらゆる文字を解析できます
              </p>
            </div>
          ) : filteredChars.length === 0 ? (
            <div className="uchi-empty-state" aria-live="polite">
              <span className="uchi-empty-icon" aria-hidden="true">
                🔎
              </span>
              <p>「{filterQuery}」に一致する文字が見つかりません</p>
            </div>
          ) : (
            <>
              <div className="uchi-table-wrapper">
                <table
                  className="uchi-table"
                  aria-label="Unicode文字情報テーブル"
                  aria-rowcount={filteredChars.length + 1}
                >
                  <thead className="uchi-table-head">
                    <tr aria-rowindex={1}>
                      <th scope="col" className="uchi-th-index">
                        #
                      </th>
                      <th scope="col" className="uchi-th-char">
                        文字
                      </th>
                      <th scope="col">コードポイント</th>
                      <th scope="col">UTF-8</th>
                      <th scope="col">UTF-16</th>
                      <th scope="col">HTMLエンティティ</th>
                      <th scope="col">カテゴリ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageChars.map((info, i) => (
                      <CharRow
                        key={`${currentPage}-${i}`}
                        info={info}
                        index={currentPage * PAGE_SIZE + i}
                        onCopy={handleCopy}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="uchi-pagination" role="navigation" aria-label="ページ移動">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    aria-label="前のページ"
                  >
                    ← 前へ
                  </button>
                  <span className="uchi-page-info" aria-live="polite">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    aria-label="次のページ"
                  >
                    次へ →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "このツールについて",
              items: [
                "テキストの各文字を1コードポイント単位で分解してUnicode情報を表示します",
                "絵文字（😀）はサロゲートペア（2つのUTF-16コードユニット）として表現されます",
                "漢字・ひらがな・カタカナはUTF-8で3バイト（0xE3〜）を使用します",
                "ASCII文字（英数字）はUTF-8で1バイト（0x00〜0x7F）です",
                "HTMLエンティティ列は名前付き（&amp; 等）がある場合はそちらを優先表示します",
              ],
            },
            {
              title: "コードポイント表記",
              items: [
                "U+0041 → ラテン大文字 A（UTF-8: 0x41 / UTF-16: 0x0041）",
                "U+3042 → ひらがな「あ」（UTF-8: 0xE3 0x81 0x82）",
                "U+1F600 → 😀（UTF-8: 4バイト / UTF-16: サロゲートペア）",
                "U+0000〜U+001F → 制御文字（NUL, LF, CR, TAB など）",
                "U+D800〜U+DFFF → サロゲート領域（単体では無効）",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
