import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  encodeBase36,
  decodeBase36,
  validateBase36,
  encodeIntBase36,
  decodeIntBase36,
  type Base36Variant,
} from '~/utils/base36';
import '../styles/tools/base36.css';

export const Route = createFileRoute('/base36')({
  head: () => ({
    meta: [
      { title: 'Base36エンコード・デコード | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストや整数を Base36 形式にエンコード・デコードするオンラインツール。[0-9a-z] の 36 文字を使用。JavaScript の Number.toString(36) と互換性があり、短い ID 生成やライセンスキーに最適。',
      },
      { property: 'og:title', content: 'Base36エンコード・デコード | Web ツール集' },
      {
        property: 'og:description',
        content: 'Base36エンコード・デコード。JavaScript の Number.toString(36) と互換の英数字エンコード方式。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/base36` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'Base36エンコード・デコード | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'Base36エンコード・デコード。短い ID・ライセンスキー生成に使われる英数字エンコード方式。',
      },
    ],
  }),
  component: Base36Converter,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = 'encode' | 'decode';
type InputMode = 'text' | 'number';

/**
 * Base36 変換コンポーネント
 */
function Base36Converter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('encode');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [input, setInput] = useState('');
  const [variant, setVariant] = useState<Base36Variant>('lower');

  // テキストモード：エンコード結果
  const encodeResult = useMemo(() => {
    if (mode !== 'encode' || inputMode !== 'text' || !input) return null;
    return encodeBase36(input, variant);
  }, [mode, inputMode, input, variant]);

  // テキストモード：デコード結果・エラー
  const { decodeResult, decodeError } = useMemo(() => {
    if (mode !== 'decode' || inputMode !== 'text' || !input.trim()) {
      return { decodeResult: null, decodeError: null };
    }
    const validationError = validateBase36(input);
    if (validationError) {
      return { decodeResult: null, decodeError: validationError };
    }
    const result = decodeBase36(input);
    if (!result.success) {
      return { decodeResult: null, decodeError: result.error ?? 'デコードに失敗しました' };
    }
    return { decodeResult: result, decodeError: null };
  }, [mode, inputMode, input]);

  // 数値モード：結果
  const { numberResult, numberError } = useMemo(() => {
    if (inputMode !== 'number' || !input.trim()) {
      return { numberResult: null, numberError: null };
    }
    if (mode === 'encode') {
      // 10進数 → Base36
      try {
        const n = BigInt(input.trim().replace(/[,_]/g, ''));
        if (n < 0n) return { numberResult: null, numberError: '負の整数はサポートされていません' };
        return { numberResult: encodeIntBase36(n, variant), numberError: null };
      } catch {
        return { numberResult: null, numberError: '有効な整数を入力してください' };
      }
    } else {
      // Base36 → 10進数
      const validationError = validateBase36(input);
      if (validationError) return { numberResult: null, numberError: validationError };
      try {
        const n = decodeIntBase36(input.trim());
        return { numberResult: n.toString(), numberError: null };
      } catch (e) {
        return { numberResult: null, numberError: String(e) };
      }
    }
  }, [inputMode, mode, input, variant]);

  const output =
    inputMode === 'number'
      ? (numberResult ?? '')
      : mode === 'encode'
        ? (encodeResult?.encoded ?? '')
        : (decodeResult?.decoded ?? '');

  const hasOutput = !!output;

  const handleCopyOutput = useCallback(async () => {
    if (!output) return;
    const ok = await copy(output);
    if (ok) {
      showToast('コピーしました', 'success');
      announceStatus('出力をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [output, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInput('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setInput('');
      announceStatus(
        newMode === 'encode' ? 'エンコードモードに切り替えました' : 'デコードモードに切り替えました',
      );
    },
    [announceStatus],
  );

  const handleSwap = useCallback(() => {
    if (!output) return;
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    setInput(output);
    announceStatus('入出力を入れ替えました');
  }, [mode, output, announceStatus]);

  const errorMessage =
    inputMode === 'number' ? numberError : mode === 'decode' ? decodeError : null;

  const alphabetDisplay =
    variant === 'upper'
      ? '0-9A-Z (0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ)'
      : '0-9a-z (0123456789abcdefghijklmnopqrstuvwxyz)';

  return (
    <>
      <div className="tool-container">
        <h2 className="tool-title">Base36 エンコード・デコード</h2>

        {/* モード切替 */}
        <div className="b36-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === 'encode'}
            className={`b36-tab-btn${mode === 'encode' ? ' active' : ''}`}
            onClick={() => handleModeChange('encode')}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={mode === 'decode'}
            className={`b36-tab-btn${mode === 'decode' ? ' active' : ''}`}
            onClick={() => handleModeChange('decode')}
          >
            デコード
          </button>
        </div>

        {/* 入力モード選択 */}
        <div className="b36-mode-tabs" role="group" aria-label="入力モード">
          <button
            type="button"
            className={`b36-mode-btn${inputMode === 'text' ? ' active' : ''}`}
            onClick={() => { setInputMode('text'); setInput(''); }}
            aria-pressed={inputMode === 'text'}
          >
            テキスト
          </button>
          <button
            type="button"
            className={`b36-mode-btn${inputMode === 'number' ? ' active' : ''}`}
            onClick={() => { setInputMode('number'); setInput(''); }}
            aria-pressed={inputMode === 'number'}
          >
            整数
          </button>
        </div>

        {/* オプション */}
        <div className="b36-options-row">
          <fieldset className="b36-fieldset">
            <legend className="b36-legend">出力形式</legend>
            <label className="b36-radio-label">
              <input
                type="radio"
                name="b36-variant"
                value="lower"
                checked={variant === 'lower'}
                onChange={() => setVariant('lower')}
              />
              小文字 (0-9a-z)
            </label>
            <label className="b36-radio-label">
              <input
                type="radio"
                name="b36-variant"
                value="upper"
                checked={variant === 'upper'}
                onChange={() => setVariant('upper')}
              />
              大文字 (0-9A-Z)
            </label>
          </fieldset>
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="b36-input" className="section-title">
            {inputMode === 'number'
              ? mode === 'encode' ? '10進数整数' : 'Base36 文字列'
              : mode === 'encode' ? '入力テキスト' : 'Base36 文字列'}
          </label>
          {inputMode === 'text' ? (
            <textarea
              id="b36-input"
              className="b36-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'エンコードしたいテキストを入力...'
                  : 'デコードしたい Base36 文字列を入力...'
              }
              aria-label={mode === 'encode' ? 'エンコード入力テキスト' : 'デコード入力Base36文字列'}
              spellCheck={false}
            />
          ) : (
            <input
              id="b36-input"
              type="text"
              className="b36-number-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? '10進数整数を入力（例: 255 → ff）'
                  : 'Base36 文字列を入力（例: ff → 255）'
              }
              aria-label={mode === 'encode' ? '10進数整数入力' : 'Base36文字列入力'}
              spellCheck={false}
            />
          )}
          <div className="b36-alphabet-note" aria-label="使用アルファベット">
            {alphabetDisplay}
          </div>
        </div>

        {/* エラー表示 */}
        {errorMessage && input.trim() && (
          <div className="b36-error" role="alert" aria-label="エラー">
            <span className="b36-error-icon" aria-hidden="true">⚠</span>
            {errorMessage}
          </div>
        )}

        {/* ボタン */}
        <div className="b36-action-row">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopyOutput}
            disabled={!hasOutput}
            aria-label="出力をコピー"
          >
            コピー
          </button>
          {inputMode === 'text' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSwap}
              disabled={!hasOutput}
              aria-label="入出力を入れ替える"
              title="出力を入力に入れ替え"
            >
              ⇄ 入れ替え
            </button>
          )}
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!input}
            aria-label="入力をクリア"
          >
            クリア
          </button>
        </div>

        {/* 出力 */}
        {hasOutput && (
          <div className="converter-section">
            <div className="b36-output-header">
              <span className="b36-output-label">
                {inputMode === 'number'
                  ? mode === 'encode' ? 'Base36 出力' : '10進数出力'
                  : mode === 'encode' ? 'Base36 出力' : 'デコード結果'}
              </span>
              {inputMode === 'text' && mode === 'encode' && encodeResult && (
                <span className="b36-output-meta">
                  {encodeResult.inputBytes} バイト → {encodeResult.outputLength} 文字
                </span>
              )}
              {inputMode === 'text' && mode === 'decode' && decodeResult && (
                <span className="b36-output-meta">
                  {decodeResult.bytes.length} バイト
                </span>
              )}
            </div>
            {inputMode === 'text' ? (
              <textarea
                className="b36-textarea b36-textarea-output"
                readOnly
                value={output}
                aria-label={mode === 'encode' ? 'Base36エンコード出力' : 'デコード結果'}
                aria-live="polite"
              />
            ) : (
              <div className="b36-number-result" aria-live="polite" aria-label="変換結果">
                {output}
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'Base36 について',
              items: [
                '[0-9a-z] の 36 文字を使用するエンコード方式です（大文字小文字を区別しない）',
                'JavaScript の Number.prototype.toString(36) / parseInt(str, 36) と互換性があります',
                'URL セーフ・英数字のみで構成されるため、URL やファイル名に直接使用できます',
                '整数モードでは、10進数の数値を Base36 で短縮表現できます（例: 255 → "73"）',
                'デコード時は大文字小文字を区別しません（"FF" と "ff" は同じ値）',
              ],
            },
            {
              title: '主な用途',
              items: [
                'ライセンスキー・シリアルナンバーの生成（英数字のみで読みやすい）',
                'JavaScript で Number.toString(36) を使った短い ID 生成',
                'Epoch 秒や整数 ID を短い文字列に変換（タイムスタンプベースの ID）',
                'ゲームの得点・チェックサムの短縮表現',
                'CSS や HTML ID として安全な文字列の生成',
              ],
            },
            {
              title: 'Base36 vs 他のエンコード',
              items: [
                'Base36: 36文字。大文字小文字不問。JS ネイティブ対応。読みやすいが効率はやや低い',
                'Base62: 62文字。英数字のみ（大小文字区別）。より短い出力。URL 短縮に最適',
                'Base58: 58文字。紛らわしい文字を除去。Bitcoin・IPFS アドレスに使用',
                'Base32: 32文字。大文字・数字のみ。TOTP シークレット・QR コードに使用',
                'Base64: 64文字。効率最大だが特殊文字（+/=）を含む。バイナリ転送に使用',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
