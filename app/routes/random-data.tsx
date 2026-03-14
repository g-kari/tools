import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import {
  generateRandomData,
  FIELD_CONFIGS,
  type FieldType,
  type OutputFormat,
  type NumberOptions,
  type DateOptions,
} from "~/utils/random-data";

export const Route = createFileRoute("/random-data")({
  head: () => ({
    meta: [
      { title: "ランダムデータ生成ツール | Web ツール集" },
      {
        name: "description",
        content:
          "開発・テスト用のランダムデータを生成します。氏名・メール・電話番号・住所・UUID・IPアドレスなど様々な形式に対応。JSON/CSV/TSV出力。",
      },
      { property: "og:title", content: "ランダムデータ生成ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "開発・テスト用のランダムデータを生成します。氏名・メール・電話番号・住所・UUID・IPアドレスなど様々な形式に対応。JSON/CSV/TSV出力。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/random-data` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ランダムデータ生成ツール | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "開発・テスト用のランダムデータを生成します。氏名・メール・電話番号・住所・UUID・IPアドレスなど様々な形式に対応。JSON/CSV/TSV出力。",
      },
    ],
  }),
  component: RandomDataPage,
});

/** プレビュー用の行データ型 */
type PreviewRow = Record<string, string | number>;

/** ランダムデータジェネレーターページコンポーネント */
function RandomDataPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const [selectedFields, setSelectedFields] = useState<FieldType[]>([
    "japaneseName",
    "email",
    "japanesePhone",
    "japaneseAddress",
  ]);
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>("json");
  const [numberOptions, setNumberOptions] = useState<NumberOptions>({
    min: 1,
    max: 100,
  });
  const [dateOptions, setDateOptions] = useState<DateOptions>({
    startYear: 2000,
    endYear: 2025,
  });
  const [output, setOutput] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);

  const handleFieldToggle = useCallback((type: FieldType) => {
    setSelectedFields((prev) =>
      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFields(FIELD_CONFIGS.map((c) => c.type));
  }, []);

  const handleClearFields = useCallback(() => {
    setSelectedFields([]);
  }, []);

  const handleGenerate = useCallback(() => {
    if (selectedFields.length === 0) {
      showToast("フィールドを1つ以上選択してください", "error");
      return;
    }

    const result = generateRandomData({
      fields: selectedFields,
      count,
      format,
      numberOptions,
      dateOptions,
    });

    setOutput(result);

    // JSON形式の場合はプレビューを更新（最大10行）
    if (format === "json" && result) {
      try {
        const parsed = JSON.parse(result) as PreviewRow[];
        setPreviewRows(parsed.slice(0, 10));
      } catch {
        setPreviewRows([]);
      }
    } else {
      setPreviewRows([]);
    }

    showToast(`${count}件のデータを生成しました`, "success");
  }, [selectedFields, count, format, numberOptions, dateOptions, showToast]);

  const handleCopy = useCallback(async () => {
    if (!output) {
      showToast("コピーするデータがありません", "error");
      return;
    }
    const success = await copy(output);
    if (success) {
      showToast("クリップボードにコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, showToast]);

  const handleDownload = useCallback(() => {
    if (!output) {
      showToast("ダウンロードするデータがありません", "error");
      return;
    }
    const extensionMap: Record<OutputFormat, string> = {
      json: "json",
      csv: "csv",
      tsv: "tsv",
    };
    const mimeMap: Record<OutputFormat, string> = {
      json: "application/json",
      csv: "text/csv",
      tsv: "text/tab-separated-values",
    };
    const ext = extensionMap[format];
    const mime = mimeMap[format];
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `random-data.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("ダウンロードを開始しました", "success");
  }, [output, format, showToast]);

  // Ctrl+Enter で生成
  useKeyboardShortcut("Enter", handleGenerate, { ctrl: true });

  // プレビューテーブルのヘッダーキー一覧
  const previewHeaders =
    previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <div className="tool-container">
      {/* フィールド選択セクション */}
      <div className="converter-section">
        <h2 className="section-title">フィールド選択</h2>
        <div className="random-data-field-section">
          <div className="random-data-settings-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSelectAll}
              aria-label="すべてのフィールドを選択"
            >
              すべて選択
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClearFields}
              aria-label="フィールド選択をクリア"
            >
              クリア
            </button>
          </div>
          <div
            className="random-data-field-grid"
            role="group"
            aria-label="生成するフィールドを選択"
          >
            {FIELD_CONFIGS.map((config) => {
              const isSelected = selectedFields.includes(config.type);
              return (
                <label
                  key={config.type}
                  className={`random-data-field-item${isSelected ? " selected" : ""}`}
                  htmlFor={`field-${config.type}`}
                >
                  <span className="random-data-field-label">
                    <input
                      id={`field-${config.type}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFieldToggle(config.type)}
                      aria-label={config.label}
                    />
                    {config.label}
                  </span>
                  <span className="random-data-field-desc">
                    {config.description}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 生成設定セクション */}
      <div className="converter-section">
        <h2 className="section-title">生成設定</h2>
        <div className="random-data-settings-row">
          <div className="random-data-settings-group">
            <label htmlFor="random-data-count">
              件数（1〜100）
            </label>
            <input
              id="random-data-count"
              type="number"
              className="random-data-count-input"
              min={1}
              max={100}
              value={count}
              onChange={(e) =>
                setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
              }
              aria-label="生成件数"
            />
          </div>
          <div className="random-data-settings-group">
            <label htmlFor="random-data-format">
              フォーマット
            </label>
            <select
              id="random-data-format"
              className="random-data-format-select"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as OutputFormat);
                setPreviewRows([]);
              }}
              aria-label="出力フォーマットを選択"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="tsv">TSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* 数値範囲設定（numberフィールド選択時のみ表示） */}
      {selectedFields.includes("number") && (
        <div className="converter-section">
          <h2 className="section-title">数値範囲設定</h2>
          <div className="random-data-range-settings">
            <div className="random-data-range-row">
              <label htmlFor="number-min">最小値</label>
              <input
                id="number-min"
                type="number"
                className="random-data-range-input"
                value={numberOptions.min}
                onChange={(e) =>
                  setNumberOptions((prev) => ({
                    ...prev,
                    min: parseInt(e.target.value) || 0,
                  }))
                }
                aria-label="数値の最小値"
              />
              <label htmlFor="number-max">最大値</label>
              <input
                id="number-max"
                type="number"
                className="random-data-range-input"
                value={numberOptions.max}
                onChange={(e) =>
                  setNumberOptions((prev) => ({
                    ...prev,
                    max: parseInt(e.target.value) || 100,
                  }))
                }
                aria-label="数値の最大値"
              />
            </div>
          </div>
        </div>
      )}

      {/* 日付範囲設定（dateフィールド選択時のみ表示） */}
      {selectedFields.includes("date") && (
        <div className="converter-section">
          <h2 className="section-title">日付範囲設定</h2>
          <div className="random-data-range-settings">
            <div className="random-data-range-row">
              <label htmlFor="date-start-year">開始年</label>
              <input
                id="date-start-year"
                type="number"
                className="random-data-range-input"
                min={1900}
                max={2100}
                value={dateOptions.startYear}
                onChange={(e) =>
                  setDateOptions((prev) => ({
                    ...prev,
                    startYear: parseInt(e.target.value) || 2000,
                  }))
                }
                aria-label="日付の開始年"
              />
              <label htmlFor="date-end-year">終了年</label>
              <input
                id="date-end-year"
                type="number"
                className="random-data-range-input"
                min={1900}
                max={2100}
                value={dateOptions.endYear}
                onChange={(e) =>
                  setDateOptions((prev) => ({
                    ...prev,
                    endYear: parseInt(e.target.value) || 2025,
                  }))
                }
                aria-label="日付の終了年"
              />
            </div>
          </div>
        </div>
      )}

      {/* 生成ボタン */}
      <div className="converter-section">
        <button
          type="button"
          className="random-data-generate-btn"
          onClick={handleGenerate}
          aria-label="ランダムデータを生成（Ctrl+Enter）"
        >
          生成（Ctrl+Enter）
        </button>
      </div>

      {/* プレビューテーブル（JSON形式のみ） */}
      {output && format === "json" && previewRows.length > 0 && (
        <div className="converter-section">
          <h2 className="section-title">
            プレビュー（最大10件）
          </h2>
          <div className="random-data-preview-wrapper">
            <table
              className="random-data-preview-table"
              aria-label="生成データプレビュー"
            >
              <thead>
                <tr>
                  {previewHeaders.map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {previewHeaders.map((header) => (
                      <td key={header}>{String(row[header] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 出力エリア */}
      {output && (
        <div className="converter-section random-data-output-section">
          <div className="random-data-action-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              aria-label="生成データをクリップボードにコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="random-data-download-btn"
              onClick={handleDownload}
              aria-label={`${format.toUpperCase()}ファイルとしてダウンロード`}
            >
              ダウンロード（.{format}）
            </button>
          </div>
          <textarea
            className="random-data-output-area"
            value={output}
            readOnly
            aria-label="生成されたランダムデータ"
            aria-live="polite"
          />
        </div>
      )}

      {/* TipsCard */}
      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "生成したいフィールドをチェックボックスで選択（複数選択可）",
              "件数（1〜100件）と出力フォーマット（JSON/CSV/TSV）を設定",
              "「数値」フィールドを選択すると数値範囲を設定できます",
              "「日付」フィールドを選択すると年の範囲を設定できます",
              "「生成」ボタンまたは Ctrl+Enter でデータを生成",
              "「コピー」でクリップボードに、「ダウンロード」でファイル保存",
            ],
          },
          {
            title: "対応フィールド",
            items: [
              "日本語氏名・英語氏名・メールアドレス・電話番号（日本）",
              "住所（日本）・会社名・UUID v4",
              "数値（範囲指定）・日付（YYYY-MM-DD）・Lorem Ipsumテキスト",
              "カラーコード（#RRGGBB）・IPv4/IPv6アドレス・MACアドレス",
              "暗号学的に安全な乱数（crypto.getRandomValues）を使用",
            ],
          },
        ]}
      />
    </div>
  );
}
