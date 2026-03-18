import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  encodeBase62,
  decodeBase62,
  validateBase62,
  encodeIntBase62,
  decodeIntBase62,
  type Base62Variant,
} from '~/utils/base62';
import '../styles/tools/base62.css';

export const Route = createFileRoute('/base62')({
  head: () => ({
    meta: [
      { title: 'Base62エンコード・デコード | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストや整数を Base62 形式にエンコード・デコードするオンラインツール。[0-9A-Za-z] の 62 文字を使用。URL 短縮サービスや短い一意 ID 生成に最適。',
      },
      { property: 'og:title', content: 'Base62エンコード・デコード | Web ツール集' },
      {
        property: 'og:description',
        content: 'Base62エンコード・デコード。URL 短縮・短い一意 ID 生成に使われる英数字のみのエンコード方式。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/base62` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'Base62エンコード・デコード | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'Base62エンコード・デコード。URL 短縮・短い一意 ID 生成に使われる英数字のみのエンコード方式。',
      },
    ],
  }),
  component: Base62Converter,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = 'encode' | 'decode';
type InputMode = 'text' | 'number';

function Base62Converter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('encode');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [input, setInput] = useState('');
  const [variant, setVariant] = useState<Base62Variant>('standard');

  // テキストモード：エンコード結果
  const encodeResult = useMemo(() => {
    if (mode !== 'encode' || inputMode !== 'text' || !input) return null;
    return encodeBase62(input, variant);
  }, [mode, inputMode, input, variant]);

  // テキストモード：デコード結果・エラー
  const { decodeResult, decodeError } = useMemo(() => {
    if (mode !== 'decode' || inputMode !== 'text' || !input.trim()) {
      return { decodeResult: null, decodeError: null };
    }
    const validationError = validateBase62(input, variant);
    if (validationError) {
      return { decodeResult: null, decodeError: validationError };
    }
    const result = decodeBase62(input, variant);
    if (!result.success) {
      return { decodeResult: null, decodeError: result.error ?? 'デコードに失敗しました' };
    }
    return { decodeResult: result, decodeError: null };
  }, [mode, inputMode, input, variant]);

  // 数値モード：結果
  const { numberResult, numberError } = useMemo(() => {
    if (inputMode !== 'number' || !input.trim()) {
      return { numberResult: null, numberError: null };
    }
    if (mode === 'encode') {
      // 10進数 → Base62
      try {
        const n = BigInt(input.trim().replace(/[,_]/g, ''));
        if (n < 0n) return { numberResult: null, numberError: '負の整数はサポートされていません' };
        return { numberResult: encodeIntBase62(n, variant), numberError: null };
      } catch {
        return { numberResult: null, numberError: '有効な整数を入力してください' };
      }
    } else {
      // Base62 → 10進数
      const validationError = validateBase62(input, variant);
      if (validationError) return { numberResult: null, numberError: validationError };
      try {
        const n = decodeIntBase62(input.trim(), variant);
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
    variant === 'standard' ? '0-9A-Za-z (0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz)' : '0-9a-zA-Z (0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ)';

  return (
    <>
      <div className="tool-container">
        {/* モード切替 */}
        <div className="b62-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === 'encode'}
            className={`b62-tab-btn${mode === 'encode' ? ' active' : ''}`}
            onClick={() => handleModeChange('encode')}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={mode === 'decode'}
            className={`b62-tab-btn${mode === 'decode' ? ' active' : ''}`}
            onClick={() => handleModeChange('decode')}
          >
            デコード
          </button>
        </div>

        {/* 入力モード選択 */}
        <div className="b62-mode-tabs" role="group" aria-label="入力モード">
          <button
            type="button"
            className={`b62-mode-btn${inputMode === 'text' ? ' active' : ''}`}
            onClick={() => { setInputMode('text'); setInput(''); }}
            aria-pressed={inputMode === 'text'}
          >
            テキスト
          </button>
          <button
            type="button"
            className={`b62-mode-btn${inputMode === 'number' ? ' active' : ''}`}
            onClick={() => { setInputMode('number'); setInput(''); }}
            aria-pressed={inputMode === 'number'}
          >
            整数
          </button>
        </div>

        {/* オプション */}
        <div className="b62-options-row">
          <fieldset className="b62-fieldset">
            <legend className="b62-legend">アルファベット</legend>
            <label className="b62-radio-label">
              <input
                type="radio"
                name="b62-variant"
                value="standard"
                checked={variant === 'standard'}
                onChange={() => setVariant('standard')}
              />
              標準 (0-9A-Za-z)
            </label>
            <label className="b62-radio-label">
              <input
                type="radio"
                name="b62-variant"
                value="lower-first"
                checked={variant === 'lower-first'}
                onChange={() => setVariant('lower-first')}
              />
              小文字優先 (0-9a-zA-Z)
            </label>
          </fieldset>
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="b62-input" className="section-title">
            {inputMode === 'number'
              ? mode === 'encode' ? '10進数整数' : 'Base62 文字列'
              : mode === 'encode' ? '入力テキスト' : 'Base62 文字列'}
          </label>
          {inputMode === 'text' ? (
            <textarea
              id="b62-input"
              className="b62-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'エンコードしたいテキストを入力...'
                  : 'デコードしたい Base62 文字列を入力...'
              }
              aria-label={mode === 'encode' ? 'エンコード入力テキスト' : 'デコード入力Base62文字列'}
              spellCheck={false}
            />
          ) : (
            <input
              id="b62-input"
              type="text"
              className="b62-number-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? '10進数整数を入力（例: 123456789）'
                  : 'Base62 文字列を入力（例: 8M0kX）'
              }
              aria-label={mode === 'encode' ? '10進数整数入力' : 'Base62文字列入力'}
              spellCheck={false}
            />
          )}
          <div className="b62-alphabet-display" aria-label="使用アルファベット">
            {alphabetDisplay}
          </div>
        </div>

        {/* エラー表示 */}
        {errorMessage && input.trim() && (
          <div className="b62-error" role="alert" aria-label="エラー">
            <span className="b62-error-icon" aria-hidden="true">⚠</span>
            {errorMessage}
          </div>
        )}

        {/* ボタン */}
        <div className="b62-action-row">
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
            <div className="b62-output-header">
              <span className="b62-output-label">
                {inputMode === 'number'
                  ? mode === 'encode' ? 'Base62 出力' : '10進数出力'
                  : mode === 'encode' ? 'Base62 出力' : 'デコード結果'}
              </span>
              {inputMode === 'text' && mode === 'encode' && encodeResult && (
                <span className="b62-output-meta">
                  {encodeResult.inputBytes} バイト → {encodeResult.outputLength} 文字
                </span>
              )}
              {inputMode === 'text' && mode === 'decode' && decodeResult && (
                <span className="b62-output-meta">
                  {decodeResult.bytes.length} バイト
                </span>
              )}
            </div>
            {inputMode === 'text' ? (
              <textarea
                className="b62-textarea b62-textarea-output"
                readOnly
                value={output}
                aria-label={mode === 'encode' ? 'Base62エンコード出力' : 'デコード結果'}
                aria-live="polite"
              />
            ) : (
              <div className="b62-number-result" aria-live="polite" aria-label="変換結果">
                {output}
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'Base62 について',
              items: [
                '[0-9A-Za-z] の 62 文字のみを使用した URL セーフなエンコード方式です',
                '特殊文字（+, /, =）を含まないため、URL やファイル名にそのまま使用できます',
                '標準 (0-9A-Za-z) と小文字優先 (0-9a-zA-Z) の 2 種類のアルファベット順が存在します',
                'Base64 より 2 文字少ないため、出力が約 3〜5% 長くなります',
                '整数モードでは 10進数整数を Base62 表現に変換し、ID の短縮表現として使用できます',
              ],
            },
            {
              title: '主な用途',
              items: [
                'URL 短縮サービスの短縮 ID 生成（例: bit.ly・t.co）',
                'データベースの自動増分 ID を短い文字列に変換',
                'YouTube・Instagram などの動画・投稿 ID（例: dQw4w9WgXcQ）',
                '英数字のみで構成される短いトークン・識別子の生成',
                'QR コードに埋め込む短い識別子の生成',
              ],
            },
            {
              title: 'Base62 vs 他のエンコード',
              items: [
                'Base64: 特殊文字（+, /, =）を含むため URL エンコードが必要な場合がある',
                'Base58: 紛らわしい文字（0, O, I, l）を除いた 58 文字。Bitcoin アドレス等に使用',
                'Base32: 大文字・数字のみ 32 文字。QR コード・TOTP シークレットに使用',
                'Base62: URL セーフ・英数字のみ・パディング不要のバランスの取れた選択肢',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
