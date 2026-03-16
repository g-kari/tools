import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { useClipboard } from '~/hooks/useClipboard';
import { useToast } from '~/components/Toast';
import { TipsCard } from '~/components/TipsCard';
import { convertHtmlToJsx } from '~/utils/html-to-jsx';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';

export const Route = createFileRoute('/html-to-jsx')({
  head: () => ({
    meta: [
      { title: 'HTML→JSX変換 | Web ツール集' },
      {
        name: 'description',
        content:
          'HTMLをReact JSXに変換するツール。class→className、style文字列→オブジェクト、イベントハンドラのcamelCase変換、void要素の自己閉じ等に対応。リアルタイム変換。',
      },
      { property: 'og:title', content: 'HTML→JSX変換 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'HTMLをReact JSXに変換するツール。class→className、style文字列→オブジェクト、イベントハンドラのcamelCase変換、void要素の自己閉じ等に対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/html-to-jsx` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
    ],
  }),
  component: HtmlToJsxPage,
});

const SAMPLE_HTML = `<div class="container" onclick="handleClick()">
  <h1 class="title" tabindex="0">Hello World</h1>
  <label for="name-input">名前:</label>
  <input
    type="text"
    id="name-input"
    class="input-field"
    placeholder="名前を入力"
    maxlength="50"
    readonly
  >
  <br>
  <img src="image.png" alt="サンプル画像" class="hero-image">
  <p style="color: red; font-size: 16px; margin-top: 8px">
    <!-- これはコメントです -->
    テキストコンテンツ
  </p>
  <button
    class="btn btn-primary"
    onmouseenter="handleHover()"
    disabled
  >
    送信
  </button>
</div>`;

/**
 * HTML→JSX変換ページコンポーネント
 * HTMLマークアップをReact JSX構文にリアルタイム変換する
 */
function HtmlToJsxPage() {
  const [inputHtml, setInputHtml] = useState('');
  const { copy } = useClipboard();
  const { showToast } = useToast();

  // リアルタイム変換
  const result = useMemo(() => convertHtmlToJsx(inputHtml), [inputHtml]);

  const handleCopyOutput = useCallback(async () => {
    if (!result.output) return;
    const success = await copy(result.output);
    if (success) {
      showToast('JSXをコピーしました', 'success');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [result.output, copy, showToast]);

  const handleClear = useCallback(() => {
    setInputHtml('');
  }, []);

  const handleLoadSample = useCallback(() => {
    setInputHtml(SAMPLE_HTML);
  }, []);

  const hasInput = inputHtml.length > 0;
  const hasOutput = result.output.length > 0;

  return (
    <div className="tool-container">
      <h2 className="section-title">HTML → JSX 変換</h2>

      {/* サンプルボタン */}
      <div className="html-to-jsx-panel-header">
        <button
          type="button"
          className="html-to-jsx-action-btn"
          onClick={handleLoadSample}
          aria-label="サンプルHTMLを読み込む"
        >
          サンプルを読み込む
        </button>
      </div>

      {/* 2カラムグリッド: 入力/出力 */}
      <div className="html-to-jsx-grid">
        {/* 左: HTML入力 */}
        <div className="html-to-jsx-panel">
          <div className="html-to-jsx-panel-header">
            <label htmlFor="html-input" className="html-to-jsx-panel-label">
              HTML 入力
            </label>
            <button
              type="button"
              className="html-to-jsx-action-btn"
              onClick={handleClear}
              disabled={!hasInput}
              aria-label="入力をクリア"
            >
              クリア
            </button>
          </div>
          <textarea
            id="html-input"
            className="html-to-jsx-textarea"
            value={inputHtml}
            onChange={(e) => setInputHtml(e.target.value)}
            placeholder={`<div class="container">\n  <h1 class="title">Hello World</h1>\n  <br>\n  <img src="..." alt="...">\n</div>`}
            aria-label="変換するHTML入力エリア"
            spellCheck={false}
          />
        </div>

        {/* 右: JSX出力 */}
        <div className="html-to-jsx-panel">
          <div className="html-to-jsx-panel-header">
            <span className="html-to-jsx-panel-label">JSX 出力</span>
            <button
              type="button"
              className="html-to-jsx-action-btn"
              onClick={handleCopyOutput}
              disabled={!hasOutput}
              aria-label="JSX出力をコピー"
            >
              コピー
            </button>
          </div>
          <textarea
            className="html-to-jsx-textarea"
            value={result.output}
            readOnly
            placeholder="変換後のJSXがここに表示されます..."
            aria-label="変換後のJSX出力エリア（読み取り専用）"
            aria-readonly="true"
          />
        </div>
      </div>

      {/* 変換内容リスト */}
      {result.changes.length > 0 && (
        <div
          className="html-to-jsx-changes"
          role="status"
          aria-live="polite"
          aria-label="変換内容"
        >
          <h3 className="html-to-jsx-changes-title">変換内容</h3>
          <ul className="html-to-jsx-changes-list">
            {result.changes.map((change) => (
              <li key={change.type} className="html-to-jsx-change-item">
                <span className="html-to-jsx-change-count">{change.count}件</span>
                <span>{change.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TipsCard
        sections={[
          {
            title: '変換される内容',
            items: [
              'class → className（CSSクラス属性の変換）',
              'for → htmlFor（label要素のfor属性）',
              'onclick → onClick、onchange → onChange 等（イベントハンドラのcamelCase変換）',
              'tabindex → tabIndex、readonly → readOnly、maxlength → maxLength 等',
              '<br>、<img>、<input> 等のvoid要素を自己閉じタグに変換（<br />）',
              'HTMLコメント → JSXコメント（<!-- --> → {/* */}）',
            ],
          },
          {
            title: 'style属性の変換',
            items: [
              'style="color: red" → style={{ color: \'red\' }}',
              'CSSプロパティ名をcamelCaseに変換（font-size → fontSize、background-color → backgroundColor）',
              'ベンダープレフィックス（-webkit-、-moz- 等）も正しくcamelCase変換',
              '純粋な数値はクォートなしで出力（zIndex: 10 等）',
            ],
          },
          {
            title: '注意事項',
            items: [
              'このツールは構文的な変換のみ行います。ロジックは変換しません',
              'JSXの式埋め込み（{variable} 等）には対応していません',
              'コンポーネント名の変換（大文字始まり）は行いません',
              '複雑なHTML（テンプレートエンジン構文等）は正確に変換できない場合があります',
            ],
          },
        ]}
      />
    </div>
  );
}
