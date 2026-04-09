import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useId } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import {
  PRETTIER_CATEGORIES,
  PRETTIER_PRESETS,
  generatePrettierConfig,
  getDefaultValues,
  type PrettierOption,
} from "~/utils/prettier-config-builder";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import "~/styles/tools/prettier-config-builder.css";

export const Route = createFileRoute("/prettier-config-builder")({
  head: () => ({
    meta: [
      { title: ".prettierrc ビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "Prettier のオプションを選択して .prettierrc を自動生成。printWidth・semi・singleQuote・trailingComma など主要オプションをカテゴリ別に設定。React・Vue・TypeScript 向けプリセット対応。",
      },
      {
        property: "og:title",
        content: ".prettierrc ビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content: "Prettier オプションを選択して .prettierrc を自動生成。プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/prettier-config-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: ".prettierrc ビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "Prettier オプションをカテゴリ別に設定して .prettierrc を生成",
      },
    ],
  }),
  component: PrettierConfigBuilderPage,
});

/** ブール型オプションのトグルコンポーネント */
function BooleanToggle({
  optionKey,
  value,
  onChange,
}: {
  optionKey: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const inputId = useId();
  return (
    <label className="prettier-toggle" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`prettier-toggle-track${value ? " checked" : ""}`}>
        <span className="prettier-toggle-thumb" />
      </span>
      <span className="prettier-toggle-label">{value ? "true" : "false"}</span>
    </label>
  );
}

