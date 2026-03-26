import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { TipsCard } from '~/components/TipsCard';
import { useClipboard } from '~/hooks/useClipboard';
import {
  convertCss,
  PROPERTY_MAP,
  VALUE_MAP,
  CSS_SAMPLES,
  type ConvertedLine,
} from '~/utils/css-logical';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import '../styles/tools/css-logical.css';

export const Route = createFileRoute('/css-logical')({
  head: () => ({
    meta: [
      { title: 'CSS 論理プロパティ変換 | Web ツール集' },
      {
        name: 'description',
        content:
          '物理的な CSS プロパティ（margin-left, padding-top, width など）を論理プロパティ（margin-inline-start, padding-block-start, inline-size など）に自動変換。RTL 対応・国際化対応のコードベース移行をサポート。',
      },
      { property: 'og:title', content: 'CSS 論理プロパティ変換 | Web ツール集' },
      {
        property: 'og:description',
        content:
          '物理的な CSS を論理プロパティに自動変換。RTL・多言語対応の CSS 移行に便利なオンラインツール。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/css-logical` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'CSS 論理プロパティ変換 | Web ツール集' },
      {
        name: 'twitter:description',
        content: '物理的な CSS を論理プロパティに自動変換。RTL 対応コードへの移行ツール。',
      },
    ],
  }),
  component: CssLogicalPage,
});

/** 対応表のカテゴリ */
type RefCategory = 'margin' | 'padding' | 'border' | 'sizing' | 'position' | 'other';

const REF_CATEGORIES: { key: RefCategory; label: string }[] = [
  { key: 'margin', label: 'Margin' },
  { key: 'padding', label: 'Padding' },
  { key: 'border', label: 'Border' },
  { key: 'sizing', label: 'サイズ' },
  { key: 'position', label: '位置' },
  { key: 'other', label: 'その他' },
];

/** プロパティをカテゴリ分類する */
function categorize(prop: string): RefCategory {
  if (prop.startsWith('margin')) return 'margin';
  if (prop.startsWith('padding')) return 'padding';
  if (prop.startsWith('border')) return 'border';
  if (['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'].includes(prop))
    return 'sizing';
  if (['top', 'bottom', 'left', 'right'].includes(prop)) return 'position';
  return 'other';
}

/**
 * CSS 論理プロパティ変換ページ
 */
function CssLogicalPage() {
  const [inputCss, setInputCss] = useState(CSS_SAMPLES[0]!.css);
  const [selectedSample, setSelectedSample] = useState(0);
  const [activeRefTab, setActiveRefTab] = useState<RefCategory>('margin');

  const { copy } = useClipboard();
  const { showToast } = useToast();

  const result = useMemo(() => convertCss(inputCss), [inputCss]);

  const handleSampleChange = useCallback((index: number) => {
    const sample = CSS_SAMPLES[index];
    if (!sample) return;
    setSelectedSample(index);
    setInputCss(sample.css);
  }, []);

  const handleClear = useCallback(() => {
    setInputCss('');
    setSelectedSample(-1);
  }, []);

  const handleCopy = useCallback(async () => {
    await copy(result.output);
    showToast('変換結果をコピーしました', 'success');
  }, [copy, result.output, showToast]);

  // カテゴリごとのプロパティマッピング
  const filteredPropMap = useMemo(() => {
    return Object.entries(PROPERTY_MAP).filter(
      ([prop]) => categorize(prop) === activeRefTab,
    );
  }, [activeRefTab]);

  // 「その他」カテゴリに値変換マッピングも含める
  const filteredValueMap = useMemo(() => {
    if (activeRefTab !== 'other') return [];
    return Object.entries(VALUE_MAP).flatMap(([prop, values]) =>
      Object.entries(values).map(([from, to]) => ({
        physical: `${prop}: ${from}`,
        logical: `${prop}: ${to}`,
      })),
    );
  }, [activeRefTab]);

  return (
    <div className="tool-container">
      {/* サンプル選択 */}
      <div className="cssl-samples-row">
        <span className="cssl-samples-label">サンプル:</span>
        {CSS_SAMPLES.map((sample, index) => (
          <button
            key={sample.label}
            type="button"
            className={`cssl-sample-btn${selectedSample === index ? ' active' : ''}`}
            onClick={() => handleSampleChange(index)}
            aria-pressed={selectedSample === index}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* エディターグリッド */}
      <div className="cssl-editor-grid">
        {/* 入力パネル */}
        <div className="cssl-panel">
          <div className="cssl-panel-header">
            <label className="cssl-panel-title" htmlFor="cssl-input">
              入力
              <span className="cssl-badge">物理プロパティ</span>
            </label>
            <span className="cssl-stats">
              {inputCss.split('\n').length} 行
            </span>
          </div>
          <textarea
            id="cssl-input"
            className="cssl-textarea"
            value={inputCss}
            onChange={(e) => {
              setInputCss(e.target.value);
              setSelectedSample(-1);
            }}
            placeholder={`.example {\n  margin-left: 16px;\n  padding-top: 8px;\n  width: 320px;\n}`}
            aria-label="変換対象の CSS を入力"
            spellCheck={false}
          />
        </div>

        {/* 出力パネル */}
        <div className="cssl-panel">
          <div className="cssl-panel-header">
            <span className="cssl-panel-title">
              変換結果
              <span className="cssl-badge cssl-badge--changed">論理プロパティ</span>
            </span>
            <span
              className={`cssl-stats${result.changedCount > 0 ? ' cssl-stats--active' : ''}`}
              aria-live="polite"
            >
              {result.changedCount > 0
                ? `${result.changedCount} 件変換`
                : '変換なし'}
            </span>
          </div>
          <div
            className="cssl-output"
            role="region"
            aria-label="変換結果"
            aria-live="polite"
          >
            {result.lines.length > 0 ? (
              result.lines.map((line: ConvertedLine, i: number) => (
                <span
                  key={i}
                  className={`cssl-output-line${line.changed ? ' cssl-output-line--changed' : ''}`}
                >
                  {line.converted}
                  {'\n'}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--color-on-surface-variant)' }}>
                左側に CSS を入力すると変換結果がここに表示されます
              </span>
            )}
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="cssl-action-row">
        <button type="button" className="btn-secondary" onClick={handleClear}>
          クリア
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleCopy}
          disabled={!result.output}
          aria-disabled={!result.output}
        >
          結果をコピー
        </button>
      </div>

      {/* プロパティ対応表 */}
      <div className="cssl-reference-section">
        <p className="cssl-reference-title">プロパティ対応表</p>
        <div className="cssl-reference-tabs" role="tablist" aria-label="プロパティカテゴリ">
          {REF_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              className={`cssl-ref-tab${activeRefTab === cat.key ? ' active' : ''}`}
              aria-selected={activeRefTab === cat.key}
              onClick={() => setActiveRefTab(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-label={`${activeRefTab} プロパティ対応表`}>
          <table className="cssl-ref-table">
            <thead>
              <tr>
                <th scope="col">物理プロパティ</th>
                <th scope="col" className="prop-arrow">→</th>
                <th scope="col">論理プロパティ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPropMap.map(([physical, logical]) => (
                <tr key={physical}>
                  <td className="prop-physical">{physical}</td>
                  <td className="prop-arrow">→</td>
                  <td className="prop-logical">{logical}</td>
                </tr>
              ))}
              {filteredValueMap.map(({ physical, logical }) => (
                <tr key={physical}>
                  <td className="prop-physical">{physical}</td>
                  <td className="prop-arrow">→</td>
                  <td className="prop-logical">{logical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: 'CSS 論理プロパティとは',
            items: [
              '書字方向（LTR/RTL）やブロック方向に基づいた CSS プロパティの新しい定義方式',
              '物理的な方向（left/right/top/bottom）ではなく、論理的な方向（inline/block, start/end）で指定',
              'inline 軸: テキストが流れる方向（LTR なら左→右、RTL なら右→左）',
              'block 軸: ブロックが積み重なる方向（通常は上→下）',
              'start/end: 書字方向の始まり・終わり（LTR では left=start, right=end）',
            ],
          },
          {
            title: 'RTL 対応での利点',
            items: [
              '同じ CSS で LTR・RTL の両方に対応できる（dir="rtl" 切り替えだけで OK）',
              'margin-inline-start は LTR で左マージン、RTL で右マージンになる',
              'inset-inline-start は LTR で left、RTL で right として機能する',
              'アラビア語・ヘブライ語・ペルシャ語などの RTL 言語対応に必須',
            ],
          },
          {
            title: '注意事項',
            items: [
              'width/height → inline-size/block-size は書字方向が変わると軸が逆転する',
              'vertical-lr や sideways-rl など縦書きモードでは block 軸が水平になる',
              '古いブラウザでは論理プロパティ非対応の場合があるため、物理プロパティをフォールバックとして残す方法もある',
              'border-radius の論理プロパティ（border-start-start-radius 等）はブラウザサポートが比較的新しい',
            ],
          },
        ]}
      />
    </div>
  );
}
