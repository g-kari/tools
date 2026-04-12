import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type Base,
  parseInteger,
  formatInteger,
  toBinary32,
  formatBinaryGroups,
  computeResults,
  computeShift,
  popcount,
} from "~/utils/bitwise";

export const Route = createFileRoute("/bitwise")({
  head: () => ({
    meta: [
      { title: "ビット演算計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "AND・OR・XOR・NOT・シフト演算をビジュアルで確認できるビット演算計算機。2進数・8進数・10進数・16進数で入力可能。32ビットビット表示付き。",
      },
      {
        property: "og:title",
        content: "ビット演算計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "AND・OR・XOR・NOT・シフト演算をビジュアルで確認できるビット演算計算機。2進数・8進数・10進数・16進数で入力可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/bitwise` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ビット演算計算機 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "AND・OR・XOR・NOT・シフト演算をビジュアルで確認できるビット演算計算機。",
      },
    ],
  }),
  component: BitwiseCalculator,
});

const BASE_OPTIONS: { label: string; value: Base }[] = [
  { label: "BIN", value: 2 },
  { label: "OCT", value: 8 },
  { label: "DEC", value: 10 },
  { label: "HEX", value: 16 },
];

const BASE_LABELS: Record<Base, string> = {
  2: "2進数",
  8: "8進数",
  10: "10進数",
  16: "16進数",
};

/** 単一オペランドの入力・表示コンポーネント */
function OperandPanel({
  label,
  inputValue,
  base,
  parsedValue,
  onInputChange,
  onBaseChange,
}: {
  label: string;
  inputValue: string;
  base: Base;
  parsedValue: number | null;
  onInputChange: (v: string) => void;
  onBaseChange: (b: Base) => void;
}) {
  const isError = inputValue !== "" && parsedValue === null;
  const bin32 = parsedValue !== null ? toBinary32(parsedValue) : null;

  return (
    <section className="bw-section" aria-labelledby={`bw-op-title-${label}`}>
      <h2 className="bw-section-title" id={`bw-op-title-${label}`}>
        入力 {label}
      </h2>

      <div className="bw-input-row" role="group" aria-label={`入力${label}の設定`}>
        <select
          className="bw-base-select"
          value={base}
          onChange={(e) => onBaseChange(Number(e.target.value) as Base)}
          aria-label={`入力${label}の基数`}
        >
          {BASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className={`bw-number-input${isError ? " error" : ""}`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={base === 16 ? "例: FF" : base === 2 ? "例: 1010" : "例: 255"}
          aria-label={`${label}の値（${BASE_LABELS[base]}）`}
          aria-invalid={isError}
          spellCheck={false}
        />
      </div>
      {isError && (
        <p className="bw-input-error" role="alert">
          {BASE_LABELS[base]}
          として解析できません（符号付き32ビット整数の範囲：-2147483648〜2147483647）
        </p>
      )}

      {parsedValue !== null && (
        <>
          {/* 他の基数での表示 */}
          <div className="bw-repr-grid" aria-label={`${label}の他の基数表現`}>
            {([2, 8, 10, 16] as Base[])
              .filter((b) => b !== base)
              .map((b) => (
                <div key={b} className="bw-repr-item">
                  <div className="bw-repr-base">{BASE_LABELS[b]}</div>
                  <div className="bw-repr-value">{formatInteger(parsedValue, b)}</div>
                </div>
              ))}
          </div>

          {/* 32ビットビット表示 */}
          {bin32 && (
            <div className="bw-bits-section">
              <div className="bw-bits-label">32ビット表現（MSB → LSB）</div>
              <div
                className="bw-bits-row"
                role="img"
                aria-label={`${label}の32ビット表現: ${formatBinaryGroups(bin32)}`}
              >
                {bin32.split("").map((bit, i) => {
                  const pos = 31 - i;
                  // 8ビットごとにセパレーター
                  const addSep = i > 0 && i % 8 === 0;
                  return (
                    <span key={i} className="bw-bit-contents">
                      {addSep && <span className="bw-bit-sep" aria-hidden="true" />}
                      <span className={`bw-bit bw-bit-${bit}`} title={`bit ${pos}`}>
                        {bit}
                      </span>
                    </span>
                  );
                })}
              </div>
              <p className="bw-popcount">セットビット数: {popcount(parsedValue)} / 32</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function BitwiseCalculator() {
  const [inputA, setInputA] = useState("42");
  const [baseA, setBaseA] = useState<Base>(10);
  const [inputB, setInputB] = useState("15");
  const [baseB, setBaseB] = useState<Base>(10);
  const [shiftAmount, setShiftAmount] = useState(1);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  const parsedA = useMemo(() => parseInteger(inputA, baseA), [inputA, baseA]);
  const parsedB = useMemo(() => parseInteger(inputB, baseB), [inputB, baseB]);

  const results = useMemo(() => {
    if (parsedA === null || parsedB === null) return null;
    return computeResults(parsedA, parsedB);
  }, [parsedA, parsedB]);

  const shiftResults = useMemo(() => {
    if (parsedA === null) return null;
    return computeShift(parsedA, shiftAmount);
  }, [parsedA, shiftAmount]);

  const handleCopyValue = useCallback(
    async (value: number, label: string) => {
      const success = await copy(String(value));
      if (success) {
        announceStatus(`${label}の結果をコピーしました`);
        showToast(`${label}: ${value} をコピーしました`, "success");
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast],
  );

  return (
    <>
      <div className="tool-container">
        <div className="bw-layout">
          {/* 左側: 入力 */}
          <div className="bw-controls">
            <OperandPanel
              label="A"
              inputValue={inputA}
              base={baseA}
              parsedValue={parsedA}
              onInputChange={setInputA}
              onBaseChange={setBaseA}
            />

            <OperandPanel
              label="B"
              inputValue={inputB}
              base={baseB}
              parsedValue={parsedB}
              onInputChange={setInputB}
              onBaseChange={setBaseB}
            />

            {/* シフト演算 */}
            <section className="bw-section" aria-labelledby="bw-shift-title">
              <h2 className="bw-section-title" id="bw-shift-title">
                シフト演算（A）
              </h2>
              <div className="bw-shift-row">
                <span className="bw-shift-label">シフト量:</span>
                <input
                  type="number"
                  className="bw-shift-input"
                  min={0}
                  max={31}
                  value={shiftAmount}
                  onChange={(e) =>
                    setShiftAmount(Math.max(0, Math.min(31, Number(e.target.value))))
                  }
                  aria-label="シフト量（0〜31ビット）"
                />
                <span className="bw-shift-label">ビット</span>
              </div>
              {shiftResults !== null ? (
                <div className="bw-shift-results" aria-label="シフト演算結果">
                  {[
                    {
                      op: `A << ${shiftAmount}`,
                      value: shiftResults.leftShift,
                    },
                    {
                      op: `A >> ${shiftAmount}`,
                      value: shiftResults.rightShift,
                    },
                    {
                      op: `A >>> ${shiftAmount}`,
                      value: shiftResults.unsignedRightShift,
                    },
                  ].map(({ op, value }) => (
                    <div key={op} className="bw-shift-result-item">
                      <span className="bw-shift-result-op">{op}</span>
                      <span className="bw-shift-result-value">
                        {value}{" "}
                        <span className="bw-bit-hex">
                          (0x{formatInteger(value, 16).toUpperCase()})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="bw-bits-label">入力Aを設定してください</p>
              )}
            </section>
          </div>

          {/* 右側: 演算結果 */}
          <div className="bw-right">
            <section className="bw-section" aria-labelledby="bw-results-title">
              <h2 className="bw-section-title" id="bw-results-title">
                演算結果（A op B）
              </h2>
              {results !== null ? (
                <table className="bw-results-table" aria-label="ビット演算結果一覧">
                  <thead>
                    <tr>
                      <th scope="col">演算</th>
                      <th scope="col">記号</th>
                      <th scope="col">10進数</th>
                      <th scope="col">16進数</th>
                      <th scope="col">説明</th>
                      <th scope="col">
                        <span className="sr-only">コピー</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.label}>
                        <td className="bw-op-label">{r.label}</td>
                        <td className="bw-op-symbol">{r.symbol}</td>
                        <td className="bw-op-decimal">{r.value}</td>
                        <td className="bw-op-hex">0x{formatInteger(r.value, 16).toUpperCase()}</td>
                        <td className="bw-op-desc">{r.description}</td>
                        <td>
                          <button
                            type="button"
                            className="bw-op-copy-btn"
                            onClick={() => handleCopyValue(r.value, r.label)}
                            aria-label={`${r.label}の結果 ${r.value} をコピー`}
                          >
                            コピー
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="bw-bits-label">有効な値をA・B両方に入力してください</p>
              )}
            </section>

            {/* ビット表示（AND結果） */}
            {results !== null && parsedA !== null && parsedB !== null && (
              <section className="bw-section" aria-labelledby="bw-bit-visual-title">
                <h2 className="bw-section-title" id="bw-bit-visual-title">
                  ビット演算ビジュアル
                </h2>
                {[
                  { label: "A", value: parsedA },
                  { label: "B", value: parsedB },
                  {
                    label: "A AND B",
                    value: results.find((r) => r.label === "AND")!.value,
                  },
                  {
                    label: "A OR B",
                    value: results.find((r) => r.label === "OR")!.value,
                  },
                  {
                    label: "A XOR B",
                    value: results.find((r) => r.label === "XOR")!.value,
                  },
                ].map(({ label, value }) => {
                  const bin = toBinary32(value);
                  return (
                    <div key={label} className="bw-bit-visual-item">
                      <div className="bw-bits-label">
                        {label} = {value}
                      </div>
                      <div className="bw-bits-row" role="img" aria-label={`${label}の32ビット表現`}>
                        {bin.split("").map((bit, i) => {
                          const addSep = i > 0 && i % 8 === 0;
                          return (
                            <span key={i} className="bw-bit-contents">
                              {addSep && <span className="bw-bit-sep" aria-hidden="true" />}
                              <span className={`bw-bit bw-bit-${bit}`}>{bit}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            <TipsCard
              sections={[
                {
                  title: "使い方",
                  items: [
                    "入力AとBに整数値を入力してください（符号付き32ビット）",
                    "基数を BIN/OCT/DEC/HEX から選択できます",
                    "演算結果テーブルの「コピー」ボタンで値をクリップボードへコピー",
                    "シフト演算のビット量は0〜31ビットで指定できます",
                  ],
                },
                {
                  title: "ビット演算について",
                  items: [
                    "AND (&): 両方のビットが1のとき結果が1",
                    "OR (|): どちらかのビットが1のとき結果が1",
                    "XOR (^): ビットが異なるとき結果が1（排他的論理和）",
                    "NOT (~): 全ビットを反転（Two's complement）",
                    ">> は符号付きシフト、>>> は符号なしシフト",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
