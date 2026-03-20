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
import { useClipboard } from '~/hooks/useClipboard';
import {
  validateCard,
  TEST_CARD_NUMBERS,
  type LuhnResult,
} from '../utils/luhn';

export const Route = createFileRoute('/luhn-check')({
  head: () => ({
    meta: [
      { title: 'Luhn / クレジットカード番号バリデーター | Web ツール集' },
      {
        name: 'description',
        content:
          'Luhnアルゴリズムでクレジットカード番号の有効性を検証するツール。Visa・Mastercard・Amex・Discover・JCBなどのカード種別を自動判定。テスト用カード番号リスト付き。ブラウザ内完結で入力データは外部送信されません。',
      },
      {
        property: 'og:title',
        content: 'Luhn / クレジットカード番号バリデーター | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'Luhnアルゴリズムでクレジットカード番号の有効性を検証。Visa・Mastercard・Amex・JCB等のカード種別を自動判定。テスト番号リスト付き。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/luhn-check` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'Luhn / クレジットカード番号バリデーター | Web ツール集',
      },
      {
        name: 'twitter:description',
        content:
          'Luhnアルゴリズムでクレジットカード番号の有効性を検証。カード種別自動判定・テスト番号リスト付き。',
      },
    ],
  }),
  component: LuhnCheckTool,
});

/** カード種別のブランドアイコン */
function BrandIcon({ brand }: { brand: string }) {
  const icons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    jcb: '💳',
    diners: '💳',
    unionpay: '💳',
  };
  return <span aria-hidden="true">{icons[brand] ?? '💳'}</span>;
}

/**
 * Luhn / クレジットカード番号バリデーターコンポーネント
 */
function LuhnCheckTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState('');
  const [result, setResult] = useState<LuhnResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // リアルタイム検証
  const handleInputChange = useCallback((value: string) => {
    // 数字・スペース・ハイフンのみ許可
    const sanitized = value.replace(/[^\d\s\-]/g, '');
    setInput(sanitized);

    const digits = sanitized.replace(/[\s\-]/g, '');
    if (digits.length === 0) {
      setResult(null);
      return;
    }
    setResult(validateCard(sanitized));
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    inputRef.current?.focus();
    announceStatus('クリアしました');
  }, [announceStatus]);

  const handleUseTestNumber = useCallback(
    (number: string) => {
      setInput(number);
      setResult(validateCard(number));
      inputRef.current?.focus();
      announceStatus(`テスト番号を入力しました: ${number}`);
    },
    [announceStatus]
  );

  const handleCopyFormatted = useCallback(async () => {
    if (!result?.formatted) {
      showToast('コピーするデータがありません', 'error');
      return;
    }
    const success = await copy(result.formatted);
    if (success) {
      showToast('フォーマット済み番号をコピーしました', 'success');
      announceStatus('クリップボードにコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [result, copy, showToast, announceStatus]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showDetails = result !== null && result.digits.length > 0;

  return (
    <>
      <div className="luhn-container">
        {/* 入力セクション */}
        <section className="luhn-input-section" aria-labelledby="luhn-heading">
          <h2 id="luhn-heading" className="section-title">
            Luhn / クレジットカード番号バリデーター
          </h2>

          <div className="luhn-input-row">
            <label htmlFor="luhn-input" className="sr-only">
              クレジットカード番号
            </label>
            <input
              id="luhn-input"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              className="luhn-input"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="例: 4532 0151 1283 0366"
              aria-label="クレジットカード番号"
              aria-describedby="luhn-input-help"
              maxLength={24}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <span id="luhn-input-help" className="sr-only">
            カード番号を入力するとリアルタイムで検証されます。スペース・ハイフンは自動的に除去されます。
          </span>

          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!input}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
            {result && result.formatted && (
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleCopyFormatted}
                aria-label="フォーマット済み番号をコピー"
              >
                コピー
              </Button>
            )}
          </div>

          {/* 検証結果バナー */}
          {showDetails && (
            <div
              className={`luhn-result-banner ${result.isValid && result.isValidLength ? 'valid' : 'invalid'}`}
              role="status"
              aria-live="polite"
              aria-label="Luhn検証結果"
            >
              <span className="luhn-result-icon">
                {result.isValid && result.isValidLength ? '✓' : '✗'}
              </span>
              <div className="luhn-result-text">
                <div className="luhn-result-title">
                  {result.isValid && result.isValidLength
                    ? 'Luhn検証: 有効'
                    : result.isValid && !result.isValidLength
                      ? 'Luhnチェック: 通過 (桁数不一致)'
                      : 'Luhn検証: 無効'}
                </div>
                <div className="luhn-result-subtitle">
                  {result.cardType
                    ? `${result.cardType.name} (${result.digits.length}桁)`
                    : `カード種別不明 (${result.digits.length}桁)`}
                </div>
              </div>
              {result.cardType && (
                <BrandIcon brand={result.cardType.brand} />
              )}
            </div>
          )}
        </section>

        {/* 詳細情報 */}
        {showDetails && (
          <section
            className="luhn-details-section"
            aria-labelledby="luhn-details-heading"
          >
            <h3 id="luhn-details-heading" className="section-title">
              詳細情報
            </h3>
            <div className="luhn-details-grid">
              <div className="luhn-detail-card span-2">
                <div className="luhn-detail-label">フォーマット済み番号</div>
                <div className="luhn-formatted-display">{result.formatted}</div>
              </div>

              <div className="luhn-detail-card">
                <div className="luhn-detail-label">Luhn チェック</div>
                <div
                  className={`luhn-detail-value ${result.isValid ? 'valid' : 'invalid'}`}
                >
                  {result.isValid ? '✓ 通過' : '✗ 失敗'}
                </div>
              </div>

              <div className="luhn-detail-card">
                <div className="luhn-detail-label">桁数</div>
                <div
                  className={`luhn-detail-value ${result.isValidLength ? 'valid' : 'invalid'}`}
                >
                  {result.digits.length}桁
                  {result.isValidLength ? ' ✓' : ' ✗'}
                </div>
              </div>

              <div className="luhn-detail-card">
                <div className="luhn-detail-label">カード種別</div>
                <div className="luhn-detail-value">
                  {result.cardType ? result.cardType.name : '不明'}
                </div>
              </div>

              <div className="luhn-detail-card">
                <div className="luhn-detail-label">チェックディジット</div>
                <div className="luhn-detail-value">{result.checkDigit}</div>
              </div>

              <div className="luhn-detail-card">
                <div className="luhn-detail-label">数字のみ</div>
                <div className="luhn-detail-value">{result.digits}</div>
              </div>

              <div className="luhn-detail-card">
                <div className="luhn-detail-label">先頭6桁 (BIN/IIN)</div>
                <div className="luhn-detail-value">
                  {result.digits.slice(0, 6) || '—'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* テスト番号リスト */}
        <section
          className="luhn-test-section"
          aria-labelledby="luhn-test-heading"
        >
          <h3 id="luhn-test-heading" className="section-title">
            テスト用カード番号
          </h3>
          <p className="tips-item luhn-tips-no-margin">
            これらはテスト・開発専用の番号です。実際の決済には使用できません。
          </p>
          <div className="luhn-test-table-wrapper">
            <table className="luhn-test-table" aria-label="テスト用カード番号一覧">
              <thead>
                <tr>
                  <th scope="col">ブランド</th>
                  <th scope="col">番号</th>
                  <th scope="col">備考</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {TEST_CARD_NUMBERS.map((card) => (
                  <tr key={card.number}>
                    <td>{card.name}</td>
                    <td>
                      <code className="luhn-test-number">{card.number}</code>
                    </td>
                    <td>{card.note}</td>
                    <td>
                      <button
                        type="button"
                        className="luhn-use-btn"
                        onClick={() => handleUseTestNumber(card.number)}
                        aria-label={`${card.name} ${card.number} を入力欄に設定`}
                      >
                        使用
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                '入力欄にカード番号を入力するとリアルタイムで検証されます',
                'スペース（例: 4532 0151 1283 0366）やハイフン区切りでも入力可能',
                '「テスト用カード番号」の「使用」ボタンで検証を試せます',
                '「コピー」ボタンでフォーマット済み番号をクリップボードにコピー',
              ],
            },
            {
              title: 'Luhnアルゴリズムとは',
              items: [
                'IBMのHans Peter Luhnが1954年に考案したチェックサムアルゴリズム',
                'クレジットカード・借方カード・SIM番号の誤入力検出に使われる',
                '有効なカード番号であっても実在するカードを保証するものではありません',
                'ISO/IEC 7812-1 で標準化されており、ほぼ全てのカードに採用',
              ],
            },
            {
              title: 'BIN/IIN（先頭6桁）',
              items: [
                'BIN (Bank Identification Number) = カード発行銀行の識別子',
                'IIN (Issuer Identification Number) とも呼ばれる',
                'Visa: 4から始まる16桁、Mastercard: 51–55 または 2221–2720',
                'Amex: 34 または 37 の15桁、JCB: 3528–3589 の16桁',
              ],
            },
            {
              title: 'セキュリティ上の注意',
              items: [
                '入力データはブラウザ内で完結し、外部サーバーには送信されません',
                '実際のクレジットカード番号は第三者と共有しないでください',
                'このツールはテスト・教育目的にのみ使用してください',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
