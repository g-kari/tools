import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  ESCAPE_MODES,
  escapeString,
  unescapeString,
  type EscapeMode,
} from '~/utils/string-escape';
import '../styles/tools/string-escape.css';

export const Route = createFileRoute('/string-escape')({
  head: () => ({
    meta: [
      { title: '文字列エスケープ | Web ツール集' },
      {
        name: 'description',
        content:
          'JavaScript・JSON・Python・正規表現・Shell向けの文字列エスケープ/アンエスケープツール。\\n・\\t・\\uXXXX などの特殊文字をリアルタイム変換。',
      },
      { property: 'og:title', content: '文字列エスケープ | Web ツール集' },
      {
        property: 'og:description',
        content:
          'JavaScript・JSON・Python・正規表現・Shell向けの文字列エスケープ/アンエスケープ変換ツール。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/string-escape` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '文字列エスケープ | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'JavaScript・JSON・Python・正規表現・Shell向けの文字列エスケープ/アンエスケープ変換ツール。',
      },
    ],
  }),
  component: StringEscapeTool,
});

// ---------------------------------------------------------------------------
// サンプルデータ
// ---------------------------------------------------------------------------

const SAMPLE_TEXT = `こんにちは、"世界"！
タブ	区切りと改行があります。
パス: C:\\Users\\user\\Documents
URLパラメータ: https://example.com?q=hello&lang=ja
正規表現: (\\d+\\.\\d+)
Shell: it's a "test" $HOME`;

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

function StringEscapeTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [rawInput, setRawInput] = useState('');
  const [mode, setMode] = useState<EscapeMode>('js-double');

  const currentModeInfo = useMemo(() => ESCAPE_MODES.find((m) => m.id === mode)!, [mode]);

  // エスケープ済み出力（リアルタイム）
  const escapedOutput = useMemo(() => {
    if (!rawInput) return '';
    return escapeString(rawInput, mode);
  }, [rawInput, mode]);

  const handleCopyEscaped = useCallback(async () => {
    if (!escapedOutput) return;
    const ok = await copy(escapedOutput);
    if (ok) {
      showToast('エスケープ済みテキストをコピーしました', 'success');
      announceStatus('エスケープ済みテキストをクリップボードにコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [escapedOutput, copy, showToast, announceStatus]);

  const handleCopyWithWrapper = useCallback(async () => {
    if (!escapedOutput || !currentModeInfo.wrapper) return;
    const withWrapper =
      currentModeInfo.wrapper.open + escapedOutput + currentModeInfo.wrapper.close;
    const ok = await copy(withWrapper);
    if (ok) {
      showToast('クォート付きでコピーしました', 'success');
      announceStatus('クォート付きでクリップボードにコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [escapedOutput, currentModeInfo, copy, showToast, announceStatus]);

  const handleUnescapeToRaw = useCallback(() => {
    if (!escapedOutput) return;
    const unescaped = unescapeString(escapedOutput, mode);
    setRawInput(unescaped);
    announceStatus('アンエスケープして入力欄に反映しました');
    showToast('アンエスケープしました', 'success');
  }, [escapedOutput, mode, showToast, announceStatus]);

  const handleUnescapeFromInput = useCallback(() => {
    if (!rawInput) return;
    const unescaped = unescapeString(rawInput, mode);
    setRawInput(unescaped);
    announceStatus('入力テキストをアンエスケープしました');
    showToast('アンエスケープしました', 'success');
  }, [rawInput, mode, showToast, announceStatus]);

  const handleLoadSample = useCallback(() => {
    setRawInput(SAMPLE_TEXT);
    announceStatus('サンプルテキストを読み込みました');
  }, [announceStatus]);

  const handleClear = useCallback(() => {
    setRawInput('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: EscapeMode) => {
      setMode(newMode);
      announceStatus(`モードを${ESCAPE_MODES.find((m) => m.id === newMode)?.label ?? newMode}に変更しました`);
    },
    [announceStatus],
  );

  return (
    <>
      <div className="tool-container">
        {/* モード選択 */}
        <div
          className="string-escape-modes"
          role="group"
          aria-label="エスケープモード選択"
        >
          {ESCAPE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`string-escape-mode-btn${mode === m.id ? ' active' : ''}`}
              onClick={() => handleModeChange(m.id)}
              aria-pressed={mode === m.id}
              aria-label={m.label}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* モード説明 */}
        <p className="string-escape-mode-desc" aria-live="polite">
          {currentModeInfo.description}
        </p>

        {/* アクションボタン */}
        <div className="string-escape-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopyEscaped}
            disabled={!escapedOutput}
            aria-label="エスケープ済みテキストをコピー"
          >
            エスケープ結果をコピー
          </button>
          {currentModeInfo.wrapper && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyWithWrapper}
              disabled={!escapedOutput}
              aria-label={`${currentModeInfo.wrapper.open}...${currentModeInfo.wrapper.close} で囲んでコピー`}
            >
              {currentModeInfo.wrapper.open}...{currentModeInfo.wrapper.close} でコピー
            </button>
          )}
          {currentModeInfo.supportsUnescape && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleUnescapeFromInput}
              disabled={!rawInput}
              aria-label="入力テキストをアンエスケープ"
            >
              入力をアンエスケープ
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSample}
            aria-label="サンプルテキストを読み込む"
          >
            サンプル
          </button>
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!rawInput}
            aria-label="入力をクリア"
          >
            クリア
          </button>
        </div>

        {/* 入出力エリア */}
        <div className="string-escape-layout">
          {/* 入力 */}
          <div>
            <div className="string-escape-section-header">
              <label htmlFor="string-escape-input" className="section-title">
                生テキスト（入力）
              </label>
              <span className="string-escape-char-count" aria-label={`入力文字数: ${rawInput.length}`}>
                {rawInput.length.toLocaleString()} 文字
              </span>
            </div>
            <textarea
              id="string-escape-input"
              className="string-escape-textarea"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={`ここに生テキストを入力してください…\n例: Hello, "World"!\nLine 2\tTabbed`}
              spellCheck={false}
              aria-label="生テキスト入力"
            />
          </div>

          {/* 出力 */}
          <div>
            <div className="string-escape-section-header">
              <label htmlFor="string-escape-output" className="section-title">
                エスケープ済み（出力）
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {currentModeInfo.wrapper && (
                  <span className="string-escape-wrapper-info">
                    {currentModeInfo.wrapper.open}...{currentModeInfo.wrapper.close}
                  </span>
                )}
                <span className="string-escape-char-count" aria-label={`出力文字数: ${escapedOutput.length}`}>
                  {escapedOutput.length.toLocaleString()} 文字
                </span>
              </div>
            </div>
            <textarea
              id="string-escape-output"
              className="string-escape-textarea"
              value={escapedOutput}
              readOnly
              placeholder="左側に生テキストを入力するとエスケープ結果が表示されます"
              spellCheck={false}
              aria-label="エスケープ済みテキスト出力"
              aria-live="polite"
            />
            {currentModeInfo.supportsUnescape && escapedOutput && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleUnescapeToRaw}
                style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                aria-label="出力をアンエスケープして入力に反映"
              >
                ↑ アンエスケープして入力に反映
              </button>
            )}
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: 'JavaScriptとJSONの違い',
              items: [
                'JSONはRFC 8259に従い、制御文字（U+0000〜U+001F）を必ずエスケープします',
                'JSONはサロゲートペアを \\uXXXX で表現します',
                'JSダブルモードは \\uXXXX を使いますが、JSON より柔軟です',
                'テンプレートリテラルモードは \\n をそのまま（改行として）埋め込めるため、エスケープしません',
              ],
            },
            {
              title: '正規表現モードについて',
              items: [
                '正規表現で特別な意味を持つ . * + ? ^ $ { } ( ) | [ ] \\ をエスケープします',
                '文字列リテラルとして検索したい場合に使用します',
                '例: user.name を正規表現で検索するには user\\.name にエスケープが必要',
              ],
            },
            {
              title: 'Shellモードについて',
              items: [
                'シングルクォート方式: 文字列全体を \' で囲み、内部の \' を \'\\\'\'  に変換します',
                'シングルクォート内では $ や \\ を含む文字列も安全に扱えます',
                '例: it\'s OK → \'it\'\\\'\'s OK\'',
              ],
            },
            {
              title: 'アンエスケープについて',
              items: [
                '「入力をアンエスケープ」ボタン: 入力欄にある \\n や \\t などを実際の改行・タブに変換します',
                '「↑ アンエスケープして入力に反映」ボタン: 出力欄のエスケープ済みテキストを元に戻して入力欄に反映します',
                'JS・JSON・Pythonモードでアンエスケープが利用できます',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
