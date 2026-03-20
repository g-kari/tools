import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useCallback, useRef } from 'react';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import {
  validateIsbn,
  SAMPLE_ISBNS,
  type IsbnResult,
} from '../utils/isbn';

export const Route = createFileRoute('/isbn')({
  head: () => ({
    meta: [
      { title: 'ISBN バリデーター | Web ツール集' },
      {
        name: 'description',
        content:
          'ISBN-10 / ISBN-13 の検証・相互変換ツール。チェックデジット計算、ハイフン付きフォーマット表示対応。入力データはブラウザ内で完結し外部送信されません。',
      },
      {
        property: 'og:title',
        content: 'ISBN バリデーター | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'ISBN-10 / ISBN-13 の検証・相互変換ツール。チェックデジット計算、ハイフン付きフォーマット表示対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/isbn` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'ISBN バリデーター | Web ツール集',
      },
      {
        name: 'twitter:description',
        content:
          'ISBN-10 / ISBN-13 の検証・相互変換。チェックデジット計算・フォーマット表示対応。',
      },
    ],
  }),
  component: IsbnTool,
});

/** 結果フィールドのコピーボタン付き表示 */
function ResultField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | null;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="isbn-result-item">
      <div className="isbn-result-label">{label}</div>
      {value ? (
        <div className="isbn-result-value">
          <span>{value}</span>
          <button
            type="button"
            className="isbn-copy-btn"
            onClick={() => onCopy(value)}
            aria-label={`${label}をコピー`}
          >
            コピー
          </button>
        </div>
      ) : (
        <div className="isbn-result-value na">— 該当なし —</div>
      )}
    </div>
  );
}

/**
 * ISBN バリデーターコンポーネント
 */
function IsbnTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [result, setResult] = useState<IsbnResult | null>(null);

  /** 入力変更時にリアルタイム検証 */
  const handleInputChange = useCallback((value: string) => {
    // 数字・X・ハイフン・スペースのみ許可
    const sanitized = value.replace(/[^0-9xXhH\-\s]/g, '');
    setInput(sanitized);

    const trimmed = sanitized.trim();
    if (trimmed.length === 0) {
      setResult(null);
      return;
    }
    const res = validateIsbn(trimmed);
    setResult(res);

    if (res.isValid) {
      announceStatus(`${res.type} 有効なISBNです`);
    }
  }, [announceStatus]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    inputRef.current?.focus();
    announceStatus('クリアしました');
  }, [announceStatus]);

  const handleCopy = useCallback(
    (text: string) => {
      copy(text);
      showToast('コピーしました', 'success');
      announceStatus('コピーしました');
    },
    [copy, showToast, announceStatus]
  );

  const handleSampleClick = useCallback(
    (isbn: string) => {
      setInput(isbn);
      const res = validateIsbn(isbn);
      setResult(res);
      announceStatus(`サンプル: ${isbn} を設定しました`);
    },
    [announceStatus]
  );

  const showResult = result && result.raw.length > 0;
  const showError =
    showResult && !result.isValid && result.raw.length >= 10;

  return (
    <>
      <div className="isbn-container">
        {/* 入力エリア */}
        <div className="isbn-input-section">
          <label htmlFor="isbn-input" className="section-title">
            ISBN を入力
          </label>
          <div className="isbn-input-row">
            <input
              ref={inputRef}
              id="isbn-input"
              type="text"
              className="isbn-input"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="例: 9784873119038 または 030640615X"
              autoComplete="off"
              spellCheck={false}
              maxLength={17}
              aria-label="ISBN入力欄"
              aria-describedby="isbn-hint"
            />
          </div>
          <p id="isbn-hint" className="isbn-samples-title" style={{ marginBottom: 0 }}>
            ISBN-10（10桁）または ISBN-13（13桁）を入力。ハイフンは自動除去されます。
          </p>
          <div className="isbn-button-group">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!input}
            >
              クリア
            </Button>
          </div>
        </div>

        {/* エラー表示 */}
        {showError && result.error && (
          <div className="isbn-error-section" role="alert">
            ⚠️ {result.error}
          </div>
        )}

        {/* 結果表示 */}
        {showResult && (result.isValid || result.isValidLength) && (
          <div className="isbn-result-section" aria-live="polite">
            <div
              className={`isbn-result-badge ${result.isValid ? 'valid' : 'invalid'}`}
            >
              {result.isValid ? '✅ 有効なISBN' : '❌ 無効なISBN'}
              {result.type && ` (${result.type})`}
            </div>

            <div className="isbn-result-grid">
              <ResultField
                label="ISBN（ハイフンなし）"
                value={result.formatted || null}
                onCopy={handleCopy}
              />
              <ResultField
                label="ISBN（ハイフンあり）"
                value={result.formattedWithHyphens || null}
                onCopy={handleCopy}
              />
              <ResultField
                label="ISBN-10"
                value={result.isbn10}
                onCopy={handleCopy}
              />
              <ResultField
                label="ISBN-13"
                value={result.isbn13}
                onCopy={handleCopy}
              />
            </div>
          </div>
        )}

        {/* サンプルISBN */}
        <div className="isbn-samples-section">
          <div className="isbn-samples-title">サンプル ISBN</div>
          <div className="isbn-samples-list">
            {SAMPLE_ISBNS.map((sample) => (
              <button
                key={sample.isbn}
                type="button"
                className="isbn-sample-item"
                onClick={() => handleSampleClick(sample.isbn)}
                aria-label={`${sample.label}: ${sample.isbn} を使用`}
              >
                <span className="isbn-sample-label">{sample.label}</span>
                <span className="isbn-sample-code">{sample.isbn}</span>
                <span className="isbn-sample-note">{sample.note}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 使い方 */}
        <TipsCard
          sections={[
            {
              title: 'ISBN とは',
              items: [
                'ISBN（国際標準図書番号）は書籍を一意に識別する番号です',
                'ISBN-10: 10桁。チェックデジットは 0–9 または X（=10）',
                'ISBN-13: 13桁。先頭が 978 または 979。チェックデジットは 0–9',
                '2007年以降に発行された書籍は基本的に ISBN-13 を使用',
              ],
            },
            {
              title: '相互変換について',
              items: [
                'ISBN-10 ↔ ISBN-13 の変換ができます',
                'ISBN-13 → ISBN-10 は先頭が 978 の場合のみ変換可能',
                '979 プレフィックスの ISBN-13 は ISBN-10 に変換できません',
              ],
            },
            {
              title: 'チェックデジット計算',
              items: [
                'ISBN-10: 各桁に 10〜1 を掛けた総和が 11 の倍数',
                'ISBN-13: 奇数位置 ×1、偶数位置 ×3 の総和が 10 の倍数',
                'X はチェックデジットとして 10 を表します（ISBN-10のみ）',
              ],
            },
            {
              title: '使い方',
              items: [
                '上のフィールドに ISBN を入力（ハイフンあり・なし両方OK）',
                'リアルタイムで検証結果が表示されます',
                'サンプルボタンをクリックして例を試せます',
                'コピーボタンで各形式の ISBN をクリップボードにコピーできます',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
