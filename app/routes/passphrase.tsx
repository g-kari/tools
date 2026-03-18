import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useEffect, useCallback } from 'react';
import {
  generatePassphrase,
  calculatePassphraseEntropy,
  getEntropyStrength,
  estimateCrackTime,
  SEPARATOR_OPTIONS,
  WORD_LIST,
  type PassphraseOptions,
} from '../utils/passphrase';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import { useKeyboardShortcut } from '~/hooks/useKeyboardShortcut';

export const Route = createFileRoute('/passphrase')({
  head: () => ({
    meta: [
      { title: 'パスフレーズ生成 | Web ツール集' },
      {
        name: 'description',
        content:
          '英単語を組み合わせた記憶しやすいパスフレーズを生成。単語数・区切り文字・大文字化・数字/記号の追加を設定可能。エントロピー計算とクラック時間推定付き。',
      },
      { property: 'og:title', content: 'パスフレーズ生成 | Web ツール集' },
      {
        property: 'og:description',
        content:
          '英単語を組み合わせた記憶しやすいパスフレーズを生成。単語数・区切り文字・大文字化・数字/記号の追加を設定可能。エントロピー計算とクラック時間推定付き。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/passphrase` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'パスフレーズ生成 | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          '英単語を組み合わせた記憶しやすいパスフレーズを生成。エントロピー計算付き。',
      },
    ],
  }),
  component: PassphraseGenerator,
});

/** デフォルト設定 */
const DEFAULT_OPTIONS: PassphraseOptions = {
  wordCount: 5,
  separator: '-',
  capitalize: false,
  addNumber: false,
  addSymbol: false,
};

function PassphraseGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [passphrase, setPassphrase] = useState('');
  const [options, setOptions] = useState<PassphraseOptions>(DEFAULT_OPTIONS);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleGenerate = useCallback(() => {
    const result = generatePassphrase(options);
    setPassphrase(result);
    setCopied(false);
    setHistory((prev) => [result, ...prev].slice(0, 5));
    announceStatus('パスフレーズを生成しました');
  }, [options, announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!passphrase) {
      showToast('コピーするパスフレーズがありません', 'error');
      return;
    }
    const success = await copy(passphrase);
    if (success) {
      setCopied(true);
      announceStatus('パスフレーズをクリップボードにコピーしました');
      showToast('クリップボードにコピーしました', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [passphrase, copy, showToast, announceStatus]);

  const handleCopyHistory = useCallback(
    async (text: string) => {
      const success = await copy(text);
      if (success) {
        showToast('クリップボードにコピーしました', 'success');
      }
    },
    [copy, showToast]
  );

  const handleOptionChange = useCallback(
    <K extends keyof PassphraseOptions>(key: K, value: PassphraseOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Ctrl+Enter で生成
  useKeyboardShortcut('Enter', handleGenerate, { ctrl: true });

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entropy = calculatePassphraseEntropy(options);
  const strength = getEntropyStrength(entropy);
  const crackTime = estimateCrackTime(entropy);

  return (
    <>
      <div className="pp-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="パスフレーズ生成フォーム">
          {/* 単語数スライダー */}
          <section className="pp-section" aria-labelledby="pp-word-count-heading">
            <label
              id="pp-word-count-heading"
              htmlFor="pp-word-count-hidden"
              className="section-title"
            >
              単語数: {options.wordCount} 語
            </label>
            {/* E2Eテスト用の隠しinput */}
            <input
              type="number"
              id="pp-word-count-hidden"
              value={options.wordCount}
              onChange={(e) =>
                handleOptionChange('wordCount', Math.min(8, Math.max(3, Number(e.target.value))))
              }
              min={3}
              max={8}
              aria-hidden="true"
              className="absolute opacity-0 pointer-events-none"
            />
            <Slider
              min={3}
              max={8}
              step={1}
              value={[options.wordCount]}
              onValueChange={(value) => handleOptionChange('wordCount', value[0])}
              aria-label="単語数"
              className="mb-5"
            />
          </section>

          {/* 区切り文字選択 */}
          <section className="pp-section" aria-labelledby="pp-separator-heading">
            <h2 id="pp-separator-heading" className="section-title">
              区切り文字
            </h2>
            <div className="pp-separator-group" role="group" aria-label="区切り文字の選択">
              {SEPARATOR_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`pp-separator-btn ${options.separator === opt.value ? 'pp-separator-btn--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="separator"
                    value={opt.value}
                    checked={options.separator === opt.value}
                    onChange={() => handleOptionChange('separator', opt.value)}
                    className="sr-only"
                    aria-label={opt.label}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* オプション設定 */}
          <section className="pp-section" aria-labelledby="pp-options-heading">
            <h2 id="pp-options-heading" className="section-title">
              追加オプション
            </h2>
            <div className="pp-options-group" role="group" aria-label="追加オプション">
              <div className="checkbox-label relative">
                <input
                  type="checkbox"
                  checked={options.capitalize}
                  onChange={(e) => handleOptionChange('capitalize', e.target.checked)}
                  aria-label="各単語の先頭を大文字にする"
                  className="absolute left-0 top-0 w-4 h-4 opacity-[0.01] cursor-pointer z-10"
                />
                <Checkbox
                  id="pp-capitalize"
                  checked={options.capitalize}
                  onCheckedChange={(checked) => handleOptionChange('capitalize', checked === true)}
                />
                <Label htmlFor="pp-capitalize">各単語の先頭を大文字にする</Label>
              </div>
              <div className="checkbox-label relative">
                <input
                  type="checkbox"
                  checked={options.addNumber}
                  onChange={(e) => handleOptionChange('addNumber', e.target.checked)}
                  aria-label="末尾に数字（2桁）を追加する"
                  className="absolute left-0 top-0 w-4 h-4 opacity-[0.01] cursor-pointer z-10"
                />
                <Checkbox
                  id="pp-add-number"
                  checked={options.addNumber}
                  onCheckedChange={(checked) => handleOptionChange('addNumber', checked === true)}
                />
                <Label htmlFor="pp-add-number">末尾に数字（2桁）を追加する</Label>
              </div>
              <div className="checkbox-label relative">
                <input
                  type="checkbox"
                  checked={options.addSymbol}
                  onChange={(e) => handleOptionChange('addSymbol', e.target.checked)}
                  aria-label="末尾に記号を追加する"
                  className="absolute left-0 top-0 w-4 h-4 opacity-[0.01] cursor-pointer z-10"
                />
                <Checkbox
                  id="pp-add-symbol"
                  checked={options.addSymbol}
                  onCheckedChange={(checked) => handleOptionChange('addSymbol', checked === true)}
                />
                <Label htmlFor="pp-add-symbol">末尾に記号を追加する (!@#$%^&*)</Label>
              </div>
            </div>
          </section>

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="パスフレーズ生成操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              aria-label="新しいパスフレーズを生成"
            >
              生成
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!passphrase}
              aria-label="パスフレーズをクリップボードにコピー"
            >
              {copied ? 'コピーしました' : 'コピー'}
            </Button>
          </div>

          {/* パスフレーズ出力 */}
          <div className="pp-output-section">
            <label htmlFor="pp-output" className="section-title">
              生成されたパスフレーズ
            </label>
            <input
              type="text"
              id="pp-output"
              value={passphrase}
              readOnly
              placeholder="パスフレーズを生成してください..."
              aria-label="生成されたパスフレーズ"
              aria-live="polite"
              className="pp-output-input"
            />
          </div>

          {/* エントロピー・強度情報 */}
          {passphrase && (
            <section className="pp-stats-section" aria-labelledby="pp-stats-heading">
              <h2 id="pp-stats-heading" className="section-title">
                セキュリティ情報
              </h2>
              <div className="result-card" aria-live="polite">
                <div className="result-row">
                  <div className="result-label">エントロピー</div>
                  <div className="result-value">{entropy.toFixed(1)} bits</div>
                </div>
                <div className="result-row">
                  <div className="result-label">強度</div>
                  <div className="result-value">{strength.label}</div>
                </div>
                <div className="result-row">
                  <div className="result-label">強度インジケーター</div>
                  <div className="result-value">
                    <div
                      className="strength-bar"
                      role="progressbar"
                      aria-valuenow={strength.score}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-label={`パスフレーズ強度: ${strength.label}`}
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`strength-segment ${level <= strength.score ? `strength-${strength.score}` : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">クラック推定時間</div>
                  <div className="result-value pp-crack-time">{crackTime}</div>
                </div>
                <div className="result-row">
                  <div className="result-label">単語数リスト</div>
                  <div className="result-value">{WORD_LIST.length.toLocaleString()} 語</div>
                </div>
              </div>
            </section>
          )}
        </form>

        {/* 生成履歴 */}
        {history.length > 1 && (
          <section className="pp-history-section" aria-labelledby="pp-history-heading">
            <h2 id="pp-history-heading" className="section-title">
              直近の生成履歴
            </h2>
            <ul className="pp-history-list" aria-label="パスフレーズ生成履歴">
              {history.slice(1).map((item, idx) => (
                <li key={idx} className="pp-history-item">
                  <span className="pp-history-text">{item}</span>
                  <button
                    type="button"
                    className="pp-history-copy"
                    onClick={() => handleCopyHistory(item)}
                    aria-label={`${item} をコピー`}
                  >
                    コピー
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'スライダーで単語数を調整（3〜8語）',
                '区切り文字を選択してパスフレーズの形式を変更',
                '「生成」ボタンで新しいパスフレーズを作成',
                '「コピー」ボタンでクリップボードにコピー',
                'キーボードショートカット: Ctrl+Enter で生成',
              ],
            },
            {
              title: 'パスフレーズとは？',
              items: [
                '複数の単語を組み合わせたパスワードの一種です',
                '「correct-horse-battery-staple」のような形式で、覚えやすく安全です',
                '5語以上のパスフレーズは、ランダムな12文字パスワードと同等以上のセキュリティがあります',
                '単語数を増やすほどエントロピー（強度の指標）が向上します',
                `クラック時間は毎秒10億回（10⁹）の試行を想定した目安です`,
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
