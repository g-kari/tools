import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import {
  type AngleUnit,
  ANGLE_UNIT_LABELS,
  ANGLE_UNIT_SHORT,
  toDegrees,
  fromDegrees,
  calcTrigValues,
  calcInverseTrig,
  formatTrigValue,
  formatAngle,
  COMMON_ANGLES_DEG,
  COMMON_ANGLE_RAD_LABELS,
} from '~/utils/trig';
import '../styles/tools/trig.css';

export const Route = createFileRoute('/trig')({
  head: () => ({
    meta: [
      { title: '三角関数計算機 | Web ツール集' },
      {
        name: 'description',
        content:
          '角度の単位変換（度・ラジアン・グラジアン・回転）と sin / cos / tan / cot / sec / csc の計算、逆三角関数の計算をまとめたツール。',
      },
      { property: 'og:title', content: '三角関数計算機 | Web ツール集' },
      {
        property: 'og:description',
        content: '角度変換・三角関数・逆三角関数をブラウザ内でリアルタイム計算。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/trig` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
    ],
  }),
  component: TrigPage,
});

const UNITS: AngleUnit[] = ['deg', 'rad', 'grad', 'turn'];

/** 逆三角関数の定義 */
const INVERSE_FUNS = [
  {
    fn: 'asin' as const,
    label: 'arcsin (x)',
    desc: '入力範囲: −1 〜 1',
    placeholder: '例: 0.5',
  },
  {
    fn: 'acos' as const,
    label: 'arccos (x)',
    desc: '入力範囲: −1 〜 1',
    placeholder: '例: 0.5',
  },
  {
    fn: 'atan' as const,
    label: 'arctan (x)',
    desc: '入力範囲: 任意の実数',
    placeholder: '例: 1',
  },
] as const;

/**
 * 三角関数計算機ページコンポーネント
 */
function TrigPage() {
  const [inputValue, setInputValue] = useState('45');
  const [unit, setUnit] = useState<AngleUnit>('deg');
  const [inverseInputs, setInverseInputs] = useState<Record<string, string>>({
    asin: '',
    acos: '',
    atan: '',
  });

  /** 入力角度を度に変換 */
  const degrees = useMemo(() => {
    const n = parseFloat(inputValue);
    if (isNaN(n)) return null;
    return toDegrees(n, unit);
  }, [inputValue, unit]);

  /** 各単位に変換した値 */
  const conversions = useMemo(() => {
    if (degrees === null) return null;
    return Object.fromEntries(
      UNITS.map((u) => [u, fromDegrees(degrees, u)]),
    ) as Record<AngleUnit, number>;
  }, [degrees]);

  /** 三角関数の値 */
  const trigValues = useMemo(() => {
    if (degrees === null) return null;
    return calcTrigValues(degrees);
  }, [degrees]);

  /** クイック選択で角度をセット */
  const handleQuickSelect = useCallback(
    (deg: number) => {
      const val = fromDegrees(deg, unit);
      setInputValue(formatAngle(val));
    },
    [unit],
  );

  /** 単位変更時に入力値も変換 */
  const handleUnitChange = useCallback(
    (newUnit: AngleUnit) => {
      if (degrees !== null) {
        setInputValue(formatAngle(fromDegrees(degrees, newUnit)));
      }
      setUnit(newUnit);
    },
    [degrees],
  );

  /** 逆三角関数の入力更新 */
  const handleInverseInput = useCallback((fn: string, val: string) => {
    setInverseInputs((prev) => ({ ...prev, [fn]: val }));
  }, []);

  return (
    <div className="tool-container">
      {/* 単位選択 */}
      <div className="trig-unit-row">
        <label htmlFor="trig-unit-select">角度の単位:</label>
        <select
          id="trig-unit-select"
          className="trig-unit-select"
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value as AngleUnit)}
          aria-label="角度の単位を選択"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {ANGLE_UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </div>

      {/* 角度入力 */}
      <div className="trig-input-row">
        <input
          type="number"
          id="trig-angle-input"
          className="trig-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="角度を入力"
          aria-label={`角度の値 (${ANGLE_UNIT_LABELS[unit]})`}
        />
        <span className="trig-input-unit">{ANGLE_UNIT_SHORT[unit]}</span>
      </div>

      {/* よく使う角度のクイック選択 */}
      <p className="trig-quick-label">よく使う角度:</p>
      <div className="trig-quick-row" role="group" aria-label="よく使う角度の選択">
        {COMMON_ANGLES_DEG.map((deg) => {
          const currentDeg = degrees !== null ? degrees : null;
          const isActive = currentDeg !== null && Math.abs(((currentDeg % 360) + 360) % 360 - deg) < 1e-8;
          return (
            <button
              key={deg}
              type="button"
              className={`trig-quick-btn${isActive ? ' active' : ''}`}
              onClick={() => handleQuickSelect(deg)}
              aria-pressed={isActive}
              aria-label={`${deg}度を選択`}
            >
              {deg}°
            </button>
          );
        })}
      </div>

      {/* 単位変換結果 */}
      <p className="trig-section-title">角度変換</p>
      <div className="trig-conversion-grid" aria-label="角度変換結果">
        {UNITS.map((u) => (
          <div
            key={u}
            className={`trig-conv-card${u === unit ? ' active' : ''}`}
          >
            <span className="trig-conv-label">{ANGLE_UNIT_LABELS[u]}</span>
            <span className="trig-conv-value">
              {conversions
                ? formatAngle(conversions[u]) + ' ' + ANGLE_UNIT_SHORT[u]
                : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* 三角関数の値 */}
      <p className="trig-section-title">三角関数</p>
      <div className="trig-values-grid" aria-label="三角関数の計算結果">
        {trigValues ? (
          <>
            {(
              [
                ['sin', trigValues.sin],
                ['cos', trigValues.cos],
                ['tan', trigValues.tan],
                ['cot', trigValues.cot],
                ['sec', trigValues.sec],
                ['csc', trigValues.csc],
              ] as [string, number | null][]
            ).map(([name, val]) => (
              <div key={name} className="trig-val-card">
                <div className="trig-val-name">{name}</div>
                {val === null ? (
                  <div className="trig-val-undefined">未定義</div>
                ) : (
                  <div className="trig-val-value">{formatTrigValue(val)}</div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="trig-val-card">
            <div className="trig-val-value">—</div>
          </div>
        )}
      </div>

      {/* 逆三角関数 */}
      <p className="trig-section-title">逆三角関数</p>
      <div className="trig-inverse-grid">
        {INVERSE_FUNS.map(({ fn, label, desc, placeholder }) => {
          const val = parseFloat(inverseInputs[fn] ?? '');
          const isValid = !isNaN(val);
          const result = isValid ? calcInverseTrig(fn, val) : null;
          const outOfRange = isValid && result === null;
          return (
            <div key={fn} className="trig-inverse-card">
              <div className="trig-inverse-title">{label}</div>
              <div className="trig-inverse-input-row">
                <label htmlFor={`trig-inv-${fn}`}>x =</label>
                <input
                  id={`trig-inv-${fn}`}
                  type="number"
                  className="trig-inverse-input"
                  value={inverseInputs[fn]}
                  onChange={(e) => handleInverseInput(fn, e.target.value)}
                  placeholder={placeholder}
                  aria-label={`${label} の入力値`}
                />
              </div>
              <div className="trig-inverse-result" aria-live="polite">
                {outOfRange ? (
                  <span className="trig-inverse-error">{desc}</span>
                ) : result !== null ? (
                  <>
                    <span className="trig-inverse-result-val">
                      {formatAngle(result)}°
                    </span>
                    <span> = </span>
                    <span>{formatAngle(fromDegrees(result, 'rad'))} rad</span>
                  </>
                ) : (
                  <span className="trig-inverse-hint">
                    {desc}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* よく使う角度テーブル */}
      <p className="trig-section-title">よく使う角度の三角関数値</p>
      <div className="trig-table-wrapper">
        <table className="trig-table" aria-label="よく使う角度の三角関数値一覧">
          <thead>
            <tr>
              <th>度 (°)</th>
              <th>rad</th>
              <th>sin</th>
              <th>cos</th>
              <th>tan</th>
            </tr>
          </thead>
          <tbody>
            {COMMON_ANGLES_DEG.map((deg) => {
              const vals = calcTrigValues(deg);
              return (
                <tr key={deg}>
                  <td>{deg}°</td>
                  <td>{COMMON_ANGLE_RAD_LABELS[deg]}</td>
                  <td>{formatTrigValue(vals.sin, 6)}</td>
                  <td>{formatTrigValue(vals.cos, 6)}</td>
                  <td>
                    {vals.tan === null ? (
                      <span className="trig-undef">未定義</span>
                    ) : (
                      formatTrigValue(vals.tan, 6)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TipsCard
        sections={[
          {
            title: '角度の単位について',
            items: [
              '度 (°): 円を 360 等分。日常でもっとも広く使われる単位。',
              'ラジアン (rad): 円の弧の長さと半径の比。数学・プログラミングで標準的。π rad = 180°',
              'グラジアン (grad): 円を 400 等分。測量・工学で利用される。100 grad = 90°',
              '回転 (turn): 1 回転 = 360°。CSS の回転プロパティなどで利用。',
            ],
          },
          {
            title: '三角関数の定義',
            items: [
              'sin θ = 対辺 / 斜辺、cos θ = 隣辺 / 斜辺、tan θ = 対辺 / 隣辺',
              'cot θ = 1 / tan θ（tan が 0 のとき未定義）',
              'sec θ = 1 / cos θ（cos が 0 のとき未定義）',
              'csc θ = 1 / sin θ（sin が 0 のとき未定義）',
            ],
          },
          {
            title: '逆三角関数の出力範囲',
            items: [
              'arcsin(x): −90° 〜 90°（入力範囲 −1 〜 1）',
              'arccos(x): 0° 〜 180°（入力範囲 −1 〜 1）',
              'arctan(x): −90° 〜 90°（入力範囲 任意の実数）',
            ],
          },
        ]}
      />
    </div>
  );
}
