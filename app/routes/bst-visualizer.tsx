import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { TipsCard } from '~/components/TipsCard';
import {
  type BSTNode,
  type NodePosition,
  type TraversalType,
  TRAVERSAL_LABELS,
  insertNode,
  deleteNode,
  searchNode,
  inorder,
  preorder,
  postorder,
  getHeight,
  getSize,
  calcTreeLayout,
  NODE_RADIUS,
  BASE_WIDTH,
  LEVEL_HEIGHT,
} from '~/utils/bst-visualizer';
import '../styles/tools/bst-visualizer.css';

export const Route = createFileRoute('/bst-visualizer')({
  head: () => ({
    meta: [
      { title: '二分探索木ビジュアライザー | Web ツール集' },
      {
        name: 'description',
        content:
          '二分探索木（BST）の挿入・削除・探索をアニメーションで可視化するツール。中順・前順・後順の走査結果もリアルタイム表示。',
      },
      {
        property: 'og:title',
        content: '二分探索木ビジュアライザー | Web ツール集',
      },
      {
        property: 'og:description',
        content: 'BSTの挿入・削除・探索をブラウザ内でアニメーション可視化。走査順序もリアルタイム確認。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/bst-visualizer` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: '二分探索木ビジュアライザー | Web ツール集',
      },
      {
        name: 'twitter:description',
        content: 'BSTの挿入・削除・探索をアニメーションで可視化。',
      },
    ],
  }),
  component: BSTVisualizerPage,
});

const PRESETS: { label: string; values: number[] }[] = [
  { label: '基本', values: [50, 30, 70, 20, 40, 60, 80] },
  { label: '左偏り', values: [50, 40, 30, 20, 10] },
  { label: '右偏り', values: [10, 20, 30, 40, 50] },
  { label: 'ランダム10', values: [] },
];

type MessageType = 'found' | 'not-found' | 'info' | null;

/** SVG の高さを木の高さに応じて計算 */
function calcSvgHeight(root: BSTNode | null): number {
  const h = getHeight(root);
  if (h === 0) return 120;
  return NODE_RADIUS + h * LEVEL_HEIGHT + NODE_RADIUS + 20;
}

