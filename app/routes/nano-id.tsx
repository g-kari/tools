import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateNanoId,
  calculateEntropy,
  calculateCollisionProbability,
  DEFAULT_ALPHABET,
  DEFAULT_SIZE,
  PRESET_ALPHABETS,
  type PresetKey,
} from "~/utils/nano-id";

export const Route = createFileRoute("/nano-id")({
  head: () => ({
    meta: [
      { title: "Nano ID ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "Nano ID（URL セーフな短い一意識別子）を生成するツール。サイズ・アルファベットをカスタマイズ可能。UUID より短く人間が読みやすい識別子を暗号論的乱数で生成。",
      },
      {
        property: "og:title",
        content: "Nano ID ジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Nano ID（URL セーフな短い一意識別子）を生成するツール。サイズ・アルファベットをカスタマイズ可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/nano-id` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Nano ID ジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "Nano ID を生成するツール。サイズ・アルファベットをカスタマイズ可能。",
      },
    ],
  }),
  component: NanoIdGenerator,
});

function NanoIdGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [ids, setIds] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [customAlphabet, setCustomAlphabet] = useState(DEFAULT_ALPHABET);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("default");
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

  const handlePresetChange = useCallback((preset: PresetKey) => {
    setSelectedPreset(preset);
    setCustomAlphabet(PRESET_ALPHABETS[preset].value);
    setError(null);
  }, []);

  const handleAlphabetChange = useCallback((value: string) => {
    setCustomAlphabet(value);
    setSelectedPreset("default");
    setError(null);
  }, []);

  const handleGenerate = useCallback(() => {
    setError(null);
    try {
      const uniqueAlphabet = [...new Set(customAlphabet.split(""))].join("");
      if (uniqueAlphabet.length < 2) {
        setError("アルファベットは 2 文字以上の異なる文字が必要です");
        return;
      }
      const generated: string[] = [];
      for (let i = 0; i < count; i++) {
        generated.push(generateNanoId(size, uniqueAlphabet));
      }
      setIds(generated);
      setCopiedIndex(null);
      setCopiedAll(false);
      announceStatus(`${count} 個の Nano ID を生成しました`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    }
  }, [count, size, customAlphabet, announceStatus]);

  const handleCopy = useCallback(
    async (index: number) => {
      const success = await copy(ids[index]);
      if (success) {
        setCopiedIndex(index);
        announceStatus("Nano ID をコピーしました");
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [ids, copy, announceStatus, showToast]
  );

  const handleCopyAll = useCallback(async () => {
    const all = ids.join("\n");
    const success = await copy(all);
    if (success) {
      setCopiedAll(true);
      announceStatus("すべての Nano ID をコピーしました");
      if (copiedAllTimeoutRef.current) clearTimeout(copiedAllTimeoutRef.current);
      copiedAllTimeoutRef.current = setTimeout(() => setCopiedAll(false), 2000);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [ids, copy, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setIds([]);
    setCopiedIndex(null);
    setCopiedAll(false);
    announceStatus("Nano ID をクリアしました");
  }, [announceStatus]);

  // 初回マウント時に 1 件生成
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      handleGenerate();
    }
  }, [handleGenerate]);

  const uniqueAlphabet = [...new Set(customAlphabet.split(""))].join("");
  const entropy = calculateEntropy(size, uniqueAlphabet || DEFAULT_ALPHABET);
  const collisionProb = calculateCollisionProbability(
    size,
    uniqueAlphabet || DEFAULT_ALPHABET
  );

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          aria-label="Nano ID 生成フォーム"
        >
          {/* ── 設定セクション ── */}
          <div className="converter-section">
            <h2 className="section-title">生成設定</h2>

            {/* サイズ・生成数 */}
            <div className="nanoid-options">
              <div className="option-group">
                <label htmlFor="nanoid-size">サイズ（文字数）:</label>
                <input
                  id="nanoid-size"
                  type="number"
                  min={1}
                  max={512}
                  value={size}
                  onChange={(e) =>
                    setSize(
                      Math.max(1, Math.min(512, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-20"
                  aria-describedby="nanoid-size-help"
                />
                <span id="nanoid-size-help" className="sr-only">
                  1 から 512 の間で文字数を指定できます
                </span>
              </div>
              <div className="option-group">
                <label htmlFor="nanoid-count">生成数:</label>
                <input
                  id="nanoid-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) =>
                    setCount(
                      Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-20"
                  aria-describedby="nanoid-count-help"
                />
                <span id="nanoid-count-help" className="sr-only">
                  1 から 100 の間で生成数を指定できます
                </span>
              </div>
            </div>

            {/* プリセット選択 */}
            <div className="nanoid-preset-group">
              <label htmlFor="nanoid-preset">アルファベットプリセット:</label>
              <select
                id="nanoid-preset"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
                className="nanoid-preset-select"
              >
                {(Object.keys(PRESET_ALPHABETS) as PresetKey[]).map((key) => (
                  <option key={key} value={key}>
                    {PRESET_ALPHABETS[key].label}
                  </option>
                ))}
              </select>
            </div>

            {/* カスタムアルファベット */}
            <div className="nanoid-alphabet-group">
              <label htmlFor="nanoid-alphabet">カスタムアルファベット:</label>
              <input
                id="nanoid-alphabet"
                type="text"
                value={customAlphabet}
                onChange={(e) => handleAlphabetChange(e.target.value)}
                placeholder="使用する文字を入力..."
                aria-describedby="nanoid-alphabet-hint"
                spellCheck={false}
                autoComplete="off"
                className="nanoid-alphabet-input"
              />
              <p id="nanoid-alphabet-hint" className="nanoid-hint">
                {uniqueAlphabet.length} 種類の文字 ／ エントロピー:{" "}
                {entropy.toFixed(1)} ビット ／ 100万件生成時の衝突確率:{" "}
                {collisionProb}
              </p>
            </div>

            {error && (
              <div className="nanoid-error" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <div className="button-group" role="group" aria-label="Nano ID 操作">
              <button type="submit" className="btn-primary">
                Nano ID 生成
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                disabled={ids.length === 0}
              >
                クリア
              </button>
            </div>
          </div>

          {/* ── 結果セクション ── */}
          {ids.length > 0 && (
            <div className="converter-section">
              <div className="nanoid-result-header">
                <h2 className="section-title">生成結果</h2>
                {ids.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCopyAll}
                  >
                    {copiedAll ? "コピーしました" : "すべてコピー"}
                  </button>
                )}
              </div>

              <div
                className="nanoid-list"
                role="list"
                aria-live="polite"
                aria-label="生成した Nano ID"
              >
                {ids.map((id, index) => (
                  <div key={index} className="nanoid-item" role="listitem">
                    <code className="nanoid-value">{id}</code>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => handleCopy(index)}
                      aria-label={`Nano ID ${index + 1} をコピー`}
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
            title: "Nano ID とは",
            items: [
              "Nano ID は UUID の代替として広く使われる、軽量でURL フレンドリーな一意識別子です",
              "デフォルト 21 文字（UUID の 36 文字より短い）で同等以上のランダム性を持ちます",
              "crypto.getRandomValues() による暗号論的に安全な乱数を使用します",
              "JavaScript/TypeScript の主要プロジェクトで npm 週間 5 億回以上ダウンロードされています",
            ],
          },
          {
            title: "UUID との比較",
            items: [
              "UUID v4: 36 文字（ハイフン含む）・122 ビットのランダム性",
              "Nano ID（デフォルト）: 21 文字・128 ビット相当のランダム性",
              "Nano ID は URL・ファイル名・データベース ID として直接使用可能",
              "アルファベットをカスタマイズして用途に合わせた ID を生成できます",
            ],
          },
          {
            title: "アルファベットの選び方",
            items: [
              "デフォルト（URL セーフ）: 一般的な ID 生成に最適",
              "英数字のみ: システムやデータベースで安全に使用できます",
              "数字のみ: 短い数値 PIN・コード生成に便利（エントロピーは低い）",
              "紛らわしい文字を除外: 人間が読み上げる場合や印刷物に最適",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
