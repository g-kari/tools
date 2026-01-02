import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  UNIT_CATEGORIES,
  type UnitCategory,
  type UnitDefinition,
  type ConversionHistoryEntry,
  getUnitsForCategory,
  convertUnit,
  formatNumber,
  createHistoryEntry,
} from "../utils/unit-converter";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/unit-converter")({
  head: () => ({
    meta: [{ title: "単位変換ツール" }],
  }),
  component: UnitConverter,
});

/** 履歴の最大保持数 */
const MAX_HISTORY = 5;

function UnitConverter() {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory>("length");
  const [fromUnit, setFromUnit] = useState<string>("m");
  const [toUnit, setToUnit] = useState<string>("km");
  const [inputValue, setInputValue] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const units = getUnitsForCategory(selectedCategory);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  // カテゴリ変更時に単位をリセット
  const handleCategoryChange = useCallback(
    (categoryId: UnitCategory) => {
      setSelectedCategory(categoryId);
      const newUnits = getUnitsForCategory(categoryId);
      if (newUnits.length >= 2) {
        setFromUnit(newUnits[0].id);
        setToUnit(newUnits[1].id);
      }
      setResult(null);
      announceStatus(`${UNIT_CATEGORIES.find((c) => c.id === categoryId)?.name}カテゴリを選択しました`);
    },
    [announceStatus]
  );

  // 変換実行
  const handleConvert = useCallback(() => {
    const numValue = parseFloat(inputValue);

    if (inputValue === "" || isNaN(numValue)) {
      showToast("数値を入力してください", "error");
      announceStatus("エラー: 数値を入力してください");
      inputRef.current?.focus();
      return;
    }

    const converted = convertUnit(numValue, fromUnit, toUnit, selectedCategory);

    if (converted === null) {
      showToast("変換に失敗しました", "error");
      announceStatus("エラー: 変換に失敗しました");
      return;
    }

    setResult(converted);

    // 履歴に追加
    const entry = createHistoryEntry(
      selectedCategory,
      numValue,
      fromUnit,
      toUnit,
      converted
    );
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));

    const fromUnitDef = units.find((u) => u.id === fromUnit);
    const toUnitDef = units.find((u) => u.id === toUnit);
    announceStatus(
      `${formatNumber(numValue)} ${fromUnitDef?.symbol} = ${formatNumber(converted)} ${toUnitDef?.symbol}`
    );
  }, [inputValue, fromUnit, toUnit, selectedCategory, units, showToast, announceStatus]);

  // 単位を入れ替え
  const handleSwapUnits = useCallback(() => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setResult(null);
    announceStatus("単位を入れ替えました");
  }, [fromUnit, toUnit, announceStatus]);

  // クリア
  const handleClear = useCallback(() => {
    setInputValue("");
    setResult(null);
    announceStatus("入力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  // リアルタイム変換
  useEffect(() => {
    const numValue = parseFloat(inputValue);
    if (inputValue !== "" && !isNaN(numValue)) {
      const converted = convertUnit(numValue, fromUnit, toUnit, selectedCategory);
      setResult(converted);
    } else {
      setResult(null);
    }
  }, [inputValue, fromUnit, toUnit, selectedCategory]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleConvert();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleConvert]);

  // 初期フォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getUnitLabel = (unitId: string): string => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? `${unit.name} (${unit.symbol})` : unitId;
  };

  const getCategoryLabel = (categoryId: UnitCategory): string => {
    const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
    return category?.name ?? categoryId;
  };

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="単位変換フォーム">
          {/* カテゴリ選択 */}
          <div className="converter-section">
            <label id="category-label" className="section-title">
              カテゴリ
            </label>
            <div
              className="unit-category-grid"
              role="radiogroup"
              aria-labelledby="category-label"
            >
              {UNIT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedCategory === category.id}
                  className={`unit-category-btn ${selectedCategory === category.id ? "active" : ""}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 入力セクション */}
          <div className="converter-section">
            <label htmlFor="unitInput" className="section-title">
              入力値
            </label>
            <div className="unit-input-row">
              <input
                type="number"
                id="unitInput"
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="数値を入力..."
                aria-describedby="input-help"
                className="unit-input"
                step="any"
              />
              <select
                id="fromUnit"
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                aria-label="変換元の単位"
                className="unit-select"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
            <span id="input-help" className="sr-only">
              変換したい数値を入力してください
            </span>
          </div>

          {/* 単位入れ替えボタン */}
          <div className="unit-swap-container">
            <button
              type="button"
              className="unit-swap-btn"
              onClick={handleSwapUnits}
              aria-label="変換元と変換先の単位を入れ替え"
              title="単位を入れ替え"
            >
              ⇅
            </button>
          </div>

          {/* 出力セクション */}
          <div className="converter-section">
            <label htmlFor="toUnit" className="section-title">
              変換結果
            </label>
            <div className="unit-input-row">
              <div className="unit-result" aria-live="polite" aria-atomic="true">
                {result !== null ? formatNumber(result) : "—"}
              </div>
              <select
                id="toUnit"
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                aria-label="変換先の単位"
                className="unit-select"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ボタングループ */}
          <div className="button-group" role="group" aria-label="変換操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleConvert}
              aria-label="単位を変換"
            >
              変換
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSwapUnits}
              aria-label="単位を入れ替え"
            >
              入れ替え
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力をクリア"
            >
              クリア
            </button>
          </div>

          {/* 変換履歴 */}
          {history.length > 0 && (
            <section className="converter-section" aria-labelledby="history-title">
              <h2 id="history-title" className="section-title">
                変換履歴（最新{MAX_HISTORY}件）
              </h2>
              <ul className="unit-history-list" role="list">
                {history.map((entry) => {
                  const categoryUnits = getUnitsForCategory(entry.categoryId);
                  const fromUnitDef = categoryUnits.find(
                    (u: UnitDefinition) => u.id === entry.fromUnitId
                  );
                  const toUnitDef = categoryUnits.find(
                    (u: UnitDefinition) => u.id === entry.toUnitId
                  );
                  return (
                    <li key={entry.id} className="unit-history-item">
                      <span className="unit-history-category">
                        {getCategoryLabel(entry.categoryId)}
                      </span>
                      <span className="unit-history-conversion">
                        {formatNumber(entry.inputValue)} {fromUnitDef?.symbol} ={" "}
                        {formatNumber(entry.result)} {toUnitDef?.symbol}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </form>

        {/* 使い方 */}
        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>カテゴリを選択（長さ、重さ、温度など）</li>
            <li>変換したい数値を入力</li>
            <li>変換元と変換先の単位を選択</li>
            <li>リアルタイムで変換結果が表示されます</li>
            <li>「入れ替え」ボタンで単位を入れ替え可能</li>
            <li>キーボードショートカット: Ctrl+Enter で変換</li>
          </ul>
          <h4>対応カテゴリ</h4>
          <ul>
            <li>長さ: メートル、キロメートル、マイル、フィートなど</li>
            <li>重さ: グラム、キログラム、ポンド、オンスなど</li>
            <li>温度: 摂氏、華氏、ケルビン</li>
            <li>データサイズ: バイト、KB、MB、GB（1024/1000進数）</li>
            <li>面積: 平方メートル、ヘクタール、坪、畳など</li>
            <li>体積: リットル、ガロン、カップなど</li>
            <li>速度: m/s、km/h、mph、ノット</li>
            <li>時間: 秒、分、時間、日、週、月、年</li>
          </ul>
        </aside>
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
