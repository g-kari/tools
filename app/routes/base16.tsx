import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { StatusAnnouncer } from '~/hooks/useStatusAnnouncement';
import { useCopyWithFeedback } from '~/hooks/useCopyWithFeedback';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  encodeBase16,
  decodeBase16,
  validateBase16,
  type Base16Case,
  type Base16Delimiter,
} from '~/utils/base16';
import '../styles/tools/base16.css';

export const Route = createFileRoute('/base16')({
  head: () => ({
    meta: [
      { title: 'Base16 (Hex) エンコード・デコード | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストを Base16（16進数・Hex）形式にエンコード・デコードするオンラインツール。大文字/小文字の切り替えや区切り文字（スペース・コロン・ダッシュ）のオプションに対応。',
      },
      { property: 'og:title', content: 'Base16 (Hex) エンコード・デコード | Web ツール集' },
      {
        property: 'og:description',
        content: 'テキストを Base16（16進数）にエンコード・デコード。大文字/小文字・区切り文字オプション対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/base16` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'Base16 (Hex) エンコード・デコード | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'テキストを Base16（16進数）にエンコード・デコード。',
      },
    ],
  }),
  component: Base16Converter,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = 'encode' | 'decode';

function Base16Converter() {
  const { statusRef, announceStatus, copyWithFeedback } = useCopyWithFeedback();

  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [letterCase, setLetterCase] = useState<Base16Case>('upper');
  const [delimiter, setDelimiter] = useState<Base16Delimiter>('none');

  // エンコード結果
  const encodeResult = useMemo(() => {
    if (mode !== 'encode' || !input) return null;
    return encodeBase16(input, letterCase, delimiter);
  }, [mode, input, letterCase, delimiter]);

  // デコード結果・エラー
  const { decodeResult, decodeError } = useMemo(() => {
    if (mode !== 'decode' || !input.trim()) {
      return { decodeResult: null, decodeError: null };
    }
    const normalized = input.replace(/[\s:_-]/g, '');
    const validationError = validateBase16(normalized);
    if (validationError) {
      return { decodeResult: null, decodeError: validationError };
    }
    const result = decodeBase16(input);
    if (!result.success) {
      return { decodeResult: null, decodeError: result.error };
    }
    return { decodeResult: result, decodeError: null };
  }, [mode, input]);

  const output = mode === 'encode' ? (encodeResult?.encoded ?? '') : (decodeResult?.decoded ?? '');
  const hasOutput = !!output;

  const handleCopyOutput = useCallback(async () => {
    await copyWithFeedback(output, '出力をコピーしました');
  }, [output, copyWithFeedback]);

  const handleClear = useCallback(() => {
    setInput('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setInput('');
      announceStatus(newMode === 'encode' ? 'エンコードモードに切り替えました' : 'デコードモードに切り替えました');
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

  return (
    <>
      <div className="tool-container">
        {/* モード切替 */}
        <div className="b16-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === 'encode'}
            className={`b16-tab-btn${mode === 'encode' ? ' active' : ''}`}
            onClick={() => handleModeChange('encode')}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={mode === 'decode'}
            className={`b16-tab-btn${mode === 'decode' ? ' active' : ''}`}
            onClick={() => handleModeChange('decode')}
          >
            デコード
          </button>
        </div>

        {/* オプション */}
        {mode === 'encode' && (
          <div className="b16-options-row">
            <fieldset className="b16-fieldset">
              <legend className="b16-legend">大文字/小文字</legend>
              <label className="b16-radio-label">
                <input
                  type="radio"
                  name="letterCase"
                  value="upper"
                  checked={letterCase === 'upper'}
                  onChange={() => setLetterCase('upper')}
                />
                大文字（A–F）
              </label>
              <label className="b16-radio-label">
                <input
                  type="radio"
                  name="letterCase"
                  value="lower"
                  checked={letterCase === 'lower'}
                  onChange={() => setLetterCase('lower')}
                />
                小文字（a–f）
              </label>
            </fieldset>
            <fieldset className="b16-fieldset">
              <legend className="b16-legend">区切り文字</legend>
              <label className="b16-radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="none"
                  checked={delimiter === 'none'}
                  onChange={() => setDelimiter('none')}
                />
                なし
              </label>
              <label className="b16-radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="space"
                  checked={delimiter === 'space'}
                  onChange={() => setDelimiter('space')}
                />
                スペース
              </label>
              <label className="b16-radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="colon"
                  checked={delimiter === 'colon'}
                  onChange={() => setDelimiter('colon')}
                />
                コロン（:）
              </label>
              <label className="b16-radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="dash"
                  checked={delimiter === 'dash'}
                  onChange={() => setDelimiter('dash')}
                />
                ダッシュ（-）
              </label>
            </fieldset>
          </div>
        )}

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="b16-input" className="section-title">
            {mode === 'encode' ? '入力テキスト' : 'Base16 (Hex) 文字列'}
          </label>
          <textarea
            id="b16-input"
            className="b16-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'エンコードしたいテキストを入力...'
                : 'デコードしたい16進数文字列を入力（例: 48656C6C6F、48 65 6C 6C 6F、48:65:6C:6C:6F）...'
            }
            aria-label={mode === 'encode' ? 'エンコード入力テキスト' : 'デコード入力Hex文字列'}
            spellCheck={false}
          />
        </div>

        {/* デコードエラー */}
        {mode === 'decode' && decodeError && input.trim() && (
          <div className="b16-error" role="alert" aria-label="デコードエラー">
            <span className="b16-error-icon" aria-hidden="true">⚠</span>
            {decodeError}
          </div>
        )}

        {/* ボタン */}
        <div className="b16-action-row">
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
            <div className="b16-output-header">
              <span className="b16-output-label">
                {mode === 'encode' ? 'Base16 (Hex) 出力' : 'デコード結果'}
              </span>
              {mode === 'encode' && encodeResult && (
                <span className="b16-output-meta">
                  {encodeResult.inputBytes} バイト → {encodeResult.outputLength} 文字
                </span>
              )}
              {mode === 'decode' && decodeResult && (
                <span className="b16-output-meta">
                  {decodeResult.bytes.length} バイト
                </span>
              )}
            </div>
            <textarea
              className="b16-textarea b16-textarea-output"
              readOnly
              value={output}
              aria-label={mode === 'encode' ? 'Base16エンコード出力' : 'デコード結果'}
              aria-live="polite"
            />
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'Base16 (Hex) について',
              items: [
                'RFC 4648 で定義されたエンコード方式です',
                '0–9 と A–F（または a–f）の16文字を使用',
                '1バイトを2桁の16進数で表現します',
                '入力の2倍のサイズになります（1バイト → 2文字）',
                'スペース・コロン・ダッシュ区切りの入力も自動解析できます',
              ],
            },
            {
              title: '主な用途',
              items: [
                'ハッシュ値（MD5, SHA など）の表示形式',
                'MACアドレス（例: AA:BB:CC:DD:EE:FF）',
                '色コード（例: #FF5733）',
                'バイナリデータの可読表現',
                'デバッグ時のメモリダンプ表示',
              ],
            },
            {
              title: '他の Base エンコードとの比較',
              items: [
                'Base16: 文字数が最多（効率最低）、可読性が高い',
                'Base32: 大文字小文字を区別しない環境向け',
                'Base64: 最も広く使われ、効率がよい（3バイト→4文字）',
                'Base85: 高効率だが特殊文字を含む',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
