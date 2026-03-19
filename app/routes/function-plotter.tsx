import { createFileRoute } from '@tanstack/react-router';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import { useToast } from '~/components/Toast';
import {
  PLOT_COLORS,
  SAMPLE_FUNCTIONS,
  buildAllPlotData,
  autoYRange,
  splitIntoSegments,
  niceStep,
  compileExpression,
  type PlotFunction,
  type PlotData,
  type PlotRange,
  type PlotColor,
} from '~/utils/function-plotter';

export const Route = createFileRoute('/function-plotter')({
  head: () => ({
    meta: [
      { title: '関数グラフ描画 | Web ツール集' },
      {
        name: 'description',
        content:
          '数学関数のグラフをブラウザ内でリアルタイム描画するツール。sin・cos・tan・log・exp・x^2 などに対応。複数関数の重ね描き、ズーム・パン操作、PNG出力が可能。',
      },
      { property: 'og:title', content: '関数グラフ描画 | Web ツール集' },
      {
        property: 'og:description',
        content:
          '数学関数のグラフをブラウザ内でリアルタイム描画するツール。複数関数の重ね描き、ズーム・パン操作対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/function-plotter` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '関数グラフ描画 | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          '数学関数のグラフをブラウザ内でリアルタイム描画するツール。sin・cos・exp・x^2など対応。',
      },
    ],
  }),
  component: FunctionPlotterPage,
});

/** デフォルトのプロット範囲 */
const DEFAULT_RANGE: PlotRange = { xMin: -10, xMax: 10, yMin: -6, yMax: 6 };

/** キャンバス描画設定 */
const CANVAS_HEIGHT = 480;

/** テーマカラー（CSS変数から取得できないため固定値） */
const THEME = {
  bg: '#121212',
  surface: '#1e1e1e',
  gridMinor: 'rgba(255,255,255,0.04)',
  gridMajor: 'rgba(255,255,255,0.10)',
  axis: 'rgba(255,255,255,0.30)',
  axisLabel: 'rgba(255,255,255,0.45)',
  text: 'rgba(255,255,255,0.60)',
} as const;

/** ワールド座標 → キャンバスピクセル変換 */
function worldToCanvas(
  wx: number,
  wy: number,
  range: PlotRange,
  canvasW: number,
  canvasH: number
): [number, number] {
  const cx = ((wx - range.xMin) / (range.xMax - range.xMin)) * canvasW;
  const cy = (1 - (wy - range.yMin) / (range.yMax - range.yMin)) * canvasH;
  return [cx, cy];
}

/** キャンバスピクセル → ワールド座標変換 */
function canvasToWorld(
  cx: number,
  cy: number,
  range: PlotRange,
  canvasW: number,
  canvasH: number
): [number, number] {
  const wx = (cx / canvasW) * (range.xMax - range.xMin) + range.xMin;
  const wy = (1 - cy / canvasH) * (range.yMax - range.yMin) + range.yMin;
  return [wx, wy];
}

/**
 * キャンバスにグラフを描画する
 */
