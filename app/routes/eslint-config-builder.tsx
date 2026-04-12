import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useId } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import {
  ESLINT_CATEGORIES,
  ESLINT_PRESETS,
  generateEslintConfig,
  generateInstallCommand,
  getConfigFileName,
  getDefaultValues,
  type EslintOption,
} from "~/utils/eslint-config-builder";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";
import "~/styles/tools/eslint-config-builder.css";

export const Route = createFileRoute("/eslint-config-builder")({
  head: () => ({
    meta: [
      { title: "ESLint Config ビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "ESLint の設定をカテゴリ別に選択して eslint.config.js または .eslintrc.json を自動生成。TypeScript・React・コード品質ルールをプリセットから素早く設定。ESLint 9 のフラット設定形式に対応。",
      },
      {
        property: "og:title",
        content: "ESLint Config ビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "ESLint オプションを選択して eslint.config.js / .eslintrc.json を自動生成。TypeScript・React プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/eslint-config-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ESLint Config ビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "ESLint オプションをカテゴリ別に設定して設定ファイルを自動生成",
      },
    ],
  }),
  component: EslintConfigBuilderPage,
});

/** ブール型オプションのトグルコンポーネント */
function BooleanToggle({
  optionKey: _optionKey,
  value,
  onChange,
}: {
  optionKey: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const inputId = useId();
  return (
    <label className="eslint-toggle" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`eslint-toggle-track${value ? " checked" : ""}`}>
        <span className="eslint-toggle-thumb" />
      </span>
      <span className="eslint-toggle-label">{value ? "true" : "false"}</span>
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
      className="eslint-select"
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
  option: EslintOption;
  value: boolean | string;
  defaultValue: boolean | string;
  onChange: (key: string, val: boolean | string) => void;
}) {
  const isModified = value !== defaultValue;

  return (
    <div className={`eslint-option-row${isModified ? " modified" : ""}`}>
      <div className="eslint-option-label-col">
        <span className="eslint-option-key">{option.key}</span>
        <span className="eslint-option-desc">{option.description}</span>
        {option.recommended && option.recommended.length > 0 && (
          <div className="eslint-option-recommended">
            {option.recommended.map((r) => (
              <span key={r} className="eslint-option-badge">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="eslint-option-input-col">
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
      </div>
    </div>
  );
}

/**
 * ESLint Config ビルダーページ
 */
function EslintConfigBuilderPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const defaultValues = useMemo(() => getDefaultValues(), []);
  const [values, setValues] = useState<Record<string, boolean | string>>(() => getDefaultValues());
  const [activeCategory, setActiveCategory] = useState(ESLINT_CATEGORIES[0].id);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const output = useMemo(() => generateEslintConfig(values), [values]);
  const fileName = useMemo(() => getConfigFileName(values), [values]);
  const installCmd = useMemo(() => generateInstallCommand(values), [values]);

  const handleChange = useCallback((key: string, val: boolean | string) => {
    setActivePreset(null);
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = ESLINT_PRESETS.find((p) => p.id === presetId);
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

  const handleCopyConfig = useCallback(async () => {
    const success = await copy(output);
    if (success) {
      showToast("クリップボードにコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, output, showToast]);

  const handleCopyInstall = useCallback(async () => {
    const success = await copy(installCmd);
    if (success) {
      showToast("インストールコマンドをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, installCmd, showToast]);

  const currentCategory = useMemo(
    () => ESLINT_CATEGORIES.find((c) => c.id === activeCategory),
    [activeCategory],
  );

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">ESLint Config ビルダー</h1>
        <p className="tool-description">
          ESLint のオプションを選択して設定ファイルを生成します。 ESLint 9
          のフラット設定形式（eslint.config.js）とレガシー形式（.eslintrc.json）に対応しています。
        </p>
      </div>

      <TipsCard
        sections={[
          {
            title: "Tips",
            items: [
              "ESLint 9 以降はフラット設定形式（eslint.config.js）が標準です。新規プロジェクトではフラット設定を推奨します",
              "Prettier を使用している場合はスタイルルール（セミコロン・引用符・インデント）を ESLint で設定する必要はありません",
              "TypeScript プロジェクトでは @typescript-eslint/no-unused-vars が no-unused-vars の代わりに使われます",
              "strictTypeChecked を使うと型情報を活用した高精度なチェックが可能ですが、tsconfig.json の設定が必要です",
            ],
          },
        ]}
      />

      {/* プリセット選択 */}
      <section className="tool-section" aria-labelledby="presets-heading">
        <h2 id="presets-heading" className="tool-section-title">
          プリセット
        </h2>
        <div className="eslint-presets">
          {ESLINT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`eslint-preset-btn${activePreset === preset.id ? " active" : ""}`}
              onClick={() => handlePreset(preset.id)}
              aria-pressed={activePreset === preset.id}
            >
              <span className="eslint-preset-name">{preset.label}</span>
              <span className="eslint-preset-desc">{preset.description}</span>
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
        <div className="eslint-tabs" role="tablist" aria-label="オプションカテゴリ">
          {ESLINT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`eslint-tab${activeCategory === cat.id ? " active" : ""}`}
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
            className="eslint-options"
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
        <div className="eslint-output-header">
          <h2 id="output-heading" className="eslint-output-title">
            {fileName}
          </h2>
          <div className="eslint-action-row">
            <button type="button" className="eslint-reset-btn" onClick={handleReset}>
              リセット
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopyConfig}
              aria-label={`${fileName} をクリップボードにコピー`}
            >
              コピー
            </button>
          </div>
        </div>
        <textarea
          className="eslint-output"
          value={output}
          readOnly
          aria-label={`生成された ${fileName}`}
          aria-live="polite"
        />

        {/* インストールコマンド */}
        <div className="eslint-install-section">
          <p className="eslint-install-label">必要なパッケージ</p>
          <div className="eslint-install-cmd">
            <code className="eslint-install-code">{installCmd}</code>
            <button
              type="button"
              className="eslint-copy-install-btn"
              onClick={handleCopyInstall}
              aria-label="インストールコマンドをコピー"
            >
              コピー
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
