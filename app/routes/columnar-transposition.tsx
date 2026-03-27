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
  encodeColumnar,
  decodeColumnar,
  buildColumnOrder,
  buildGrid,
} from '../utils/columnar-transposition';
import '../styles/tools/columnar-transposition.css';

export const Route = createFileRoute('/columnar-transposition')({
  head: () => ({
    meta: [
      { title: '列転置暗号（Columnar Transposition） | Web ツール集' },
      {
        name: 'description',
        content:
          '列転置暗号（Columnar Transposition Cipher）のエンコード・デコードツール。キーワードのアルファベット順に列を並び替える古典暗号。グリッド可視化・パディング文字設定に対応。',
      },
      {
        property: 'og:title',
        content: '列転置暗号（Columnar Transposition） | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          '列転置暗号のエンコード・デコードツール。キーワードで列順を決める古典的転置暗号。グリッド可視化付き。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/columnar-transposition` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: '列転置暗号（Columnar Transposition） | Web ツール集',
      },
      {
        name: 'twitter:description',
        content: '列転置暗号のエンコード・デコードツール。グリッド可視化付き。',
      },
    ],
  }),
  component: ColumnarTranspositionCipher,
});

type Mode = 'encode' | 'decode';

/**
 * 列転置暗号ツールコンポーネント
 * テキストの列転置暗号エンコード・デコードとグリッド可視化を提供する
 */
function ColumnarTranspositionCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState('');
  const [key, setKey] = useState('KEY');
  const [padChar, setPadChar] = useState('X');
  const [mode, setMode] = useState<Mode>('encode');
  const [showGrid, setShowGrid] = useState(false);

  const validKey = useMemo(() => key.replace(/[^A-Za-z]/g, '').toUpperCase() || 'A', [key]);
  const validPad = useMemo(() => (padChar.replace(/[^A-Za-z]/g, '').toUpperCase()[0] ?? 'X'), [padChar]);

  const output = useMemo(() => {
    if (!inputText) return '';
    if (mode === 'encode') return encodeColumnar(inputText, validKey, validPad);
    return decodeColumnar(inputText, validKey, validPad);
  }, [inputText, validKey, validPad, mode]);

  const columnOrder = useMemo(() => buildColumnOrder(validKey), [validKey]);

  const gridData = useMemo(() => {
    if (!showGrid || !inputText) return [];
    const source = mode === 'encode' ? inputText : output;
    return buildGrid(source, validKey, validPad);
  }, [showGrid, inputText, output, mode, validKey, validPad]);

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

  const handleClear = useCallback(() => {
    setInputText('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      announceStatus(
        newMode === 'encode' ? 'エンコードモードに切り替えました' : 'デコードモードに切り替えました'
      );
    },
    [announceStatus]
  );

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => {
      const next = !prev;
      announceStatus(next ? 'グリッド可視化を表示しました' : 'グリッド可視化を非表示にしました');
      return next;
    });
  }, [announceStatus]);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        {/* モード選択 */}
        <section aria-labelledby="ct-mode-heading">
          <h2 id="ct-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="ct-mode-group" role="group" aria-label="変換モード">
            <Button
              type="button"
              variant={mode === 'encode' ? 'default' : 'outline'}
              onClick={() => handleModeChange('encode')}
              aria-pressed={mode === 'encode'}
            >
              エンコード
            </Button>
            <Button
              type="button"
              variant={mode === 'decode' ? 'default' : 'outline'}
              onClick={() => handleModeChange('decode')}
              aria-pressed={mode === 'decode'}
            >
              デコード
            </Button>
          </div>
        </section>

        {/* キーワード設定 */}
        <section aria-labelledby="ct-key-heading">
          <h2 id="ct-key-heading" className="section-title">
            キーワード設定
          </h2>
          <div className="ct-key-row">
            <input
              type="text"
              className="ct-key-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="例: KEY"
              aria-label="列転置暗号のキーワード（英字のみ有効）"
              spellCheck={false}
              maxLength={20}
            />
            <input
              type="text"
              className="ct-key-input ct-key-input--pad"
              value={padChar}
              onChange={(e) => setPadChar(e.target.value)}
              placeholder="X"
              aria-label="パディング文字（英字1文字）"
              spellCheck={false}
              maxLength={1}
            />
          </div>
          {/* 列順バッジ */}
          <div className="ct-key-order" aria-label="列の読み取り順（アルファベット順のランク）">
            {Array.from(validKey).map((char, i) => (
              <div key={i} className="ct-key-badge">
                <span className="ct-key-badge-char">{char}</span>
                <span className="ct-key-badge-rank">{columnOrder[i] + 1}</span>
              </div>
            ))}
          </div>
        </section>

        {/* テキスト入力 */}
        <section aria-labelledby="ct-input-heading">
          <h2 id="ct-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="ct-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'encode' ? '暗号化するテキストを入力' : '復号する暗号文を入力'}
            rows={4}
            aria-label="列転置暗号の入力テキスト"
          />
        </section>

        {/* 変換結果 */}
        <section aria-labelledby="ct-output-heading">
          <h2 id="ct-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="ct-output"
            className={`ct-output${isEmpty ? ' ct-output--empty' : ''}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || '（変換結果なし）'}`}
            role="region"
          >
            {isEmpty ? '変換結果がここに表示されます' : output}
          </div>

          <div className="ct-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleGrid}
              disabled={isEmpty}
              aria-label={showGrid ? 'グリッド可視化を非表示' : 'グリッド可視化を表示'}
            >
              {showGrid ? '可視化を非表示' : 'グリッド可視化'}
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

        {/* グリッド可視化 */}
        {showGrid && gridData.length > 0 && (
          <section aria-labelledby="ct-grid-heading">
            <h2 id="ct-grid-heading" className="section-title">
              グリッド可視化
            </h2>
            <div className="ct-grid-wrapper">
              <table className="ct-grid" aria-label="列転置暗号グリッド">
                <thead>
                  <tr>
                    {Array.from(validKey).map((char, i) => (
                      <th key={i} scope="col" aria-label={`列 ${i + 1}: ${char}`}>
                        {char}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="ct-key-rank-row" aria-label="列の読み取り順">
                    {columnOrder.map((rank, i) => (
                      <td key={i} aria-label={`列 ${i + 1} の順番: ${rank + 1}`}>
                        {rank + 1}
                      </td>
                    ))}
                  </tr>
                  {gridData.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          className={cell.isPad ? 'ct-grid-pad' : ''}
                          aria-label={cell.isPad ? `パディング: ${cell.char}` : cell.char}
                        >
                          {cell.char}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'キーワードを入力してください（英字のみ有効）',
                'エンコード: 平文をキーワード長の列に並べ、アルファベット順に列を読み取って暗号化します',
                'デコード: 同じキーワードを指定して元のテキストに戻します',
                'パディング: テキストがグリッドを埋め切らない場合に使う補填文字（デフォルト: X）',
                'グリッド可視化: 平文がどのように並ぶかビジュアルで確認できます',
              ],
            },
            {
              title: '列転置暗号について',
              items: [
                '転置式暗号の一種で、文字の順番をキーワードに基づいて並び替えます',
                'キーワード「KEY」の場合、E=1番目・K=2番目・Y=3番目の順で列を読み取ります',
                '第一次・第二次世界大戦中に軍事通信でも使用された歴史ある暗号です',
                '単純な転置暗号のため単体では解読されやすく、CTFやパズル用途に適しています',
                'ADFGVX暗号やDouble Transpositionなど、より複雑な暗号のベースとなっています',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