function drawPlot(
  ctx: CanvasRenderingContext2D,
  range: PlotRange,
  allData: PlotData[],
  w: number,
  h: number
): void {
  // 背景
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, w, h);

  const xRange = range.xMax - range.xMin;
  const yRange = range.yMax - range.yMin;

  // グリッド描画
  const xStep = niceStep(xRange, 10);
  const yStep = niceStep(yRange, 8);

  // 縦グリッド線
  const xStart = Math.ceil(range.xMin / xStep) * xStep;
  for (let x = xStart; x <= range.xMax + xStep * 0.01; x += xStep) {
    const [cx] = worldToCanvas(x, 0, range, w, h);
    const isZero = Math.abs(x) < xStep * 0.001;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.strokeStyle = isZero ? THEME.axis : THEME.gridMajor;
    ctx.lineWidth = isZero ? 1.5 : 1;
    ctx.stroke();
  }

  // 横グリッド線
  const yStart = Math.ceil(range.yMin / yStep) * yStep;
  for (let y = yStart; y <= range.yMax + yStep * 0.01; y += yStep) {
    const [, cy] = worldToCanvas(0, y, range, w, h);
    const isZero = Math.abs(y) < yStep * 0.001;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.strokeStyle = isZero ? THEME.axis : THEME.gridMajor;
    ctx.lineWidth = isZero ? 1.5 : 1;
    ctx.stroke();
  }

  // 軸ラベル
  ctx.fillStyle = THEME.axisLabel;
  ctx.font = '11px "JetBrains Mono", "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const [, y0cy] = worldToCanvas(0, 0, range, w, h);
  const labelY = Math.min(h - 16, Math.max(4, y0cy + 4));

  for (let x = xStart; x <= range.xMax + xStep * 0.01; x += xStep) {
    if (Math.abs(x) < xStep * 0.001) continue;
    const [cx] = worldToCanvas(x, 0, range, w, h);
    const label = parseFloat(x.toPrecision(6)).toString();
    ctx.fillText(label, cx, labelY);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const [x0cx] = worldToCanvas(0, 0, range, w, h);
  const labelX = Math.max(36, Math.min(w - 4, x0cx - 4));

  for (let y = yStart; y <= range.yMax + yStep * 0.01; y += yStep) {
    if (Math.abs(y) < yStep * 0.001) continue;
    const [, cy] = worldToCanvas(0, y, range, w, h);
    const label = parseFloat(y.toPrecision(6)).toString();
    ctx.fillText(label, labelX, cy);
  }

  // 関数プロット
  for (const data of allData) {
    if (data.error || data.points.length === 0) continue;

    const segments = splitIntoSegments(data.points, 8);

    ctx.strokeStyle = data.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const seg of segments) {
      if (seg.length < 2) continue;
      ctx.beginPath();
      for (let i = 0; i < seg.length; i++) {
        const [cx, cy] = worldToCanvas(seg[i].x, seg[i].y, range, w, h);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }
}

/** 範囲入力の値をパースして有効な数値に変換 */
function parseRangeValue(s: string, fallback: number): number {
  const v = parseFloat(s);
  return isNaN(v) || !isFinite(v) ? fallback : v;
}

/**
 * 関数グラフ描画ページコンポーネント
 */
function FunctionPlotterPage() {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);

  // 関数リスト
  const [functions, setFunctions] = useState<PlotFunction[]>([
    { expression: 'sin(x)', color: PLOT_COLORS[0], enabled: true },
    { expression: '', color: PLOT_COLORS[1], enabled: true },
    { expression: '', color: PLOT_COLORS[2], enabled: true },
    { expression: '', color: PLOT_COLORS[3], enabled: true },
  ]);

  // 表示範囲
  const [range, setRange] = useState<PlotRange>(DEFAULT_RANGE);
  const [rangeInputs, setRangeInputs] = useState({
    xMin: String(DEFAULT_RANGE.xMin),
    xMax: String(DEFAULT_RANGE.xMax),
    yMin: String(DEFAULT_RANGE.yMin),
    yMax: String(DEFAULT_RANGE.yMax),
  });

  // カーソル座標表示
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);

  // パン操作
  const panRef = useRef<{ startX: number; startY: number; startRange: PlotRange } | null>(null);

  // キャンバスサイズ監視
  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setCanvasWidth(w);
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  // プロットデータ計算
  const allData = useMemo(
    () => buildAllPlotData(functions, range.xMin, range.xMax, Math.max(300, canvasWidth)),
    [functions, range.xMin, range.xMax, canvasWidth]
  );

  // キャンバス描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPlot(ctx, range, allData, canvasWidth, CANVAS_HEIGHT);
  }, [range, allData, canvasWidth]);

  // 範囲入力の同期
  const handleRangeCommit = useCallback(() => {
    setRange({
      xMin: parseRangeValue(rangeInputs.xMin, DEFAULT_RANGE.xMin),
      xMax: parseRangeValue(rangeInputs.xMax, DEFAULT_RANGE.xMax),
      yMin: parseRangeValue(rangeInputs.yMin, DEFAULT_RANGE.yMin),
      yMax: parseRangeValue(rangeInputs.yMax, DEFAULT_RANGE.yMax),
    });
  }, [rangeInputs]);

  // y軸自動調整
  const handleAutoY = useCallback(() => {
    const { yMin, yMax } = autoYRange(allData);
    setRange((prev) => ({ ...prev, yMin, yMax }));
    setRangeInputs((prev) => ({
      ...prev,
      yMin: parseFloat(yMin.toPrecision(6)).toString(),
      yMax: parseFloat(yMax.toPrecision(6)).toString(),
    }));
  }, [allData]);

  // リセット
  const handleReset = useCallback(() => {
    setRange(DEFAULT_RANGE);
    setRangeInputs({
      xMin: String(DEFAULT_RANGE.xMin),
      xMax: String(DEFAULT_RANGE.xMax),
      yMin: String(DEFAULT_RANGE.yMin),
      yMax: String(DEFAULT_RANGE.yMax),
    });
  }, []);

  // PNG出力
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'function-plot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('PNGを保存しました', 'success');
  }, [showToast]);

  // ホイールズーム
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (canvasWidth / rect.width);
      const cy = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      const [wx, wy] = canvasToWorld(cx, cy, range, canvasWidth, CANVAS_HEIGHT);

      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      const newXMin = wx + (range.xMin - wx) * factor;
      const newXMax = wx + (range.xMax - wx) * factor;
      const newYMin = wy + (range.yMin - wy) * factor;
      const newYMax = wy + (range.yMax - wy) * factor;

      const newRange = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
      setRange(newRange);
      setRangeInputs({
        xMin: parseFloat(newXMin.toPrecision(5)).toString(),
        xMax: parseFloat(newXMax.toPrecision(5)).toString(),
        yMin: parseFloat(newYMin.toPrecision(5)).toString(),
        yMax: parseFloat(newYMax.toPrecision(5)).toString(),
      });
    },
    [range, canvasWidth]
  );

  // パン開始
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (canvasWidth / rect.width);
      const cy = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      panRef.current = { startX: cx, startY: cy, startRange: { ...range } };
    },
    [range, canvasWidth]
  );

  // パン中
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (canvasWidth / rect.width);
      const cy = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      const [wx, wy] = canvasToWorld(cx, cy, range, canvasWidth, CANVAS_HEIGHT);
      setCursorCoords({ x: wx, y: wy });

      if (!panRef.current || !(e.buttons & 1)) {
        panRef.current = null;
        return;
      }

      const { startX, startY, startRange } = panRef.current;
      const dx = cx - startX;
      const dy = cy - startY;
      const xPerPx = (startRange.xMax - startRange.xMin) / canvasWidth;
      const yPerPx = (startRange.yMax - startRange.yMin) / CANVAS_HEIGHT;

      const newRange = {
        xMin: startRange.xMin - dx * xPerPx,
        xMax: startRange.xMax - dx * xPerPx,
        yMin: startRange.yMin + dy * yPerPx,
        yMax: startRange.yMax + dy * yPerPx,
      };
      setRange(newRange);
      setRangeInputs({
        xMin: parseFloat(newRange.xMin.toPrecision(5)).toString(),
        xMax: parseFloat(newRange.xMax.toPrecision(5)).toString(),
        yMin: parseFloat(newRange.yMin.toPrecision(5)).toString(),
        yMax: parseFloat(newRange.yMax.toPrecision(5)).toString(),
      });
    },
    [range, canvasWidth]
  );

  const handleMouseUp = useCallback(() => {
    panRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    panRef.current = null;
    setCursorCoords(null);
  }, []);

  // 関数更新
  const updateFunction = useCallback(
    (index: number, field: keyof PlotFunction, value: string | boolean) => {
      setFunctions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  // サンプル関数を最初の空欄に適用
  const handleSampleClick = useCallback(
    (expr: string) => {
      setFunctions((prev) => {
        const next = [...prev];
        // 空欄か無効な入力の最初のスロットを探す
        const idx = next.findIndex(
          (f) => !f.expression.trim() || compileExpression(f.expression).fn === null
        );
        const slot = idx >= 0 ? idx : 0;
        next[slot] = { ...next[slot], expression: expr, enabled: true };
        return next;
      });
    },
    []
  );

  // バリデーション
  const errors = useMemo(
    () =>
      functions
        .filter((f) => f.enabled && f.expression.trim())
        .map((f) => {
          const { error } = compileExpression(f.expression);
          return error ? { expr: f.expression, msg: error, color: f.color } : null;
        })
        .filter(Boolean) as { expr: string; msg: string; color: PlotColor }[],
    [functions]
  );

  // 凡例（有効な関数のみ）
  const legendItems = useMemo(
    () =>
      functions
        .filter((f) => f.enabled && f.expression.trim() && !compileExpression(f.expression).error)
        .map((f) => ({ expr: f.expression, color: f.color })),
    [functions]
  );

  return (
    <div className="tool-container">
      <h2 className="section-title">関数グラフ描画</h2>

      <div className="fp-layout">
        {/* 関数入力 */}
        <div className="fp-functions-section">
          <p className="fp-section-label">y = f(x) を入力（最大4つ）</p>
          {functions.map((fn, i) => (
            <div
              key={i}
              className={`fp-function-row${!fn.enabled ? ' disabled' : ''}`}
            >
              <span
                className="fp-color-indicator"
                style={{ backgroundColor: fn.color }}
                aria-hidden="true"
              />
              <input
                type="text"
                className={`fp-function-input${
                  fn.enabled &&
                  fn.expression.trim() &&
                  compileExpression(fn.expression).error
                    ? ' error'
                    : ''
                }`}
                value={fn.expression}
                onChange={(e) => updateFunction(i, 'expression', e.target.value)}
                placeholder={i === 0 ? '例: sin(x)' : `関数 ${i + 1}（省略可）`}
                aria-label={`関数 ${i + 1} の数式入力`}
                disabled={!fn.enabled}
              />
              <button
                className={`fp-toggle-btn${fn.enabled ? ' active' : ''}`}
                onClick={() => updateFunction(i, 'enabled', !fn.enabled)}
                aria-pressed={fn.enabled}
                aria-label={`関数 ${i + 1} を${fn.enabled ? '無効化' : '有効化'}`}
              >
                {fn.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}

          {errors.length > 0 && (
            <div className="fp-error-list" role="alert">
              {errors.map((e, i) => (
                <p key={i} className="fp-error-item">
                  ⚠ {e.expr}: {e.msg}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* サンプルボタン */}
        <div className="fp-samples" role="group" aria-label="サンプル関数">
          <span className="fp-sample-label">サンプル:</span>
          {SAMPLE_FUNCTIONS.map((s) => (
            <button
              key={s.label}
              className="fp-sample-btn"
              onClick={() => handleSampleClick(s.expression)}
              aria-label={`サンプル関数: ${s.expression}`}
              title={s.expression}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 範囲設定 */}
        <div className="fp-range-section" role="group" aria-label="グラフ表示範囲">
          <div className="fp-range-group">
            <label htmlFor="fp-xmin" className="fp-range-label">
              x:
            </label>
            <input
              id="fp-xmin"
              type="number"
              className="fp-range-input"
              value={rangeInputs.xMin}
              onChange={(e) =>
                setRangeInputs((p) => ({ ...p, xMin: e.target.value }))
              }
              onBlur={handleRangeCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleRangeCommit()}
              aria-label="x軸最小値"
            />
            <span className="fp-range-separator">〜</span>
            <input
              id="fp-xmax"
              type="number"
              className="fp-range-input"
              value={rangeInputs.xMax}
              onChange={(e) =>
                setRangeInputs((p) => ({ ...p, xMax: e.target.value }))
              }
              onBlur={handleRangeCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleRangeCommit()}
              aria-label="x軸最大値"
            />
          </div>
          <div className="fp-range-group">
            <label htmlFor="fp-ymin" className="fp-range-label">
              y:
            </label>
            <input
              id="fp-ymin"
              type="number"
              className="fp-range-input"
              value={rangeInputs.yMin}
              onChange={(e) =>
                setRangeInputs((p) => ({ ...p, yMin: e.target.value }))
              }
              onBlur={handleRangeCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleRangeCommit()}
              aria-label="y軸最小値"
            />
            <span className="fp-range-separator">〜</span>
            <input
              id="fp-ymax"
              type="number"
              className="fp-range-input"
              value={rangeInputs.yMax}
              onChange={(e) =>
                setRangeInputs((p) => ({ ...p, yMax: e.target.value }))
              }
              onBlur={handleRangeCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleRangeCommit()}
              aria-label="y軸最大値"
            />
          </div>
          <button
            className="fp-auto-y-btn"
            onClick={handleAutoY}
            aria-label="y軸範囲を自動調整"
            title="関数の値域に合わせてy軸を自動調整"
          >
            y 自動
          </button>
        </div>

        {/* キャンバス */}
        <div className="fp-canvas-wrapper" ref={wrapperRef} aria-label="グラフ描画エリア">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={CANVAS_HEIGHT}
            className="fp-canvas"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            aria-label="数学関数グラフ"
            role="img"
          />
          {cursorCoords !== null && (
            <div className="fp-cursor-coords" aria-hidden="true">
              x = {cursorCoords.x.toPrecision(5)}, y = {cursorCoords.y.toPrecision(5)}
            </div>
          )}
          <p className="fp-canvas-hint" aria-hidden="true">
            ドラッグ: パン　ホイール: ズーム
          </p>
        </div>

        {/* 凡例 */}
        {legendItems.length > 0 && (
          <div className="fp-legend" aria-label="凡例">
            {legendItems.map((item, i) => (
              <div key={i} className="fp-legend-item">
                <span
                  className="fp-legend-line"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="fp-legend-expr">y = {item.expr}</span>
              </div>
            ))}
          </div>
        )}

        {/* アクション */}
        <div className="fp-actions">
          <button className="fp-reset-btn" onClick={handleReset} aria-label="表示範囲をリセット">
            範囲リセット
          </button>
          <button className="fp-export-btn" onClick={handleExport} aria-label="グラフをPNGとして保存">
            PNG 保存
          </button>
        </div>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                '「y = f(x)」の右辺の式を入力するとグラフが即座に描画されます',
                '最大4つの関数を同時に描画できます',
                'ドラッグでパン、マウスホイールでズームが可能です',
                'サンプルボタンをクリックすると関数式を入力できます',
              ],
            },
            {
              title: '使用できる関数・定数',
              items: [
                '三角関数: sin(x), cos(x), tan(x), asin(x), acos(x), atan(x)',
                '双曲線関数: sinh(x), cosh(x), tanh(x)',
                '指数・対数: exp(x), log(x), log2(x), log10(x)',
                '基本: sqrt(x), cbrt(x), abs(x), pow(x,n), sign(x)',
                '定数: PI (≈3.14159), E (≈2.71828), SQRT2, LN2, INF',
              ],
            },
            {
              title: '演算子',
              items: [
                '+ - * / : 四則演算',
                '^ : べき乗（例: x^2, x^3）',
                '% : 剰余（例: x % 2）',
                '括弧 () : 優先順位制御',
              ],
            },
            {
              title: '記述例',
              items: [
                'sin(x) — サイン曲線',
                'x^2 - 2*x + 1 — 二次関数',
                '1/x — 双曲線',
                'abs(x) — 絶対値',
                'sin(x*PI)/x — sinc関数',
                'floor(x) — 階段関数',
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
