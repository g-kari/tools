import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import {
  textToBinary,
  binaryToText,
  looksLikeBinary,
  type BinaryDelimiter,
} from '../utils/text-binary';
import '../styles/tools/text-binary.css';

export const Route = createFileRoute('/text-binary')({
  head: () => ({
    meta: [
      { title: 'テキスト ↔ バイナリ変換 | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストを UTF-8 バイト列の2進数（01010101…）に変換、または2進数からテキストに逆変換するツール。日本語・絵文字を含む任意の Unicode 文字に対応。',
      },
      {
        property: 'og:title',
        content: 'テキスト ↔ バイナリ変換 | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'テキストを UTF-8 バイト列の2進数に変換するツール。日本語・絵文字を含む任意の Unicode 文字に対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/text-binary` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'テキスト ↔ バイナリ変換 | Web ツール集',
      },
      {
        name: 'twitter:description',
        content:
          'テキストを UTF-8 バイト列の2進数に変換するツール。日本語・絵文字にも対応。',
      },
    ],
  }),
  component: TextBinaryConverter,
});

type ConversionMode = 'text-to-binary' | 'binary-to-text';

/**
 * テキスト ↔ バイナリ変換コンポーネント
 */
function TextBinaryConverter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<ConversionMode>('text-to-binary');
  const [inputText, setInputText] = useState('');
  const [delimiter, setDelimiter] = useState<BinaryDelimiter>('space');

  const handleModeChange = useCallback(
    (newMode: ConversionMode) => {
      setMode(newMode);
      setInputText('');
      announceStatus(
        newMode === 'text-to-binary'
          ? 'テキスト→バイナリモードに切り替えました'
          : 'バイナリ→テキストモードに切り替えました',
      );
    },
    [announceStatus],
  );

  const encodeResult = useMemo(() => {
    if (mode !== 'text-to-binary') return null;
    if (!inputText) return null;
    return textToBinary(inputText, delimiter);
  }, [mode, inputText, delimiter]);

  const decodeResult = useMemo(() => {
    if (mode !== 'binary-to-text') return null;
    if (!inputText.trim()) return null;
    return binaryToText(inputText);
  }, [mode, inputText]);

  const autoDetectedMode = useMemo((): ConversionMode | null => {
    if (inputText.trim() === '') return null;
    return looksLikeBinary(inputText) ? 'binary-to-text' : 'text-to-binary';
  }, [inputText]);

  const handleClear = () => {
    setInputText('');
    announceStatus('入力内容をクリアしました');
  };

  const handleCopy = async () => {
    const output =
      mode === 'text-to-binary'
        ? encodeResult?.encoded
        : decodeResult && decodeResult.success
          ? decodeResult.decoded
          : null;
    if (!output) return;
    const success = await copy(output);
    if (success) {
      showToast('変換結果をコピーしました', 'success');
      announceStatus('変換結果をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  };

  const handleAutoDetect = () => {
    if (autoDetectedMode && autoDetectedMode !== mode) {
      setMode(autoDetectedMode);
      announceStatus(
        autoDetectedMode === 'text-to-binary'
          ? '自動検出: テキスト→バイナリモードに切り替えました'
          : '自動検出: バイナリ→テキストモードに切り替えました',
      );
    }
  };

  const showAutoDetectHint =
    autoDetectedMode !== null && autoDetectedMode !== mode;

  const outputValue =
    mode === 'text-to-binary'
      ? (encodeResult?.encoded ?? '')
      : decodeResult && decodeResult.success
        ? decodeResult.decoded
        : '';

  const decodeError =
    decodeResult && !decodeResult.success ? decodeResult.error : null;

  const hasOutput = outputValue !== '';

  return (
    <>
      <div className="text-binary-container">
        {/* モード切替 */}
        <section aria-labelledby="text-binary-heading">
          <h2 id="text-binary-heading" className="section-title">
            テキスト ↔ バイナリ変換
          </h2>

          <div
            className="text-binary-mode-buttons"
            role="group"
            aria-label="変換モード選択"
          >
            <button
              className={`text-binary-mode-btn${mode === 'text-to-binary' ? ' active' : ''}`}
              onClick={() => handleModeChange('text-to-binary')}
              aria-pressed={mode === 'text-to-binary'}
              type="button"
            >
              テキスト → バイナリ
            </button>
            <button
              className={`text-binary-mode-btn${mode === 'binary-to-text' ? ' active' : ''}`}
              onClick={() => handleModeChange('binary-to-text')}
              aria-pressed={mode === 'binary-to-text'}
              type="button"
            >
              バイナリ → テキスト
            </button>
          </div>
        </section>

        {/* オプション（テキスト→バイナリのみ） */}
        {mode === 'text-to-binary' && (
          <div className="text-binary-options" role="group" aria-label="出力オプション">
            <div className="text-binary-option-group">
              <span className="text-binary-option-label">区切り文字:</span>
              <select
                className="text-binary-option-select"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as BinaryDelimiter)}
                aria-label="バイト間の区切り文字"
              >
                <option value="space">スペース</option>
                <option value="none">なし</option>
                <option value="comma">コンマ</option>
                <option value="newline">改行</option>
              </select>
            </div>
          </div>
        )}

        {/* 入力エリア */}
        <div className="text-binary-io-section">
          <label htmlFor="text-binary-input" className="text-binary-label">
            {mode === 'text-to-binary'
              ? '変換するテキスト'
              : '変換するバイナリ（スペース・コンマ・改行区切り）'}
          </label>
          <Textarea
            id="text-binary-input"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
            }}
            placeholder={
              mode === 'text-to-binary'
                ? 'Hello, 世界!'
                : '01001000 01100101 01101100 01101100 01101111'
            }
            rows={4}
            aria-describedby="text-binary-input-hint"
            spellCheck={false}
          />

          {showAutoDetectHint && (
            <p className="text-binary-hint" id="text-binary-input-hint">
              入力から{autoDetectedMode === 'binary-to-text' ? 'バイナリ' : 'テキスト'}を検出しました。
              <button
                type="button"
                className="link-button"
                onClick={handleAutoDetect}
              >
                モードを切り替える
              </button>
            </p>
          )}

          {decodeError && (
            <p className="text-binary-error" role="alert">
              {decodeError}
            </p>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="button-group" role="group" aria-label="操作">
          <Button
            type="button"
            variant="outline"
            className="btn-clear"
            onClick={handleClear}
            disabled={inputText === ''}
            aria-label="入力をクリア"
          >
            クリア
          </Button>
          {hasOutput && (
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopy}
              aria-label="変換結果をコピー"
            >
              結果をコピー
            </Button>
          )}
        </div>

        {/* 出力エリア */}
        {hasOutput && (
          <div className="text-binary-io-section">
            <label htmlFor="text-binary-output" className="text-binary-label">
              {mode === 'text-to-binary' ? 'バイナリ（変換結果）' : 'テキスト（変換結果）'}
            </label>
            <Textarea
              id="text-binary-output"
              value={outputValue}
              readOnly
              rows={mode === 'text-to-binary' && delimiter === 'newline' ? 8 : 4}
              aria-label="変換結果"
            />

            {/* 統計情報 */}
            {mode === 'text-to-binary' && encodeResult && (
              <div className="text-binary-stats" aria-label="統計情報">
                <span className="text-binary-stat-badge">
                  文字数: {encodeResult.charCount}
                </span>
                <span className="text-binary-stat-badge">
                  バイト数: {encodeResult.inputBytes}
                </span>
                <span className="text-binary-stat-badge">
                  ビット数: {encodeResult.inputBytes * 8}
                </span>
              </div>
            )}
            {mode === 'binary-to-text' &&
              decodeResult?.success && (
                <div className="text-binary-stats" aria-label="統計情報">
                  <span className="text-binary-stat-badge">
                    バイト数: {decodeResult.bytes.length}
                  </span>
                  <span className="text-binary-stat-badge">
                    文字数: {[...decodeResult.decoded].length}
                  </span>
                </div>
              )}
          </div>
        )}

        {/* バイト内訳テーブル（テキスト→バイナリ時、入力がある場合） */}
        {mode === 'text-to-binary' &&
          encodeResult &&
          encodeResult.byteBreakdown.length > 0 && (
            <div className="text-binary-breakdown-section">
              <h3 className="text-binary-breakdown-title">バイト内訳</h3>
              <table
                className="text-binary-breakdown-table"
                aria-label="文字ごとのバイト内訳"
              >
                <thead>
                  <tr>
                    <th scope="col">文字</th>
                    <th scope="col">コードポイント</th>
                    <th scope="col">16進数 (Hex)</th>
                    <th scope="col">2進数 (Binary)</th>
                  </tr>
                </thead>
                <tbody>
                  {encodeResult.byteBreakdown.map((info, idx) => (
                    <tr key={idx}>
                      <td className="text-binary-char-cell">{info.char}</td>
                      <td className="text-binary-cp-cell">{info.codePoint}</td>
                      <td className="text-binary-hex-cell">
                        {info.hexBytes.join(' ')}
                      </td>
                      <td className="text-binary-bin-cell">
                        {info.binaryBytes.map((b, bi) => (
                          <span key={bi} className="text-binary-byte-chip">
                            {b}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {[...inputText].length > 64 && (
                <p className="text-binary-truncate-note">
                  ※ 内訳は先頭 64 文字のみ表示しています
                </p>
              )}
            </div>
          )}

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'テキスト→バイナリ: テキストを入力すると各文字の UTF-8 バイト列を2進数で表示します',
                'バイナリ→テキスト: スペース・コンマ・改行区切りの8ビット列を入力するとテキストに変換します',
                '区切り文字（スペース/なし/コンマ/改行）を切り替えることで出力形式を変更できます',
                '「結果をコピー」ボタンで変換結果をクリップボードにコピーできます',
              ],
            },
            {
              title: 'バイナリ表現とは',
              items: [
                '2進数（0と1のみ）でデータを表現する方法です',
                '1文字 = 1バイト（8ビット）が基本単位（ASCII文字の場合）',
                'UTF-8 では日本語1文字は 3〜4 バイト（24〜32 ビット）になります',
                '例: "A" → 01000001（ASCII コード 65 の2進数）',
                '例: "あ" → 11100011 10000001 10000010（UTF-8 の 3 バイト）',
              ],
            },
            {
              title: 'UTF-8 エンコーディング',
              items: [
                'このツールは UTF-8 エンコーディングを使用します',
                'ASCII文字（A-Z, 0-9など）は 1 バイト（8 ビット）',
                'ラテン文字の拡張（é, ñ など）は 2 バイト（16 ビット）',
                '日本語・中国語・韓国語などのCJK文字は 3 バイト（24 ビット）',
                '絵文字などの補助多言語面の文字は 4 バイト（32 ビット）',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