/** 数値入力コンポーネント（+/- ボタン付き） */
function NumberInput({
  optionKey,
  value,
  onChange,
}: {
  optionKey: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const step = optionKey === "printWidth" ? 10 : 1;
  const min = optionKey === "printWidth" ? 40 : 1;
  const max = optionKey === "printWidth" ? 200 : 8;

  return (
    <div className="prettier-number-input" role="group" aria-label={optionKey}>
      <button
        type="button"
        className="prettier-number-btn"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label={`${optionKey} を減らす`}
        disabled={value <= min}
      >
        −
      </button>
      <span className="prettier-number-value" aria-live="polite" aria-atomic="true">
        {value}
      </span>
      <button
        type="button"
        className="prettier-number-btn"
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label={`${optionKey} を増やす`}
        disabled={value >= max}
      >
        ＋
      </button>
    </div>
  );
}

/** 単一選択オプションのセレクトコンポーネント */
function EnumSelect({
  optionKey,
  value,
  choices,
  onChange,
}: {
  optionKey: string;
  value: string;
  choices: string[];
  onChange: (v: string) => void;
}) {
  const selectId = useId();
  return (
    <select
      id={selectId}
      className="prettier-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={optionKey}
    >
      {choices.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

/** オプション1行分のコンポーネント */
function OptionRow({
  option,
  value,
  defaultValue,
  onChange,
}: {
  option: PrettierOption;
  value: boolean | number | string;
  defaultValue: boolean | number | string;
  onChange: (key: string, val: boolean | number | string) => void;
}) {
  const isModified = value !== defaultValue;

  return (
    <div className={`prettier-option-row${isModified ? " modified" : ""}`}>
      <div className="prettier-option-label-col">
        <span className="prettier-option-key">{option.key}</span>
        <span className="prettier-option-desc">{option.description}</span>
        {option.recommended && option.recommended.length > 0 && (
          <div className="prettier-option-recommended">
            {option.recommended.map((r) => (
              <span key={r} className="prettier-option-badge">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="prettier-option-input-col">
        {option.type === "boolean" && (
          <BooleanToggle
            optionKey={option.key}
            value={value as boolean}
            onChange={(v) => onChange(option.key, v)}
          />
        )}
        {option.type === "number" && (
          <NumberInput
            optionKey={option.key}
            value={value as number}
            onChange={(v) => onChange(option.key, v)}
          />
        )}
        {option.type === "enum" && (
          <EnumSelect
            optionKey={option.key}
            value={value as string}
            choices={option.choices ?? []}
            onChange={(v) => onChange(option.key, v)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * .prettierrc ビルダーページ
 */
function PrettierConfigBuilderPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const defaultValues = useMemo(() => getDefaultValues(), []);
  const [values, setValues] = useState<Record<string, boolean | number | string>>(() =>
    getDefaultValues(),
  );
  const [activeCategory, setActiveCategory] = useState(PRETTIER_CATEGORIES[0].id);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const output = useMemo(() => generatePrettierConfig(values), [values]);

  const handleChange = useCallback((key: string, val: boolean | number | string) => {
    setActivePreset(null);
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = PRETTIER_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const defaults = getDefaultValues();
      setValues({ ...defaults, ...preset.values });
      setActivePreset(presetId);
      showToast(`プリセット「${preset.label}」を適用しました`, "success");
    },
    [showToast],
  );

  const handleReset = useCallback(() => {
    setValues(getDefaultValues());
    setActivePreset(null);
    showToast("設定をリセットしました", "info");
  }, [showToast]);

  const handleCopy = useCallback(async () => {
    const success = await copy(output);
    if (success) {
      showToast("クリップボードにコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, output, showToast]);

  const currentCategory = useMemo(
    () => PRETTIER_CATEGORIES.find((c) => c.id === activeCategory),
    [activeCategory],
  );

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">.prettierrc ビルダー</h1>
        <p className="tool-description">
          Prettier のオプションを選択して .prettierrc を生成します。
          デフォルト値と異なる設定のみ出力します。
        </p>
      </div>

      <TipsCard
        tips={[
          "デフォルト値と同じオプションは出力に含まれません。変更した設定だけが .prettierrc に反映されます",
          'Prettier v3 からは trailingComma のデフォルトが "all" に変更されました',
          'endOfLine を "lf" に固定すると Windows/Mac 間での改行コードの違いを防げます',
          '.prettierrc の代わりに prettier.config.js や package.json の "prettier" キーでも設定できます',
        ]}
      />

      {/* プリセット選択 */}
      <section className="tool-section" aria-labelledby="presets-heading">
        <h2 id="presets-heading" className="tool-section-title">
          プリセット
        </h2>
        <div className="prettier-presets">
          {PRETTIER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`prettier-preset-btn${activePreset === preset.id ? " active" : ""}`}
              onClick={() => handlePreset(preset.id)}
              aria-pressed={activePreset === preset.id}
            >
              <span className="prettier-preset-name">{preset.label}</span>
              <span className="prettier-preset-desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* カテゴリタブ + オプション */}
      <section className="tool-section" aria-labelledby="options-heading">
        <h2 id="options-heading" className="tool-section-title">
          オプション設定
        </h2>

        {/* タブ */}
        <div className="prettier-tabs" role="tablist" aria-label="オプションカテゴリ">
          {PRETTIER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`prettier-tab${activeCategory === cat.id ? " active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* オプション一覧 */}
        {currentCategory && (
          <div
            className="prettier-options"
            role="tabpanel"
            aria-label={`${currentCategory.label} オプション`}
          >
            {currentCategory.options.map((option) => (
              <OptionRow
                key={option.key}
                option={option}
                value={values[option.key]}
                defaultValue={defaultValues[option.key]}
                onChange={handleChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* 出力 */}
      <section className="tool-section" aria-labelledby="output-heading">
        <div className="prettier-output-header">
          <h2 id="output-heading" className="prettier-output-title">
            .prettierrc
          </h2>
          <div className="prettier-action-row">
            <button type="button" className="prettier-reset-btn" onClick={handleReset}>
              リセット
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopy}
              aria-label=".prettierrc をクリップボードにコピー"
            >
              コピー
            </button>
          </div>
        </div>
        {output === "{}" ? (
          <p className="prettier-empty-msg">
            すべてデフォルト値のため .prettierrc は空です（{}）。変更したオプションが出力されます。
          </p>
        ) : (
          <textarea
            className="prettier-output"
            value={output}
            readOnly
            aria-label="生成された .prettierrc"
            aria-live="polite"
          />
        )}
      </section>
    </div>
  );
}
