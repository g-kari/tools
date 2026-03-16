import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  encodeToAll,
  decodeBytes,
  hexToBytes,
  detectEncoding,
  SUPPORTED_ENCODINGS,
  type EncodingName,
} from '~/utils/encoding';
import '../styles/tools/encoding.css';

export const Route = createFileRoute('/encoding')({
  head: () => ({
    meta: [
      { title: '文字コード変換 | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストをUTF-8・Shift_JIS・EUC-JP・ISO-2022-JPなど複数の文字コードに変換し、16進数バイト列を表示。16進数からテキストへの逆変換・自動文字コード検出にも対応。',
      },
      { property: 'og:title', content: '文字コード変換 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'テキストをUTF-8・Shift_JIS・EUC-JP・ISO-2022-JPなど複数の文字コードに変換。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/encoding` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '文字コード変換 | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'テキストをUTF-8・Shift_JIS・EUC-JPなど複数の文字コードに変換。16進数からテキストへの逆変換も対応。',
      },
    ],
  }),
  component: EncodingPage,
});

/** 動作モード */
type Mode = 'encode' | 'decode';

function EncodingPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('encode');

  // ── エンコードモード ──
  const [encodeInput, setEncodeInput] = useState('');

  // ── デコードモード ──
  const [hexInput, setHexInput] = useState('');
  const [selectedEncoding, setSelectedEncoding] =
    useState<EncodingName>('UTF8');

  // ── エンコード結果 ──
  const encodeResults = useMemo(() => {
    if (!encodeInput.trim()) return null;
    return encodeToAll(encodeInput);
  }, [encodeInput]);

  // ── デコード結果 ──
  const decodeResult = useMemo(() => {
    const trimmed = hexInput.trim();
    if (!trimmed) return null;

    const bytes = hexToBytes(trimmed);
    if (!bytes) return { error: '無効な16進数です。スペース区切りで入力してください。' };
    if (!bytes.length) return null;

    const detected = detectEncoding(bytes);
    const decodeFrom =
      selectedEncoding === 'UTF8' && detected !== 'UTF8'
        ? detected
        : selectedEncoding;

    try {
      const text = decodeBytes(bytes, decodeFrom);
      return { text, detected, bytes };
    } catch {
      return { error: 'デコードに失敗しました。文字コードを確認してください。' };
    }
  }, [hexInput, selectedEncoding]);

  const handleCopyHex = useCallback(
    async (hex: string, label: string) => {
      const success = await copy(hex);
      if (success) {
        showToast(`${label} のHexをコピーしました`, 'success');
        announceStatus(`${label} の16進数をクリップボードにコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [copy, showToast, announceStatus]
  );

  const handleCopyDecoded = useCallback(
    async (text: string) => {
      const success = await copy(text);
      if (success) {
        showToast('デコード結果をコピーしました', 'success');
        announceStatus('デコード結果をクリップボードにコピーしました');
      } else {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [copy, showToast, announceStatus]
  );

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      announceStatus(
        newMode === 'encode' ? 'テキスト→Hexモードに切り替えました' : 'Hex→テキストモードに切り替えました'
      );
    },
    [announceStatus]
  );

  return (
    <>
      <div className="encoding-container">
        {/* モード切り替え */}
        <div
          className="encoding-tab-group"
          role="tablist"
          aria-label="変換モード"
        >
          <button
            role="tab"
            aria-selected={mode === 'encode'}
            className={`encoding-tab${mode === 'encode' ? ' encoding-tab--active' : ''}`}
            onClick={() => handleModeChange('encode')}
            type="button"
          >
            テキスト → Hex
          </button>
          <button
            role="tab"
            aria-selected={mode === 'decode'}
            className={`encoding-tab${mode === 'decode' ? ' encoding-tab--active' : ''}`}
            onClick={() => handleModeChange('decode')}
            type="button"
          >
            Hex → テキスト
          </button>
        </div>

        {/* ── エンコードモード ── */}
        {mode === 'encode' && (
          <>
            <section
              className="encoding-input-section"
              aria-labelledby="encode-input-title"
            >
              <h2
                className="encoding-section-title"
                id="encode-input-title"
              >
                テキスト入力
              </h2>
              <label htmlFor="encode-text-input" className="sr-only">
                変換するテキスト
              </label>
              <textarea
                id="encode-text-input"
                className="encoding-textarea"
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                placeholder="ここにテキストを入力してください（日本語対応）"
                aria-label="変換するテキスト"
                spellCheck={false}
              />
              {encodeInput && (
                <p className="encoding-input-meta">
                  {encodeInput.length} 文字
                </p>
              )}
            </section>

            {/* エンコード結果一覧 */}
            {encodeResults && (
              <div
                className="encoding-results-section"
                role="region"
                aria-label="各文字コードのエンコード結果"
                aria-live="polite"
              >
                {encodeResults.map((result) => (
                  <div
                    key={result.encoding.code}
                    className="encoding-result-card"
                  >
                    <div className="encoding-result-header">
                      <div className="encoding-result-title">
                        <span className="encoding-result-name">
                          {result.encoding.label}
                        </span>
                        <span className="encoding-result-alias">
                          {result.encoding.alias}
                        </span>
                      </div>
                      {!result.error && (
                        <span className="encoding-result-bytes-badge">
                          {result.byteCount} bytes
                        </span>
                      )}
                      <button
                        type="button"
                        className="encoding-copy-btn"
                        onClick={() =>
                          handleCopyHex(result.hex, result.encoding.label)
                        }
                        disabled={!result.hex}
                        aria-label={`${result.encoding.label} のHexをコピー`}
                      >
                        コピー
                      </button>
                    </div>
                    <div className="encoding-result-body">
                      {result.error ? (
                        <p className="encoding-result-error">{result.error}</p>
                      ) : result.hex ? (
                        <p className="encoding-hex-value">{result.hex}</p>
                      ) : (
                        <p className="encoding-hex-empty">（空）</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── デコードモード ── */}
        {mode === 'decode' && (
          <section
            className="encoding-input-section"
            aria-labelledby="decode-input-title"
          >
            <h2 className="encoding-section-title" id="decode-input-title">
              16進数バイト列を入力
            </h2>
            <label htmlFor="hex-input" className="sr-only">
              16進数バイト列
            </label>
            <textarea
              id="hex-input"
              className="encoding-textarea"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="例: E3 81 82 E3 81 84 E3 81 86（スペース区切り）"
              aria-label="16進数バイト列"
              aria-describedby="hex-input-hint"
              spellCheck={false}
            />
            <p className="encoding-hint" id="hex-input-hint">
              スペース・コロン・カンマ区切りの16進数を入力してください。
            </p>

            {/* 文字コード選択 */}
            <div className="encoding-select-row">
              <span className="encoding-select-label">文字コード：</span>
              <select
                className="encoding-select"
                value={selectedEncoding}
                onChange={(e) =>
                  setSelectedEncoding(e.target.value as EncodingName)
                }
                aria-label="デコードする文字コードを選択"
              >
                {SUPPORTED_ENCODINGS.map((enc) => (
                  <option key={enc.code} value={enc.code}>
                    {enc.label} — {enc.alias}
                  </option>
                ))}
              </select>
              {decodeResult &&
                !decodeResult.error &&
                decodeResult.detected && (
                  <span className="encoding-detected-badge">
                    自動検出: {decodeResult.detected}
                  </span>
                )}
            </div>

            {/* デコード結果 */}
            {decodeResult && (
              <div aria-live="polite">
                {decodeResult.error ? (
                  <p className="encoding-error" role="alert">
                    {decodeResult.error}
                  </p>
                ) : decodeResult.text !== undefined ? (
                  <div className="encoding-decode-result">
                    <div className="encoding-decode-result-label">
                      デコード結果
                    </div>
                    <p className="encoding-decode-result-text">
                      {decodeResult.text}
                    </p>
                    <button
                      type="button"
                      className="encoding-copy-btn encoding-copy-btn--decode"
                      onClick={() => handleCopyDecoded(decodeResult.text!)}
                      aria-label="デコード結果をコピー"
                    >
                      コピー
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                '【テキスト→Hex】テキストを入力すると各文字コードの16進数バイト列を一覧表示します',
                '「コピー」ボタンで各文字コードのHexをクリップボードにコピーできます',
                '【Hex→テキスト】16進数バイト列を入力し、文字コードを選択してテキストに変換します',
                '文字コードが不明な場合は「自動検出」バッジで推定コードを確認できます',
              ],
            },
            {
              title: '対応文字コード',
              items: [
                'UTF-8 — Webの標準。日本語を3バイトで表現',
                'Shift_JIS (CP932) — Windows日本語環境の標準。2バイト文字',
                'EUC-JP — Unix/Linux環境の日本語文字コード。2バイト文字',
                'ISO-2022-JP — メール・FAXで使われるJIS文字コード。エスケープシーケンス使用',
                'UTF-16 BE — Unicodeを2〜4バイトで表現（ビッグエンディアン）',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
