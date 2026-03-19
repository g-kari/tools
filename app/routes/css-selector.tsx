import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/css-selector")({
  head: () => ({
    meta: [
      { title: "CSS Selectorテスター | Web ツール集" },
      {
        name: "description",
        content:
          "HTMLに対してCSSセレクターをテストし、マッチした要素を確認できるオンラインツール。",
      },
      {
        property: "og:title",
        content: "CSS Selectorテスター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "HTMLに対してCSSセレクターをテストし、マッチした要素を確認できるオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-selector` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Selectorテスター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "HTMLに対してCSSセレクターをテストし、マッチした要素を確認できるオンラインツール。",
      },
    ],
  }),
  component: CssSelectorChecker,
});

/** マッチした要素の情報 */
interface MatchedElement {
  index: number;
  tagName: string;
  id: string;
  classes: string[];
  text: string;
  outerHTML: string;
}

const SAMPLE_HTML = `<div class="container">
  <header id="site-header">
    <h1 class="title">タイトル</h1>
    <nav>
      <a href="/" class="nav-link active">ホーム</a>
      <a href="/about" class="nav-link">About</a>
    </nav>
  </header>
  <main>
    <article class="post featured">
      <h2 class="post-title">記事タイトル</h2>
      <p class="post-body">本文テキストが入ります。</p>
      <span data-tag="news">ニュース</span>
    </article>
    <ul class="list">
      <li class="item">アイテム1</li>
      <li class="item">アイテム2</li>
      <li class="item last">アイテム3</li>
    </ul>
  </main>
</div>`;

const SAMPLE_SELECTORS = [
  { label: "クラス名", value: ".nav-link" },
  { label: "ID", value: "#site-header" },
  { label: "子孫結合子", value: "article p" },
  { label: "属性", value: "[data-tag]" },
  { label: "擬似クラス", value: "li:last-child" },
  { label: "複数セレクター", value: "h1, h2" },
];

/**
 * CSSセレクターでHTML内の要素をテストし、結果を返す
 */
function runCssSelector(
  html: string,
  selector: string
): { elements: MatchedElement[]; error: string | null } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodeList = doc.querySelectorAll(selector);
    const elements = Array.from(nodeList).map((el, i) => ({
      index: i,
      tagName: el.tagName.toLowerCase(),
      id: el.id,
      classes: Array.from(el.classList),
      text: (el.textContent ?? "").trim().slice(0, 120),
      outerHTML: el.outerHTML.slice(0, 300),
    }));
    return { elements, error: null };
  } catch (err) {
    return {
      elements: [],
      error: err instanceof Error ? err.message : "無効なCSSセレクターです",
    };
  }
}

function CssSelectorChecker() {
  const { showToast } = useToast();
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [selector, setSelector] = useState(".nav-link");
  const [result, setResult] = useState<MatchedElement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectorRef = useRef<HTMLInputElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleTest = useCallback(() => {
    if (!selector.trim()) {
      showToast("CSSセレクターを入力してください", "error");
      selectorRef.current?.focus();
      return;
    }
    if (!html.trim()) {
      showToast("HTMLを入力してください", "error");
      return;
    }

    setError(null);
    const { elements, error: selectorError } = runCssSelector(html, selector);
    if (selectorError) {
      setError(selectorError);
      setResult(null);
      announceStatus("エラー: " + selectorError);
    } else {
      setResult(elements);
      announceStatus(
        elements.length > 0
          ? `${elements.length}件の要素が見つかりました`
          : "マッチする要素が見つかりませんでした"
      );
    }
  }, [selector, html, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setHtml("");
    setSelector("");
    setResult(null);
    setError(null);
    announceStatus("クリアしました");
    selectorRef.current?.focus();
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    setHtml(SAMPLE_HTML);
    setSelector(".nav-link");
    setResult(null);
    setError(null);
    announceStatus("サンプルHTMLを読み込みました");
  }, [announceStatus]);

  // Ctrl+Enter でテスト実行
  useKeyboardShortcut("Enter", handleTest, { ctrl: true });

  useEffect(() => {
    selectorRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="CSS Selectorテストフォーム"
        >
          <div className="converter-section">
            <label htmlFor="selectorInput">CSSセレクター</label>
            <input
              type="text"
              id="selectorInput"
              ref={selectorRef}
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="例: .class-name, #id, div > p, [data-attr], li:nth-child(2)"
              aria-describedby="selector-help"
              aria-label="CSSセレクター入力欄"
              autoComplete="off"
              spellCheck="false"
            />
            <span id="selector-help" className="sr-only">
              テストしたいCSSセレクターを入力してください
            </span>
            <div
              className="css-selector-presets"
              role="group"
              aria-label="サンプルセレクター"
            >
              {SAMPLE_SELECTORS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className="css-selector-preset-btn"
                  onClick={() => setSelector(s.value)}
                  aria-label={`${s.label}: ${s.value}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="converter-section">
            <div className="css-selector-html-header">
              <label htmlFor="htmlInput" className="section-title">
                HTML
              </label>
              <button
                type="button"
                className="css-selector-sample-btn"
                onClick={handleLoadSample}
                aria-label="サンプルHTMLを読み込む"
              >
                サンプルを使う
              </button>
            </div>
            <Textarea
              id="htmlInput"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="テスト対象のHTMLを入力してください..."
              aria-describedby="html-input-help"
              aria-label="HTML入力欄"
            />
            <span id="html-input-help" className="sr-only">
              CSSセレクターでテストするHTMLを入力してください
            </span>
          </div>

          <div className="button-group" role="group" aria-label="操作ボタン">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleTest}
              aria-label="CSSセレクターをテスト"
            >
              テスト
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="すべての入力をクリア"
            >
              クリア
            </Button>
          </div>
        </form>

        <ErrorMessage message={error} />

        {result !== null && !error && (
          <section aria-labelledby="result-title">
            <h2 id="result-title" className="section-title">
              テスト結果
            </h2>
            <div className="result-card" aria-live="polite">
              <div className="result-row">
                <div className="result-label">マッチ数</div>
                <div className="result-value">{result.length}件</div>
              </div>
              {result.length > 0 &&
                result.map((el) => (
                  <div key={el.index} className="match-item">
                    <div className="result-row">
                      <div className="result-label">要素 {el.index + 1}</div>
                      <div className="result-value">
                        <code>&lt;{el.tagName}&gt;</code>
                      </div>
                    </div>
                    {el.id && (
                      <div className="result-row">
                        <div className="result-label">ID</div>
                        <div className="result-value">
                          <code>#{el.id}</code>
                        </div>
                      </div>
                    )}
                    {el.classes.length > 0 && (
                      <div className="result-row">
                        <div className="result-label">クラス</div>
                        <div className="result-value">
                          <code>.{el.classes.join(" .")}</code>
                        </div>
                      </div>
                    )}
                    {el.text && (
                      <div className="result-row">
                        <div className="result-label">テキスト</div>
                        <div className="result-value">{el.text}</div>
                      </div>
                    )}
                    <div className="result-row">
                      <div className="result-label">HTML</div>
                      <div className="result-value css-selector-outerhtml">
                        <code>{el.outerHTML}</code>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「CSSセレクター」欄にテストしたいセレクターを入力",
                "「HTML」欄にテスト対象のHTMLを入力（サンプルも使用可）",
                "「テスト」ボタンでマッチした要素を確認",
                "キーボードショートカット: Ctrl+Enter でテスト実行",
                "セレクタープリセットボタンから代表的なセレクターを選択可能",
              ],
            },
            {
              title: "セレクター例",
              items: [
                ".class-name — クラス名でマッチ",
                "#id — IDでマッチ",
                "div p — 子孫結合子（div内のすべてのp）",
                "div > p — 子結合子（divの直接の子のp）",
                "[href] — 属性の存在チェック",
                "[data-type=\"foo\"] — 属性値でマッチ",
                "li:first-child — 擬似クラス",
                "h1, h2, h3 — 複数セレクター（カンマ区切り）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
