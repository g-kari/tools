import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  compressText,
  decompressBase64,
  formatBytes,
  GZIP_FORMAT_LABELS,
  type GzipFormat,
} from '../utils/gzip';
import { TipsCard } from '~/components/TipsCard';
import { useClipboard } from '~/hooks/useClipboard';
import '../styles/tools/gzip.css';

export const Route = createFileRoute('/gzip')({
  head: () => ({
    meta: [
      { title: 'GZip/Deflate 圧縮・解凍 | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストを gzip・deflate・deflate-raw 形式でブラウザ内圧縮・解凍するツール。圧縮率・サイズ比較表示。Base64でエンコードされた圧縮データの解凍にも対応。',
      },
      { property: 'og:title', content: 'GZip/Deflate 圧縮・解凍 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'テキストを gzip・deflate・deflate-raw 形式でブラウザ内圧縮・解凍。圧縮率・サイズ比較表示。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/gzip` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'GZip/Deflate 圧縮・解凍 | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'テキストを gzip/deflate でブラウザ内圧縮・解凍。圧縮率・サイズ比較表示。',
      },
    ],
  }),
  component: GzipPage,
});

/** 操作モード */
type Mode = 'compress' | 'decompress';

/**
 * GZip/Deflate 圧縮・解凍ページ
 */
function GzipPage() {
  const [mode, setMode] = useState<Mode>('compress');
  const [format, setFormat] = useState<GzipFormat>('gzip');

  // 圧縮モード
  const [compressInput, setCompressInput] = useState('');
  const [compressOutput, setCompressOutput] = useState('');
  const [compressStats, setCompressStats] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
  } | null>(null);
  const [compressError, setCompressError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // 解凍モード
  const [decompressInput, setDecompressInput] = useState('');
  const [decompressOutput, setDecompressOutput] = useState('');
  const [decompressStats, setDecompressStats] = useState<{
    compressedSize: number;
    decompressedSize: number;
  } | null>(null);
  const [decompressError, setDecompressError] = useState('');
  const [isDecompressing, setIsDecompressing] = useState(false);

  const { copy } = useClipboard();

  // -------------------------------------------------------------------------
  // 圧縮処理
  // -------------------------------------------------------------------------
  const handleCompress = useCallback(async () => {
    setCompressError('');
    setCompressOutput('');
    setCompressStats(null);

    if (!compressInput.trim()) {
      setCompressError('圧縮するテキストを入力してください');
      return;
    }

    setIsCompressing(true);
    try {
      const result = await compressText(compressInput, format);
      setCompressOutput(result.base64);
      setCompressStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        ratio: result.ratio,
      });
    } catch (err) {
      setCompressError(err instanceof Error ? err.message : '圧縮中にエラーが発生しました');
    } finally {
      setIsCompressing(false);
    }
  }, [compressInput, format]);

  const handleClearCompress = useCallback(() => {
    setCompressInput('');
    setCompressOutput('');
    setCompressStats(null);
    setCompressError('');
  }, []);

  // -------------------------------------------------------------------------
  // 解凍処理
  // -------------------------------------------------------------------------
  const handleDecompress = useCallback(async () => {
    setDecompressError('');
    setDecompressOutput('');
    setDecompressStats(null);

    if (!decompressInput.trim()) {
      setDecompressError('解凍する Base64 データを入力してください');
      return;
    }

    setIsDecompressing(true);
    try {
      const result = await decompressBase64(decompressInput.trim(), format);
      setDecompressOutput(result.text);
      setDecompressStats({
        compressedSize: result.compressedSize,
        decompressedSize: result.decompressedSize,
      });
    } catch (err) {
      setDecompressError(
        err instanceof Error ? err.message : '解凍中にエラーが発生しました。形式が一致しているか確認してください。',
      );
    } finally {
      setIsDecompressing(false);
    }
  }, [decompressInput, format]);

  const handleClearDecompress = useCallback(() => {
    setDecompressInput('');
    setDecompressOutput('');
    setDecompressStats(null);
    setDecompressError('');
  }, []);

  // -------------------------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------------------------
  const ratioPercent = compressStats ? (compressStats.ratio * 100).toFixed(1) : null;
  const isPositiveRatio = compressStats ? compressStats.ratio >= 0 : false;

  return (
    <div className="tool-container">
      {/* モード切替タブ */}
      <div className="gz-tabs" role="tablist" aria-label="操作モード">
        <button
          type="button"
          role="tab"
          className={`gz-tab-btn${mode === 'compress' ? ' active' : ''}`}
          onClick={() => setMode('compress')}
          aria-selected={mode === 'compress'}
          aria-controls="gz-panel-compress"
        >
          🗜️ 圧縮
        </button>
        <button
          type="button"
          role="tab"
          className={`gz-tab-btn${mode === 'decompress' ? ' active' : ''}`}
          onClick={() => setMode('decompress')}
          aria-selected={mode === 'decompress'}
          aria-controls="gz-panel-decompress"
        >
          📂 解凍
        </button>
      </div>

      {/* 形式選択 */}
      <div className="gz-options-row">
        <fieldset className="gz-fieldset">
          <legend className="gz-legend">圧縮形式</legend>
          {(['gzip', 'deflate', 'deflate-raw'] as GzipFormat[]).map((f) => (
            <label key={f} className="gz-radio-label">
              <input
                type="radio"
                name="gz-format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
                aria-label={GZIP_FORMAT_LABELS[f]}
              />
              {GZIP_FORMAT_LABELS[f]}
            </label>
          ))}
        </fieldset>
      </div>

      {/* ========== 圧縮パネル ========== */}
      {mode === 'compress' && (
        <div id="gz-panel-compress" role="tabpanel" aria-label="圧縮パネル">
          <div className="form-group">
            <label className="form-label" htmlFor="gz-compress-input">
              圧縮するテキスト
            </label>
            <textarea
              id="gz-compress-input"
              className="gz-textarea"
              placeholder="圧縮したいテキストを入力してください..."
              value={compressInput}
              onChange={(e) => setCompressInput(e.target.value)}
              aria-label="圧縮するテキスト入力"
              aria-required="true"
            />
          </div>

          <div className="gz-action-row">
            <button
              type="button"
              className="btn-primary"
              onClick={handleCompress}
              disabled={isCompressing}
              aria-busy={isCompressing}
            >
              {isCompressing ? '圧縮中...' : '圧縮する'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClearCompress}>
              クリア
            </button>
          </div>

          {compressError && (
            <div className="gz-error" role="alert" aria-live="assertive">
              <span className="gz-error-icon" aria-hidden="true">⚠️</span>
              <span>{compressError}</span>
            </div>
          )}

          {compressOutput && (
            <>
              {/* 統計 */}
              {compressStats && (
                <div className="gz-stats" aria-label="圧縮統計">
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">元サイズ</span>
                    <span className="gz-stat-value">
                      {formatBytes(compressStats.originalSize)}
                    </span>
                  </div>
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">圧縮後</span>
                    <span className="gz-stat-value">
                      {formatBytes(compressStats.compressedSize)}
                    </span>
                  </div>
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">圧縮率</span>
                    <span
                      className={`gz-stat-value${isPositiveRatio ? ' gz-stat-value--positive' : ' gz-stat-value--negative'}`}
                    >
                      {isPositiveRatio ? '-' : '+'}
                      {Math.abs(Number(ratioPercent))}%
                    </span>
                  </div>
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">形式</span>
                    <span className="gz-stat-value">{GZIP_FORMAT_LABELS[format]}</span>
                  </div>
                </div>
              )}

              {/* Base64出力 */}
              <div className="gz-output-header">
                <span className="gz-output-label">Base64エンコード済み圧縮データ</span>
                <button
                  type="button"
                  className="btn-copy"
                  onClick={() => copy(compressOutput)}
                  aria-label="圧縮結果をコピー"
                >
                  コピー
                </button>
              </div>
              <textarea
                className="gz-textarea gz-textarea-output"
                readOnly
                value={compressOutput}
                aria-label="圧縮結果（Base64）"
                aria-readonly="true"
              />
            </>
          )}
        </div>
      )}

      {/* ========== 解凍パネル ========== */}
      {mode === 'decompress' && (
        <div id="gz-panel-decompress" role="tabpanel" aria-label="解凍パネル">
          <div className="form-group">
            <label className="form-label" htmlFor="gz-decompress-input">
              解凍する Base64 データ
            </label>
            <textarea
              id="gz-decompress-input"
              className="gz-textarea"
              placeholder="Base64エンコードされた圧縮データを貼り付けてください..."
              value={decompressInput}
              onChange={(e) => setDecompressInput(e.target.value)}
              aria-label="解凍する Base64 データ入力"
              aria-required="true"
            />
          </div>

          <div className="gz-action-row">
            <button
              type="button"
              className="btn-primary"
              onClick={handleDecompress}
              disabled={isDecompressing}
              aria-busy={isDecompressing}
            >
              {isDecompressing ? '解凍中...' : '解凍する'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClearDecompress}>
              クリア
            </button>
          </div>

          {decompressError && (
            <div className="gz-error" role="alert" aria-live="assertive">
              <span className="gz-error-icon" aria-hidden="true">⚠️</span>
              <span>{decompressError}</span>
            </div>
          )}

          {decompressOutput && (
            <>
              {/* 統計 */}
              {decompressStats && (
                <div className="gz-stats" aria-label="解凍統計">
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">圧縮データ</span>
                    <span className="gz-stat-value">
                      {formatBytes(decompressStats.compressedSize)}
                    </span>
                  </div>
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">解凍後</span>
                    <span className="gz-stat-value">
                      {formatBytes(decompressStats.decompressedSize)}
                    </span>
                  </div>
                  <div className="gz-stat-item">
                    <span className="gz-stat-label">形式</span>
                    <span className="gz-stat-value">{GZIP_FORMAT_LABELS[format]}</span>
                  </div>
                </div>
              )}

              {/* テキスト出力 */}
              <div className="gz-output-header">
                <span className="gz-output-label">解凍されたテキスト</span>
                <button
                  type="button"
                  className="btn-copy"
                  onClick={() => copy(decompressOutput)}
                  aria-label="解凍結果をコピー"
                >
                  コピー
                </button>
              </div>
              <textarea
                className="gz-textarea gz-textarea-output"
                readOnly
                value={decompressOutput}
                aria-label="解凍結果テキスト"
                aria-readonly="true"
              />
            </>
          )}
        </div>
      )}

      <TipsCard
        sections={[
          {
            title: '使い方',
            items: [
              '「圧縮」タブ: テキストを入力して形式を選び「圧縮する」をクリック。結果は Base64 で表示されます',
              '「解凍」タブ: Base64 形式の圧縮データを入力して「解凍する」をクリック',
              '圧縮形式は gzip・deflate (zlib)・deflate-raw から選択できます',
              '圧縮率が負の値（+X%）の場合、元データより大きくなっています（短いテキストや既圧縮データに多い）',
            ],
          },
          {
            title: '各形式の違い',
            items: [
              'gzip: 最も広く使われる形式。HTTP Content-Encoding や .gz ファイルに対応',
              'deflate (zlib): RFC 1950 準拠。zlib ヘッダー付きの deflate 圧縮',
              'deflate-raw: RFC 1951 準拠。ヘッダーなしの生 deflate ストリーム',
              'すべてブラウザ内で処理されるため、データが外部に送信されることはありません',
            ],
          },
        ]}
      />
    </div>
  );
}
