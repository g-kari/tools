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
import { hexToRgb, rgbToHex } from '~/utils/color-converter';
import {
  findNearestColors,
  findExactColorName,
  contrastColor,
  CSS_NAMED_COLORS,
  type ColorMatch,
} from '~/utils/color-name';

export const Route = createFileRoute('/color-name')({
  head: () => ({
    meta: [
      { title: '色名検索 | Web ツール集' },
      {
        name: 'description',
        content:
          'CSS名前付き色を検索するツール。HEXやRGBカラーを入力すると最も近いCSS色名をΔE色差順に表示。140色のCSS名前付き色を完全収録。',
      },
      { property: 'og:title', content: '色名検索 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'CSS名前付き色を検索するツール。HEXやRGBカラーを入力すると最も近いCSS色名をΔE色差順に表示。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/color-name` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '色名検索 | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'HEXやRGBカラーを入力すると最も近いCSS色名をΔE色差順に表示する色名検索ツール。',
      },
    ],
  }),
  component: ColorNameFinder,
});

const DEFAULT_HEX = '#39D353';

/** ΔE値に応じた一致度ラベルを返す */
function matchLabel(deltaE: number): { label: string; className: string } {
  if (deltaE === 0) return { label: '完全一致', className: 'cn-badge-exact' };
  if (deltaE < 5) return { label: 'ほぼ同じ', className: 'cn-badge-close' };
  if (deltaE < 15) return { label: '近似', className: 'cn-badge-near' };
  return { label: '参考', className: 'cn-badge-far' };
}

/** 色スウォッチカードコンポーネント */
function ColorCard({
  match,
  onCopyName,
  onCopyHex,
}: {
  match: ColorMatch;
  onCopyName: (name: string) => void;
  onCopyHex: (hex: string) => void;
}) {
  const fg = contrastColor(match.rgb);
  const badge = matchLabel(match.deltaE);

  return (
    <div className="cn-color-card" role="listitem">
      <div
        className="cn-color-swatch"
        style={{ backgroundColor: match.hex, color: fg } as React.CSSProperties}
        aria-label={`色見本: ${match.name} ${match.hex}`}
        role="img"
      >
        <span className="cn-swatch-hex">{match.hex}</span>
      </div>
      <div className="cn-color-info">
        <div className="cn-color-name-row">
          <code className="cn-color-name">{match.name}</code>
          <span className={`cn-match-badge ${badge.className}`}>{badge.label}</span>
        </div>
        <div className="cn-color-meta">
          <span className="cn-delta-e" title="CIE76 色差 ΔE">
            ΔE = {match.deltaE}
          </span>
          <span className="cn-rgb-value">
            rgb({match.rgb.r}, {match.rgb.g}, {match.rgb.b})
          </span>
        </div>
        <div className="cn-color-actions">
          <button
            type="button"
            className="cn-copy-btn"
            onClick={() => onCopyName(match.name)}
            aria-label={`色名 ${match.name} をコピー`}
          >
            名前をコピー
          </button>
          <button
            type="button"
            className="cn-copy-btn cn-copy-btn-secondary"
            onClick={() => onCopyHex(match.hex)}
            aria-label={`HEX ${match.hex} をコピー`}
          >
            HEXをコピー
          </button>
        </div>
      </div>
    </div>
  );
}

/** 色名検索メインコンポーネント */
function ColorNameFinder() {
  const [hexInput, setHexInput] = useState(DEFAULT_HEX);
  const [hexError, setHexError] = useState(false);
  const [inputRgb, setInputRgb] = useState(() => hexToRgb(DEFAULT_HEX)!);
  const [showAll, setShowAll] = useState(false);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** HEX入力変更ハンドラ */
  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setHexInput(raw);
      const rgb = hexToRgb(raw);
      if (rgb) {
        setHexError(false);
        setInputRgb(rgb);
      } else {
        setHexError(true);
      }
    },
    []
  );

  /** ネイティブカラーピッカー変更ハンドラ */
  const handlePickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value.toUpperCase();
      setHexInput(hex);
      const rgb = hexToRgb(hex);
      if (rgb) {
        setHexError(false);
        setInputRgb(rgb);
      }
    },
    []
  );

  /** コピーハンドラ */
  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const success = await copy(text);
      if (success) {
        announceStatus(`${label} をコピーしました`);
        showToast(`${label} をコピーしました`, 'success');
      } else {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [copy, announceStatus, showToast]
  );

  /** 検索結果を計算 */
  const results = useMemo(
    () => findNearestColors(inputRgb, 10),
    [inputRgb]
  );

  /** 完全一致の色名 */
  const exactName = useMemo(
    () => findExactColorName(rgbToHex(inputRgb)),
    [inputRgb]
  );

  /** 表示する全色リスト（ブラウズモード用） */
  const allColors = useMemo(() => CSS_NAMED_COLORS, []);

  const inputFg = contrastColor(inputRgb);
  const pickerValue =
    hexInput.match(/^#[0-9a-fA-F]{6}$/) ? hexInput.toLowerCase() : '#000000';

  return (
    <>
      <div className="tool-container">
        {/* 入力セクション */}
        <section className="cn-input-section" aria-labelledby="cn-input-title">
          <h2 className="cn-section-title" id="cn-input-title">
            色を入力
          </h2>
          <div className="cn-input-layout">
            {/* カラープレビュー */}
            <div
              className="cn-input-swatch"
              style={{ backgroundColor: hexError ? '#161b22' : rgbToHex(inputRgb), color: hexError ? '#8b949e' : inputFg } as React.CSSProperties}
              role="img"
              aria-label={`現在の入力色: ${hexInput}`}
            >
              {exactName ? (
                <span className="cn-exact-name">{exactName}</span>
              ) : (
                <span className="cn-swatch-hint">色名なし</span>
              )}
              <input
                type="color"
                className="cn-native-picker"
                value={pickerValue}
                onChange={handlePickerChange}
                aria-label="カラーピッカーで色を選択"
                title="クリックして色を選択"
              />
            </div>

            {/* HEX入力 */}
            <div className="cn-hex-field">
              <label htmlFor="cn-hex-input" className="cn-field-label">
                HEXカラーコード
              </label>
              <input
                id="cn-hex-input"
                type="text"
                className={`cn-hex-input${hexError ? ' error' : ''}`}
                value={hexInput}
                onChange={handleHexChange}
                placeholder="#FF5733"
                aria-label="HEXカラーコード入力"
                aria-invalid={hexError}
                maxLength={7}
                spellCheck={false}
              />
              {hexError && (
                <span className="cn-error-msg" role="alert">
                  無効なHEX値です（例: #FF5733）
                </span>
              )}
              {!hexError && (
                <p className="cn-input-hint">
                  rgb({inputRgb.r}, {inputRgb.g}, {inputRgb.b})
                  {exactName && (
                    <> &mdash; <strong>{exactName}</strong> に完全一致</>
                  )}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 検索結果 */}
        {!hexError && (
          <section
            className="cn-results-section"
            aria-labelledby="cn-results-title"
          >
            <h2 className="cn-section-title" id="cn-results-title">
              近い色 TOP 10
            </h2>
            <div
              className="cn-results-grid"
              role="list"
              aria-label="近いCSS色名の一覧"
            >
              {results.map((match) => (
                <ColorCard
                  key={match.name}
                  match={match}
                  onCopyName={(name) => handleCopy(name, name)}
                  onCopyHex={(hex) => handleCopy(hex, hex)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 全色一覧 */}
        <section className="cn-all-section" aria-labelledby="cn-all-title">
          <div className="cn-all-header">
            <h2 className="cn-section-title" id="cn-all-title">
              CSS名前付き色一覧 ({allColors.length}色)
            </h2>
            <button
              type="button"
              className="cn-toggle-btn"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              aria-controls="cn-all-grid"
            >
              {showAll ? '閉じる ▲' : '全色を表示 ▼'}
            </button>
          </div>
          {showAll && (
            <div
              id="cn-all-grid"
              className="cn-all-grid"
              role="list"
              aria-label="全CSS名前付き色"
            >
              {allColors.map((color) => {
                const rgb = hexToRgb(color.hex) ?? { r: 0, g: 0, b: 0 };
                const fg = contrastColor(rgb);
                return (
                  <button
                    key={color.name}
                    type="button"
                    className="cn-all-item"
                    style={{ backgroundColor: color.hex, color: fg } as React.CSSProperties}
                    onClick={() => {
                      setHexInput(color.hex);
                      setInputRgb(rgb);
                      setHexError(false);
                      setShowAll(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title={`${color.name} — ${color.hex} をセット`}
                    aria-label={`${color.name} ${color.hex}`}
                    role="listitem"
                  >
                    <span className="cn-all-item-name">{color.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'HEXカラーコードを入力するか、左の色見本をクリックしてカラーピッカーで色を選択してください',
                '入力色に最も近いCSS色名をΔE（知覚的色差）順にTOP 10で表示します',
                'ΔE = 0 は完全一致（入力色がそのままCSS色名として使えます）',
                '「全色を表示」で140色のCSS名前付き色を一覧表示できます',
                '色名またはHEXをコピーしてCSSに直接貼り付けられます',
              ],
            },
            {
              title: 'ΔE (色差) の目安',
              items: [
                'ΔE = 0: 完全一致 — 入力色はCSS色名そのもの',
                'ΔE < 5: ほぼ同じ — 人の目にはほぼ区別できない',
                'ΔE < 15: 近似 — 似た印象の色',
                'ΔE ≥ 15: 参考 — 近似はしているが色味が異なる',
                'ΔEはCIE76規格に基づく知覚的色差。単純なRGB距離より正確',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer ref={statusRef} />
    </>
  );
}
