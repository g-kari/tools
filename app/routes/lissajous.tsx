import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import {
  type LissajousParams,
  calcLissajousPoint,
  describeLissajous,
  formatFreqRatio,
  lcm,
  degToRad,
} from '~/utils/lissajous';
import '../styles/tools/lissajous.css';

export const Route = createFileRoute('/lissajous')({
  head: () => ({
    meta: [
      { title: 'リサジュー図形ビジュアライザー | Web ツール集' },
      {
        name: 'description',
        content:
          'リサジュー図形（Lissajous Figure）をリアルタイムで描画・アニメーション表示するツール。周波数比・位相差を自由に変更して美しい曲線を探索できます。',
      },
      {
        property: 'og:title',
        content: 'リサジュー図形ビジュアライザー | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'リサジュー図形をアニメーションで描画。周波数比・位相差を変えて様々な図形を探索。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/lissajous` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
    ],
  }),
  component: LissajousPage,
});

const CANVAS_SIZE = 480;

/** アニメーション速度の選択肢 */
const SPEED_OPTIONS = [
  { label: '遅い', value: 0.005 },
  { label: '普通', value: 0.015 },
  { label: '速い', value: 0.04 },
];

/** プリセット */
const PRESETS: Array<{ label: string; params: LissajousParams }> = [
  { label: '円 (1:1, 90°)', params: { freqX: 1, freqY: 1, phaseDeg: 90, amplitude: 0.85 } },
  { label: '楕円 (1:1, 45°)', params: { freqX: 1, freqY: 1, phaseDeg: 45, amplitude: 0.85 } },
  { label: '8の字 (1:2)', params: { freqX: 1, freqY: 2, phaseDeg: 90, amplitude: 0.85 } },
  { label: '3:2', params: { freqX: 3, freqY: 2, phaseDeg: 90, amplitude: 0.85 } },
  { label: '5:4', params: { freqX: 5, freqY: 4, phaseDeg: 90, amplitude: 0.85 } },
  { label: '5:3', params: { freqX: 5, freqY: 3, phaseDeg: 45, amplitude: 0.85 } },
];

/**
 * リサジュー図形ビジュアライザーページ
 */
function LissajousPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  const [params, setParams] = useState<LissajousParams>({
    freqX: 3,
    freqY: 2,
    phaseDeg: 90,
    amplitude: 0.85,
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.015);
  const [lineColor, setLineColor] = useState('#6750a4');
  const [bgColor, setBgColor] = useState('#1c1b1f');
  const [showDot, setShowDot] = useState(true);

  /** キャンバスに描画 */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const r = cx;

    // 背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // グリッド（薄め）
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, CANVAS_SIZE);
    ctx.moveTo(0, cy);
    ctx.lineTo(CANVAS_SIZE, cy);
    ctx.stroke();

    // 軌跡（トレイル）
    const trail = trailRef.current;
    if (trail.length > 1) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < trail.length; i++) {
        const alpha = i / trail.length;
        ctx.strokeStyle =
          lineColor +
          Math.round(alpha * 255)
            .toString(16)
            .padStart(2, '0');
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
    }

    // 現在位置のドット
    if (showDot && trail.length > 0) {
      const last = trail[trail.length - 1];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // トレイル長: 周期に合わせて調整
    const totalPeriod =
      2 * Math.PI * lcm(params.freqX, params.freqY);
    const maxTrailLen = Math.round(totalPeriod / speed) * 1.2;

    if (isPlaying) {
      tRef.current += speed;
      if (tRef.current > totalPeriod) {
        tRef.current -= totalPeriod;
      }

      const pt = calcLissajousPoint(tRef.current, params);
      const sx = cx + pt.x * r;
      const sy = cy + pt.y * r;

      trailRef.current.push({ x: sx, y: sy });

      if (trailRef.current.length > maxTrailLen) {
        trailRef.current.shift();
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [params, isPlaying, speed, lineColor, bgColor, showDot]);

  /** パラメータ変更時にトレイルをリセット */
  useEffect(() => {
    trailRef.current = [];
    tRef.current = 0;
  }, [params]);

  /** アニメーションループ管理 */
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  /** プリセット適用 */
  const applyPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setParams(preset.params);
  }, []);

  /** 静止画として完全な図形を一括描画 */
  const drawFullShape = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const r = cx;
    const steps = 3000;
    const totalPeriod = 2 * Math.PI * lcm(params.freqX, params.freqY);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalPeriod;
      const delta = degToRad(params.phaseDeg);
      const x = cx + params.amplitude * Math.sin(params.freqX * t + delta) * r;
      const y = cy + params.amplitude * Math.sin(params.freqY * t) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // アニメーション停止してトレイルをクリア
    trailRef.current = [];
    setIsPlaying(false);
  }, [params, lineColor, bgColor]);

  const ratio = formatFreqRatio(params.freqX, params.freqY);
  const shapeName = describeLissajous(params.freqX, params.freqY, params.phaseDeg);

  return (
    <div className="lissajous">
      <h1 className="lissajous__title">リサジュー図形ビジュアライザー</h1>
      <p className="lissajous__description">
        リサジュー図形（Lissajous Figure）をリアルタイムでアニメーション描画します。
        周波数比・位相差を変えて様々な美しい曲線を探索してください。
      </p>

      {/* プリセット */}
      <div className="lissajous__btn-row" style={{ marginBottom: '1rem' }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="lissajous__btn lissajous__btn--secondary"
            onClick={() => applyPreset(preset)}
            aria-label={`プリセット: ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* キャンバス */}
      <div className="lissajous__canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="lissajous__canvas"
          aria-label="リサジュー図形の描画エリア"
          role="img"
        />
      </div>

      {/* 情報パネル */}
      <div className="lissajous__info">
        <div className="lissajous__info-item">
          <span className="lissajous__info-label">図形</span>
          <span className="lissajous__info-value">{shapeName}</span>
        </div>
        <div className="lissajous__info-item">
          <span className="lissajous__info-label">周波数比</span>
          <span className="lissajous__info-value">{ratio}</span>
        </div>
        <div className="lissajous__info-item">
          <span className="lissajous__info-label">数式</span>
          <span className="lissajous__info-value">
            x = A·sin({params.freqX}t + {params.phaseDeg}°)，y = A·sin({params.freqY}t)
          </span>
        </div>
      </div>

      {/* コントロール */}
      <div className="lissajous__controls">
        <div className="lissajous__control-row">
          <div className="lissajous__control">
            <label className="lissajous__label">
              <span>X軸 周波数 (a)</span>
              <span className="lissajous__label-value">{params.freqX}</span>
            </label>
            <input
              type="range"
              className="lissajous__slider"
              min={1}
              max={12}
              step={1}
              value={params.freqX}
              onChange={(e) =>
                setParams((p) => ({ ...p, freqX: Number(e.target.value) }))
              }
              aria-label="X軸の周波数"
            />
          </div>
          <div className="lissajous__control">
            <label className="lissajous__label">
              <span>Y軸 周波数 (b)</span>
              <span className="lissajous__label-value">{params.freqY}</span>
            </label>
            <input
              type="range"
              className="lissajous__slider"
              min={1}
              max={12}
              step={1}
              value={params.freqY}
              onChange={(e) =>
                setParams((p) => ({ ...p, freqY: Number(e.target.value) }))
              }
              aria-label="Y軸の周波数"
            />
          </div>
        </div>

        <div className="lissajous__control-row">
          <div className="lissajous__control">
            <label className="lissajous__label">
              <span>位相差 (δ)</span>
              <span className="lissajous__label-value">{params.phaseDeg}°</span>
            </label>
            <input
              type="range"
              className="lissajous__slider"
              min={0}
              max={360}
              step={1}
              value={params.phaseDeg}
              onChange={(e) =>
                setParams((p) => ({ ...p, phaseDeg: Number(e.target.value) }))
              }
              aria-label="位相差"
            />
          </div>
          <div className="lissajous__control">
            <label className="lissajous__label">
              <span>振幅</span>
              <span className="lissajous__label-value">
                {Math.round(params.amplitude * 100)}%
              </span>
            </label>
            <input
              type="range"
              className="lissajous__slider"
              min={0.3}
              max={0.95}
              step={0.01}
              value={params.amplitude}
              onChange={(e) =>
                setParams((p) => ({ ...p, amplitude: Number(e.target.value) }))
              }
              aria-label="振幅"
            />
          </div>
        </div>
      </div>

      {/* ボタン・速度 */}
      <div className="lissajous__btn-row" style={{ marginBottom: '1rem' }}>
        <button
          className="lissajous__btn lissajous__btn--primary"
          onClick={() => {
            trailRef.current = [];
            setIsPlaying((p) => !p);
          }}
          aria-label={isPlaying ? '一時停止' : '再開'}
        >
          {isPlaying ? '⏸ 一時停止' : '▶ 再開'}
        </button>
        <button
          className="lissajous__btn lissajous__btn--secondary"
          onClick={() => {
            trailRef.current = [];
            tRef.current = 0;
            setIsPlaying(true);
          }}
          aria-label="リセット"
        >
          ↺ リセット
        </button>
        <button
          className="lissajous__btn lissajous__btn--secondary"
          onClick={drawFullShape}
          aria-label="全体を一括描画"
        >
          ⚡ 全体を描画
        </button>

        <span className="lissajous__speed-label">速度:</span>
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className={`lissajous__btn ${speed === opt.value ? 'lissajous__btn--primary' : 'lissajous__btn--secondary'}`}
            onClick={() => setSpeed(opt.value)}
            aria-label={`速度: ${opt.label}`}
            aria-pressed={speed === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 色設定・オプション */}
      <div className="lissajous__color-row" style={{ marginBottom: '1.5rem' }}>
        <div className="lissajous__color-item">
          <label htmlFor="lissajous-line-color">線の色</label>
          <input
            id="lissajous-line-color"
            type="color"
            className="lissajous__color-input"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            aria-label="線の色"
          />
        </div>
        <div className="lissajous__color-item">
          <label htmlFor="lissajous-bg-color">背景色</label>
          <input
            id="lissajous-bg-color"
            type="color"
            className="lissajous__color-input"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            aria-label="背景色"
          />
        </div>
        <div className="lissajous__color-item">
          <label htmlFor="lissajous-show-dot">描画点を表示</label>
          <input
            id="lissajous-show-dot"
            type="checkbox"
            checked={showDot}
            onChange={(e) => setShowDot(e.target.checked)}
            aria-label="描画点を表示"
          />
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: 'リサジュー図形とは',
            items: [
              '2つの単振動を合成して得られる平面曲線です。',
              'x(t) = A·sin(a·t + δ)、y(t) = B·sin(b·t) で定義されます。',
              '周波数比 a:b が簡単な整数比のとき、きれいな閉じた図形になります。',
              '振動の解析、音響可視化、電子工学など幅広い分野で活用されます。',
            ],
          },
          {
            title: '使い方',
            items: [
              '「X軸 周波数 (a)」「Y軸 周波数 (b)」スライダーで周波数を変更します。',
              '「位相差 (δ)」スライダーで位相のずれを調整します（90° で円・楕円になります）。',
              '「全体を描画」ボタンで完成した図形を一括表示します。',
              'プリセットから有名なリサジュー図形を素早く選択できます。',
              '線の色・背景色をカスタマイズできます。',
            ],
          },
        ]}
      />
    </div>
  );
}
