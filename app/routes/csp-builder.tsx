import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useCallback, useRef, useId } from 'react';
import { useToast } from '../components/Toast';
import { TipsCard } from '~/components/TipsCard';
import { useStatusAnnouncement, StatusAnnouncer } from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import {
  ALL_CSP_DIRECTIVES,
  CSP_FETCH_DIRECTIVES,
  CSP_DOCUMENT_DIRECTIVES,
  CSP_OTHER_DIRECTIVES,
  CSP_COMMON_SOURCES,
  type CspDirectiveEntry,
  parseCsp,
  buildCsp,
  validateCsp,
  formatCspMultiline,
  getDefaultPolicy,
  getStrictPolicy,
} from '~/utils/csp-builder';

export const Route = createFileRoute('/csp-builder')({
  head: () => ({
    meta: [
      { title: 'CSP ビルダー | Web ツール集' },
      {
        name: 'description',
        content:
          'Content-Security-Policy ヘッダーをGUIで構築するツール。fetch・document・reporting の各ディレクティブを設定し、CSP 文字列を即座に生成。既存ヘッダーのパース・検証・セキュリティ警告にも対応。',
      },
      { property: 'og:title', content: 'CSP ビルダー | Web ツール集' },
      {
        property: 'og:description',
        content:
          'Content-Security-Policy ヘッダーをGUIで構築するツール。fetch・document・reporting の各ディレクティブを設定し、CSP 文字列を即座に生成。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/csp-builder` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'CSP ビルダー | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'Content-Security-Policy ヘッダーをGUIで構築するツール。',
      },
    ],
  }),
  component: CspBuilderPage,
});

/** モード定義 */
type Mode = 'build' | 'parse';

