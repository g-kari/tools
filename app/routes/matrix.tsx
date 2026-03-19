import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import {
  parseMatrix,
  matrixAdd,
  matrixSubtract,
  matrixMultiply,
  matrixScalar,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  matrixTrace,
  matrixRank,
  formatMatrixNum,
  type Matrix,
} from '../utils/matrix';
import '../styles/tools/matrix.css';

export const Route = createFileRoute('/matrix')({
  head: () => ({
    meta: [
      { title: '行列計算ツール | Web ツール集' },
      {
        name: 'description',
        content:
          '行列の加算・減算・乗算・転置・逆行列・行列式・トレース・ランクをブラウザ内で計算。最大 6×6 の行列に対応。数学・機械学習・競技プログラミングに便利。',
      },
      { property: 'og:title', content: '行列計算ツール | Web ツール集' },
      {
        property: 'og:description',
        content:
          '行列の加算・減算・乗算・転置・逆行列・行列式・トレース・ランクをブラウザ内で計算。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/matrix` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '行列計算ツール | Web ツール集' },
      {
        name: 'twitter:description',
        content: '行列の各種演算をブラウザ内で計算するツール。',
      },
    ],
  }),
  component: MatrixPage,
});

type BinaryOp = 'add' | 'subtract' | 'multiply' | 'scalar';
type UnaryOp = 'transpose' | 'determinant' | 'inverse' | 'trace' | 'rank';
type OpMode = 'binary' | 'unary';

const BINARY_OPS: { value: BinaryOp; label: string; symbol: string }[] = [
  { value: 'add', label: '加算', symbol: 'A + B' },
  { value: 'subtract', label: '減算', symbol: 'A − B' },
  { value: 'multiply', label: '乗算', symbol: 'A × B' },
  { value: 'scalar', label: 'スカラー倍', symbol: 'kA' },
];

const UNARY_OPS: { value: UnaryOp; label: string; symbol: string }[] = [
  { value: 'transpose', label: '転置', symbol: 'Aᵀ' },
  { value: 'determinant', label: '行列式', symbol: 'det(A)' },
  { value: 'inverse', label: '逆行列', symbol: 'A⁻¹' },
  { value: 'trace', label: 'トレース', symbol: 'tr(A)' },
  { value: 'rank', label: 'ランク', symbol: 'rank(A)' },
];

const SAMPLE_MATRICES: { label: string; a: string; b: string }[] = [
  { label: '2×2', a: '1 2\n3 4', b: '5 6\n7 8' },
  {
    label: '3×3',
    a: '1 2 3\n0 1 4\n5 6 0',
    b: '1 0 0\n0 1 0\n0 0 1',
  },
  { label: '逆行列', a: '2 1\n5 3', b: '3 -1\n-5 2' },
  {
    label: '4×4',
    a: '1 2 0 0\n3 4 0 0\n0 0 2 1\n0 0 5 3',
    b: '1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1',
  },
];

/** 行列をグリッド形式で表示するコンポーネント */
function MatrixGrid({ matrix, label }: { matrix: Matrix; label?: string }) {
  return (
    <div className="matrix-grid-wrapper">
      {label && <span className="matrix-grid-label">{label}</span>}
      <div className="matrix-brackets">
        <span className="matrix-bracket-open" aria-hidden="true">[</span>
        <table
          className="matrix-table"
          role="grid"
          aria-label={label ?? '行列'}
        >
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j} className="matrix-cell">
                    {formatMatrixNum(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <span className="matrix-bracket-close" aria-hidden="true">]</span>
      </div>
    </div>
  );
}

/**
 * 行列計算ページ
 */
function MatrixPage() {
  const [mode, setMode] = useState<OpMode>('binary');
  const [binaryOp, setBinaryOp] = useState<BinaryOp>('add');
  const [unaryOp, setUnaryOp] = useState<UnaryOp>('transpose');
  const [inputA, setInputA] = useState('1 2\n3 4');
  const [inputB, setInputB] = useState('5 6\n7 8');
  const [scalar, setScalar] = useState('2');

  const parsedA = useMemo(() => parseMatrix(inputA), [inputA]);
  const parsedB = useMemo(() => parseMatrix(inputB), [inputB]);
  const scalarVal = useMemo(() => parseFloat(scalar), [scalar]);

  const result = useMemo(() => {
    if (parsedA.error || !parsedA.matrix) return null;
    const a = parsedA.matrix;

    if (mode === 'unary') {
      switch (unaryOp) {
        case 'transpose':
          return matrixTranspose(a);
        case 'determinant':
          return matrixDeterminant(a);
        case 'inverse':
          return matrixInverse(a);
        case 'trace':
          return matrixTrace(a);
        case 'rank':
          return matrixRank(a);
      }
    }

    if (binaryOp === 'scalar') {
      if (isNaN(scalarVal)) {
        return { result: null, scalar: null, error: '有効なスカラー値を入力してください' };
      }
      return matrixScalar(a, scalarVal);
    }

    if (parsedB.error || !parsedB.matrix) return null;
    const b = parsedB.matrix;

    switch (binaryOp) {
      case 'add':
        return matrixAdd(a, b);
      case 'subtract':
        return matrixSubtract(a, b);
      case 'multiply':
        return matrixMultiply(a, b);
    }
  }, [mode, binaryOp, unaryOp, parsedA, parsedB, scalarVal]);

  const handleSample = useCallback((a: string, b: string) => {
    setInputA(a);
    setInputB(b);
  }, []);

  const currentOp =
    mode === 'binary'
      ? BINARY_OPS.find((op) => op.value === binaryOp)
      : UNARY_OPS.find((op) => op.value === unaryOp);

  const showBInput = mode === 'binary' && binaryOp !== 'scalar';
  const showScalarInput = mode === 'binary' && binaryOp === 'scalar';

  return (
    <div className="tool-container">
      <h2 className="section-title">行列計算ツール</h2>

      {/* モード切替 */}
      <div className="matrix-mode-tabs" role="tablist" aria-label="演算モード">
        <button
          role="tab"
          type="button"
          aria-selected={mode === 'binary'}
          className={`matrix-mode-tab${mode === 'binary' ? ' active' : ''}`}
          onClick={() => setMode('binary')}
        >
          二項演算 (A ○ B)
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={mode === 'unary'}
          className={`matrix-mode-tab${mode === 'unary' ? ' active' : ''}`}
          onClick={() => setMode('unary')}
        >
          単項演算 (A のみ)
        </button>
      </div>

      {/* 演算選択 */}
      <div className="matrix-ops-row" role="group" aria-label="演算種別">
        {mode === 'binary'
          ? BINARY_OPS.map((op) => (
              <button
                key={op.value}
                type="button"
                aria-pressed={binaryOp === op.value}
                className={`matrix-op-btn${binaryOp === op.value ? ' active' : ''}`}
                onClick={() => setBinaryOp(op.value)}
              >
                <span className="matrix-op-symbol">{op.symbol}</span>
                <span className="matrix-op-label">{op.label}</span>
              </button>
            ))
          : UNARY_OPS.map((op) => (
              <button
                key={op.value}
                type="button"
                aria-pressed={unaryOp === op.value}
                className={`matrix-op-btn${unaryOp === op.value ? ' active' : ''}`}
                onClick={() => setUnaryOp(op.value)}
              >
                <span className="matrix-op-symbol">{op.symbol}</span>
                <span className="matrix-op-label">{op.label}</span>
              </button>
            ))}
      </div>

      {/* サンプルボタン */}
      <div className="matrix-samples-row">
        <span className="matrix-samples-label">サンプル:</span>
        {SAMPLE_MATRICES.map((s) => (
          <button
            key={s.label}
            type="button"
            className="matrix-sample-btn"
            onClick={() => handleSample(s.a, s.b)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 入力エリア */}
      <div className="matrix-inputs">
        {/* 行列 A */}
        <div className="matrix-input-block">
          <label htmlFor="matrix-a-input" className="matrix-input-label">
            行列 A
            {parsedA.matrix && (
              <span className="matrix-size-badge">
                {parsedA.rows}×{parsedA.cols}
              </span>
            )}
          </label>
          <textarea
            id="matrix-a-input"
            className={`matrix-textarea${parsedA.error ? ' error' : ''}`}
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            placeholder={'1 2 3\n4 5 6\n7 8 9'}
            aria-label="行列 A を入力（スペース区切りで列、改行で行）"
            spellCheck={false}
          />
          {parsedA.error && (
            <span className="matrix-input-error" role="alert">
              {parsedA.error}
            </span>
          )}
        </div>

        {/* 演算子 */}
        {mode === 'binary' && (
          <div className="matrix-op-divider" aria-hidden="true">
            <span className="matrix-op-divider-symbol">
              {currentOp?.symbol ?? '○'}
            </span>
          </div>
        )}

        {/* 行列 B or スカラー入力 */}
        {showBInput && (
          <div className="matrix-input-block">
            <label htmlFor="matrix-b-input" className="matrix-input-label">
              行列 B
              {parsedB.matrix && (
                <span className="matrix-size-badge">
                  {parsedB.rows}×{parsedB.cols}
                </span>
              )}
            </label>
            <textarea
              id="matrix-b-input"
              className={`matrix-textarea${parsedB.error ? ' error' : ''}`}
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              placeholder={'5 6\n7 8'}
              aria-label="行列 B を入力（スペース区切りで列、改行で行）"
              spellCheck={false}
            />
            {parsedB.error && (
              <span className="matrix-input-error" role="alert">
                {parsedB.error}
              </span>
            )}
          </div>
        )}

        {showScalarInput && (
          <div className="matrix-input-block matrix-input-block--scalar">
            <label htmlFor="matrix-scalar-input" className="matrix-input-label">
              スカラー k
            </label>
            <input
              id="matrix-scalar-input"
              type="number"
              className="matrix-scalar-input"
              value={scalar}
              onChange={(e) => setScalar(e.target.value)}
              aria-label="スカラー値を入力"
            />
          </div>
        )}
      </div>

      {/* 結果表示 */}
      <div className="matrix-result-section" aria-live="polite">
        <div className="matrix-result-header">
          <span className="matrix-result-title">
            計算結果:{' '}
            <span className="matrix-result-op">{currentOp?.symbol}</span>
          </span>
        </div>

        {!result && (
          <div className="matrix-result-empty">
            行列を入力すると結果が表示されます
          </div>
        )}

        {result?.error && (
          <div className="matrix-result-error" role="alert">
            ⚠ {result.error}
          </div>
        )}

        {result && !result.error && (
          <div className="matrix-result-content">
            {result.result && <MatrixGrid matrix={result.result} />}
            {result.scalar !== null && (
              <div className="matrix-scalar-result">
                <span className="matrix-scalar-result-value">
                  {formatMatrixNum(result.scalar)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 入力行列プレビュー */}
      {(parsedA.matrix ||
        (mode === 'binary' && !showScalarInput && parsedB.matrix)) && (
        <div className="matrix-preview-section">
          <p className="matrix-preview-title">入力行列プレビュー</p>
          <div className="matrix-preview-row">
            {parsedA.matrix && (
              <MatrixGrid matrix={parsedA.matrix} label="行列 A" />
            )}
            {mode === 'binary' && !showScalarInput && parsedB.matrix && (
              <MatrixGrid matrix={parsedB.matrix} label="行列 B" />
            )}
          </div>
        </div>
      )}

      <TipsCard>
        <ul>
          <li>スペース・タブ・カンマで列を区切り、改行で行を区切って入力</li>
          <li>行列式・逆行列・トレースは正方行列のみ対応</li>
          <li>乗算は A の列数と B の行数が一致する必要があります（A: m×n、B: n×p → 結果: m×p）</li>
          <li>負数・小数も使用可能（例: -1.5 や 3.14）</li>
          <li>逆行列が存在しない場合（特異行列）はエラーが表示されます</li>
        </ul>
      </TipsCard>
    </div>
  );
}
