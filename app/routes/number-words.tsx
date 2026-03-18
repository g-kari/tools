import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useKeyboardShortcut } from '~/hooks/useKeyboardShortcut';
import {
  toWordsEnglish,
  toWordsEnglishOrdinal,
  toWordsJapanese,
  toWordsJapaneseReading,
  NUMBER_WORDS_MAX,
} from '../utils/number-words';

export const Route = createFileRoute('/number-words')({
  head: () => ({
    meta: [
      { title: '数値テキスト変換 | Web ツール集' },
      {
        name: 'description',
        content:
          '整数を英語・日本語のテキストに変換するツール。英語基数詞（one hundred twenty-three）・序数詞（first, second）・日本語漢数字（百二十三）・読み仮名（ひゃくにじゅうさん）に対応。',
      },
      { property: 'og:title', content: '数値テキスト変換 | Web ツール集' },
      {
        property: 'og:description',
        content:
          '整数を英語・日本語のテキストに変換するツール。英語基数詞・序数詞・日本語漢数字・読み仮名に対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/number-words` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '数値テキスト変換 | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          '整数を英語・日本語のテキストに変換するツール。',
      },
    ],
  }),
  component: NumberWordsConverter,
});

/** 変換結果の型 */
interface ConversionResult {
  enCardinal: string | null;
  enOrdinal: string | null;
  jaKanji: string | null;
  jaReading: string | null;
}

/** 変換を実行する */
function convert(input: string): ConversionResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const n = Number(trimmed);
  if (!Number.isInteger(n) || isNaN(n)) return null;

  return {
    enCardinal: toWordsEnglish(n),
    enOrdinal: toWordsEnglishOrdinal(n),
    jaKanji: toWordsJapanese(n),
    jaReading: toWordsJapaneseReading(n),
  };
}

/** 結果行コンポーネント */
function ResultRow({
  label,
  value,
  valueClass,
  onCopy,
}: {
  label: string;
  value: string | null;
  valueClass?: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="nw-result-card">
      <div className="nw-result-content">
        <div className="nw-result-label">{label}</div>
        {value ? (
          <div className={`nw-result-value ${valueClass ?? ''}`}>{value}</div>
        ) : (
          <div className="nw-result-empty">—</div>
        )}
      </div>
      <button
        type="button"
        className="nw-copy-button"
        onClick={() => value && onCopy(value)}
        disabled={!value}
        aria-label={`${label}をコピー`}
      >
        コピー
      </button>
    </div>
  );
}

/**
 * 数値テキスト変換コンポーネント
 */
function NumberWordsConverter() {
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleConvert = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('数値を入力してください');
      setResult(null);
      announceStatus('エラー: 数値を入力してください');
      inputRef.current?.focus();
      return;
    }

    const n = Number(trimmed);
    if (!Number.isInteger(n) || isNaN(n)) {
      setError('整数を入力してください');
      setResult(null);
      announceStatus('エラー: 整数を入力してください');
      inputRef.current?.focus();
      return;
    }

    if (Math.abs(n) > NUMBER_WORDS_MAX) {
      setError(`サポート範囲外です（最大: ±${NUMBER_WORDS_MAX.toLocaleString()}）`);
      setResult(null);
      announceStatus('エラー: サポート範囲外の数値です');
      inputRef.current?.focus();
      return;
    }

    const converted = convert(trimmed);
    if (!converted) {
      setError('変換に失敗しました');
      setResult(null);
      return;
    }

    setError('');
    setResult(converted);
    announceStatus('変換完了');
  }, [input, announceStatus]);

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('コピーしました', 'success');
        announceStatus('クリップボードにコピーしました');
      } catch {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [showToast, announceStatus]
  );

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError('');
    inputRef.current?.focus();
    announceStatus('クリアしました');
  }, [announceStatus]);

  // Ctrl+Enter で変換
  useKeyboardShortcut('Enter', handleConvert, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 入力変更時にリアルタイム変換
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      setError('');
      if (value.trim()) {
        const converted = convert(value);
        setResult(converted);
      } else {
        setResult(null);
      }
    },
    []
  );

  return (
    <>
      <div className="nw-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="数値テキスト変換フォーム"
        >
          {/* 入力セクション */}
          <section className="nw-input-section" aria-labelledby="nw-heading">
            <h2 id="nw-heading" className="section-title">
              数値テキスト変換
            </h2>

            <div className="nw-input-row">
              <label htmlFor="nw-input" className="sr-only">
                変換する整数
              </label>
              <input
                id="nw-input"
                ref={inputRef}
                type="number"
                className="nw-input"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="例: 12345"
                aria-label="変換する整数"
                aria-describedby="nw-input-help"
              />
            </div>
            <span id="nw-input-help" className="sr-only">
              整数を入力すると英語・日本語のテキストに変換されます
            </span>

            {error && (
              <p className="nw-error" role="alert">
                {error}
              </p>
            )}

            <div className="button-group" role="group" aria-label="操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleConvert}
                aria-label="数値をテキストに変換"
              >
                変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClear}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>

            <p className="nw-range-note">
              対応範囲: 0〜{NUMBER_WORDS_MAX.toLocaleString()}（999兆）、および負の整数の英語変換
            </p>
          </section>
        </form>

        {/* 結果セクション */}
        <div
          className="nw-results-section"
          aria-live="polite"
          aria-label="変換結果"
        >
          <ResultRow
            label="英語 基数詞 (Cardinal)"
            value={result?.enCardinal ?? null}
            valueClass="nw-value-large"
            onCopy={handleCopy}
          />
          <ResultRow
            label="英語 序数詞 (Ordinal)"
            value={result?.enOrdinal ?? null}
            onCopy={handleCopy}
          />
          <ResultRow
            label="日本語 漢数字"
            value={result?.jaKanji ?? null}
            valueClass="nw-value-japanese"
            onCopy={handleCopy}
          />
          <ResultRow
            label="日本語 読み仮名"
            value={result?.jaReading ?? null}
            valueClass="nw-value-reading"
            onCopy={handleCopy}
          />
        </div>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                '入力欄に整数を入力すると英語・日本語に自動変換されます',
                '「変換」ボタンまたは Ctrl+Enter でも変換できます',
                '各結果の「コピー」ボタンでクリップボードにコピーできます',
                '負の整数も英語変換に対応しています（例: -42 → negative forty-two）',
              ],
            },
            {
              title: '活用例',
                items: [
                  '請求書・領収書の金額を英語テキストで記載する場合',
                  '法的文書での数値の書き言葉表現',
                  '多言語対応アプリのローカライズ確認',
                  '日本語教育・英語学習での数値表現の確認',
                  '序数詞（1st, 2nd, 3rd...）の正確なスペル確認',
                ],
            },
            {
              title: '日本語の読みのルール',
              items: [
                '百の音便変化: 三百=さんびゃく, 六百=ろっぴゃく, 八百=はっぴゃく',
                '千の音便変化: 三千=さんぜん, 八千=はっせん',
                '「一千」は「せん」、「一百」は「ひゃく」と省略されます',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