/** ディレクティブ入力行コンポーネント */
function DirectiveRow({
  entry,
  onToggle,
  onUpdateSources,
  onRemove,
}: {
  entry: CspDirectiveEntry;
  onToggle: (name: string) => void;
  onUpdateSources: (name: string, sources: string) => void;
  onRemove: (name: string) => void;
}) {
  const info = ALL_CSP_DIRECTIVES.find((d) => d.name === entry.name);
  const inputId = useId();

  return (
    <div className={`csp-directive-row ${!entry.enabled ? 'csp-directive-row-disabled' : ''}`}>
      <div className="csp-directive-row-header">
        <label className="csp-directive-toggle" title={entry.enabled ? '無効化' : '有効化'}>
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={() => onToggle(entry.name)}
            aria-label={`${entry.name} を${entry.enabled ? '無効化' : '有効化'}`}
          />
        </label>
        <div className="csp-directive-name-wrap">
          <code className="csp-directive-name">{entry.name}</code>
          {info?.deprecated && (
            <span className="csp-deprecated-badge" title="非推奨">非推奨</span>
          )}
        </div>
        <button
          type="button"
          className="csp-remove-btn"
          onClick={() => onRemove(entry.name)}
          aria-label={`${entry.name} を削除`}
          title="削除"
        >
          ✕
        </button>
      </div>
      {info && (
        <p className="csp-directive-description">{info.description}</p>
      )}
      {(!info || info.hasSourceList) && (
        <div className="csp-sources-input-wrap">
          <label htmlFor={inputId} className="sr-only">
            {entry.name} のソース値
          </label>
          <input
            id={inputId}
            type="text"
            className="csp-sources-input"
            value={entry.sources.join(' ')}
            onChange={(e) => onUpdateSources(entry.name, e.target.value)}
            placeholder="例: 'self' https://cdn.example.com"
            disabled={!entry.enabled}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      )}
      {/* ソースクイック入力チップ */}
      {(!info || info.hasSourceList) && entry.enabled && (
        <div className="csp-source-chips" aria-label="よく使うソース値">
          {CSP_COMMON_SOURCES.map((src) => (
            <button
              key={src.value}
              type="button"
              className={`csp-source-chip ${src.risky ? 'csp-source-chip-risky' : ''}`}
              title={src.description}
              onClick={() => {
                const current = entry.sources;
                if (!current.includes(src.value)) {
                  onUpdateSources(entry.name, [...current, src.value].join(' '));
                }
              }}
              aria-label={`${src.value} を追加: ${src.description}`}
            >
              {src.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** CSP ビルダーメインコンポーネント */
function CspBuilderPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('build');
  const [directives, setDirectives] = useState<CspDirectiveEntry[]>(getDefaultPolicy);
  const [parseInput, setParseInput] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [showMultiline, setShowMultiline] = useState(false);
  const [addDirectiveName, setAddDirectiveName] = useState('');
  const parseInputRef = useRef<HTMLTextAreaElement>(null);

  // ビルド済み CSP 文字列
  const cspString = buildCsp(directives);
  const multilineString = formatCspMultiline(cspString);

  // 検証結果
  const validation = validateCsp(directives);

  // ディレクティブのトグル
  const handleToggle = useCallback((name: string) => {
    setDirectives((prev) =>
      prev.map((d) => (d.name === name ? { ...d, enabled: !d.enabled } : d))
    );
  }, []);

  // ソース更新
  const handleUpdateSources = useCallback((name: string, sourcesStr: string) => {
    const sources = sourcesStr.split(/\s+/).filter(Boolean);
    setDirectives((prev) =>
      prev.map((d) => (d.name === name ? { ...d, sources } : d))
    );
  }, []);

  // ディレクティブ削除
  const handleRemove = useCallback((name: string) => {
    setDirectives((prev) => prev.filter((d) => d.name !== name));
  }, []);

  // ディレクティブ追加
  const handleAddDirective = useCallback(() => {
    const name = addDirectiveName.trim().toLowerCase();
    if (!name) return;
    if (directives.some((d) => d.name === name)) {
      showToast(`"${name}" はすでに追加されています`, 'error');
      return;
    }
    const info = ALL_CSP_DIRECTIVES.find((d) => d.name === name);
    setDirectives((prev) => [
      ...prev,
      { name, sources: [], enabled: true },
    ]);
    setAddDirectiveName('');
    announceStatus(`${name} を追加しました`);
    void info; // suppress unused warning
  }, [addDirectiveName, directives, showToast, announceStatus]);

  // テンプレート適用
  const handleApplyTemplate = useCallback((template: 'default' | 'strict') => {
    const policy = template === 'default' ? getDefaultPolicy() : getStrictPolicy();
    setDirectives(policy);
    announceStatus(`${template === 'default' ? 'デフォルト' : '厳格な'} ポリシーを適用しました`);
  }, [announceStatus]);

  // パース実行
  const handleParse = useCallback(() => {
    const { directives: parsed, errors } = parseCsp(parseInput);
    if (parsed.length === 0 && errors.length === 0) {
      showToast('CSP ヘッダーを入力してください', 'error');
      return;
    }
    setDirectives(parsed);
    setParseErrors(errors);
    setMode('build');
    announceStatus(`${parsed.length} 件のディレクティブをパースしました`);
    if (errors.length > 0) {
      showToast(`${errors.length} 件の警告があります`, 'error');
    } else {
      showToast(`${parsed.length} 件のディレクティブをパースしました`, 'success');
    }
  }, [parseInput, showToast, announceStatus]);

  // クリップボードコピー
  const handleCopy = useCallback(async () => {
    if (!cspString) return;
    const success = await copy(cspString);
    if (success) {
      showToast('CSP ヘッダー値をコピーしました', 'success');
      announceStatus('CSP ヘッダー値をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [cspString, copy, showToast, announceStatus]);

  // クリア
  const handleClear = useCallback(() => {
    setDirectives([]);
    setParseInput('');
    setParseErrors([]);
    announceStatus('クリアしました');
  }, [announceStatus]);

  // 既存のディレクティブ名セット
  const usedNames = new Set(directives.map((d) => d.name));
  const availableDirectives = ALL_CSP_DIRECTIVES.filter((d) => !usedNames.has(d.name));

  return (
    <>
      <div className="tool-container">
        <h2 className="tool-title">CSP ビルダー</h2>
        <p className="tool-description">
          Content-Security-Policy ヘッダーをGUIで構築・パース・検証するツールです。
        </p>

        {/* モード切替 */}
        <div className="csp-mode-tabs" role="tablist" aria-label="モード選択">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'build'}
            className={`csp-mode-tab ${mode === 'build' ? 'csp-mode-tab-active' : ''}`}
            onClick={() => setMode('build')}
          >
            ビルド
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'parse'}
            className={`csp-mode-tab ${mode === 'parse' ? 'csp-mode-tab-active' : ''}`}
            onClick={() => setMode('parse')}
          >
            パース
          </button>
        </div>

        {/* パースモード */}
        {mode === 'parse' && (
          <div className="csp-parse-section">
            <label htmlFor="csp-parse-input" className="section-title">
              既存の CSP ヘッダー値を貼り付け
            </label>
            <textarea
              id="csp-parse-input"
              ref={parseInputRef}
              className="csp-parse-textarea"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder={"例: default-src 'self'; script-src 'self' https://cdn.example.com; img-src 'self' data:"}
              rows={5}
              spellCheck={false}
              autoComplete="off"
              aria-label="パースする CSP ヘッダー値"
            />
            <div className="csp-parse-actions">
              <button
                type="button"
                className="button-primary"
                onClick={handleParse}
                disabled={!parseInput.trim()}
              >
                パースしてビルダーに反映
              </button>
            </div>
          </div>
        )}

        {/* ビルドモード */}
        {mode === 'build' && (
          <>
            {/* テンプレート */}
            <div className="csp-templates">
              <span className="csp-templates-label">テンプレート:</span>
              <button
                type="button"
                className="csp-template-btn"
                onClick={() => handleApplyTemplate('default')}
                title="標準的なセキュアポリシーを適用"
              >
                デフォルト
              </button>
              <button
                type="button"
                className="csp-template-btn"
                onClick={() => handleApplyTemplate('strict')}
                title="nonce ベースの厳格なポリシーを適用"
              >
                厳格（nonce ベース）
              </button>
              <button
                type="button"
                className="csp-template-btn csp-template-btn-danger"
                onClick={handleClear}
                title="すべてクリア"
              >
                クリア
              </button>
            </div>

            {/* Fetch ディレクティブ */}
            <section className="csp-category-section" aria-labelledby="csp-cat-fetch">
              <h3 id="csp-cat-fetch" className="csp-category-heading">
                Fetch ディレクティブ
                <span className="csp-category-desc">リソース読み込みの制御</span>
              </h3>
              <div className="csp-directives-list">
                {directives.filter((d) => CSP_FETCH_DIRECTIVES.some((f) => f.name === d.name)).map((entry) => (
                  <DirectiveRow
                    key={entry.name}
                    entry={entry}
                    onToggle={handleToggle}
                    onUpdateSources={handleUpdateSources}
                    onRemove={handleRemove}
                  />
                ))}
                {directives.filter((d) => CSP_FETCH_DIRECTIVES.some((f) => f.name === d.name)).length === 0 && (
                  <p className="csp-empty-hint">Fetch ディレクティブがありません。下の「ディレクティブを追加」から追加してください。</p>
                )}
              </div>
            </section>

            {/* Document / Navigation ディレクティブ */}
            <section className="csp-category-section" aria-labelledby="csp-cat-doc">
              <h3 id="csp-cat-doc" className="csp-category-heading">
                Document / Navigation ディレクティブ
                <span className="csp-category-desc">ページ動作の制御</span>
              </h3>
              <div className="csp-directives-list">
                {directives.filter((d) => CSP_DOCUMENT_DIRECTIVES.some((f) => f.name === d.name)).map((entry) => (
                  <DirectiveRow
                    key={entry.name}
                    entry={entry}
                    onToggle={handleToggle}
                    onUpdateSources={handleUpdateSources}
                    onRemove={handleRemove}
                  />
                ))}
                {directives.filter((d) => CSP_DOCUMENT_DIRECTIVES.some((f) => f.name === d.name)).length === 0 && (
                  <p className="csp-empty-hint">Document ディレクティブがありません。</p>
                )}
              </div>
            </section>

            {/* その他のディレクティブ */}
            <section className="csp-category-section" aria-labelledby="csp-cat-other">
              <h3 id="csp-cat-other" className="csp-category-heading">
                その他のディレクティブ
                <span className="csp-category-desc">セキュリティ強化・レポート</span>
              </h3>
              <div className="csp-directives-list">
                {directives.filter((d) => CSP_OTHER_DIRECTIVES.some((f) => f.name === d.name)).map((entry) => (
                  <DirectiveRow
                    key={entry.name}
                    entry={entry}
                    onToggle={handleToggle}
                    onUpdateSources={handleUpdateSources}
                    onRemove={handleRemove}
                  />
                ))}
                {directives.filter((d) => CSP_OTHER_DIRECTIVES.some((f) => f.name === d.name)).length === 0 && (
                  <p className="csp-empty-hint">その他のディレクティブがありません。</p>
                )}
              </div>
            </section>

            {/* カスタムディレクティブ */}
            {directives.filter(
              (d) => !ALL_CSP_DIRECTIVES.some((def) => def.name === d.name)
            ).length > 0 && (
              <section className="csp-category-section" aria-labelledby="csp-cat-custom">
                <h3 id="csp-cat-custom" className="csp-category-heading">
                  カスタムディレクティブ
                </h3>
                <div className="csp-directives-list">
                  {directives.filter(
                    (d) => !ALL_CSP_DIRECTIVES.some((def) => def.name === d.name)
                  ).map((entry) => (
                    <DirectiveRow
                      key={entry.name}
                      entry={entry}
                      onToggle={handleToggle}
                      onUpdateSources={handleUpdateSources}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ディレクティブ追加 */}
            <div className="csp-add-section">
              <label htmlFor="csp-add-directive" className="csp-add-label">
                ディレクティブを追加
              </label>
              <div className="csp-add-row">
                <select
                  id="csp-add-directive"
                  className="csp-add-select"
                  value={addDirectiveName}
                  onChange={(e) => setAddDirectiveName(e.target.value)}
                  aria-label="追加するディレクティブを選択"
                >
                  <option value="">-- ディレクティブを選択 --</option>
                  {availableDirectives.length > 0 ? (
                    availableDirectives.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}{d.deprecated ? ' (非推奨)' : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>利用可能なディレクティブがありません</option>
                  )}
                </select>
                <button
                  type="button"
                  className="button-primary csp-add-btn"
                  onClick={handleAddDirective}
                  disabled={!addDirectiveName}
                  aria-label="選択したディレクティブを追加"
                >
                  追加
                </button>
              </div>
            </div>
          </>
        )}

        {/* 生成結果 */}
        {mode === 'build' && (
          <div className="csp-output-section">
            <div className="csp-output-header">
              <h3 className="section-title">生成された CSP ヘッダー値</h3>
              <div className="csp-output-controls">
                <label className="csp-multiline-toggle">
                  <input
                    type="checkbox"
                    checked={showMultiline}
                    onChange={(e) => setShowMultiline(e.target.checked)}
                    aria-label="複数行表示に切り替え"
                  />
                  <span>複数行表示</span>
                </label>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleCopy}
                  disabled={!cspString}
                  aria-label="CSP ヘッダー値をクリップボードにコピー"
                >
                  コピー
                </button>
              </div>
            </div>

            {cspString ? (
              <div className="csp-output-box" role="region" aria-label="生成された CSP">
                <code className="csp-output-code" aria-label="Content-Security-Policy の値">
                  {showMultiline ? multilineString : cspString}
                </code>
              </div>
            ) : (
              <div className="csp-output-empty">
                有効なディレクティブが設定されていません
              </div>
            )}

            {cspString && (
              <div className="csp-http-example">
                <p className="csp-http-example-label">HTTP レスポンスヘッダー例:</p>
                <code className="csp-output-code">
                  Content-Security-Policy: {cspString}
                </code>
              </div>
            )}
          </div>
        )}

        {/* パースエラー */}
        {parseErrors.length > 0 && (
          <div className="csp-errors-section" role="alert">
            <h3 className="csp-validation-heading csp-validation-heading-error">
              パースエラー
            </h3>
            <ul className="csp-validation-list">
              {parseErrors.map((e, i) => (
                <li key={i} className="csp-validation-item csp-validation-item-error">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 検証結果 */}
        {mode === 'build' && cspString && (validation.warnings.length > 0 || validation.suggestions.length > 0) && (
          <div className="csp-validation-section" role="region" aria-label="CSP 検証結果">
            {validation.warnings.length > 0 && (
              <div className="csp-validation-group">
                <h3 className="csp-validation-heading csp-validation-heading-warning">
                  ⚠️ セキュリティ警告 ({validation.warnings.length})
                </h3>
                <ul className="csp-validation-list">
                  {validation.warnings.map((w, i) => (
                    <li key={i} className="csp-validation-item csp-validation-item-warning">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {validation.suggestions.length > 0 && (
              <div className="csp-validation-group">
                <h3 className="csp-validation-heading csp-validation-heading-suggestion">
                  💡 改善提案 ({validation.suggestions.length})
                </h3>
                <ul className="csp-validation-list">
                  {validation.suggestions.map((s, i) => (
                    <li key={i} className="csp-validation-item csp-validation-item-suggestion">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'CSP とは',
              items: [
                'Content-Security-Policy は XSS（クロスサイトスクリプティング）などの攻撃を防ぐための HTTP レスポンスヘッダーです',
                'どのオリジン・スキームからリソースを読み込めるかをブラウザに指示します',
                'CSP Level 3 仕様では nonce や hash を使った厳格なポリシーが推奨されています',
                'まず report-only モード（Content-Security-Policy-Report-Only）でテストし、問題がなければ本番適用することを推奨します',
              ],
            },
            {
              title: 'よく使うソース値',
              items: [
                "'none': すべてブロック（最も安全）",
                "'self': 同一オリジンのみ許可",
                "'unsafe-inline': インラインコードを許可（XSS リスクあり）",
                "'unsafe-eval': eval() を許可（XSS リスクあり）",
                "'strict-dynamic': nonce/hash で信頼されたスクリプトが動的追加するスクリプトを許可",
                "'nonce-{値}': 特定の nonce を持つ要素のみ許可（サーバーで毎リクエスト生成）",
              ],
            },
            {
              title: '実装のコツ',
              items: [
                '最初に default-src を設定し、必要なディレクティブだけ上書きするのが定番パターンです',
                "object-src 'none' を設定するとプラグイン（Flash 等）経由の XSS を防げます",
                "base-uri 'self' を設定すると <base> タグを使ったリダイレクト攻撃を防げます",
                "frame-ancestors 'none' を設定するとクリックジャッキング攻撃を防げます（X-Frame-Options の代替）",
                '違反レポートを受け取るには report-to ディレクティブと Reporting API を組み合わせてください',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
