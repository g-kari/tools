import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  REGEX_LIBRARY,
  filterRegexEntries,
  getCategoryLabel,
  getCategoryClass,
  testRegex,
  type RegexCategory,
} from '~/utils/regex-library';
import '../styles/tools/regex-library.css';

export const Route = createFileRoute('/regex-library')({
  head: () => ({
    meta: [
      { title: '正規表現ライブラリ | Web ツール集' },
      {
        name: 'description',
        content:
          'よく使われる正規表現パターンのリファレンスライブラリ。メール・URL・IPアドレス・日付・電話番号・パスワードなど60種類以上のカテゴリ別パターンを収録。ライブテスト機能付き。',
      },
      { property: 'og:title', content: '正規表現ライブラリ | Web ツール集' },
      {
        property: 'og:description',
        content:
          'よく使われる正規表現パターンのリファレンスライブラリ。メール・URL・IPアドレス・日付・電話番号など多数のパターンを収録。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/regex-library` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '正規表現ライブラリ | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'よく使われる正規表現パターンのリファレンスライブラリ。カテゴリ別に検索してライブテストが可能。',
      },
    ],
  }),
  component: RegexLibraryPage,
});

const CATEGORIES: Array<RegexCategory | 'all'> = [
  'all',
  'email',
  'url',
  'network',
  'datetime',
  'phone',
  'password',
  'code',
  'japanese',
  'text',
  'finance',
];

/**
 * 正規表現ライブラリページ
 *
 * よく使われる正規表現パターンのカタログを表示するページ。
 * カテゴリフィルター・キーワード検索・ライブテスト機能を提供する。
 */
function RegexLibraryPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [selectedCategory, setSelectedCategory] = useState<RegexCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  /** カード別ライブテスト入力値: id -> test string */
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});

  const filteredEntries = useMemo(
    () => filterRegexEntries(REGEX_LIBRARY, searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  const handleCopyPattern = useCallback(
    async (id: string, pattern: string, flags: string) => {
      const text = flags ? `/${pattern}/${flags}` : pattern;
      const ok = await copy(text);
      if (ok) {
        showToast('パターンをコピーしました', 'success');
        announceStatus(`正規表現パターン ${id} をコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
        announceStatus('コピーに失敗しました');
      }
    },
    [copy, showToast, announceStatus]
  );

  const handleCategoryChange = useCallback(
    (cat: RegexCategory | 'all') => {
      setSelectedCategory(cat);
      const count = filterRegexEntries(REGEX_LIBRARY, searchQuery, cat).length;
      announceStatus(`${getCategoryLabel(cat)} でフィルタリング。${count} 件表示`);
    },
    [searchQuery, announceStatus]
  );

  const handleTestInputChange = useCallback((id: string, value: string) => {
    setTestInputs((prev) => ({ ...prev, [id]: value }));
  }, []);

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">正規表現ライブラリ</h2>

        {/* カテゴリフィルター */}
        <div className="regex-lib-filters" role="group" aria-label="カテゴリフィルター">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`regex-lib-filter-btn${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* 検索ボックス */}
        <div className="regex-lib-search">
          <label htmlFor="regex-lib-search-input" className="sr-only">
            正規表現を検索
          </label>
          <input
            id="regex-lib-search-input"
            type="search"
            className="regex-lib-search-input"
            placeholder="名前・説明・パターンで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="正規表現を検索"
          />
        </div>

        {/* 件数表示 */}
        <p
          className="regex-lib-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredEntries.length} 件 / 全 {REGEX_LIBRARY.length} 件
        </p>

        {/* カードグリッド */}
        {filteredEntries.length > 0 ? (
          <div className="regex-lib-grid" role="list" aria-label="正規表現パターン一覧">
            {filteredEntries.map((entry) => {
              const testInput = testInputs[entry.id] ?? '';
              const testResult = testInput !== '' ? testRegex(entry.pattern, entry.flags.replace('g', ''), testInput) : null;

              return (
                <article
                  key={entry.id}
                  className={`regex-lib-card ${getCategoryClass(entry.category)}`}
                  role="listitem"
                  aria-label={entry.name}
                >
                  {/* ヘッダー: 名前 + カテゴリバッジ */}
                  <div className="regex-lib-card-header">
                    <h3 className="regex-lib-name">{entry.name}</h3>
                    <span
                      className="regex-lib-badge"
                      aria-label={`カテゴリ: ${getCategoryLabel(entry.category)}`}
                    >
                      {getCategoryLabel(entry.category)}
                    </span>
                  </div>

                  {/* 説明 */}
                  <p className="regex-lib-description">{entry.description}</p>

                  {/* パターン表示 */}
                  <div className="regex-lib-pattern-area" aria-label="正規表現パターン">
                    <span className="regex-lib-pattern-label">Pattern</span>
                    <code className="regex-lib-pattern-code">{entry.pattern}</code>
                    {entry.flags && (
                      <span className="regex-lib-flags" aria-label={`フラグ: ${entry.flags}`}>
                        /{entry.flags}
                      </span>
                    )}
                  </div>

                  {/* マッチ例 */}
                  <div className="regex-lib-examples">
                    <div className="regex-lib-examples-row">
                      <span className="regex-lib-examples-label match" aria-label="マッチする例">
                        ✓
                      </span>
                      <div className="regex-lib-example-chips" role="list" aria-label="マッチする例">
                        {entry.examples.match.map((ex) => (
                          <code key={ex} className="regex-lib-chip match" role="listitem">
                            {ex}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div className="regex-lib-examples-row">
                      <span className="regex-lib-examples-label no-match" aria-label="マッチしない例">
                        ✗
                      </span>
                      <div className="regex-lib-example-chips" role="list" aria-label="マッチしない例">
                        {entry.examples.noMatch.map((ex) => (
                          <code key={ex} className="regex-lib-chip no-match" role="listitem">
                            {ex}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ライブテスト */}
                  <div className="regex-lib-test-area">
                    <span className="regex-lib-test-label">ライブテスト</span>
                    <div className="regex-lib-test-input-row">
                      <input
                        type="text"
                        className="regex-lib-test-input"
                        placeholder="テスト文字列を入力..."
                        value={testInput}
                        onChange={(e) => handleTestInputChange(entry.id, e.target.value)}
                        aria-label={`${entry.name} のライブテスト入力`}
                      />
                      <span
                        className={`regex-lib-test-result ${
                          testResult === null ? 'empty' : testResult ? 'match' : 'no-match'
                        }`}
                        aria-live="polite"
                        aria-label={
                          testResult === null
                            ? '入力待ち'
                            : testResult
                              ? 'マッチ'
                              : 'マッチなし'
                        }
                      >
                        {testResult === null ? '─' : testResult ? '✓ マッチ' : '✗ 不一致'}
                      </span>
                    </div>
                  </div>

                  {/* フッター: コピー + 正規表現チェッカーへのリンク */}
                  <div className="regex-lib-card-footer">
                    <button
                      type="button"
                      className="regex-lib-copy-btn"
                      onClick={() => handleCopyPattern(entry.id, entry.pattern, entry.flags)}
                      aria-label={`${entry.name} のパターンをコピー`}
                    >
                      パターンをコピー
                    </button>
                    <Link
                      to="/regex-checker"
                      className="regex-lib-checker-btn"
                      aria-label={`${entry.name} を正規表現チェッカーで開く`}
                    >
                      チェッカーで開く →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="regex-lib-empty" role="status" aria-live="polite">
            <p>該当する正規表現が見つかりませんでした。</p>
            <p>検索条件を変更してお試しください。</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: '正規表現の基本構文',
              items: [
                '.（ドット）: 任意の1文字（改行除く）',
                '* / + / ? : 0回以上 / 1回以上 / 0or1回の繰り返し',
                '[abc] / [^abc] : 文字クラス / 否定文字クラス',
                '^（行頭） / $（行末）: アンカー',
                '\\d / \\w / \\s : 数字 / 英数字 / 空白文字',
                '(?=...) / (?!...) : 先読み（肯定/否定）',
              ],
            },
            {
              title: 'フラグの意味',
              items: [
                'i（ignoreCase）: 大文字・小文字を区別しない',
                'g（global）: 文字列全体からすべてのマッチを検索',
                'm（multiline）: ^ $ が各行の先頭・末尾にマッチ',
                's（dotAll）: . が改行文字にもマッチ',
                'u（unicode）: Unicode モードで解析',
              ],
            },
            {
              title: '使用上の注意',
              items: [
                'メールアドレスの完全な検証はサーバーサイドでも行うこと',
                '正規表現は入力値の簡易チェックであり、完全保証ではない',
                'セキュリティに関わる検証は正規表現のみに頼らないこと',
                '「チェッカーで開く」から regex-checker でさらに詳しくテストできる',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
