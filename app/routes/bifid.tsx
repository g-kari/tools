import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { useClipboard } from '../hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '../hooks/useStatusAnnouncement';
import { TipsCard } from '../components/TipsCard';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { encodeBifid, decodeBifid, buildBifidSquare } from '../utils/bifid';
import '../styles/tools/bifid.css';

export const Route = createFileRoute('/bifid')({
  head: () => ({
    meta: [
      { title: 'Bifid暗号（ビフィド暗号） | Web ツール集' },
      {
        name: 'description',
        content:
          'Bifid暗号（ビフィド暗号）のエンコード・デコードツール。ポリュビオスの方陣を使った分割転置暗号。キーワード・周期設定・方陣可視化に対応。',
      },
      {
        property: 'og:title',
        content: 'Bifid暗号（ビフィド暗号） | Web ツール集',
      },
      {
        property: 'og:description',
        content: 'Bifid暗号のエンコード・デコードツール。ポリュビオス方陣を使った分割転置暗号。周期設定・方陣可視化付き。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/bifid` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'Bifid暗号（ビフィド暗号） | Web ツール集',
      },
      {
        name: 'twitter:description',
        content: 'Bifid暗号のエンコード・デコードツール。ポリュビオス方陣・周期設定付き。',
      },
    ],
  }),
  component: BifidCipher,
});

type Mode = 'encode' | 'decode';

/** キーワードに属するかどうかを判定するためのSet */
function buildKeySet(key: string): Set<string> {
  const upper = key.toUpperCase().replace(/J/g, 'I');
  const seen = new Set<string>();
  for (const ch of upper) {
    if (/[A-Z]/.test(ch)) seen.add(ch);
  }
  return seen;
}

/**
 * Bifid暗号ツールコンポーネント
 * ポリュビオスの方陣を使った分割転置暗号のエンコード・デコードと方陣可視化を提供する
 */
function BifidCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState('');
  const [key, setKey] = useState('KEYWORD');
  const [period, setPeriod] = useState(0);
  const [mode, setMode] = useState<Mode>('encode');
  const [showSquare, setShowSquare] = useState(false);

  const validKey = useMemo(() => key.replace(/[^A-Za-z]/g, '').toUpperCase() || 'A', [key]);

  const output = useMemo(() => {
    if (!inputText) return '';
    if (mode === 'encode') return encodeBifid(inputText, validKey, period);
    return decodeBifid(inputText, validKey, period);
  }, [inputText, validKey, period, mode]);

  const grid = useMemo(() => buildBifidSquare(validKey), [validKey]);
  const keySet = useMemo(() => buildKeySet(validKey), [validKey]);

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

  const handleToggleSquare = useCallback(() => {
    setShowSquare((prev) => {
      const next = !prev;
      announceStatus(next ? '方陣可視化を表示しました' : '方陣可視化を非表示にしました');
      return next;
    });
  }, [announceStatus]);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setPeriod(isNaN(val) || val < 0 ? 0 : val);
  }, []);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        {/* モード選択 */}
        <section aria-labelledby="bifid-mode-heading">
          <h2 id="bifid-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="bifid-mode-group" role="group" aria-label="変換モード">
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
        <section aria-labelledby="bifid-key-heading">
          <h2 id="bifid-key-heading" className="section-title">
            キーワード設定
          </h2>
          <div className="bifid-key-row">
            <input
              type="text"
              className="bifid-key-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="例: KEYWORD"
              aria-label="Bifid暗号のキーワード（英字のみ有効）"
              spellCheck={false}
              maxLength={25}
            />
          </div>
          <div className="bifid-period-row">
            <label htmlFor="bifid-period" className="bifid-period-label">
              周期（0 = 全体処理）:
            </label>
            <input
              type="number"
              id="bifid-period"
              className="bifid-period-input"
              value={period}
              onChange={handlePeriodChange}
              min={0}
              max={100}
              aria-label="Bifid暗号の分割周期（0で全体を一括処理）"
            />
          </div>
        </section>

        {/* テキスト入力 */}
        <section aria-labelledby="bifid-input-heading">
          <h2 id="bifid-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="bifid-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'encode'
                ? '暗号化するテキストを入力（英字のみ有効、J は I に変換）'
                : '復号する暗号文を入力'
            }
            rows={4}
            aria-label="Bifid暗号の入力テキスト"
          />
        </section>

        {/* 変換結果 */}
        <section aria-labelledby="bifid-output-heading">
          <h2 id="bifid-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="bifid-output"
            className={`bifid-output${isEmpty ? ' bifid-output--empty' : ''}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || '（変換結果なし）'}`}
            role="region"
          >
            {isEmpty ? '変換結果がここに表示されます' : output}
          </div>

          <div className="bifid-actions" role="group" aria-label="操作">
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
              onClick={handleToggleSquare}
              aria-label={showSquare ? '方陣可視化を非表示' : '方陣可視化を表示'}
            >
              {showSquare ? '方陣を非表示' : '方陣可視化'}
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

        {/* ポリュビオス方陣可視化 */}
        {showSquare && (
          <section aria-labelledby="bifid-square-heading">
            <h2 id="bifid-square-heading" className="section-title">
              ポリュビオス方陣
            </h2>
            <div className="bifid-square-wrapper">
              <table className="bifid-square" aria-label="Bifid暗号のポリュビオス方陣">
                <thead>
                  <tr>
                    <th scope="col" aria-label="行/列インデックス"></th>
                    {[0, 1, 2, 3, 4].map((c) => (
                      <th key={c} scope="col" aria-label={`列 ${c}`}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={r}>
                      <th scope="row" aria-label={`行 ${r}`}>
                        {r}
                      </th>
                      {row.map((ch, c) => (
                        <td
                          key={c}
                          className={keySet.has(ch) ? 'bifid-square-key' : ''}
                          aria-label={`(${r},${c}): ${ch}${keySet.has(ch) ? '（キー文字）' : ''}`}
                        >
                          {ch}
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
                'キーワードを入力してください（英字のみ有効、J は I と同一視）',
                'エンコード: 平文の各文字を方陣で座標変換し、行列を分離・再結合して暗号化します',
                'デコード: 同じキーワード・周期を指定して元のテキストに戻します',
                '周期: テキストをN文字ずつのブロックに分けて処理します（0で全体一括）',
                '方陣可視化: キーワードで生成されたポリュビオス方陣を確認できます',
              ],
            },
            {
              title: 'Bifid暗号について',
              items: [
                '19世紀末にフェリックス・デラステルが発明した分割転置暗号です',
                'ポリュビオスの方陣で各文字を (行, 列) の座標ペアに変換します',
                'すべての行座標を並べ、続けて列座標を並べ、2つずつ取り出して再変換します',
                '置換と転置を組み合わせることで、単純な暗号より解読困難になります',
                'J は I と同一視され、25文字で5×5の方陣を構成します',
                'CTFや暗号パズルでよく出題される古典暗号の一つです',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
