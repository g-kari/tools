import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { Button } from '~/components/ui/button';
import {
  analyzeFloat32,
  analyzeFloat64,
  bitsToNumber,
  hexToNumber,
  getFormula,
  getSpecialValueLabel,
  FLOAT32_PRESETS,
  FLOAT64_PRESETS,
  type FloatPrecision,
  type IEEE754Result,
} from '../utils/ieee754';

export const Route = createFileRoute('/ieee754')({
  head: () => ({
    meta: [
      { title: 'IEEE 754 浮動小数点数ビジュアライザー | Web ツール集' },
      {
        name: 'description',
        content:
          'IEEE 754浮動小数点数の内部表現をビット単位で可視化するツール。float32（単精度）・float64（倍精度）に対応。符号・指数部・仮数部のビットを対話的に操作可能。NaN・Infinity・非正規化数にも対応。',
      },
      {
        property: 'og:title',
        content: 'IEEE 754 浮動小数点数ビジュアライザー | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'IEEE 754浮動小数点数の内部表現をビット単位で可視化するツール。float32・float64に対応。符号・指数部・仮数部を対話的に操作可能。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/ieee754` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
    ],
  }),
  component: IEEE754Visualizer,
});

type InputMode = 'decimal' | 'hex';

/** 精度に応じたビット数 */
function getTotalBits(precision: FloatPrecision): number {
  return precision === 'float32' ? 32 : 64;
}

/** 精度に応じた指数部ビット数 */
function getExpBits(precision: FloatPrecision): number {
  return precision === 'float32' ? 8 : 11;
}

/**
 * IEEE 754 浮動小数点数ビジュアライザーコンポーネント
 */
function IEEE754Visualizer() {
  const [precision, setPrecision] = useState<FloatPrecision>('float32');
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('decimal');
  const [bits, setBits] = useState<number[]>(new Array(64).fill(0));
  const [parseError, setParseError] = useState('');

  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const totalBits = getTotalBits(precision);
  const expBitsCount = getExpBits(precision);
  const currentBits = bits.slice(0, totalBits);

  /** 現在のビットパターンを解析 */
  const result: IEEE754Result = useMemo(() => {
    const value = bitsToNumber(currentBits, precision);
    return precision === 'float32' ? analyzeFloat32(value) : analyzeFloat64(value);
  }, [currentBits, precision]);

  /** ビット配列を設定する（解析結果から） */
  const applyAnalysis = useCallback(
    (r: IEEE754Result) => {
      const newBits = [r.signBit, ...r.exponentBits, ...r.mantissaBits];
      setBits([...newBits, ...new Array(64 - newBits.length).fill(0)]);
    },
    []
  );

  /** 10進数入力の処理 */
  const handleDecimalInput = useCallback(
    (str: string) => {
      setInputValue(str);
      if (!str.trim()) {
        setBits(new Array(64).fill(0));
        setParseError('');
        return;
      }

      let num: number;
      const lower = str.trim().toLowerCase();
      if (lower === 'nan') {
        num = NaN;
      } else if (lower === 'infinity' || lower === '+infinity') {
        num = Infinity;
      } else if (lower === '-infinity') {
        num = -Infinity;
      } else {
        num = parseFloat(str);
        if (Number.isNaN(num)) {
          setParseError('有効な数値を入力してください（例: 3.14, -1, Infinity, NaN）');
          return;
        }
      }

      setParseError('');
      const r = precision === 'float32' ? analyzeFloat32(num) : analyzeFloat64(num);
      applyAnalysis(r);
    },
    [precision, applyAnalysis]
  );

  /** 16進数入力の処理 */
  const handleHexInput = useCallback(
    (str: string) => {
      setInputValue(str);
      const clean = str.replace(/[\s_]/g, '').replace(/^0x/i, '');
      if (!clean) {
        setBits(new Array(64).fill(0));
        setParseError('');
        return;
      }

      const expectedLength = precision === 'float32' ? 8 : 16;
      if (!/^[0-9a-fA-F]+$/.test(clean)) {
        setParseError('16進数文字列を入力してください（例: 3F800000）');
        return;
      }
      if (clean.length > expectedLength) {
        setParseError(
          `${precision === 'float32' ? '8' : '16'}文字以内で入力してください`
        );
        return;
      }

      setParseError('');
      const num = hexToNumber(clean, precision);
      const r = precision === 'float32' ? analyzeFloat32(num) : analyzeFloat64(num);
      applyAnalysis(r);
    },
    [precision, applyAnalysis]
  );

  /** 入力変更ハンドラ */
  const handleInput = useCallback(
    (str: string) => {
      if (inputMode === 'decimal') {
        handleDecimalInput(str);
      } else {
        handleHexInput(str);
      }
    },
    [inputMode, handleDecimalInput, handleHexInput]
  );

  /** 精度変更 */
  const handlePrecisionChange = useCallback(
    (p: FloatPrecision) => {
      // 現在の数値を保持して新しい精度で再解析
      const currentValue = result.decimalValue;
      setPrecision(p);
      setBits(new Array(64).fill(0));
      setInputValue('');
      setParseError('');
      // 現在値が有効なら変換する（次のレンダリングで再計算される）
      if (!result.isNaN && !result.isZero) {
        setTimeout(() => {
          const r = p === 'float32' ? analyzeFloat32(currentValue) : analyzeFloat64(currentValue);
          applyAnalysis(r);
        }, 0);
      }
    },
    [result, applyAnalysis]
  );

  /** 特定のビットをトグル */
  const handleBitToggle = useCallback((index: number) => {
    setBits((prev) => {
      const newBits = [...prev];
      newBits[index] = newBits[index] ? 0 : 1;
      return newBits;
    });
    setInputValue(''); // ビット直接操作時は入力フィールドをクリア
  }, []);

  /** プリセット適用 */
  const handlePreset = useCallback(
    (value: number) => {
      const r = precision === 'float32' ? analyzeFloat32(value) : analyzeFloat64(value);
      applyAnalysis(r);
      setInputValue(
        Number.isNaN(value) ? 'NaN' : !isFinite(value) ? (value > 0 ? 'Infinity' : '-Infinity') : String(value)
      );
      setInputMode('decimal');
      setParseError('');
    },
    [precision, applyAnalysis]
  );

  /** HEXコピー */
  const handleCopyHex = useCallback(async () => {
    const success = await copy(result.hexRepresentation);
    if (success) {
      showToast('HEX をコピーしました', 'success');
      announceStatus('HEX をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [copy, result.hexRepresentation, showToast, announceStatus]);

  /** 2進数コピー */
  const handleCopyBinary = useCallback(async () => {
    const success = await copy(result.binaryRepresentation);
    if (success) {
      showToast('2進数をコピーしました', 'success');
      announceStatus('2進数をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [copy, result.binaryRepresentation, showToast, announceStatus]);

  const specialLabel = getSpecialValueLabel(result);
  const formula = getFormula(result);
  const presets = precision === 'float32' ? FLOAT32_PRESETS : FLOAT64_PRESETS;

  // ビットの種別を判定
  function getBitType(index: number): 'sign' | 'exp' | 'mant' {
    if (index === 0) return 'sign';
    if (index < 1 + expBitsCount) return 'exp';
    return 'mant';
  }

  return (
    <>
      <div className="tool-container">
        {/* 精度セレクター */}
        <div className="f754-precision-tabs" role="tablist" aria-label="浮動小数点精度">
          <button
            role="tab"
            aria-selected={precision === 'float32'}
            className={`f754-precision-tab ${precision === 'float32' ? 'active' : ''}`}
            onClick={() => handlePrecisionChange('float32')}
          >
            float32 (単精度・32bit)
          </button>
          <button
            role="tab"
            aria-selected={precision === 'float64'}
            className={`f754-precision-tab ${precision === 'float64' ? 'active' : ''}`}
            onClick={() => handlePrecisionChange('float64')}
          >
            float64 (倍精度・64bit)
          </button>
        </div>

        {/* 数値入力 */}
        <div className="f754-input-section">
          <label htmlFor="f754-input" className="section-title">
            数値入力
          </label>
          <div className="f754-input-row">
            <select
              className="f754-input-mode-select"
              value={inputMode}
              onChange={(e) => {
                setInputMode(e.target.value as InputMode);
                setInputValue('');
                setParseError('');
              }}
              aria-label="入力形式"
            >
              <option value="decimal">10進数</option>
              <option value="hex">16進数 (HEX)</option>
            </select>
            <input
              id="f754-input"
              type="text"
              className={`f754-number-input ${parseError ? 'error' : ''}`}
              value={inputValue}
              onChange={(e) => handleInput(e.target.value)}
              placeholder={
                inputMode === 'decimal'
                  ? '例: 3.14, -1, 0.1, Infinity, NaN'
                  : precision === 'float32'
                    ? '例: 3F800000'
                    : '例: 3FF0000000000000'
              }
              aria-describedby={parseError ? 'f754-error' : undefined}
              aria-invalid={!!parseError}
              spellCheck={false}
            />
          </div>
          {parseError && (
            <p id="f754-error" className="f754-input-error" role="alert">
              {parseError}
            </p>
          )}

          {/* プリセットボタン */}
          <div className="f754-presets" role="group" aria-label="プリセット値">
            {presets.map((preset) => (
              <button
                key={preset.label}
                className="f754-preset-btn"
                onClick={() => handlePreset(preset.value)}
                title={`${preset.label} を入力`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* ビット表示 */}
        <div className="f754-bits-section">
          <div className="f754-bits-legend" aria-hidden="true">
            <span className="f754-legend-sign">符号 (1 bit)</span>
            <span className="f754-legend-exp">
              指数部 ({expBitsCount} bits)
            </span>
            <span className="f754-legend-mant">
              仮数部 ({totalBits - 1 - expBitsCount} bits)
            </span>
          </div>

          <div
            className="f754-bits-row"
            role="group"
            aria-label={`${totalBits}ビット浮動小数点数のビット表現。各ビットをクリックでトグルできます。`}
          >
            {/* 符号ビット */}
            <div className="f754-bits-group">
              <BitCell
                index={0}
                value={currentBits[0]}
                type="sign"
                totalBits={totalBits}
                onToggle={handleBitToggle}
              />
            </div>

            <div className="f754-bits-separator" aria-hidden="true" />

            {/* 指数部ビット */}
            <div className="f754-bits-group">
              {Array.from({ length: expBitsCount }, (_, i) => i + 1).map((idx) => (
                <BitCell
                  key={idx}
                  index={idx}
                  value={currentBits[idx]}
                  type="exp"
                  totalBits={totalBits}
                  onToggle={handleBitToggle}
                />
              ))}
            </div>

            <div className="f754-bits-separator" aria-hidden="true" />

            {/* 仮数部ビット */}
            <div className="f754-bits-group">
              {Array.from(
                { length: totalBits - 1 - expBitsCount },
                (_, i) => 1 + expBitsCount + i
              ).map((idx) => (
                <BitCell
                  key={idx}
                  index={idx}
                  value={currentBits[idx]}
                  type="mant"
                  totalBits={totalBits}
                  onToggle={handleBitToggle}
                />
              ))}
            </div>
          </div>

          {/* ビットインデックスラベル */}
          <div className="f754-bit-indices" aria-hidden="true">
            <span className="f754-bit-index">{totalBits - 1}</span>
            <span className="f754-bit-index-sep" />
            {Array.from({ length: expBitsCount }, (_, i) => totalBits - 2 - i).map((pos) => (
              <span key={pos} className="f754-bit-index">
                {pos}
              </span>
            ))}
            <span className="f754-bit-index-sep" />
            {Array.from(
              { length: Math.min(8, totalBits - 1 - expBitsCount) },
              (_, i) => totalBits - 1 - expBitsCount - 1 - i
            ).map((pos) => (
              <span key={pos} className="f754-bit-index">
                {pos}
              </span>
            ))}
            <span className="f754-bit-index">…0</span>
          </div>
        </div>

        {/* 結果情報グリッド */}
        <div className="f754-info-grid">
          {/* 数値 */}
          <div className="f754-info-card">
            <div className="f754-info-card-title">値</div>
            {specialLabel && (
              <div
                className={`f754-special-badge ${
                  result.isNaN ? 'nan' : result.isInfinity ? 'infinity' : 'subnormal'
                }`}
              >
                {specialLabel}
              </div>
            )}
            <div className="f754-info-value">
              {result.isNaN
                ? 'NaN'
                : result.isInfinity
                  ? result.signBit === 1
                    ? '-Infinity'
                    : '+Infinity'
                  : result.isZero
                    ? result.signBit === 1
                      ? '-0'
                      : '0'
                    : result.decimalValue.toPrecision(7).replace(/\.?0+$/, '')}
            </div>
            <div className="f754-info-sub">
              {precision === 'float32' ? '単精度 (32bit)' : '倍精度 (64bit)'}
            </div>
          </div>

          {/* HEX表現 */}
          <div className="f754-info-card">
            <div className="f754-info-card-title">16進数 (HEX)</div>
            <div className="f754-info-value" style={{ fontSize: 'var(--text-base)' }}>
              0x{result.hexRepresentation}
            </div>
            <div className="f754-info-sub">{result.binaryRepresentation.length} bits</div>
          </div>

          {/* 符号 */}
          <div className="f754-info-card">
            <div className="f754-info-card-title">符号ビット</div>
            <div className="f754-breakdown">
              <div className="f754-breakdown-row">
                <span className="f754-breakdown-label">ビット</span>
                <div className="f754-breakdown-content">
                  <span className="f754-breakdown-bits">{result.signBit}</span>
                  <span className="f754-breakdown-value">
                    {result.signBit === 0 ? '→ 正 (+)' : '→ 負 (-)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 指数部 */}
          <div className="f754-info-card">
            <div className="f754-info-card-title">指数部 (Exponent)</div>
            <div className="f754-breakdown">
              <div className="f754-breakdown-row">
                <span className="f754-breakdown-label">ビット列</span>
                <div className="f754-breakdown-content">
                  <span className="f754-breakdown-bits">
                    {result.exponentBits.join('')}
                  </span>
                  <span className="f754-breakdown-value">
                    = {result.exponentRaw} (10進数)
                  </span>
                </div>
              </div>
              <div className="f754-breakdown-row">
                <span className="f754-breakdown-label">バイアス</span>
                <div className="f754-breakdown-content">
                  <span className="f754-breakdown-bits">{result.exponentBias}</span>
                </div>
              </div>
              <div className="f754-breakdown-row">
                <span className="f754-breakdown-label">実際の指数</span>
                <div className="f754-breakdown-content">
                  <span className="f754-breakdown-bits">{result.isSubnormal ? `1 - ${result.exponentBias}` : `${result.exponentRaw} - ${result.exponentBias}`} = {result.exponentActual}</span>
                  {result.isSubnormal && (
                    <span className="f754-breakdown-value">※ 非正規化数</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 仮数部 */}
          <div className="f754-info-card">
            <div className="f754-info-card-title">仮数部 (Mantissa)</div>
            <div className="f754-breakdown">
              <div className="f754-breakdown-row">
                <span className="f754-breakdown-label">ビット列</span>
                <div className="f754-breakdown-content">
                  <span
                    className="f754-breakdown-bits"
                    style={{ wordBreak: 'break-all', fontSize: 'var(--text-xs)' }}
                  >
                    {result.mantissaBits.slice(0, 24).join('')}
                    {result.mantissaBits.length > 24 ? '...' : ''}
                  </span>
                </div>
              </div>
              <div className="f754-breakdown-row">
                <span className="f754-breakdown-label">値</span>
                <div className="f754-breakdown-content">
                  <span className="f754-breakdown-bits">
                    {result.isSubnormal ? '0' : '1'}.{result.mantissaFraction.toFixed(8).slice(2)}…
                  </span>
                  <span className="f754-breakdown-value">
                    ≈ {result.isSubnormal ? result.mantissaFraction.toExponential(4) : (1 + result.mantissaFraction).toFixed(8)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 数式 */}
          <div className="f754-info-card f754-formula-card">
            <div className="f754-info-card-title">数式表現</div>
            <div className="f754-formula">{formula}</div>
            {!result.isNaN && !result.isInfinity && !result.isZero && (
              <div className="f754-info-sub" style={{ marginTop: 'var(--space-2)' }}>
                (-1)^{result.signBit} × 2^{result.exponentActual} ×{' '}
                {result.isSubnormal ? '0' : '1'}.fraction
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="f754-actions">
          <Button variant="default" onClick={handleCopyHex}>
            HEX をコピー
          </Button>
          <Button variant="secondary" onClick={handleCopyBinary}>
            2進数をコピー
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                '数値を入力するとビット表現が自動的に表示されます',
                '各ビットをクリックして直接切り替えることができます',
                'プリセットボタンで代表的な値を素早く確認できます',
                'float32（単精度32bit）とfloat64（倍精度64bit）を切り替えられます',
              ],
            },
            {
              title: 'IEEE 754 の構造',
              items: [
                '符号ビット（赤）: 0 = 正、1 = 負',
                'float32 指数部（紫）: 8ビット、バイアス値 127',
                'float64 指数部（紫）: 11ビット、バイアス値 1023',
                'float32 仮数部（青）: 23ビット（実質24ビット精度）',
                'float64 仮数部（青）: 52ビット（実質53ビット精度）',
                '通常の数値: (-1)^符号 × 2^(指数-バイアス) × 1.仮数部',
              ],
            },
            {
              title: '特殊な値',
              items: [
                'ゼロ: 指数部・仮数部がすべて0（+0 と -0 が存在）',
                '非正規化数: 指数部が0、仮数部が0以外（極小の数）',
                '無限大 (±Infinity): 指数部がすべて1、仮数部がすべて0',
                'NaN: 指数部がすべて1、仮数部が0以外',
                '例: 0.1 + 0.2 ≠ 0.3 は float64 の仮数部の丸め誤差による',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

/** ビットセルコンポーネント */
function BitCell({
  index,
  value,
  type,
  totalBits,
  onToggle,
}: {
  index: number;
  value: number;
  type: 'sign' | 'exp' | 'mant';
  totalBits: number;
  onToggle: (index: number) => void;
}) {
  const bitPosition = totalBits - 1 - index;
  const isActive = value === 1;
  const className = `f754-bit f754-bit-${type} ${isActive ? 'active' : ''}`;

  return (
    <button
      className={className}
      onClick={() => onToggle(index)}
      aria-label={`ビット${bitPosition}（${type === 'sign' ? '符号' : type === 'exp' ? '指数部' : '仮数部'}）: ${value}。クリックで切り替え`}
      aria-pressed={isActive}
      title={`bit ${bitPosition}`}
    >
      {value}
    </button>
  );
}
