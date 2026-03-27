import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import {
  generatePackageJson,
  getDefaultConfig,
  PRESETS,
  SCRIPT_TEMPLATES,
  LICENSE_OPTIONS,
  MODULE_TYPE_OPTIONS,
  type PackageJsonConfig,
  type ScriptEntry,
} from '../utils/package-json';
import '../styles/tools/package-json.css';

export const Route = createFileRoute('/package-json')({
  head: () => ({
    meta: [
      { title: 'package.json ビルダー | Web ツール集' },
      {
        name: 'description',
        content:
          'npm の package.json をGUIで生成するツール。基本情報・scripts・keywords・エントリポイントをフォームで設定。Node.js CLI・Webアプリ・ライブラリ向けプリセット付き。',
      },
      {
        property: 'og:title',
        content: 'package.json ビルダー | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'npm の package.json をGUIで生成するツール。基本情報・scripts・keywords・エントリポイントをフォームで設定。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/package-json` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'package.json ビルダー | Web ツール集',
      },
      {
        name: 'twitter:description',
        content: 'npm の package.json をGUIで生成するツール。プリセット付き。',
      },
    ],
  }),
  component: PackageJsonBuilderPage,
});

/** package.json ビルダーページ */
function PackageJsonBuilderPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<PackageJsonConfig>(getDefaultConfig);
  const [keywordInput, setKeywordInput] = useState('');

  const output = useMemo(() => generatePackageJson(config), [config]);

  /** プリセットを適用する */
  const applyPreset = useCallback((index: number) => {
    const preset = PRESETS[index];
    setConfig((prev) => {
      const merged = { ...getDefaultConfig(), ...prev };
      if (preset.config.basic) merged.basic = { ...merged.basic, ...preset.config.basic, author: { ...merged.basic.author, ...preset.config.basic.author } };
      if (preset.config.entries) merged.entries = { ...merged.entries, ...preset.config.entries };
      if (preset.config.scripts) merged.scripts = preset.config.scripts;
      if (preset.config.keywords) merged.keywords = preset.config.keywords;
      return merged;
    });
    announceStatus(`プリセット「${preset.label}」を適用しました`);
  }, [announceStatus]);

  /** 基本情報フィールドを更新する */
  const updateBasic = useCallback(<K extends keyof PackageJsonConfig['basic']>(
    key: K,
    value: PackageJsonConfig['basic'][K]
  ) => {
    setConfig((prev) => ({ ...prev, basic: { ...prev.basic, [key]: value } }));
  }, []);

  /** author フィールドを更新する */
  const updateAuthor = useCallback(<K extends keyof PackageJsonConfig['basic']['author']>(
    key: K,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      basic: { ...prev.basic, author: { ...prev.basic.author, [key]: value } },
    }));
  }, []);

  /** エントリポイントフィールドを更新する */
  const updateEntry = useCallback(<K extends keyof PackageJsonConfig['entries']>(
    key: K,
    value: string
  ) => {
    setConfig((prev) => ({ ...prev, entries: { ...prev.entries, [key]: value } }));
  }, []);

  /** scripts エントリを追加する */
  const addScript = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      scripts: [...prev.scripts, { key: '', value: '' }],
    }));
  }, []);

  /** テンプレートからスクリプトを追加する */
  const addTemplateScript = useCallback((template: ScriptEntry) => {
    setConfig((prev) => {
      if (prev.scripts.some((s) => s.key === template.key)) {
        showToast(`"${template.key}" は既に追加されています`, 'warning');
        return prev;
      }
      return { ...prev, scripts: [...prev.scripts, { ...template }] };
    });
  }, [showToast]);

  /** scripts エントリを更新する */
  const updateScript = useCallback((index: number, field: keyof ScriptEntry, value: string) => {
    setConfig((prev) => {
      const scripts = [...prev.scripts];
      scripts[index] = { ...scripts[index], [field]: value };
      return { ...prev, scripts };
    });
  }, []);

  /** scripts エントリを削除する */
  const removeScript = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      scripts: prev.scripts.filter((_, i) => i !== index),
    }));
  }, []);

  /** キーワードを追加する */
  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (!kw) return;
    setConfig((prev) => {
      if (prev.keywords.includes(kw)) {
        showToast(`"${kw}" は既に追加されています`, 'warning');
        return prev;
      }
      return { ...prev, keywords: [...prev.keywords, kw] };
    });
    setKeywordInput('');
  }, [keywordInput, showToast]);

  /** キーワードを削除する */
  const removeKeyword = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  }, []);

  /** クリップボードにコピーする */
  const handleCopy = useCallback(async () => {
    const success = await copy(output);
    if (success) {
      announceStatus('package.json をコピーしました');
      showToast('コピーしました', 'success');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [output, copy, announceStatus, showToast]);

  /** ファイルとしてダウンロードする */
  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'package.json';
    a.click();
    URL.revokeObjectURL(url);
    announceStatus('package.json をダウンロードしました');
  }, [output, announceStatus]);

  return (
    <>
      <div className="pkgjson-container">
        {/* プリセット */}
        <div className="pkgjson-presets" aria-label="プリセット選択">
          <span className="pkgjson-presets-label">プリセット:</span>
          {PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              className="pkgjson-preset-btn"
              onClick={() => applyPreset(i)}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 基本情報 */}
        <section className="pkgjson-section" aria-labelledby="pkgjson-basic-title">
          <h2 className="pkgjson-section-title" id="pkgjson-basic-title">基本情報</h2>

          <div className="pkgjson-grid-2">
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-name" className="pkgjson-label">name</label>
              <input
                id="pkgjson-name"
                type="text"
                className="pkgjson-input"
                value={config.basic.name}
                onChange={(e) => updateBasic('name', e.target.value)}
                placeholder="my-package"
                spellCheck={false}
                autoComplete="off"
                aria-describedby="pkgjson-name-hint"
              />
              <span id="pkgjson-name-hint" className="pkgjson-hint">npm パッケージ名（スコープ付き可: @scope/name）</span>
            </div>

            <div className="pkgjson-field">
              <label htmlFor="pkgjson-version" className="pkgjson-label">version</label>
              <input
                id="pkgjson-version"
                type="text"
                className="pkgjson-input"
                value={config.basic.version}
                onChange={(e) => updateBasic('version', e.target.value)}
                placeholder="1.0.0"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="pkgjson-field">
            <label htmlFor="pkgjson-description" className="pkgjson-label">description</label>
            <input
              id="pkgjson-description"
              type="text"
              className="pkgjson-input"
              value={config.basic.description}
              onChange={(e) => updateBasic('description', e.target.value)}
              placeholder="パッケージの説明"
              autoComplete="off"
            />
          </div>

          <div className="pkgjson-grid-2">
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-license" className="pkgjson-label">license</label>
              <select
                id="pkgjson-license"
                className="pkgjson-select"
                value={config.basic.license}
                onChange={(e) => updateBasic('license', e.target.value)}
              >
                {LICENSE_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="pkgjson-field">
              <label htmlFor="pkgjson-type" className="pkgjson-label">type</label>
              <select
                id="pkgjson-type"
                className="pkgjson-select"
                value={config.basic.type}
                onChange={(e) => updateBasic('type', e.target.value as PackageJsonConfig['basic']['type'])}
              >
                {MODULE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="pkgjson-checkbox-row">
            <input
              type="checkbox"
              checked={config.basic.private}
              onChange={(e) => updateBasic('private', e.target.checked)}
              aria-describedby="pkgjson-private-hint"
            />
            private（npm に公開しない）
          </label>
          <span id="pkgjson-private-hint" className="pkgjson-hint sr-only">
            true にすると npm publish が禁止されます
          </span>
        </section>

        {/* 作者情報 */}
        <section className="pkgjson-section" aria-labelledby="pkgjson-author-title">
          <h2 className="pkgjson-section-title" id="pkgjson-author-title">作者情報 (author)</h2>
          <div className="pkgjson-grid-3">
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-author-name" className="pkgjson-label">名前</label>
              <input
                id="pkgjson-author-name"
                type="text"
                className="pkgjson-input"
                value={config.basic.author.name}
                onChange={(e) => updateAuthor('name', e.target.value)}
                placeholder="Your Name"
                autoComplete="off"
              />
            </div>
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-author-email" className="pkgjson-label">メール</label>
              <input
                id="pkgjson-author-email"
                type="email"
                className="pkgjson-input"
                value={config.basic.author.email}
                onChange={(e) => updateAuthor('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
              />
            </div>
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-author-url" className="pkgjson-label">URL</label>
              <input
                id="pkgjson-author-url"
                type="url"
                className="pkgjson-input"
                value={config.basic.author.url}
                onChange={(e) => updateAuthor('url', e.target.value)}
                placeholder="https://example.com"
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        {/* エントリポイント */}
        <section className="pkgjson-section" aria-labelledby="pkgjson-entries-title">
          <h2 className="pkgjson-section-title" id="pkgjson-entries-title">エントリポイント</h2>
          <div className="pkgjson-grid-3">
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-main" className="pkgjson-label">main</label>
              <input
                id="pkgjson-main"
                type="text"
                className="pkgjson-input"
                value={config.entries.main}
                onChange={(e) => updateEntry('main', e.target.value)}
                placeholder="dist/index.js"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-module" className="pkgjson-label">module (ESM)</label>
              <input
                id="pkgjson-module"
                type="text"
                className="pkgjson-input"
                value={config.entries.module}
                onChange={(e) => updateEntry('module', e.target.value)}
                placeholder="dist/index.esm.js"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className="pkgjson-field">
              <label htmlFor="pkgjson-types" className="pkgjson-label">types (TypeScript)</label>
              <input
                id="pkgjson-types"
                type="text"
                className="pkgjson-input"
                value={config.entries.types}
                onChange={(e) => updateEntry('types', e.target.value)}
                placeholder="dist/index.d.ts"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        {/* scripts */}
        <section className="pkgjson-section" aria-labelledby="pkgjson-scripts-title">
          <h2 className="pkgjson-section-title" id="pkgjson-scripts-title">scripts</h2>

          <div className="pkgjson-template-group" role="group" aria-label="テンプレートスクリプトを追加">
            <span className="pkgjson-hint">テンプレートから追加:</span>
            {SCRIPT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                className="pkgjson-template-btn"
                onClick={() => addTemplateScript(tpl)}
                aria-label={`${tpl.key} スクリプトを追加`}
              >
                + {tpl.key}
              </button>
            ))}
          </div>

          <div className="pkgjson-scripts-list" role="list" aria-label="scripts 一覧">
            {config.scripts.map((script, i) => (
              <div key={i} className="pkgjson-script-row" role="listitem">
                <input
                  type="text"
                  className="pkgjson-script-key"
                  value={script.key}
                  onChange={(e) => updateScript(i, 'key', e.target.value)}
                  placeholder="script name"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={`スクリプト ${i + 1} の名前`}
                />
                <input
                  type="text"
                  className="pkgjson-script-value"
                  value={script.value}
                  onChange={(e) => updateScript(i, 'value', e.target.value)}
                  placeholder="command"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={`スクリプト ${i + 1} のコマンド`}
                />
                <button
                  type="button"
                  className="pkgjson-remove-btn"
                  onClick={() => removeScript(i)}
                  aria-label={`スクリプト "${script.key || i + 1}" を削除`}
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="pkgjson-add-btn"
            onClick={addScript}
          >
            + スクリプトを追加
          </button>
        </section>

        {/* keywords */}
        <section className="pkgjson-section" aria-labelledby="pkgjson-keywords-title">
          <h2 className="pkgjson-section-title" id="pkgjson-keywords-title">keywords</h2>
          <div className="pkgjson-keywords-wrapper">
            <div className="pkgjson-tags" role="list" aria-label="キーワード一覧">
              {config.keywords.map((kw, i) => (
                <span key={i} className="pkgjson-tag" role="listitem">
                  {kw}
                  <button
                    type="button"
                    className="pkgjson-tag-remove"
                    onClick={() => removeKeyword(i)}
                    aria-label={`キーワード "${kw}" を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="pkgjson-keyword-input-row">
              <input
                type="text"
                className="pkgjson-keyword-input"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="キーワードを入力して Enter"
                aria-label="追加するキーワード"
                aria-describedby="pkgjson-keyword-hint"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="pkgjson-add-btn"
                onClick={addKeyword}
              >
                追加
              </button>
            </div>
            <span id="pkgjson-keyword-hint" className="pkgjson-hint">
              Enter キーまたは「追加」ボタンでキーワードを追加できます
            </span>
          </div>
        </section>

        {/* 出力 */}
        <section className="pkgjson-section" aria-labelledby="pkgjson-output-title">
          <h2 className="pkgjson-section-title" id="pkgjson-output-title">生成された package.json</h2>
          <div className="pkgjson-output-wrapper">
            <pre className="pkgjson-code-block" aria-live="polite" aria-label="生成された package.json">
              <code>{output}</code>
            </pre>
          </div>
          <div className="pkgjson-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              aria-label="package.json をクリップボードにコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              aria-label="package.json をファイルとしてダウンロード"
            >
              ダウンロード
            </button>
          </div>
        </section>
      </div>

      <TipsCard
        sections={[
          {
            title: 'package.json とは',
            items: [
              'npm パッケージのマニフェストファイルで、プロジェクトのメタデータを管理します',
              'name・version・description・author・license などの基本情報を記述します',
              'scripts フィールドで npm run コマンドのエイリアスを定義できます',
              'private: true にすると npm publish が禁止され、プライベートプロジェクトに適しています',
            ],
          },
          {
            title: 'type フィールド',
            items: [
              '"module" を設定すると .js ファイルが ES Module として扱われます',
              '"commonjs" を設定すると .js ファイルが CommonJS として扱われます（デフォルト）',
              'Node.js v12 以降で利用可能。Vite・ESBuild などのバンドラーでも参照されます',
              '省略した場合は CommonJS として扱われます',
            ],
          },
          {
            title: 'エントリポイント',
            items: [
              'main: CommonJS 向けのエントリポイント（require() で読み込まれる）',
              'module: ESM 向けのエントリポイント（バンドラーが優先して使用）',
              'types: TypeScript の型定義ファイル（.d.ts）へのパス',
              'ライブラリを公開する場合はこれらを適切に設定してください',
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
