import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { useClipboard } from '../hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '../hooks/useStatusAnnouncement';
import { TipsCard } from '../components/TipsCard';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  buildPlayfairSquare,
  playfairEncrypt,
  playfairDecrypt,
  prepareDigraphs,
} from '../utils/playfair';
import '../styles/tools/playfair.css';

export const Route = createFileRoute('/playfair')({
  head: () => ({
    meta: [
      { title: 'プレイフェア暗号 | Web ツール集' },
      {
        name: 'description',
        content:
          'プレイフェア暗号（Playfair cipher）のエンコード・デコードツール。5×5キー方陣を使ったダイグラフ換字式暗号。キーワードを指定してテキストを2文字単位で暗号化。方陣の可視化・ダイグラフ分割の表示付き。',
      },
      { property: 'og:title', content: 'プレイフェア暗号 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'プレイフェア暗号のエンコード・デコードツール。5×5キー方陣でダイグラフ（2文字）単位に暗号化。キーワードを自由に設定。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/playfair` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'プレイフェア暗号 | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'プレイフェア暗号（Playfair cipher）のエンコード・デコードツール。',
      },
    ],
  }),
  component: PlayfairTool,
});

type Mode = 'encrypt' | 'decrypt';

/**
 * プレイフェア暗号ツールコンポーネント
 * 5×5キー方陣を使ったダイグラフ換字式暗号の暗号化・復号化と方陣の可視化を提供する
 */
function PlayfairTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('encrypt');
  const [inputText, setInputText] = useState('');
  const [keyword, setKeyword] = useState('KEYWORD');

  // プレイフェア方陣
  const square = useMemo(() => buildPlayfairSquare(keyword), [keyword]);

  // キーワード文字セット（方陣ハイライト用）
  const keywordChars = useMemo(() => {
    const seen = new Set<string>();
    const result = new Set<string>();
    for (const ch of keyword.toUpperCase()) {
      if (!/[A-Z]/.test(ch)) continue;
      const c = ch === 'J' ? 'I' : ch;
      if (!seen.has(c)) {
        seen.add(c);
        result.add(c);
      }
    }
    return result;
  }, [keyword]);

  // 入力テキストに含まれるアルファベット（方陣ハイライト用）
  const activeChars = useMemo(() => {
    return new Set(
      inputText
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .replace(/J/g, 'I')
        .split(''),
    );
  }, [inputText]);

  // 暗号化/復号化結果
  const output = useMemo(() => {
    if (!inputText.trim() || !keyword.trim()) return '';
    if (mode === 'encrypt') return playfairEncrypt(inputText, keyword);
    return playfairDecrypt(inputText, keyword);
  }, [inputText, keyword, mode]);

  // ダイグラフ分割（暗号化モード時のみ表示）
  const digraphs = useMemo(() => {
    if (mode !== 'encrypt' || !inputText.trim() || !keyword.trim()) return [];
    return prepareDigraphs(inputText);
  }, [inputText, keyword, mode]);

  // 暗号化後ダイグラフ（暗号化モード時のみ）
  const encryptedDigraphs = useMemo(() => {
    if (mode !== 'encrypt' || !output) return [];
    return output.split(' ');
  }, [mode, output]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copy(output);
    if (ok) {
      showToast('変換結果をコピーしました', 'success');
      announceStatus('変換結果をクリップボードにコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [output, copy, showToast, announceStatus]);

  const handleSwap = useCallback(() => {
    if (!output) return;
    setInputText(output);
    setMode((m) => (m === 'encrypt' ? 'decrypt' : 'encrypt'));
    announceStatus('変換結果を入力にセットし、モードを切り替えました');
  }, [output, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const isEmpty = inputText.trim().length === 0;

  return (
    <>
      <div className="tool-container">
        {/* モード選択 */}
        <div className="playfair-mode-row" role="group" aria-label="変換モード">
          {(['encrypt', 'decrypt'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`playfair-mode-btn${mode === m ? ' playfair-mode-btn--active' : ''}`}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
            >
              {m === 'encrypt' ? '暗号化' : '復号化'}
            </button>
          ))}
        </div>

        {/* キーワード入力 */}
        <div className="playfair-keyword-row">
          <label className="playfair-keyword-label" htmlFor="playfair-keyword">
            キーワード
          </label>
          <input
            id="playfair-keyword"
            type="text"
            className="playfair-keyword-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="英字のキーワードを入力（例: SECRET）"
            aria-label="プレイフェア暗号のキーワード"
            spellCheck={false}
          />
        </div>

        {/* テキスト入力 */}
        <section aria-labelledby="playfair-input-heading">
          <h2 id="playfair-input-heading" className="section-title">
            {mode === 'encrypt' ? '平文（暗号化するテキスト）' : '暗号文（復号化するテキスト）'}
          </h2>
          <Textarea
            id="playfair-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'encrypt'
                ? '暗号化するテキストを入力（英字のみ処理されます）'
                : '暗号文を入力（スペース区切りの2文字ペアも可）'
            }
            rows={4}
            aria-label={mode === 'encrypt' ? '平文入力' : '暗号文入力'}
          />
        </section>

        {/* 変換結果 */}
        <section aria-labelledby="playfair-output-heading">
          <h2 id="playfair-output-heading" className="section-title">
            {mode === 'encrypt' ? '暗号文' : '復号文'}
          </h2>
          <div
            id="playfair-output"
            className={`playfair-output${isEmpty ? ' playfair-output--empty' : ''}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || '（変換結果なし）'}`}
            role="region"
          >
            {isEmpty ? '変換結果がここに表示されます' : output || '（変換できません）'}
          </div>

          <div className="playfair-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty || !output}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSwap}
              disabled={isEmpty || !output}
              aria-label="変換結果を入力にセットしてモードを切り替え"
            >
              結果を入力にセット
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>
        </section>

        {/* ダイグラフ分割表示（暗号化モード時のみ） */}
        {mode === 'encrypt' && digraphs.length > 0 && (
          <section aria-labelledby="playfair-digraphs-heading">
            <h2 id="playfair-digraphs-heading" className="section-title">
              ダイグラフ分割
            </h2>
            <div
              className="playfair-digraphs"
              role="list"
              aria-label="ダイグラフ（2文字ペア）の分割と変換結果"
            >
              {digraphs.map((pair, i) => (
                <span
                  key={i}
                  className="playfair-digraph-badge"
                  role="listitem"
                  aria-label={`${pair[0]}${pair[1]} → ${encryptedDigraphs[i] ?? ''}`}
                >
                  <span>{pair[0]}{pair[1]}</span>
                  {encryptedDigraphs[i] && (
                    <>
                      <span className="playfair-digraph-arrow">→</span>
                      <span className="playfair-digraph-result">{encryptedDigraphs[i]}</span>
                    </>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* プレイフェア方陣 */}
        <section aria-labelledby="playfair-square-heading">
          <h2 id="playfair-square-heading" className="section-title">
            プレイフェア方陣
          </h2>
          <div className="playfair-square-wrapper">
            <div
              className="playfair-square-grid"
              role="grid"
              aria-label="プレイフェア5×5キー方陣"
            >
              {square.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={[
                      'playfair-square-cell',
                      keywordChars.has(cell) ? 'playfair-square-cell--keyword' : '',
                      !keywordChars.has(cell) && activeChars.has(cell)
                        ? 'playfair-square-cell--active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="gridcell"
                    aria-label={`行${r + 1}列${c + 1}: ${cell}`}
                  >
                    {cell}
                  </div>
                )),
              )}
            </div>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'キーワードを入力するとプレイフェア方陣が更新されます',
                '平文を入力すると自動で暗号化されます（英字以外は無視）',
                '「復号化」モードに切り替えて暗号文を入力すると復号化できます',
                '「結果を入力にセット」ボタンで変換結果を入力に移してモードを反転します',
                '方陣のハイライト: 青=キーワード文字、緑=入力テキストに含まれる文字',
              ],
            },
            {
              title: 'プレイフェア暗号について',
              items: [
                '1854年にチャールズ・ウィートストンが考案、プレイフェア卿が普及させた換字式暗号です',
                'キーワードの文字を先頭に並べた5×5方陣（I/J を同一視）を鍵とします',
                '平文を2文字単位（ダイグラフ）に分割し、同じ文字が連続する場合は X を挿入します',
                '同じ行の文字ペア → 各列を右にシフト（復号化は左）',
                '同じ列の文字ペア → 各行を下にシフト（復号化は上）',
                '矩形の文字ペア → 互いの列を入れ替え（暗号化・復号化で同じ操作）',
                '単純な頻度分析に対しては1文字換字より強固ですが、現代暗号には適しません',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
