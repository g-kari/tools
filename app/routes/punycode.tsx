import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  encodeDomain,
  decodeDomain,
  autoConvertDomain,
  type PunycodeResult,
  type LabelInfo,
} from '~/utils/punycode';
import '../styles/tools/punycode.css';

export const Route = createFileRoute('/punycode')({
  head: () => ({
    meta: [
      { title: 'Punycode変換 (IDN) | Web ツール集' },
      {
        name: 'description',
        content:
          '国際化ドメイン名 (IDN) の Punycode 変換ツール。日本語・中国語・アラビア語などの Unicode ドメインを xn-- 形式の ASCII Compatible Encoding (ACE) に変換。RFC 3492 準拠。',
      },
      { property: 'og:title', content: 'Punycode変換 (IDN) | Web ツール集' },
      {
        property: 'og:description',
        content:
          'IDN の Punycode 変換。Unicode ⇄ ACE (xn--) 相互変換。日本語・中国語ドメイン対応。RFC 3492 準拠。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/punycode` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'Punycode変換 (IDN) | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          '国際化ドメイン名の Punycode 変換ツール。Unicode ⇄ ACE 相互変換、RFC 3492 準拠。',
      },
    ],
  }),
  component: PunycodeConverter,
});

// ---------------------------------------------------------------------------
// サンプル
// ---------------------------------------------------------------------------

type Mode = 'encode' | 'decode' | 'auto';

const ENCODE_SAMPLES = [
  { label: '日本語', value: '日本語.jp' },
  { label: 'ドイツ語', value: 'münchen.de' },
  { label: '中国語', value: '中文.com' },
  { label: '韓国語', value: '한국.kr' },
  { label: 'アラビア語', value: 'مثال.com' },
];

const DECODE_SAMPLES = [
  { label: '日本語', value: 'xn--wgv71a119e.jp' },
  { label: 'ドイツ語', value: 'xn--mnchen-3ya.de' },
  { label: '中国語', value: 'xn--fiq228c.com' },
  { label: '韓国語', value: 'xn--3e0b707e.kr' },
];

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

