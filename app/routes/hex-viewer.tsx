import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, type DragEvent } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  toHexRows,
  toHexDumpText,
  textToBytes,
  formatFileSize,
  DEFAULT_HEX_OPTIONS,
  type HexViewerOptions,
  type HexRow,
} from "~/utils/hex-viewer";

export const Route = createFileRoute("/hex-viewer")({
  head: () => ({
    meta: [
      { title: "Hex Viewer | Web ツール集" },
      {
        name: "description",
        content:
          "テキストやファイルを16進数（hex）ダンプ形式で表示するツール。バイナリデータの解析、ファイルヘッダーの確認、プロトコルデバッグに活用できます。",
      },
      { property: "og:title", content: "Hex Viewer | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストやファイルを16進数（hex）ダンプ形式で表示するツール。バイナリデータの解析に活用できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/hex-viewer` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Hex Viewer | Web ツール集" },
      {
        name: "twitter:description",
        content: "テキストやファイルを16進数（hex）ダンプ形式で表示するツール。",
      },
    ],
  }),
  component: HexViewerPage,
});

/** バイト値の表示クラスを返す */
function getByteClass(byte: number): string {
  if (byte === 0x00) return "null-byte";
  if (byte >= 0x20 && byte <= 0x7e) return "ascii-printable";
  if (byte < 0x20 || byte === 0x7f) return "ascii-control";
  return "high-byte";
}

/** Hex ダンプテーブルのヘッダー */
function HexTableHeader({ bytesPerRow, uppercase }: { bytesPerRow: number; uppercase: boolean }) {
  return (
    <thead>
      <tr>
        <th className="offset-header">Offset</th>
        {Array.from({ length: bytesPerRow }, (_, i) => (
          <th key={i}>{byteIndexToHex(i, uppercase)}</th>
        ))}
        <th className="ascii-header">ASCII</th>
      </tr>
    </thead>
  );
}

function byteIndexToHex(i: number, uppercase: boolean): string {
  const s = i.toString(16).padStart(2, "0");
  return uppercase ? s.toUpperCase() : s;
}

/** 1行分の Hex ダンプ行 */
function HexTableRow({
  row,
  uppercase,
  rawData,
  bytesPerRow,
}: {
  row: HexRow;
  uppercase: boolean;
  rawData: Uint8Array;
  bytesPerRow: number;
}) {
  const offsetStr = row.offset.toString(16).padStart(8, "0");
  const displayOffset = uppercase ? offsetStr.toUpperCase() : offsetStr;

  return (
    <tr>
      <td className="hex-offset">{displayOffset}</td>
      {row.hexBytes.map((hex, i) => {
        const byteValue = rawData[row.offset + i];
        const isPadding = hex === "";
        return (
          <td key={i} className={`hex-byte ${isPadding ? "padding" : getByteClass(byteValue)}`}>
            {isPadding ? "\u00A0\u00A0" : hex}
          </td>
        );
      })}
      <td className="hex-ascii-cell">{row.ascii}</td>
    </tr>
  );
}

/**
 * Hex Viewer ツールコンポーネント
 * テキストまたはファイルを xxd 形式の16進数ダンプで表示する
 */
function HexViewerPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [options, setOptions] = useState<HexViewerOptions>({
    ...DEFAULT_HEX_OPTIONS,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表示データの決定
  const rawData: Uint8Array | null =
    inputMode === "text" && inputText
      ? textToBytes(inputText)
      : inputMode === "file"
        ? fileData
        : null;

  const hexRows: HexRow[] = rawData ? toHexRows(rawData, options) : [];
  const isTruncated = rawData ? rawData.length > options.maxBytes : false;

  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      setFileData(new Uint8Array(e.target.result as ArrayBuffer));
    };
    reader.readAsArrayBuffer(file);
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

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleInputModeChange = useCallback((mode: "text" | "file") => {
    setInputMode(mode);
    setSelectedFile(null);
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleCopyText = useCallback(async () => {
    if (!rawData) return;
    const text = toHexDumpText(rawData, options);
    const success = await copy(text);
    if (success) {
      showToast("Hexダンプをコピーしました", "success");
      announceStatus("Hexダンプをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [rawData, options, copy, showToast, announceStatus]);

  const hasData = rawData !== null && rawData.length > 0;

  return (
    <>
      <div className="tool-container">
        {/* 入力モード切り替えタブ */}
        <div className="hex-input-tabs" role="tablist" aria-label="入力モード">
          <button
            role="tab"
            aria-selected={inputMode === "text"}
            className={`hex-input-tab ${inputMode === "text" ? "active" : ""}`}
            onClick={() => handleInputModeChange("text")}
          >
            テキスト
          </button>
          <button
            role="tab"
            aria-selected={inputMode === "file"}
            className={`hex-input-tab ${inputMode === "file" ? "active" : ""}`}
            onClick={() => handleInputModeChange("file")}
          >
            ファイル
          </button>
        </div>

        {/* テキスト入力 */}
        {inputMode === "text" && (
          <div className="converter-section">
            <label htmlFor="hex-input" className="section-title">
              入力テキスト
            </label>
            <textarea
              id="hex-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="16進数ダンプで表示するテキストを入力してください..."
              rows={4}
              aria-describedby="hex-input-hint"
            />
            <p id="hex-input-hint" className="text-case-hint">
              UTF-8 エンコードのバイト列として表示されます
            </p>
          </div>
        )}

        {/* ファイル入力 */}
        {inputMode === "file" && (
          <div className="converter-section">
            <span className="section-title">ファイル選択</span>
            <div
              className={`hex-dropzone ${isDragging ? "dragging" : ""}`}
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
              <span className="hex-dropzone-label" aria-hidden="true">
                <span className="hex-dropzone-icon">📂</span>
                <span>ファイルをドロップ</span>
                <span className="hex-dropzone-hint">またはクリックして選択（最大 64KB 表示）</span>
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
              <div className="hex-file-info" role="status">
                <span className="hex-file-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className="hex-file-size">{formatFileSize(selectedFile.size)}</span>
                <button
                  className="hex-file-clear-btn"
                  onClick={handleClearFile}
                  aria-label="ファイルをクリア"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* オプションバー */}
        {hasData && (
          <div className="hex-options-bar" role="group" aria-label="表示オプション">
            <div className="hex-option-group">
              <span className="hex-option-label">1行のバイト数:</span>
              <select
                className="hex-option-select"
                value={options.bytesPerRow}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    bytesPerRow: Number(e.target.value) as 8 | 16 | 32,
                  }))
                }
                aria-label="1行のバイト数"
              >
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
              </select>
            </div>
            <label className="hex-option-checkbox-label">
              <input
                type="checkbox"
                checked={options.uppercase}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    uppercase: e.target.checked,
                  }))
                }
              />
              大文字表示
            </label>
          </div>
        )}

        {/* データ情報バー */}
        {hasData && (
          <div className="hex-info-bar" aria-label="データ情報">
            <div className="hex-info-item">
              <span>サイズ:</span>
              <span className="hex-info-value">{formatFileSize(rawData.length)}</span>
              <span>({rawData.length.toLocaleString()} バイト)</span>
            </div>
            <div className="hex-info-item">
              <span>行数:</span>
              <span className="hex-info-value">{hexRows.length}</span>
            </div>
          </div>
        )}

        {/* アクションバー */}
        {hasData && (
          <div className="hex-action-bar">
            <button
              className="btn-secondary"
              onClick={handleCopyText}
              aria-label="Hexダンプをテキストとしてコピー"
            >
              Hexダンプをコピー
            </button>
          </div>
        )}

        {/* Hexダンプテーブル */}
        {hasData ? (
          <div className="hex-dump-container" role="region" aria-label="Hexダンプ表示">
            <table className="hex-dump-table" aria-label="16進数ダンプ">
              <HexTableHeader bytesPerRow={options.bytesPerRow} uppercase={options.uppercase} />
              <tbody>
                {hexRows.map((row) => (
                  <HexTableRow
                    key={row.offset}
                    row={row}
                    uppercase={options.uppercase}
                    rawData={rawData}
                    bytesPerRow={options.bytesPerRow}
                  />
                ))}
              </tbody>
            </table>
            {isTruncated && (
              <div className="hex-truncated-notice" role="note">
                ⚠ 表示サイズ上限（64KB）に達したため、以降のデータは省略されています（合計:{" "}
                {formatFileSize(rawData.length)}）
              </div>
            )}
          </div>
        ) : (
          <div className="hex-empty-state" aria-live="polite">
            <p>
              {inputMode === "text"
                ? "テキストを入力すると16進数ダンプが表示されます"
                : "ファイルを選択すると16進数ダンプが表示されます"}
            </p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「テキスト」タブ: テキストを入力するとUTF-8バイト列としてhexダンプ表示",
                "「ファイル」タブ: ファイルをドロップまたは選択してhexダンプ表示（最大64KB）",
                "1行のバイト数は 8 / 16 / 32 から選択可能",
                "「大文字表示」で A-F を大文字にする",
                "「Hexダンプをコピー」でxxd形式のテキストをコピー",
              ],
            },
            {
              title: "色分けの意味",
              items: [
                "紫色: ASCII表示可能文字（0x20〜0x7E）",
                "赤色: 制御文字・非表示文字（0x00〜0x1F, 0x7F）",
                "グレー: NULL バイト（0x00）",
                "青紫色: 高位バイト（0x80〜0xFF、UTF-8マルチバイトなど）",
              ],
            },
            {
              title: "活用例",
              items: [
                "ファイルのマジックナンバー確認（PNG: 89 50 4E 47、PDF: 25 50 44 46）",
                "バイナリプロトコルのデバッグ",
                "文字エンコードの確認（UTF-8マルチバイト文字の構造）",
                "ファイルヘッダーの解析",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
