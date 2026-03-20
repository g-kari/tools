import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import {
  SHORTHAND_DEFINITIONS,
  expandShorthand,
  collapseShorthand,
  type LonghandProperty,
} from '../utils/css-shorthand';
import '../styles/tools/css-shorthand.css';

export const Route = createFileRoute('/css-shorthand')({
  head: () => ({
    meta: [
      { title: 'CSSショートハンド展開 | Web ツール集' },
      {
        name: 'description',
        content:
          'CSS のショートハンドプロパティ（margin・padding・border-radius・flex・gap など）を個別プロパティに展開、またはロングハンドからショートハンドに圧縮するツール。',
      },
      { property: 'og:title', content: 'CSSショートハンド展開 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'CSS ショートハンドと個別プロパティを相互変換するツール。margin・padding・border-radius・flex・gap など対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/css-shorthand` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'CSSショートハンド展開 | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'CSS ショートハンドと個別プロパティを相互変換するツール。',
      },
    ],
  }),
  component: CssShorthand,
});

/**
 * CSS ショートハンド展開・圧縮コンポーネント
 */
function CssShorthand() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  // 展開モードの状態
  const [expandProperty, setExpandProperty] = useState(SHORTHAND_DEFINITIONS[0].name);
  const [expandInput, setExpandInput] = useState('');
  const [expandResult, setExpandResult] = useState<LonghandProperty[] | null>(null);

  // 圧縮モードの状態
  const [collapseProperty, setCollapseProperty] = useState(SHORTHAND_DEFINITIONS[0].name);
  const [collapseInputs, setCollapseInputs] = useState<Record<string, string>>({});
  const [collapseResult, setCollapseResult] = useState<string | null>(null);

  const expandInputRef = useRef<HTMLInputElement>(null);

  const handleExpandPropertyChange = useCallback((property: string) => {
    setExpandProperty(property);
    setExpandInput('');
    setExpandResult(null);
  }, []);

  const handleCollapsePropertyChange = useCallback((property: string) => {
    setCollapseProperty(property);
    setCollapseInputs({});
    setCollapseResult(null);
  }, []);

  const handleExpand = useCallback(() => {
    const trimmed = expandInput.trim();
    if (!trimmed) {
      showToast('値を入力してください', 'error');
      announceStatus('エラー: 値を入力してください');
      expandInputRef.current?.focus();
      return;
    }
    const result = expandShorthand(expandProperty, trimmed);
    if (!result) {
      showToast('展開できませんでした。値を確認してください', 'error');
      announceStatus('エラー: 展開できませんでした');
      return;
    }
    setExpandResult(result);
    announceStatus(`${result.length}個のプロパティに展開しました`);
  }, [expandInput, expandProperty, showToast, announceStatus]);

  const handleCollapse = useCallback(() => {
    const def = SHORTHAND_DEFINITIONS.find((d) => d.name === collapseProperty);
    if (!def) return;

    const emptyLonghands = def.longhands.filter((lh) => !collapseInputs[lh]?.trim());
    if (emptyLonghands.length > 0) {
      showToast('全てのプロパティ値を入力してください', 'error');
      announceStatus('エラー: 未入力のプロパティがあります');
      return;
    }

    const cleanedInputs: Record<string, string> = {};
    for (const lh of def.longhands) {
      cleanedInputs[lh] = collapseInputs[lh].trim();
    }

    const result = collapseShorthand(collapseProperty, cleanedInputs);
    if (!result) {
      showToast('圧縮できませんでした', 'error');
      announceStatus('エラー: 圧縮できませんでした');
      return;
    }
    setCollapseResult(result);
    announceStatus(`${collapseProperty}: ${result} に圧縮しました`);
  }, [collapseInputs, collapseProperty, showToast, announceStatus]);

  const handleCopyExpanded = useCallback(async () => {
    if (!expandResult) return;
    const css = expandResult.map((lh) => `${lh.property}: ${lh.value};`).join('\n');
    try {
      await navigator.clipboard.writeText(css);
      showToast('展開結果をコピーしました', 'success');
      announceStatus('展開結果をクリップボードにコピーしました');
    } catch {
      showToast('コピーに失敗しました', 'error');
    }
  }, [expandResult, showToast, announceStatus]);

  const handleCopyCollapsed = useCallback(async () => {
    if (!collapseResult) return;
    const css = `${collapseProperty}: ${collapseResult};`;
    try {
      await navigator.clipboard.writeText(css);
      showToast('圧縮結果をコピーしました', 'success');
      announceStatus('圧縮結果をクリップボードにコピーしました');
    } catch {
      showToast('コピーに失敗しました', 'error');
    }
  }, [collapseResult, collapseProperty, showToast, announceStatus]);

  const expandDef = SHORTHAND_DEFINITIONS.find((d) => d.name === expandProperty)!;
  const collapseDef = SHORTHAND_DEFINITIONS.find((d) => d.name === collapseProperty)!;

  useEffect(() => {
    expandInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="css-shorthand-container">
        {/* 展開セクション */}
        <section className="css-shorthand-section" aria-labelledby="expand-heading">
          <h2 id="expand-heading" className="section-title">
            ショートハンド → ロングハンド展開
          </h2>

          <div className="css-shorthand-property-row">
            <label htmlFor="expand-property" className="css-shorthand-label">
              プロパティ
            </label>
            <select
              id="expand-property"
              className="css-shorthand-select"
              value={expandProperty}
              onChange={(e) => handleExpandPropertyChange(e.target.value)}
              aria-label="展開するショートハンドプロパティ"
            >
              {SHORTHAND_DEFINITIONS.map((def) => (
                <option key={def.name} value={def.name}>
                  {def.name}
                </option>
              ))}
            </select>
          </div>

          <p className="css-shorthand-description">{expandDef.description}</p>
          <p className="css-shorthand-syntax">
            <code>{expandDef.syntax}</code>
          </p>

          <div className="css-shorthand-input-row">
            <label htmlFor="expand-input" className="sr-only">
              {expandProperty} の値
            </label>
            <input
              id="expand-input"
              ref={expandInputRef}
              type="text"
              className="css-shorthand-input"
              value={expandInput}
              onChange={(e) => setExpandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExpand();
              }}
              placeholder={`例: ${expandDef.example.split(': ')[1]}`}
              aria-label={`${expandProperty} のショートハンド値`}
              aria-describedby="expand-input-help"
            />
          </div>
          <span id="expand-input-help" className="sr-only">
            Enter キーまたは展開ボタンで展開します
          </span>

          <div className="button-group" role="group" aria-label="展開操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleExpand}
              aria-label="ショートハンドをロングハンドに展開"
            >
              → 展開する
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={() => {
                setExpandInput('');
                setExpandResult(null);
                expandInputRef.current?.focus();
                announceStatus('クリアしました');
              }}
              aria-label="入力と結果をクリア"
            >
              クリア
            </Button>
          </div>

          {expandResult && (
            <div
              className="css-shorthand-result"
              aria-live="polite"
              aria-label="展開結果"
            >
              <div className="css-shorthand-result-header">
                <span className="css-shorthand-result-label">展開結果</span>
                <button
                  type="button"
                  className="css-shorthand-copy-button"
                  onClick={handleCopyExpanded}
                  aria-label="展開結果をコピー"
                >
                  コピー
                </button>
              </div>
              <div className="css-shorthand-result-list">
                {expandResult.map((lh) => (
                  <div key={lh.property} className="css-shorthand-result-item">
                    <span className="css-shorthand-prop-name">{lh.property}</span>
                    <span className="css-shorthand-colon">:&nbsp;</span>
                    <span className="css-shorthand-prop-value">{lh.value}</span>
                    <span className="css-shorthand-semicolon">;</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="css-shorthand-divider" role="separator" aria-hidden="true" />

        {/* 圧縮セクション */}
        <section className="css-shorthand-section" aria-labelledby="collapse-heading">
          <h2 id="collapse-heading" className="section-title">
            ロングハンド → ショートハンド圧縮
          </h2>

          <div className="css-shorthand-property-row">
            <label htmlFor="collapse-property" className="css-shorthand-label">
              プロパティ
            </label>
            <select
              id="collapse-property"
              className="css-shorthand-select"
              value={collapseProperty}
              onChange={(e) => handleCollapsePropertyChange(e.target.value)}
              aria-label="圧縮するロングハンドプロパティ"
            >
              {SHORTHAND_DEFINITIONS.map((def) => (
                <option key={def.name} value={def.name}>
                  {def.name}
                </option>
              ))}
            </select>
          </div>

          <p className="css-shorthand-description">{collapseDef.description}</p>

          <div
            className="css-shorthand-longhands"
            role="group"
            aria-label={`${collapseProperty} のロングハンドプロパティ入力`}
          >
            {collapseDef.longhands.map((lh) => (
              <div key={lh} className="css-shorthand-longhand-row">
                <label
                  htmlFor={`collapse-${lh}`}
                  className="css-shorthand-longhand-label"
                >
                  <code>{lh}</code>
                </label>
                <input
                  id={`collapse-${lh}`}
                  type="text"
                  className="css-shorthand-input"
                  value={collapseInputs[lh] ?? ''}
                  onChange={(e) =>
                    setCollapseInputs((prev) => ({ ...prev, [lh]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCollapse();
                  }}
                  placeholder="値を入力"
                  aria-label={`${lh} の値`}
                />
              </div>
            ))}
          </div>

          <div className="button-group" role="group" aria-label="圧縮操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleCollapse}
              aria-label="ロングハンドをショートハンドに圧縮"
            >
              → 圧縮する
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={() => {
                setCollapseInputs({});
                setCollapseResult(null);
                announceStatus('クリアしました');
              }}
              aria-label="入力と結果をクリア"
            >
              クリア
            </Button>
          </div>

          {collapseResult && (
            <div
              className="css-shorthand-result"
              aria-live="polite"
              aria-label="圧縮結果"
            >
              <div className="css-shorthand-result-header">
                <span className="css-shorthand-result-label">圧縮結果</span>
                <button
                  type="button"
                  className="css-shorthand-copy-button"
                  onClick={handleCopyCollapsed}
                  aria-label="圧縮結果をコピー"
                >
                  コピー
                </button>
              </div>
              <div className="css-shorthand-result-item">
                <span className="css-shorthand-prop-name">{collapseProperty}</span>
                <span className="css-shorthand-colon">:&nbsp;</span>
                <span className="css-shorthand-prop-value">{collapseResult}</span>
                <span className="css-shorthand-semicolon">;</span>
              </div>
            </div>
          )}
        </section>

        {/* 対応プロパティ一覧 */}
        <section
          className="css-shorthand-reference-section"
          aria-labelledby="reference-heading"
        >
          <h2 id="reference-heading" className="section-title">
            対応ショートハンド一覧
          </h2>
          <div className="css-shorthand-table-wrapper">
            <table
              className="css-shorthand-table"
              aria-label="サポートするショートハンドプロパティ一覧"
            >
              <thead>
                <tr>
                  <th scope="col">プロパティ</th>
                  <th scope="col">説明</th>
                  <th scope="col">シンタックス</th>
                </tr>
              </thead>
              <tbody>
                {SHORTHAND_DEFINITIONS.map((def) => (
                  <tr key={def.name}>
                    <td>
                      <code className="css-shorthand-code">{def.name}</code>
                    </td>
                    <td>{def.description}</td>
                    <td>
                      <code className="css-shorthand-code css-shorthand-code--dim">
                        {def.syntax}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TipsCard
          tips={[
            'CSS ショートハンドは複数のプロパティを1行で指定できますが、展開することで各プロパティの値が明確になります。',
            'margin/padding は 1〜4 値で指定でき、値の数によって上右下左への適用が変わります（1値: 全方向、2値: 上下/左右、3値: 上/左右/下）。',
            'flex: 1 は flex: 1 1 0 と等価で、flex: auto は flex: 1 1 auto と等価です。',
            'gap はGrid・Flexboxの両方で使用でき、row-gap と column-gap の一括指定です。',
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