function PunycodeConverter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('auto');
  const [input, setInput] = useState('');

  const { result, error } = useMemo<{ result: PunycodeResult | null; error: string | null }>(() => {
    if (!input.trim()) return { result: null, error: null };
    try {
      let r: PunycodeResult;
      if (mode === 'encode') {
        r = encodeDomain(input);
      } else if (mode === 'decode') {
        r = decodeDomain(input);
      } else {
        r = autoConvertDomain(input).result;
      }
      return { result: r, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : '変換に失敗しました' };
    }
  }, [mode, input]);

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

  const handleSample = useCallback(
    (value: string) => {
      setInput(value);
      announceStatus(`サンプル "${value}" をセットしました`);
    },
    [announceStatus],
  );

  const handleClear = useCallback(() => {
    setInput('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setInput('');
      const labels: Record<Mode, string> = {
        encode: 'エンコード（Unicode→Punycode）',
        decode: 'デコード（Punycode→Unicode）',
        auto: '自動変換',
      };
      announceStatus(`${labels[newMode]}モードに切り替えました`);
    },
    [announceStatus],
  );

  const samples = mode === 'decode' ? DECODE_SAMPLES : ENCODE_SAMPLES;

  return (
    <>
      <div className="tool-container">
        {/* モード切替 */}
        <div className="pny-tabs" role="tablist" aria-label="変換モード">
          {(
            [
              { id: 'auto', label: '自動' },
              { id: 'encode', label: 'エンコード' },
              { id: 'decode', label: 'デコード' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              className={`pny-tab-btn${mode === id ? ' active' : ''}`}
              onClick={() => handleModeChange(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="pny-input" className="section-title">
            {mode === 'decode' ? 'Punycode ドメイン (ACE 形式)' : 'ドメイン名'}
          </label>
          <div className="pny-input-row">
            <input
              id="pny-input"
              type="text"
              className={`pny-input${error ? ' has-error' : ''}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'decode'
                  ? 'xn--wgv71a119e.jp'
                  : mode === 'encode'
                    ? '日本語.jp'
                    : '日本語.jp または xn--wgv71a119e.jp'
              }
              aria-label={
                mode === 'decode'
                  ? 'Punycodeドメイン入力'
                  : 'Unicodeドメイン入力'
              }
              aria-invalid={!!error}
              spellCheck={false}
              autoComplete="off"
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

        {/* エラー */}
        {error && input.trim() && (
          <div className="pny-error" role="alert">
            <span aria-hidden="true">⚠</span>
            {error}
          </div>
        )}

        {/* サンプル */}
        <div className="pny-samples" role="group" aria-label="サンプルドメイン">
          <span className="pny-samples-label" aria-hidden="true">
            サンプル:
          </span>
          {samples.map((s) => (
            <button
              key={s.value}
              type="button"
              className="pny-sample-btn"
              onClick={() => handleSample(s.value)}
              aria-label={`${s.label} (${s.value})`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 結果 */}
        {result && (
          <PunycodeResult
            result={result}
            mode={mode}
            onCopy={handleCopy}
          />
        )}

        <TipsCard
          sections={[
            {
              title: 'Punycode / IDN について',
              items: [
                'IDN (Internationalized Domain Name) は非ASCII文字を含むドメイン名',
                'Punycode (RFC 3492) は IDN を ASCII 互換形式 (ACE) に変換する仕組み',
                'ACE 形式は "xn--" プレフィックス + Bootstring エンコード文字列',
                'DNS プロトコルは ASCII のみのため、IDN は内部的に ACE 形式で処理される',
              ],
            },
            {
              title: '変換例',
              items: [
                '日本語.jp → xn--wgv71a119e.jp',
                'münchen.de → xn--mnchen-3ya.de',
                '中文.com → xn--fiq228c.com',
                'مثال.com → xn--mgbh0fb.com',
                'example.com → 変換不要 (純粋 ASCII)',
              ],
            },
            {
              title: '用途',
              items: [
                'メールアドレスのドメイン部分の検証',
                'DNS 設定での ACE 形式確認',
                'IDN 対応サービスのデバッグ',
                'Certificate Subject Alternative Name の確認',
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

interface PunycodeResultProps {
  result: PunycodeResult;
  mode: Mode;
  onCopy: (text: string, label: string) => void;
}

function PunycodeResult({ result, mode, onCopy }: PunycodeResultProps) {
  const outputLabel =
    mode === 'decode' ? 'Unicode ドメイン' : 'ACE (Punycode) 形式';

  return (
    <section aria-label="変換結果" className="pny-result-section">
      <p className="pny-result-label">{outputLabel}</p>
      <div className="pny-result-value-row">
        {result.hasConversion ? (
          <span className="pny-result-value" aria-live="polite">
            {result.output}
          </span>
        ) : (
          <span className="pny-result-value" aria-live="polite">
            {result.output}
            <span className="pny-no-change">（変換なし・純粋 ASCII）</span>
          </span>
        )}
        <button
          type="button"
          className="pny-copy-btn"
          onClick={() => onCopy(result.output, outputLabel)}
          aria-label={`${outputLabel}をコピー`}
        >
          コピー
        </button>
      </div>

      {/* ラベル内訳 */}
      {result.labels.length > 1 && (
        <div className="pny-labels-section" aria-label="ラベル内訳">
          <p className="pny-labels-title">ラベル内訳</p>
          <table className="pny-labels-table">
            <thead>
              <tr>
                <th scope="col">変換前</th>
                <th scope="col">変換後</th>
                <th scope="col">状態</th>
              </tr>
            </thead>
            <tbody>
              {result.labels.map((label, i) => (
                <LabelRow key={i} label={label} onCopy={onCopy} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ラベル行コンポーネント
// ---------------------------------------------------------------------------

interface LabelRowProps {
  label: LabelInfo;
  onCopy: (text: string, label: string) => void;
}

function LabelRow({ label, onCopy }: LabelRowProps) {
  return (
    <tr className={label.changed ? 'changed' : ''}>
      <td>{label.original || '(空)'}</td>
      <td>
        <span>{label.converted || '(空)'}</span>
        {label.changed && (
          <button
            type="button"
            className="pny-copy-btn pny-copy-btn-ml"
            onClick={() => onCopy(label.converted, label.original)}
            aria-label={`${label.original} の変換結果をコピー`}
          >
            コピー
          </button>
        )}
      </td>
      <td>
        {label.changed ? (
          <span className="pny-changed-badge">変換あり</span>
        ) : (
          <span className="pny-unchanged-badge">そのまま</span>
        )}
      </td>
    </tr>
  );
}
