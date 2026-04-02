import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import {
  type MandelbrotViewport,
  type ColorScheme,
  DEFAULT_VIEWPORT,
  mandelbrotSmooth,
  iterationsToColor,
  screenToComplex,
  zoomViewport,
  getZoomLevel,
  MANDELBROT_PRESETS,
} from '~/utils/mandelbrot';
import '../styles/tools/mandelbrot.css';

export const Route = createFileRoute('/mandelbrot')({
  head: () => ({
    meta: [
      { title: 'マンデルブロット集合ビジュアライザー | Web ツール集' },
      {
        name: 'description',
        content:
          'マンデルブロット集合をインタラクティブに探索できるビジュアライザー。クリックでズームイン、右クリックでズームアウト。カラースキームや最大反復回数を変更して美しいフラクタル図形を発見しよう。',
      },
      {
        property: 'og:title',
        content: 'マンデルブロット集合ビジュアライザー | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'マンデルブロット集合をインタラクティブに探索。クリックでズームイン・アウトしてフラクタルの無限の複雑さを体験。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/mandelbrot` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
    ],
  }),
  component: MandelbrotPage,
});

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const ZOOM_FACTOR = 3;

const COLOR_SCHEMES: Array<{ value: ColorScheme; label: string }> = [
  { value: 'classic', label: 'クラシック' },
  { value: 'fire', label: 'ファイア' },
  { value: 'ocean', label: 'オーシャン' },
  { value: 'grayscale', label: 'グレー' },
  { value: 'neon', label: 'ネオン' },
];

/**
 * マンデルブロット集合ビジュアライザーページ
 */
function MandelbrotPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdRef = useRef(0);

  const [viewport, setViewport] = useState<MandelbrotViewport>(DEFAULT_VIEWPORT);
  const [maxIter, setMaxIter] = useState(128);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('classic');
  const [isRendering, setIsRendering] = useState(false);
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  /** キャンバスに描画する */
  const render = useCallback(
    (vp: MandelbrotViewport, iter: number, scheme: ColorScheme) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const thisId = ++renderIdRef.current;
      setIsRendering(true);

      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      // チャンク単位で非同期描画してUIをブロックしない
      const CHUNK = 20;
      let row = 0;

      function renderChunk() {
        if (thisId !== renderIdRef.current) return; // 古いレンダーはキャンセル

        const endRow = Math.min(row + CHUNK, h);
        for (let py = row; py < endRow; py++) {
          for (let px = 0; px < w; px++) {
            const [cx, cy] = screenToComplex(px, py, vp, w, h);
            const smooth = mandelbrotSmooth(cx, cy, iter);
            const [r, g, b] = iterationsToColor(smooth, iter, scheme);
            const idx = (py * w + px) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
        row = endRow;

        if (row < h) {
          requestAnimationFrame(renderChunk);
        } else {
          if (thisId === renderIdRef.current) {
            ctx.putImageData(imageData, 0, 0);
            setIsRendering(false);
          }
        }
      }

      renderChunk();
    },
    []
  );

  useEffect(() => {
    render(viewport, maxIter, colorScheme);
    setZoomLevel(getZoomLevel(viewport));
  }, [viewport, maxIter, colorScheme, render]);

  /** クリックでズームイン */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const [cx, cy] = screenToComplex(px, py, viewport, canvas.width, canvas.height);
      setViewport(zoomViewport(cx, cy, viewport, ZOOM_FACTOR));
    },
    [viewport]
  );

  /** 右クリックでズームアウト */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const [cx, cy] = screenToComplex(px, py, viewport, canvas.width, canvas.height);
      setViewport(zoomViewport(cx, cy, viewport, 1 / ZOOM_FACTOR));
    },
    [viewport]
  );

  /** マウス移動で座標を表示 */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
      setHoverCoord(screenToComplex(px, py, viewport, canvas.width, canvas.height));
    },
    [viewport]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverCoord(null);
  }, []);

  const handleReset = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
  }, []);

  return (
    <main className="mandelbrot">
      <h1 className="mandelbrot__title">マンデルブロット集合ビジュアライザー</h1>
      <p className="mandelbrot__description">
        複素平面上で定義される美しいフラクタル図形をインタラクティブに探索できます。
        クリックで拡大・右クリックで縮小してその無限の複雑さを体験してください。
      </p>

      <div className="mandelbrot__hint">
        <span className="mandelbrot__hint-item">左クリック: ズームイン (×{ZOOM_FACTOR})</span>
        <span className="mandelbrot__hint-item">右クリック: ズームアウト (×1/{ZOOM_FACTOR})</span>
        <span className="mandelbrot__hint-item">マウス移動: 座標表示</span>
      </div>

      <div className="mandelbrot__canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`mandelbrot__canvas${isRendering ? ' mandelbrot__canvas--rendering' : ''}`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-label="マンデルブロット集合キャンバス。クリックでズームイン、右クリックでズームアウト"
        />
        {hoverCoord && (
          <div className="mandelbrot__overlay" aria-live="polite">
            <div>Re: {hoverCoord[0].toFixed(8)}</div>
            <div>Im: {hoverCoord[1].toFixed(8)}i</div>
          </div>
        )}
        {isRendering && (
          <div className="mandelbrot__loading" aria-busy="true">
            描画中...
          </div>
        )}
      </div>

      <div className="mandelbrot__info">
        <div className="mandelbrot__info-item">
          <span className="mandelbrot__info-label">ズーム倍率</span>
          <span className="mandelbrot__info-value">×{zoomLevel.toFixed(1)}</span>
        </div>
        <div className="mandelbrot__info-item">
          <span className="mandelbrot__info-label">実軸範囲</span>
          <span className="mandelbrot__info-value">
            {viewport.xMin.toFixed(6)} 〜 {viewport.xMax.toFixed(6)}
          </span>
        </div>
        <div className="mandelbrot__info-item">
          <span className="mandelbrot__info-label">虚軸範囲</span>
          <span className="mandelbrot__info-value">
            {viewport.yMin.toFixed(6)} 〜 {viewport.yMax.toFixed(6)}i
          </span>
        </div>
      </div>

      <div className="mandelbrot__controls">
        {/* 最大反復回数 */}
        <div className="mandelbrot__control">
          <div className="mandelbrot__label">
            <span>最大反復回数</span>
            <span className="mandelbrot__label-value">{maxIter}</span>
          </div>
          <input
            type="range"
            className="mandelbrot__slider"
            min={32}
            max={512}
            step={32}
            value={maxIter}
            onChange={(e) => setMaxIter(Number(e.target.value))}
            aria-label="最大反復回数"
          />
        </div>

        {/* カラースキーム */}
        <div className="mandelbrot__control">
          <div className="mandelbrot__label">
            <span>カラースキーム</span>
          </div>
          <div className="mandelbrot__scheme-row">
            {COLOR_SCHEMES.map(({ value, label }) => (
              <button
                key={value}
                className={`mandelbrot__scheme-btn${colorScheme === value ? ' mandelbrot__scheme-btn--active' : ''}`}
                onClick={() => setColorScheme(value)}
                aria-pressed={colorScheme === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* プリセット */}
        <div className="mandelbrot__control">
          <div className="mandelbrot__label">
            <span>プリセット（有名な座標）</span>
          </div>
          <div className="mandelbrot__presets">
            {MANDELBROT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className="mandelbrot__preset-btn"
                onClick={() => setViewport({ ...preset.viewport })}
                aria-label={`${preset.label}に移動`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* リセット */}
        <div className="mandelbrot__btn-row">
          <button
            className="mandelbrot__btn mandelbrot__btn--secondary"
            onClick={handleReset}
          >
            リセット
          </button>
        </div>
      </div>

      <TipsCard>
        <p>
          <strong>マンデルブロット集合</strong>とは、複素数 c に対して z₀=0、z(n+1)=z(n)²+c
          の漸化式が発散しない点 c の集合です。
          境界付近は無限に複雑な自己相似構造（フラクタル）を持ちます。
        </p>
        <p>
          <strong>反復回数が多い</strong>ほど精細な描画になりますが、描画時間も増えます。
          ズームすると境界の精細さが増すため、反復回数を増やすとより美しい模様が見えます。
        </p>
        <p>
          黒い領域が集合の内部（発散しない点）です。
          集合の外の点は発散速度に応じて着色されます。
        </p>
      </TipsCard>
    </main>
  );
}