function BSTVisualizerPage() {
  const [root, setRoot] = useState<BSTNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [highlight, setHighlight] = useState<Map<number, NodePosition['state']>>(new Map());
  const [message, setMessage] = useState<{ text: string; type: MessageType } | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHighlight = useCallback(() => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => {
      setHighlight(new Map());
      setMessage(null);
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  const parseInput = useCallback((): number | null => {
    const v = parseInt(inputValue.trim(), 10);
    if (isNaN(v) || v < -9999 || v > 9999) return null;
    return v;
  }, [inputValue]);

  const handleInsert = useCallback(() => {
    const v = parseInput();
    if (v === null) {
      setMessage({ text: '−9999〜9999 の整数を入力してください。', type: 'info' });
      return;
    }
    const newRoot = insertNode(root, v);
    if (newRoot === root) {
      setMessage({ text: `${v} はすでに存在します。`, type: 'info' });
      return;
    }
    setRoot(newRoot);
    const m = new Map<number, NodePosition['state']>();
    m.set(v, 'inserting');
    setHighlight(m);
    setMessage({ text: `${v} を挿入しました。`, type: 'info' });
    clearHighlight();
    setInputValue('');
  }, [parseInput, root, clearHighlight]);

  const handleDelete = useCallback(() => {
    const v = parseInput();
    if (v === null) {
      setMessage({ text: '削除する値を入力してください。', type: 'info' });
      return;
    }
    const [path] = searchNode(root, v);
    if (!path.includes(v)) {
      setMessage({ text: `${v} は木の中に存在しません。`, type: 'not-found' });
      return;
    }
    setRoot(deleteNode(root, v));
    setHighlight(new Map());
    setMessage({ text: `${v} を削除しました。`, type: 'info' });
    clearHighlight();
    setInputValue('');
  }, [parseInput, root, clearHighlight]);

  const handleSearch = useCallback(() => {
    const v = parseInput();
    if (v === null) {
      setMessage({ text: '探索する値を入力してください。', type: 'info' });
      return;
    }
    const [path, found] = searchNode(root, v);
    const m = new Map<number, NodePosition['state']>();
    for (const p of path) {
      m.set(p, p === v && found ? 'found' : 'searching');
    }
    setHighlight(m);
    if (found) {
      setMessage({ text: `${v} が見つかりました！（${path.length} ステップ）`, type: 'found' });
    } else {
      setMessage({ text: `${v} は見つかりませんでした。`, type: 'not-found' });
      for (const p of path) m.set(p, 'not-found');
      setHighlight(new Map(m));
    }
    clearHighlight();
  }, [parseInput, root, clearHighlight]);

  const handleClear = useCallback(() => {
    setRoot(null);
    setHighlight(new Map());
    setMessage(null);
    setInputValue('');
  }, []);

  const handlePreset = useCallback(
    (values: number[]) => {
      let r: BSTNode | null = null;
      const nums =
        values.length === 0
          ? Array.from({ length: 10 }, () => Math.floor(Math.random() * 90) + 5)
          : values;
      for (const v of nums) r = insertNode(r, v);
      setRoot(r);
      setHighlight(new Map());
      setMessage({ text: 'プリセットを読み込みました。', type: 'info' });
      clearHighlight();
    },
    [clearHighlight]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleInsert();
    },
    [handleInsert]
  );

  // SVG レイアウト
  const positions = calcTreeLayout(root, highlight);
  const svgHeight = calcSvgHeight(root);
  const isEmpty = root === null;

  // 走査結果
  const traversals: { type: TraversalType; values: number[] }[] = [
    { type: 'inorder', values: inorder(root) },
    { type: 'preorder', values: preorder(root) },
    { type: 'postorder', values: postorder(root) },
  ];

  const height = getHeight(root);
  const size = getSize(root);

  return (
    <div className="bst-visualizer">
      <h1 className="bst-visualizer__title">二分探索木ビジュアライザー</h1>
      <p className="bst-visualizer__description">
        二分探索木（BST）の挿入・削除・探索をリアルタイムで可視化します。
      </p>

      {/* プリセット */}
      <div className="bst-visualizer__presets">
        <span className="bst-visualizer__preset-label">プリセット:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className="bst-visualizer__btn bst-visualizer__btn--ghost"
            onClick={() => handlePreset(p.values)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* コントロール */}
      <div className="bst-visualizer__controls">
        <div className="bst-visualizer__input-group">
          <label className="bst-visualizer__input-label" htmlFor="bst-input">
            値（整数）
          </label>
          <input
            id="bst-input"
            className="bst-visualizer__input"
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例: 42"
            aria-label="操作する値"
          />
        </div>
        <div className="bst-visualizer__buttons">
          <button
            className="bst-visualizer__btn bst-visualizer__btn--primary"
            onClick={handleInsert}
            type="button"
            aria-label="挿入"
          >
            挿入
          </button>
          <button
            className="bst-visualizer__btn bst-visualizer__btn--secondary"
            onClick={handleSearch}
            disabled={isEmpty}
            type="button"
            aria-label="探索"
          >
            探索
          </button>
          <button
            className="bst-visualizer__btn bst-visualizer__btn--error"
            onClick={handleDelete}
            disabled={isEmpty}
            type="button"
            aria-label="削除"
          >
            削除
          </button>
          <button
            className="bst-visualizer__btn bst-visualizer__btn--ghost"
            onClick={handleClear}
            disabled={isEmpty}
            type="button"
            aria-label="クリア"
          >
            クリア
          </button>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`bst-visualizer__message bst-visualizer__message--${message.type}`}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </div>
      )}

      {/* 統計 */}
      <div className="bst-visualizer__stats">
        <div className="bst-visualizer__stat">
          <span className="bst-visualizer__stat-label">ノード数</span>
          <span className="bst-visualizer__stat-value">{size}</span>
        </div>
        <div className="bst-visualizer__stat">
          <span className="bst-visualizer__stat-label">高さ</span>
          <span className="bst-visualizer__stat-value">{height}</span>
        </div>
      </div>

      {/* 凡例 */}
      {!isEmpty && (
        <div className="bst-visualizer__legend" aria-label="凡例">
          <div className="bst-visualizer__legend-item">
            <div className="bst-visualizer__legend-dot bst-visualizer__legend-dot--normal" />
            通常
          </div>
          <div className="bst-visualizer__legend-item">
            <div className="bst-visualizer__legend-dot bst-visualizer__legend-dot--inserting" />
            挿入
          </div>
          <div className="bst-visualizer__legend-item">
            <div className="bst-visualizer__legend-dot bst-visualizer__legend-dot--searching" />
            探索中
          </div>
          <div className="bst-visualizer__legend-item">
            <div className="bst-visualizer__legend-dot bst-visualizer__legend-dot--found" />
            発見
          </div>
          <div className="bst-visualizer__legend-item">
            <div className="bst-visualizer__legend-dot bst-visualizer__legend-dot--not-found" />
            未発見
          </div>
        </div>
      )}

      {/* SVG ツリー */}
      <div className="bst-visualizer__canvas-wrap">
        {isEmpty ? (
          <div className="bst-visualizer__empty">
            <div className="bst-visualizer__empty-icon">🌲</div>
            <div className="bst-visualizer__empty-text">
              値を入力して「挿入」ボタンを押すか、プリセットを選択してください。
            </div>
          </div>
        ) : (
          <svg
            className="bst-visualizer__canvas"
            width={BASE_WIDTH}
            height={svgHeight}
            viewBox={`0 0 ${BASE_WIDTH} ${svgHeight}`}
            role="img"
            aria-label="二分探索木の可視化"
          >
            {/* エッジ（辺）を先に描画 */}
            {positions.map((pos) =>
              pos.parentX !== null && pos.parentY !== null ? (
                <line
                  key={`edge-${pos.value}`}
                  className="bst-edge"
                  x1={pos.parentX}
                  y1={pos.parentY}
                  x2={pos.x}
                  y2={pos.y}
                />
              ) : null
            )}
            {/* ノード */}
            {positions.map((pos) => (
              <g key={`node-${pos.value}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  className={
                    pos.state === 'normal'
                      ? 'bst-node-circle'
                      : `bst-node-circle bst-node-circle--${pos.state}`
                  }
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  className={
                    pos.state === 'normal'
                      ? 'bst-node-text'
                      : `bst-node-text bst-node-text--${pos.state}`
                  }
                >
                  {pos.value}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* 走査順序 */}
      {!isEmpty && (
        <div className="bst-visualizer__traversals">
          {traversals.map(({ type, values }) => (
            <div className="bst-visualizer__traversal" key={type}>
              <div className="bst-visualizer__traversal-title">{TRAVERSAL_LABELS[type]}</div>
              <div className="bst-visualizer__traversal-values" aria-label={`${TRAVERSAL_LABELS[type]}走査結果`}>
                {values.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      <TipsCard
        sections={[
          {
            title: '使い方',
            items: [
              '値を入力して「挿入」ボタン（またはEnterキー）でノードを追加します。',
              '「探索」ボタンで値を検索すると、探索経路が色で表示されます。',
              '「削除」ボタンで指定した値のノードを削除します。',
              'プリセットボタンで即座にサンプルの木を表示できます。',
            ],
          },
          {
            title: '二分探索木（BST）とは',
            items: [
              '各ノードの左部分木には、そのノードより小さい値のみが入ります。',
              '各ノードの右部分木には、そのノードより大きい値のみが入ります。',
              '中順走査（inorder traversal）を行うと昇順にソートされた配列が得られます。',
              '探索・挿入・削除の平均計算量は O(log n)、最悪計算量は O(n) です。',
            ],
          },
        ]}
      />
    </div>
  );
}
