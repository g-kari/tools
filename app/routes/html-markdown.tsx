import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { useClipboard } from '~/hooks/useClipboard';
import { useToast } from '~/components/Toast';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { convertHtmlToMarkdown } from '../utils/html-markdown';

export const Route = createFileRoute('/html-markdown')({
  head: () => ({
    meta: [
      { title: 'HTML→Markdown変換 | Web ツール集' },
      {
        name: 'description',
        content:
          'HTMLをMarkdown形式にリアルタイム変換するツール。見出し・リスト・テーブル・コードブロック・リンク・画像など主要なHTML要素に対応。コンテンツ移行やブログ執筆に便利。',
      },
      {
        property: 'og:title',
        content: 'HTML→Markdown変換 | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'HTMLをMarkdown形式にリアルタイム変換するツール。見出し・リスト・テーブル・コードブロック・リンク・画像など主要なHTML要素に対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/html-markdown` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
    ],
  }),
  component: HtmlMarkdownConverter,
});

const SAMPLE_HTML = `<h1>サンプル記事</h1>
<p>これは <strong>HTML → Markdown</strong> 変換のサンプルです。</p>
<h2>特徴</h2>
<ul>
  <li>見出し（h1〜h6）に対応</li>
  <li><em>斜体</em>・<strong>太字</strong>・<del>取り消し線</del>に対応</li>
  <li><a href="https://example.com">リンク</a>の変換に対応</li>
</ul>
<h2>コード例</h2>
<pre><code class="language-typescript">const greeting = "Hello, World!";
console.log(greeting);</code></pre>
<h2>テーブル例</h2>
<table>
  <thead>
    <tr><th>名前</th><th>説明</th></tr>
  </thead>
  <tbody>
    <tr><td>Markdown</td><td>軽量マークアップ言語</td></tr>
    <tr><td>HTML</td><td>ハイパーテキスト記述言語</td></tr>
  </tbody>
</table>`;

/**
 * HTML→Markdown変換コンポーネント
 * HTMLをMarkdown形式にリアルタイム変換する
 */
function HtmlMarkdownConverter() {
  const [inputHtml, setInputHtml] = useState('');
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** リアルタイム変換結果 */
  const outputMarkdown = useMemo(() => {
    if (!inputHtml.trim()) return '';
    try {
      return convertHtmlToMarkdown(inputHtml);
    } catch {
      return '';
    }
  }, [inputHtml]);

  const handleCopy = async () => {
    if (!outputMarkdown) return;
    const success = await copy(outputMarkdown);
    if (success) {
      showToast('変換結果をコピーしました', 'success');
      announceStatus('変換結果をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  };

  const handleClear = () => {
    setInputHtml('');
    announceStatus('入力内容をクリアしました');
  };

  const handleLoadSample = () => {
    setInputHtml(SAMPLE_HTML);
    announceStatus('サンプルHTMLを読み込みました');
  };

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">HTML → Markdown 変換</h2>

        {/* アクションボタン（上部） */}
        <div className="html-markdown-top-actions">
          <Button
            variant="outline"
            onClick={handleLoadSample}
            aria-label="サンプルHTMLを読み込む"
          >
            サンプルを読み込む
          </Button>
        </div>

        {/* 入力・出力エリア */}
        <div className="html-markdown-panels">
          {/* 入力エリア */}
          <div className="html-markdown-panel">
            <label htmlFor="html-markdown-input" className="section-title">
              HTML 入力
            </label>
            <Textarea
              id="html-markdown-input"
              value={inputHtml}
              onChange={(e) => setInputHtml(e.target.value)}
              placeholder="変換するHTMLを入力してください..."
              rows={20}
              aria-describedby="html-markdown-input-hint"
              className="html-markdown-textarea"
            />
            <p id="html-markdown-input-hint" className="html-markdown-hint">
              HTMLを入力するとMarkdownに自動変換されます
            </p>
          </div>

          {/* 出力エリア */}
          <div className="html-markdown-panel">
            <label htmlFor="html-markdown-output" className="section-title">
              Markdown 出力
            </label>
            <Textarea
              id="html-markdown-output"
              value={outputMarkdown}
              readOnly
              rows={20}
              placeholder="変換結果がここに表示されます"
              aria-live="polite"
              aria-label={`Markdown出力: ${outputMarkdown || '（変換結果なし）'}`}
              className="html-markdown-textarea"
            />
          </div>
        </div>

        {/* アクションボタン（下部） */}
        <div className="html-markdown-actions">
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={!outputMarkdown}
            aria-label="変換結果をクリップボードにコピー"
          >
            コピー
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!inputHtml}
            aria-label="入力内容をクリア"
          >
            クリア
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'HTMLを入力するとMarkdownに自動変換されます',
                '「サンプルを読み込む」で変換例を確認できます',
                '「コピー」ボタンで変換結果をクリップボードにコピーできます',
              ],
            },
            {
              title: '対応するHTML要素',
              items: [
                '見出し: <h1>〜<h6> → # 〜 ######',
                '段落: <p> → 改行区切りのテキスト',
                '太字・斜体: <strong>/<b> → **text**、<em>/<i> → *text*',
                '取り消し線: <del>/<s> → ~~text~~',
                'リンク: <a href="..."> → [text](url)',
                '画像: <img src="..." alt="..."> → ![alt](url)',
                'コードブロック: <pre><code> → ``` ... ```（言語ハイライト対応）',
                'インラインコード: <code> → `text`',
                'リスト: <ul>/<ol>/<li>（ネスト対応）',
                'テーブル: <table>/<thead>/<tbody>/<tr>/<th>/<td>',
                'blockquote: <blockquote> → > text',
                '水平線: <hr> → ---',
              ],
            },
            {
              title: '活用例',
              items: [
                'WordPressやCMSからコンテンツをMarkdownに移行',
                'ウェブページのコンテンツをREADMEやドキュメントに変換',
                'メールや文書のHTMLをMarkdownに変換してGitHubで管理',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
