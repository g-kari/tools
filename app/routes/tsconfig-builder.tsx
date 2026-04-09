import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useId } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import {
  TSCONFIG_CATEGORIES,
  TSCONFIG_PRESETS,
  generateTsConfig,
  getDefaultValues,
  type TsConfigOption,
} from "~/utils/tsconfig-builder";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import "~/styles/tools/tsconfig-builder.css";

export const Route = createFileRoute("/tsconfig-builder")({
  head: () => ({
    meta: [
      { title: "tsconfig.json ビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "TypeScript のコンパイラオプションを選択して tsconfig.json を自動生成。Node.js・Vite・Next.js・ライブラリなどのプリセットに対応。strict・module・target・jsx など主要オプションをカテゴリ別に設定できます。",
      },
      {
        property: "og:title",
        content: "tsconfig.json ビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "TypeScript コンパイラオプションを選択して tsconfig.json を自動生成。プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/tsconfig-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "tsconfig.json ビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "TypeScript コンパイラオプションをカテゴリ別に設定して tsconfig.json を生成",
      },
    ],
  }),
  component: TsConfigBuilderPage,
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
    <label className="tsconfig-toggle" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`tsconfig-toggle-track${value ? " checked" : ""}`}>
        <span className="tsconfig-toggle-thumb" />
      </span>
      <span className="tsconfig-toggle-label">{value ? "true" : "false"}</span>
    </label>
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
      className="tsconfig-select"
      value={value as string}
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

/** 複数選択オプション（lib など）のチップコンポーネント */
function MultiCheckList({
  optionKey,
  value,
  choices,
  onChange,
}: {
  optionKey: string;
  value: string[];
  choices: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = useCallback(
    (item: string) => {
      if (value.includes(item)) {
        onChange(value.filter((v) => v !== item));
      } else {
        onChange([...value, item]);
      }
    },
    [value, onChange],
  );

  return (
    <div className="tsconfig-checklist" role="group" aria-label={`${optionKey} の選択`}>
      {choices.map((c) => (
        <button
          key={c}
          type="button"
          className={`tsconfig-check-chip${value.includes(c) ? " selected" : ""}`}
          onClick={() => toggle(c)}
          aria-pressed={value.includes(c)}
        >
          {value.includes(c) && <span aria-hidden="true">✓</span>}
          {c}
        </button>
      ))}
    </div>
  );
}

/** 文字列入力コンポーネント */
function StringInput({
  optionKey,
  value,
  onChange,
}: {
  optionKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputId = useId();
  return (
    <input
      id={inputId}
      className="tsconfig-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`例: ./dist`}
      aria-label={optionKey}
    />
  );
}

/** オプション1行分のコンポーネント */
function OptionRow({
  option,
  value,
  onChange,
}: {
  option: TsConfigOption;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
}) {
  const isEnabled =
    option.type === "boolean"
      ? (value as boolean)
      : option.type === "string"
        ? (value as string) !== ""
        : option.type === "list"
          ? (value as string[]).length > 0
          : true;

  return (
    <div className={`tsconfig-option-row${isEnabled ? " enabled" : ""}`}>
      <div className="tsconfig-option-label-col">
        <span className="tsconfig-option-key">{option.key}</span>
        <span className="tsconfig-option-desc">{option.description}</span>
        {option.recommended && option.recommended.length > 0 && (
          <div className="tsconfig-option-recommended">
            {option.recommended.map((r) => (
              <span key={r} className="tsconfig-option-badge">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="tsconfig-option-input-col">
        {option.type === "boolean" && (
          <BooleanToggle
            optionKey={option.key}
            value={value as boolean}
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
        {option.type === "list" && (
          <MultiCheckList
            optionKey={option.key}
            value={value as string[]}
            choices={option.choices ?? []}
            onChange={(v) => onChange(option.key, v)}
          />
        )}
        {option.type === "string" && (
          <StringInput
            optionKey={option.key}
            value={value as string}
            onChange={(v) => onChange(option.key, v)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * tsconfig.json ビルダーページ
 */
function TsConfigBuilderPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const [values, setValues] = useState<Record<string, unknown>>(getDefaultValues);
  const [activeCategory, setActiveCategory] = useState(TSCONFIG_CATEGORIES[0].id);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const output = useMemo(() => generateTsConfig(values), [values]);

  const handleChange = useCallback((key: string, val: unknown) => {
    setActivePreset(null);
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = TSCONFIG_PRESETS.find((p) => p.id === presetId);
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
    () => TSCONFIG_CATEGORIES.find((c) => c.id === activeCategory),
    [activeCategory],
  );

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">tsconfig.json ビルダー</h1>
        <p className="tool-description">
          TypeScript のコンパイラオプションを選択して tsconfig.json を生成します。
          プリセットから始めて細かく調整することもできます。
        </p>
      </div>

      <TipsCard
        tips={[
          "strict を有効にすると noImplicitAny・strictNullChecks などがまとめて有効になります",
          "Vite や esbuild を使う場合は noEmit と isolatedModules を有効にするのが推奨です",
          "ライブラリ開発では declaration と declarationMap を有効にして型定義ファイルを生成しましょう",
          "skipLibCheck を有効にすると依存ライブラリの型エラーを無視でき、ビルドが高速になります",
        ]}
      />

      {/* プリセット選択 */}
      <section className="tool-section" aria-labelledby="presets-heading">
        <h2 id="presets-heading" className="tool-section-title">
          プリセット
        </h2>
        <div className="tsconfig-presets">
          {TSCONFIG_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`tsconfig-preset-btn${activePreset === preset.id ? " active" : ""}`}
              onClick={() => handlePreset(preset.id)}
              aria-pressed={activePreset === preset.id}
            >
              <span className="tsconfig-preset-name">{preset.label}</span>
              <span className="tsconfig-preset-desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* カテゴリタブ + オプション */}
      <section className="tool-section" aria-labelledby="options-heading">
        <h2 id="options-heading" className="tool-section-title">
          コンパイラオプション
        </h2>

        {/* タブ */}
        <div className="tsconfig-tabs" role="tablist" aria-label="オプションカテゴリ">
          {TSCONFIG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`tsconfig-tab${activeCategory === cat.id ? " active" : ""}`}
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
            className="tsconfig-options"
            role="tabpanel"
            aria-label={`${currentCategory.label} オプション`}
          >
            {currentCategory.options.map((option) => (
              <OptionRow
                key={option.key}
                option={option}
                value={values[option.key]}
                onChange={handleChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* 出力 */}
      <section className="tool-section" aria-labelledby="output-heading">
        <div className="tsconfig-output-header">
          <h2 id="output-heading" className="tsconfig-output-title">
            tsconfig.json
          </h2>
          <div className="tsconfig-action-row">
            <button type="button" className="tsconfig-reset-btn" onClick={handleReset}>
              リセット
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopy}
              aria-label="tsconfig.json をクリップボードにコピー"
            >
              コピー
            </button>
          </div>
        </div>
        <textarea
          className="tsconfig-output"
          value={output}
          readOnly
          aria-label="生成された tsconfig.json"
          aria-live="polite"
        />
      </section>
    </div>
  );
}
