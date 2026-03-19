import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { ASCII_TABLE, filterAsciiEntries, type AsciiFilter } from '../utils/ascii-table';
import { useClipboard } from '~/hooks/useClipboard';
import { TipsCard } from '~/components/TipsCard';
import '../styles/tools/ascii-table.css';

export const Route = createFileRoute('/ascii-table')({
  head: () => ({
    meta: [
      { title: 'ASCII テーブル | Web ツール集' },
      {
        name: 'description',
        content:
          'ASCII 文字コード 0〜127 の完全リファレンス。10進数・16進数・8進数・2進数・HTML エンティティ・説明を一覧表示。制御文字・印刷可能文字のフィルタリングと検索に対応。',
      },
      { property: 'og:title', content: 'ASCII テーブル | Web ツール集' },
      {
        property: 'og:description',
        content: 'ASCII コード 0〜127 の完全リファレンス。Dec/Hex/Oct/Bin/HTML Entity 対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/ascii-table` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'ASCII テーブル | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'ASCII コード 0〜127 の完全リファレンス。制御文字・印刷可能文字を一覧表示。',
      },
    ],
  }),
  component: AsciiTablePage,
});

/**
 * ASCII テーブルページコンポーネント
 * ASCII 文字コード 0–127 の完全リファレンスを提供する
 */
function AsciiTablePage() {
  const [filter, setFilter] = useState<AsciiFilter>('all');
  const [query, setQuery] = useState('');
  const { copy } = useClipboard();

  const filtered = useMemo(
    () => filterAsciiEntries(ASCII_TABLE, filter, query),
    [filter, query],
  );

  return (
    <div className="tool-container">
      {/* フィルターと検索 */}
      <div className="asc-controls">
        <div className="asc-filter-group" role="group" aria-label="カテゴリフィルター">
          {(['all', 'control', 'printable'] as AsciiFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`asc-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {f === 'all'
                ? 'すべて (0–127)'
                : f === 'control'
                  ? '制御文字 (0–31, 127)'
                  : '印刷可能 (32–126)'}
            </button>
          ))}
        </div>
        <div className="asc-search-wrap" role="search">
          <label htmlFor="asc-search" className="sr-only">
            ASCII 文字を検索
          </label>
          <input
            id="asc-search"
            type="text"
            className="asc-search-input"
            placeholder="文字・コード・説明で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="ASCII 文字を検索"
          />
          {query && (
            <button
              type="button"
              className="asc-search-clear"
              onClick={() => setQuery('')}
              aria-label="検索をクリア"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 件数表示 */}
      <p className="asc-count" aria-live="polite" role="status">
        {filtered.length} 件表示中
      </p>

      {/* テーブル */}
      <div className="asc-table-wrap" role="region" aria-label="ASCII テーブル" tabIndex={0}>
        <table className="asc-table" aria-label="ASCII 文字コード一覧">
          <thead>
            <tr>
              <th scope="col">Dec</th>
              <th scope="col">Hex</th>
              <th scope="col">Oct</th>
              <th scope="col">Bin</th>
              <th scope="col">文字</th>
              <th scope="col">HTML</th>
              <th scope="col">説明</th>
              <th scope="col" className="sr-only">コピー</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr
                key={entry.dec}
                className={`asc-row${entry.category === 'control' ? ' asc-row--control' : ''}`}
              >
                <td className="asc-cell-mono">{entry.dec}</td>
                <td className="asc-cell-mono">{entry.hex}</td>
                <td className="asc-cell-mono">{entry.oct}</td>
                <td className="asc-cell-bin">{entry.bin}</td>
                <td className="asc-cell-char">
                  <span
                    className={`asc-char${entry.printable ? '' : ' asc-char--control'}`}
                    aria-label={
                      entry.printable ? `文字: ${entry.char}` : `制御文字: ${entry.char}`
                    }
                  >
                    {entry.char}
                  </span>
                </td>
                <td className="asc-cell-mono asc-cell-entity">{entry.entity}</td>
                <td className="asc-cell-desc">{entry.description}</td>
                <td className="asc-cell-copy">
                  <button
                    type="button"
                    className="asc-copy-btn"
                    onClick={() => copy(entry.dec.toString())}
                    aria-label={`10進数 ${entry.dec} をコピー`}
                    title={`Dec: ${entry.dec} / Hex: ${entry.hex} / Char: ${entry.char}`}
                  >
                    コピー
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="asc-no-results" role="status">
          「{query}」に一致する文字が見つかりませんでした
        </div>
      )}

      <TipsCard
        sections={[
          {
            title: '使い方',
            items: [
              'カテゴリボタンで制御文字（0–31, 127）または印刷可能文字（32–126）を絞り込めます',
              '検索ボックスで10進数・16進数・文字・説明を検索できます（例: "65", "0x41", "A", "space"）',
              '「コピー」ボタンで 10進数コードをクリップボードにコピーします',
            ],
          },
          {
            title: '主な制御文字',
            items: [
              '0 (NUL): Null 文字 — 文字列終端に使われることがある',
              '9 (HT): 水平タブ — \\t として知られる',
              '10 (LF): 改行 — Unix/Linux の行末 (\\n)',
              '13 (CR): 復帰 — Windows の行末は CR+LF (\\r\\n)',
              '27 (ESC): エスケープ — ANSI エスケープシーケンスの開始',
              '32 (Space): スペース — 最初の印刷可能文字',
              '127 (DEL): 削除文字',
            ],
          },
          {
            title: 'ASCII の範囲',
            items: [
              '0–31: 制御文字 (通信・フォーマット制御)',
              '32–47: 記号 (スペース、! " # $ % & …)',
              '48–57: 数字 (0–9)',
              '58–64: 記号 (: ; < = > ? @)',
              '65–90: 大文字英字 (A–Z)',
              '91–96: 記号 ([ \\ ] ^ _ `)',
              '97–122: 小文字英字 (a–z)',
              '123–126: 記号 ({ | } ~)',
              '127: DEL 制御文字',
            ],
          },
        ]}
      />
    </div>
  );
}
