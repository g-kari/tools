import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  encodeBase85,
  decodeBase85,
  validateBase85,
  type Base85Variant,
} from '~/utils/base85';
import '../styles/tools/base85.css';

export const Route = createFileRoute('/base85')({
  head: () => ({
    meta: [
      { title: 'Base85 (ASCII85) エンコード・デコード | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストを ASCII85 / Z85 形式にエンコード・デコードするオンラインツール。4バイトを5文字に変換し Base64 より約25%効率的。PDF・PostScript・ZeroMQ で使用される Base85 エンコーディング。',
      },
      {
        property: 'og:title',
        content: 'Base85 (ASCII85) エンコード・デコード | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'ASCII85 / Z85 エンコード・デコード。PDF・PostScript・ZeroMQ で使用される Base85 エンコーディング。Base64 より約25%効率的。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/base85` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'Base85 (ASCII85) エンコード・デコード | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'ASCII85 / Z85 エンコード・デコード。PDF・PostScript・ZeroMQ で使用される Base85 エンコーディング。',
      },
    ],
  }),
  component: Base85Converter,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = 'encode' | 'decode';

function Base85Converter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [variant, setVariant] = useState<Base85Variant>('ascii85');

  // エンコード結果
  const { encodeResult, encodeError } = useMemo(() => {
    if (mode !== 'encode' || !input) {
      return { encodeResult: null, encodeError: null };
    }
    try {
      const result = encodeBase85(input, variant);
      return { encodeResult: result, encodeError: null };
    } catch (e) {
      return { encodeResult: null, encodeError: e instanceof Error ? e.message : 'エンコードエラー' };
    }
  }, [mode, input, variant]);

  // デコード結果・エラー
  const { decodeResult, decodeError } = useMemo(() => {
    if (mode !== 'decode' || !input.trim()) {
      return { decodeResult: null, decodeError: null };
    }
    const validationError = validateBase85(input, variant);
    if (validationError) {
      return { decodeResult: null, decodeError: validationError };
    }
    const result = decodeBase85(input, variant);
    if (!result.success) {
      return { decodeResult: null, decodeError: result.error ?? 'デコードに失敗しました' };
    }
    return { decodeResult: result, decodeError: null };
  }, [mode, input, variant]);

  const output =
    mode === 'encode' ? (encodeResult?.encoded ?? '') : (decodeResult?.decoded ?? '');

  const errorMessage = mode === 'encode' ? encodeError : decodeError;
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

  const alphabetDisplay =
    variant === 'ascii85'
      ? '!"#$%&\'()*+,-./0-9:;<=>?@A-Z[\\]^_`a-u （33〜117、85文字）'
      : '0-9a-zA-Z.-:+=^!/*?&<>()[]{}@%$# （ZeroMQ RFC 32、85文字）';

  return (
    <>
      <div className="tool-container">
        {/* モード切替 */}
        <div className="b85-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === 'encode'}
            className={`b85-tab-btn${mode === 'encode' ? ' active' : ''}`}
            onClick={() => handleModeChange('encode')}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={mode === 'decode'}
            className={`b85-tab-btn${mode === 'decode' ? ' active' : ''}`}
            onClick={() => handleModeChange('decode')}
          >
            デコード
          </button>
        </div>

        {/* バリアント選択 */}
        <div className="b85-options-row">
          <fieldset className="b85-fieldset">
            <legend className="b85-legend">バリアント</legend>
            <label className="b85-radio-label">
              <input
                type="radio"
                name="b85-variant"
                value="ascii85"
                checked={variant === 'ascii85'}
                onChange={() => {
                  setVariant('ascii85');
                  setInput('');
                }}
              />
              ASCII85（Adobe / PDF / PostScript）
            </label>
            <label className="b85-radio-label">
              <input
                type="radio"
                name="b85-variant"
                value="z85"
                checked={variant === 'z85'}
                onChange={() => {
                  setVariant('z85');
                  setInput('');
                }}
              />
              Z85（ZeroMQ RFC 32）
            </label>
          </fieldset>
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="b85-input" className="section-title">
            {mode === 'encode' ? '入力テキスト' : 'Base85 文字列'}
          </label>
          <textarea
            id="b85-input"
            className="b85-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'エンコードしたいテキストを入力...'
                : variant === 'ascii85'
                  ? 'デコードしたい ASCII85 文字列を入力（例: <~87cURD]i,~>）...'
                  : 'デコードしたい Z85 文字列を入力...'
            }
            aria-label={mode === 'encode' ? 'エンコード入力テキスト' : 'デコード入力Base85文字列'}
            spellCheck={false}
          />
          <div className="b85-alphabet-display" aria-label="使用アルファベット">
            {alphabetDisplay}
          </div>
        </div>

        {/* エラー表示 */}
        {errorMessage && input.trim() && (
          <div className="b85-error" role="alert" aria-label="エラー">
            <span className="b85-error-icon" aria-hidden="true">
              ⚠
            </span>
            {errorMessage}
          </div>
        )}

        {/* ボタン */}
        <div className="b85-action-row">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopyOutput}
            disabled={!hasOutput}
            aria-label="出力をコピー"
          >
            コピー
          </button>
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
            <div className="b85-output-header">
              <span className="b85-output-label">
                {mode === 'encode' ? 'Base85 出力' : 'デコード結果'}
              </span>
              {mode === 'encode' && encodeResult && (
                <span className="b85-output-meta">
                  {encodeResult.inputBytes} バイト → {encodeResult.outputLength} 文字
                </span>
              )}
              {mode === 'decode' && decodeResult && (
                <span className="b85-output-meta">{decodeResult.bytes.length} バイト</span>
              )}
            </div>
            <textarea
              className="b85-textarea b85-textarea-output"
              readOnly
              value={output}
              aria-label={mode === 'encode' ? 'Base85エンコード出力' : 'デコード結果'}
              aria-live="polite"
            />
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'Base85 について',
              items: [
                '4 バイトを 5 文字に変換するエンコード方式（Base64 の 4バイト→6文字より効率的）',
                'Base64 と比べ出力サイズが約 25% 小さくなります',
                'ASCII85: Adobe PostScript・PDF で使用。<~ ~> で囲む形式。4 null バイトを "z" 1 文字に圧縮',
                'Z85: ZeroMQ RFC 32 で定義。英数字 + 安全な記号のみ使用。入力は 4 の倍数バイトが必要',
              ],
            },
            {
              title: '主な用途',
              items: [
                'PDF ファイル内のバイナリデータ（画像・フォント）のエンコード',
                'PostScript ファイルのバイナリコンテンツ埋め込み',
                'ZeroMQ メッセージフレームのエンコード（Z85）',
                'メール本文や設定ファイルへのバイナリデータの埋め込み',
                'Base64 より小さいサイズが必要な場面でのバイナリエンコード',
              ],
            },
            {
              title: 'Base エンコード比較',
              items: [
                'Base64: 3バイト→4文字（+33%）。最もポピュラー。パディング文字あり',
                'Base85: 4バイト→5文字（+25%）。より効率的。記号を含む',
                'Base62: 可変長。URL セーフ・英数字のみ。パディングなし',
                'Base58: Bitcoin で使用。紛らわしい文字（0,O,I,l）を除いた 58 文字',
                'Base32: 大文字・数字のみ 32 文字。大文字小文字を区別しない環境向け',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
