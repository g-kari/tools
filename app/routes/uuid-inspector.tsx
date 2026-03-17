import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  parseUUID,
  UUID_SAMPLES,
  UUID_NIL,
  type UUIDInfo,
} from '~/utils/uuid-inspector';
import '../styles/tools/uuid-inspector.css';

export const Route = createFileRoute('/uuid-inspector')({
  head: () => ({
    meta: [
      { title: 'UUID インスペクター | Web ツール集' },
      {
        name: 'description',
        content:
          'UUID の構造を解析するツール。バージョン (v1〜v8) 判定・バリアント判定・v1/v6 タイムスタンプ抽出・v7 Unix エポック抽出・128 ビットバイナリ表示。RFC 4122 / RFC 9562 準拠。',
      },
      { property: 'og:title', content: 'UUID インスペクター | Web ツール集' },
      {
        property: 'og:description',
        content: 'UUID の構造を解析。バージョン (v1〜v8) 判定・タイムスタンプ抽出・バイナリ表示。RFC 4122 / RFC 9562 準拠。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/uuid-inspector` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'UUID インスペクター | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'UUID の構造を解析。バージョン判定・タイムスタンプ抽出・バイナリ表示。',
      },
    ],
  }),
  component: UUIDInspector,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

function UUIDInspector() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState('');

  const info = useMemo<UUIDInfo | null>(() => {
    if (!input.trim()) return null;
    return parseUUID(input);
  }, [input]);

  const handleSample = useCallback(
    (value: string) => {
      setInput(value);
      announceStatus(`サンプル UUID をセットしました`);
    },
    [announceStatus],
  );

  const handleClear = useCallback(() => {
    setInput('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const ok = await copy(text);
      if (ok) {
        showToast('コピーしました', 'success');
        announceStatus(`${label}をコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [copy, showToast, announceStatus],
  );

  return (
    <>
      <div className="tool-container">
        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="uuid-input" className="section-title">
            UUID 入力
          </label>
          <div className="uuid-input-row">
            <input
              id="uuid-input"
              type="text"
              className={`uuid-input${info && !info.valid ? ' has-error' : ''}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              spellCheck={false}
              autoComplete="off"
              aria-label="UUID 入力"
              aria-invalid={!!(info && !info.valid)}
            />
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
        </div>

        {/* サンプル */}
        <div className="uuid-samples" role="group" aria-label="サンプル UUID">
          <span className="uuid-samples-label" aria-hidden="true">サンプル:</span>
          {UUID_SAMPLES.map(s => (
            <button
              key={s.value}
              type="button"
              className="uuid-sample-btn"
              onClick={() => handleSample(s.value)}
              aria-label={`${s.label} のサンプルをセット`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* エラー */}
        {info && !info.valid && (
          <div className="uuid-error" role="alert">
            <span aria-hidden="true">⚠</span>
            {info.error}
          </div>
        )}

        {/* 結果 */}
        {info && info.valid && (
          <UUIDResult info={info} onCopy={handleCopy} />
        )}

        <TipsCard
          sections={[
            {
              title: 'UUID バージョンについて',
              items: [
                'v1: グレゴリオ暦タイムスタンプ + クロックシーケンス + MAC アドレス',
                'v3: MD5 ハッシュ（名前空間 + 名前）— 再現可能な識別子',
                'v4: 122 ビットの擬似乱数 — 最も広く使われるバージョン',
                'v5: SHA-1 ハッシュ（名前空間 + 名前）— v3 の改良版',
                'v6: v1 の並べ替え版（時系列でソート可能、RFC 9562）',
                'v7: Unix エポックタイムスタンプ（ms 精度）+ 乱数（RFC 9562）',
              ],
            },
            {
              title: 'UUID の構造',
              items: [
                'UUID は 128 ビット（32 hex 文字 + 4 ハイフン = 36 文字）',
                '形式: time_low - time_mid - time_hi_ver - clk_seq - node',
                'バリアントビット: clock_seq_hi_res の上位 2 ビット',
                'バージョンビット: time_hi_and_version の上位 4 ビット',
                'NIL UUID: 全ビット 0（00000000-0000-0000-0000-000000000000）',
                'Max UUID: 全ビット 1（ffffffff-ffff-ffff-ffff-ffffffffffff）',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 結果コンポーネント
// ---------------------------------------------------------------------------

interface UUIDResultProps {
  info: UUIDInfo;
  onCopy: (text: string, label: string) => void;
}

function UUIDResult({ info, onCopy }: UUIDResultProps) {
  const isSpecial = info.isNil || info.isMax;

  return (
    <section className="uuid-result-section" aria-label="UUID 解析結果">
      {/* 正規化された UUID */}
      <div className="uuid-result-header">
        <div className="uuid-result-value-row">
          <code className="uuid-normalized">{info.normalized}</code>
          <button
            type="button"
            className="pny-copy-btn"
            onClick={() => onCopy(info.normalized, 'UUID')}
            aria-label="UUID をコピー"
          >
            コピー
          </button>
        </div>
        {info.isNil && <span className="uuid-special-badge nil">NIL UUID</span>}
        {info.isMax && <span className="uuid-special-badge max">Max UUID</span>}
      </div>

      {/* メタ情報 */}
      {!isSpecial && (
        <div className="uuid-meta-grid">
          <UUIDRow label="バージョン" value={info.versionLabel ?? '不明'} highlight />
          <UUIDRow label="バリアント" value={info.variantLabel ?? '不明'} />
          {info.timestamp && (
            <UUIDRow
              label="タイムスタンプ"
              value={info.timestamp.toISOString()}
              sub={`(${info.timestamp.toLocaleString('ja-JP')})`}
            />
          )}
          {info.unixMs !== undefined && (
            <UUIDRow label="Unix ms" value={info.unixMs.toString()} />
          )}
          {info.clockSequence !== undefined && (
            <UUIDRow
              label="クロックシーケンス"
              value={`${info.clockSequence} (0x${info.clockSequence.toString(16).toUpperCase()})`}
            />
          )}
          {info.macAddress && (
            <UUIDRow label="MAC アドレス" value={info.macAddress} />
          )}
        </div>
      )}

      {/* フィールド分解 */}
      {info.components && (
        <details className="uuid-fields-section">
          <summary className="uuid-fields-title">フィールド分解</summary>
          <div className="uuid-fields-grid">
            <FieldRow label="time_low" value={info.components.timeLow} bits="ビット 0-31" color="f1" />
            <FieldRow label="time_mid" value={info.components.timeMid} bits="ビット 32-47" color="f2" />
            <FieldRow label="time_hi_version" value={info.components.timeHiAndVersion} bits="ビット 48-63" color="f3" />
            <FieldRow label="clk_seq_hi" value={info.components.clockSeqHiRes} bits="ビット 64-71" color="f4" />
            <FieldRow label="clk_seq_low" value={info.components.clockSeqLow} bits="ビット 72-79" color="f4" />
            <FieldRow label="node" value={info.components.node} bits="ビット 80-127" color="f5" />
          </div>
        </details>
      )}

      {/* バイナリビット表示 */}
      {info.binaryBits && (
        <details className="uuid-binary-section">
          <summary className="uuid-fields-title">バイナリ (128 ビット)</summary>
          <div className="uuid-binary-grid" aria-label="UUID の 128 ビットバイナリ表示">
            {info.hexBytes.map((byte, i) => (
              <div key={i} className="uuid-byte-cell">
                <span className="uuid-byte-hex">{byte}</span>
                <span className="uuid-byte-bin">
                  {parseInt(byte, 16).toString(2).padStart(8, '0')}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function UUIDRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="uuid-meta-row">
      <span className="uuid-meta-label">{label}</span>
      <span className={`uuid-meta-value${highlight ? ' highlight' : ''}`}>
        {value}
        {sub && <span className="uuid-meta-sub">{sub}</span>}
      </span>
    </div>
  );
}

function FieldRow({
  label,
  value,
  bits,
  color,
}: {
  label: string;
  value: string;
  bits: string;
  color: string;
}) {
  return (
    <div className={`uuid-field-row uuid-field-${color}`}>
      <span className="uuid-field-label">{label}</span>
      <code className="uuid-field-value">{value}</code>
      <span className="uuid-field-bits">{bits}</span>
    </div>
  );
}

// NIL UUID は UUID_NIL から import 済み
void UUID_NIL;
