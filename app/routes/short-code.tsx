import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateShortCodes,
  calculateEntropy,
  CHARSETS,
  FORMAT_PRESETS,
  type CharsetKey,
  type FormatPresetKey,
} from "~/utils/short-code";

export const Route = createFileRoute("/short-code")({
  head: () => ({
    meta: [
      { title: "ショートコードジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "チケット番号・バウチャーコード・ライセンスキー・PIN など、人間が読み書きしやすい短いコードを生成するツール。視覚的に紛らわしい文字の除外・セグメント形式のカスタマイズに対応。",
      },
      {
        property: "og:title",
        content: "ショートコードジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "チケット番号・バウチャーコード・ライセンスキーなど人間が読みやすいコードを生成するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/short-code` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ショートコードジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "チケット・バウチャー・ライセンスキーなどのショートコードを生成するツール。",
      },
    ],
  }),
  component: ShortCodeGenerator,
});

function ShortCodeGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [codes, setCodes] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<FormatPresetKey>("voucher");
  const [segmentLength, setSegmentLength] = useState(FORMAT_PRESETS.voucher.segmentLength);
  const [segmentCount, setSegmentCount] = useState(FORMAT_PRESETS.voucher.segmentCount);
  const [separator, setSeparator] = useState(FORMAT_PRESETS.voucher.separator);
  const [charsetKey, setCharsetKey] = useState<CharsetKey>(FORMAT_PRESETS.voucher.charsetKey);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedAllTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (copiedAllTimeoutRef.current) clearTimeout(copiedAllTimeoutRef.current);
    };
  }, []);

  const handlePresetChange = useCallback((preset: FormatPresetKey) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      const p = FORMAT_PRESETS[preset];
      setSegmentLength(p.segmentLength);
      setSegmentCount(p.segmentCount);
      setSeparator(p.separator);
      setCharsetKey(p.charsetKey);
    }
    setError(null);
  }, []);

  const handleGenerate = useCallback(() => {
    setError(null);
    try {
      const generated = generateShortCodes(
        {
          segmentLength,
          segmentCount,
          separator,
          alphabet: CHARSETS[charsetKey].value,
          addLuhn: false,
        },
        count,
      );
      setCodes(generated);
      setCopiedIndex(null);
      setCopiedAll(false);
      announceStatus(`${count} 件のコードを生成しました`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    }
  }, [segmentLength, segmentCount, separator, charsetKey, count, announceStatus]);

  const handleCopy = useCallback(
    async (index: number) => {
      const success = await copy(codes[index]);
      if (success) {
        setCopiedIndex(index);
        announceStatus("コードをコピーしました");
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [codes, copy, announceStatus, showToast],
  );

  const handleCopyAll = useCallback(async () => {
    const all = codes.join("\n");
    const success = await copy(all);
    if (success) {
      setCopiedAll(true);
      announceStatus("すべてのコードをコピーしました");
      if (copiedAllTimeoutRef.current) clearTimeout(copiedAllTimeoutRef.current);
      copiedAllTimeoutRef.current = setTimeout(() => setCopiedAll(false), 2000);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [codes, copy, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setCodes([]);
    setCopiedIndex(null);
    setCopiedAll(false);
    announceStatus("コードをクリアしました");
  }, [announceStatus]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      handleGenerate();
    }
  }, [handleGenerate]);

  const alphabet = CHARSETS[charsetKey].value;
  const entropy = calculateEntropy(segmentLength, segmentCount, alphabet.length);
  const exampleFormat =
    "X".repeat(segmentLength) +
    (segmentCount > 1
      ? separator + "X".repeat(segmentLength) + (segmentCount > 2 ? separator + "…" : "")
      : "");

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          aria-label="ショートコード生成フォーム"
        >
          {/* ── プリセット ── */}
          <div className="converter-section">
            <h2 className="section-title">フォーマット選択</h2>

            <div className="nanoid-options">
              <div className="option-group">
                <label htmlFor="format-preset">プリセット:</label>
                <select
                  id="format-preset"
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value as FormatPresetKey)}
                  className="select-input"
                >
                  {(Object.keys(FORMAT_PRESETS) as FormatPresetKey[]).map((key) => (
                    <option key={key} value={key}>
                      {FORMAT_PRESETS[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── カスタム設定 ── */}
          <div className="converter-section">
            <h2 className="section-title">詳細設定</h2>

            <div className="nanoid-options">
              <div className="option-group">
                <label htmlFor="segment-length">セグメント長:</label>
                <input
                  id="segment-length"
                  type="number"
                  min={1}
                  max={20}
                  value={segmentLength}
                  onChange={(e) => {
                    setSegmentLength(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)));
                    setSelectedPreset("custom");
                  }}
                  className="w-20"
                  aria-describedby="segment-length-help"
                />
                <span id="segment-length-help" className="sr-only">
                  1 から 20 の範囲で指定できます
                </span>
              </div>

              <div className="option-group">
                <label htmlFor="segment-count">セグメント数:</label>
                <input
                  id="segment-count"
                  type="number"
                  min={1}
                  max={8}
                  value={segmentCount}
                  onChange={(e) => {
                    setSegmentCount(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)));
                    setSelectedPreset("custom");
                  }}
                  className="w-20"
                />
              </div>

              <div className="option-group">
                <label htmlFor="separator">区切り文字:</label>
                <input
                  id="separator"
                  type="text"
                  maxLength={3}
                  value={separator}
                  onChange={(e) => {
                    setSeparator(e.target.value);
                    setSelectedPreset("custom");
                  }}
                  className="w-16"
                  placeholder="-"
                  aria-describedby="separator-help"
                />
                <span id="separator-help" className="sr-only">
                  セグメント間の区切り文字（最大 3 文字）
                </span>
              </div>

              <div className="option-group">
                <label htmlFor="charset">文字セット:</label>
                <select
                  id="charset"
                  value={charsetKey}
                  onChange={(e) => {
                    setCharsetKey(e.target.value as CharsetKey);
                    setSelectedPreset("custom");
                  }}
                  className="select-input"
                >
                  {(Object.keys(CHARSETS) as CharsetKey[]).map((key) => (
                    <option key={key} value={key}>
                      {CHARSETS[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="option-group">
                <label htmlFor="gen-count">生成数:</label>
                <input
                  id="gen-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
                  }
                  className="w-20"
                />
              </div>
            </div>

            {/* フォーマットプレビュー */}
            <div className="nanoid-options">
              <div className="option-group">
                <span className="text-sm text-secondary">
                  形式プレビュー: <code>{exampleFormat}</code>
                </span>
                <span className="text-sm text-secondary">
                  エントロピー: {entropy.toFixed(1)} bits
                </span>
              </div>
            </div>

            {error && (
              <div className="nanoid-error" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <div className="button-group" role="group" aria-label="コード操作">
              <button type="submit" className="btn-primary">
                コードを生成
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                disabled={codes.length === 0}
              >
                クリア
              </button>
            </div>
          </div>

          {/* ── 生成結果 ── */}
          {codes.length > 0 && (
            <div className="converter-section">
              <div className="nanoid-result-header">
                <h2 className="section-title">生成結果</h2>
                {codes.length > 1 && (
                  <button type="button" className="btn-secondary" onClick={handleCopyAll}>
                    {copiedAll ? "コピーしました" : "すべてコピー"}
                  </button>
                )}
              </div>

              <div
                className="nanoid-list"
                role="list"
                aria-live="polite"
                aria-label="生成したコード"
              >
                {codes.map((code, index) => (
                  <div key={index} className="nanoid-item" role="listitem">
                    <code className="nanoid-value">{code}</code>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => handleCopy(index)}
                      aria-label={`コード ${index + 1} をコピー`}
                    >
                      {copiedIndex === index ? "済" : "コピー"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      <TipsCard
        sections={[
          {
            title: "ショートコードとは",
            items: [
              "ショートコードは、チケット番号・バウチャーコード・ライセンスキーなど人間が扱うことを前提とした短い識別子です",
              "UUID や Nano ID と異なり、視覚的に紛らわしい文字（0/O、I/l/1 など）を除外して読み間違いを防ぎます",
              "セグメント区切り（例: ABCD-EFGH-1234）により、長いコードでも入力しやすくなります",
              "crypto.getRandomValues() による暗号論的に安全な乱数を使用します",
            ],
          },
          {
            title: "プリセットの使い方",
            items: [
              "チケット番号: イベント・整理券など 8 文字 2 セグメントの短いコード",
              "バウチャーコード: クーポン・プロモコードなど 12 文字 3 セグメントのコード",
              "ライセンスキー: ソフトウェアライセンスなど 16 文字 4 セグメントの一般的な形式",
              "PIN コード: 数字のみの 6 桁コード（ATM・認証など）",
              "短い招待コード: 4 文字の超短縮コード（SNS 招待リンクなど）",
            ],
          },
          {
            title: "文字セットの選び方",
            items: [
              "紛らわしい文字を除外（推奨）: 0/O/I/l/1/B/8 などを除いた 26 文字。印刷物・手入力に最適",
              "英数字（A–Z, 0–9）: 標準的な 36 文字。一般的なシステムで安全に使用可能",
              "数字のみ: PIN・OTP コードなど数字専用の用途に。エントロピーは低い",
              "16 進数: バイナリ・ハッシュ値と親和性が高い形式",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
