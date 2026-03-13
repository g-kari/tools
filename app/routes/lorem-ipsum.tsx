import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";

export const Route = createFileRoute("/lorem-ipsum")({
  head: () => ({
    meta: [
      { title: "Lorem Ipsum生成 | Web ツール集" },
      {
        name: "description",
        content:
          "Lorem Ipsumダミーテキストを生成します。段落数・単語数・文数での生成、日本語ダミーテキスト、HTMLタグ付き出力に対応しています。",
      },
      { property: "og:title", content: "Lorem Ipsum生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "Lorem Ipsumダミーテキストを生成します。段落数・単語数・文数での生成、日本語ダミーテキスト、HTMLタグ付き出力に対応しています。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/lorem-ipsum` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Lorem Ipsum生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "Lorem Ipsumダミーテキストを生成します。段落数・単語数・文数での生成、日本語ダミーテキスト、HTMLタグ付き出力に対応しています。",
      },
    ],
  }),
  component: LoremIpsumPage,
});

/** 生成モードの型 */
export type GenerateMode = "paragraphs" | "words" | "sentences";

/** 言語の型 */
export type Language = "latin" | "japanese";

/** Lorem Ipsum生成オプション */
export interface LoremIpsumOptions {
  /** 生成モード */
  mode: GenerateMode;
  /** 段落数（modeがparagraphsの場合） */
  paragraphCount: number;
  /** 単語数（modeがwordsの場合） */
  wordCount: number;
  /** 文数（modeがsentencesの場合） */
  sentenceCount: number;
  /** 言語 */
  language: Language;
  /** HTMLタグで囲むかどうか */
  wrapHtml: boolean;
  /** 先頭を "Lorem ipsum dolor sit amet..." で始めるかどうか（ラテン語のみ） */
  startWithLorem: boolean;
}

/** ラテン語ワードリスト */
const LATIN_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
  "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
  "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
  "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in",
  "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat", "nulla",
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
  "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
  "est", "laborum", "perspiciatis", "unde", "omnis", "iste", "natus",
  "accusantium", "doloremque", "laudantium", "totam", "rem", "aperiam",
  "eaque", "ipsa", "ab", "illo", "inventore", "veritatis", "architecto",
  "beatae", "vitae", "dicta", "explicabo", "nemo", "ipsam", "quia",
  "voluptas", "aspernatur", "odit", "fugit", "consequuntur", "magni",
  "dolores", "ratione", "sequi", "nesciunt", "neque", "porro",
];

/** 日本語ダミーテキストワードリスト */
const JAPANESE_WORDS = [
  "吾輩", "猫", "名前", "まだ", "ない", "どこで", "生まれた", "見当",
  "がつかぬ", "薄暗い", "じめじめ", "した", "所", "ニャーニャー", "泣いていた",
  "いう", "事", "だけ", "記憶している", "吾輩はここで", "始めて", "人間",
  "というものを", "見た", "しかも", "あとで", "聞くと", "それは", "書生",
  "という", "人間中で", "一番", "獰悪な", "種族", "であった", "この書生",
  "というのは", "時々", "我々を", "捕えて", "煮て食う", "という話", "である",
  "しかし", "その時", "別に", "恐しいという", "感じは", "しなかった",
  "ただ", "彼の", "掌に", "載せられて", "ふわりと", "した時", "何だか",
  "ふわふわ", "した感じが", "あった", "ばかり", "であった", "掌の上",
  "少し", "落ちついて", "書生の顔を", "見た", "何だか", "非常に大きな",
  "もので", "あるという", "感じが", "した", "第一", "毛を以て", "装飾",
  "されべき", "はず", "顔が", "つるつる", "して", "まるで", "薬缶",
  "後", "わかった", "事", "人間", "顔の一部", "毎日", "顔の表面",
  "剃り取って", "いるのか", "それとも", "元来", "そういう", "もの",
];

/**
 * ランダムな整数を生成する（min以上max以下）
 * @param min - 最小値
 * @param max - 最大値
 * @returns ランダムな整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 配列からランダムな要素を取得する
 * @param arr - 配列
 * @returns ランダムな要素
 */
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * ラテン語の段落を生成する
 * @param sentenceCount - 文数（省略時はランダム 3〜7文）
 * @returns 生成されたラテン語段落
 */
export function generateLatinParagraph(sentenceCount?: number): string {
  const numSentences = sentenceCount ?? randomInt(3, 7);
  const sentences: string[] = [];

  for (let i = 0; i < numSentences; i++) {
    const numWords = randomInt(8, 15);
    const words: string[] = [];
    for (let j = 0; j < numWords; j++) {
      words.push(randomElement(LATIN_WORDS));
    }
    const sentence = words.join(" ");
    sentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".");
  }

  return sentences.join(" ");
}

/**
 * 日本語ダミーテキストの段落を生成する
 * @param sentenceCount - 文数（省略時はランダム 3〜7文）
 * @returns 生成された日本語ダミーテキスト段落
 */
export function generateJapaneseParagraph(sentenceCount?: number): string {
  const numSentences = sentenceCount ?? randomInt(3, 7);
  const sentences: string[] = [];

  for (let i = 0; i < numSentences; i++) {
    const numWords = randomInt(5, 12);
    const words: string[] = [];
    for (let j = 0; j < numWords; j++) {
      words.push(randomElement(JAPANESE_WORDS));
    }
    sentences.push(words.join("") + "。");
  }

  return sentences.join("");
}

/**
 * 段落配列をHTMLタグで囲む
 * @param paragraphs - 段落の配列
 * @returns HTMLタグで囲まれたテキスト
 */
export function wrapWithHtmlTags(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
}

/**
 * Lorem Ipsumテキストを生成する
 * @param options - 生成オプション
 * @returns 生成されたテキスト
 */
export function generateLoremIpsum(options: LoremIpsumOptions): string {
  const {
    mode,
    paragraphCount,
    wordCount,
    sentenceCount,
    language,
    wrapHtml,
    startWithLorem,
  } = options;

  const isLatin = language === "latin";
  const paragraphFn = isLatin ? generateLatinParagraph : generateJapaneseParagraph;

  let paragraphs: string[] = [];

  if (mode === "paragraphs") {
    paragraphs = Array.from({ length: paragraphCount }, () => paragraphFn());
  } else if (mode === "words") {
    // 指定単語数になるまで段落を生成
    const words = isLatin ? LATIN_WORDS : JAPANESE_WORDS;
    const generatedWords: string[] = [];
    while (generatedWords.length < wordCount) {
      generatedWords.push(randomElement(words));
    }
    const trimmed = generatedWords.slice(0, wordCount);
    const text = isLatin
      ? trimmed.join(" ") + "."
      : trimmed.join("") + "。";
    paragraphs = [text.charAt(0).toUpperCase() + text.slice(1)];
  } else if (mode === "sentences") {
    // 指定文数の段落を生成
    const sentencesPerParagraph = Math.max(1, Math.ceil(sentenceCount / 3));
    let totalSentences = 0;
    while (totalSentences < sentenceCount) {
      const remaining = sentenceCount - totalSentences;
      const count = Math.min(sentencesPerParagraph, remaining);
      paragraphs.push(paragraphFn(count));
      totalSentences += count;
    }
  }

  // 先頭固定（ラテン語のみ）
  if (startWithLorem && isLatin && paragraphs.length > 0) {
    const loremStart =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
    const rest = paragraphs[0]
      .replace(/^[A-Z]/, "")
      .trim();
    paragraphs[0] = loremStart + (rest ? " " + rest : "");
  }

  if (wrapHtml) {
    return wrapWithHtmlTags(paragraphs);
  }

  return paragraphs.join("\n\n");
}

/** Lorem Ipsumページコンポーネント */
function LoremIpsumPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<GenerateMode>("paragraphs");
  const [paragraphCount, setParagraphCount] = useState(3);
  const [wordCount, setWordCount] = useState(100);
  const [sentenceCount, setSentenceCount] = useState(10);
  const [language, setLanguage] = useState<Language>("latin");
  const [wrapHtml, setWrapHtml] = useState(false);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    const result = generateLoremIpsum({
      mode,
      paragraphCount,
      wordCount,
      sentenceCount,
      language,
      wrapHtml,
      startWithLorem,
    });
    setOutput(result);
  };

  const handleCopy = async () => {
    if (!output) {
      showToast("コピーするテキストがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      showToast("クリップボードにコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  };

  return (
    <div className="tool-container">
      <div className="converter-section">
        <h2 className="section-title">生成設定</h2>

        <div className="lorem-ipsum-settings">
          {/* 生成モード */}
          <div className="lorem-ipsum-field">
            <label htmlFor="lorem-mode" className="lorem-ipsum-label">
              生成モード
            </label>
            <select
              id="lorem-mode"
              className="lorem-ipsum-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as GenerateMode)}
              aria-label="生成モードを選択"
            >
              <option value="paragraphs">段落</option>
              <option value="words">単語数</option>
              <option value="sentences">文数</option>
            </select>
          </div>

          {/* 段落数 */}
          {mode === "paragraphs" && (
            <div className="lorem-ipsum-field">
              <label htmlFor="lorem-paragraph-count" className="lorem-ipsum-label">
                段落数（1〜20）
              </label>
              <input
                id="lorem-paragraph-count"
                type="number"
                className="lorem-ipsum-input"
                min={1}
                max={20}
                value={paragraphCount}
                onChange={(e) =>
                  setParagraphCount(
                    Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                aria-label="段落数"
              />
            </div>
          )}

          {/* 単語数 */}
          {mode === "words" && (
            <div className="lorem-ipsum-field">
              <label htmlFor="lorem-word-count" className="lorem-ipsum-label">
                単語数
              </label>
              <input
                id="lorem-word-count"
                type="number"
                className="lorem-ipsum-input"
                min={1}
                max={10000}
                value={wordCount}
                onChange={(e) =>
                  setWordCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                aria-label="単語数"
              />
            </div>
          )}

          {/* 文数 */}
          {mode === "sentences" && (
            <div className="lorem-ipsum-field">
              <label htmlFor="lorem-sentence-count" className="lorem-ipsum-label">
                文数
              </label>
              <input
                id="lorem-sentence-count"
                type="number"
                className="lorem-ipsum-input"
                min={1}
                max={1000}
                value={sentenceCount}
                onChange={(e) =>
                  setSentenceCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                aria-label="文数"
              />
            </div>
          )}

          {/* 言語 */}
          <div className="lorem-ipsum-field">
            <label htmlFor="lorem-language" className="lorem-ipsum-label">
              言語
            </label>
            <select
              id="lorem-language"
              className="lorem-ipsum-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="言語を選択"
            >
              <option value="latin">ラテン語（Lorem Ipsum）</option>
              <option value="japanese">日本語ダミーテキスト</option>
            </select>
          </div>

          {/* オプション */}
          <div className="lorem-ipsum-options" role="group" aria-label="出力オプション">
            <label className="lorem-ipsum-checkbox-label">
              <input
                type="checkbox"
                className="lorem-ipsum-checkbox"
                checked={wrapHtml}
                onChange={(e) => setWrapHtml(e.target.checked)}
                aria-label="HTMLタグ付き出力（pタグ）"
              />
              <span>HTMLタグ付き出力（&lt;p&gt;タグ）</span>
            </label>

            {language === "latin" && (
              <label className="lorem-ipsum-checkbox-label">
                <input
                  type="checkbox"
                  className="lorem-ipsum-checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem(e.target.checked)}
                  aria-label="先頭をLorem ipsum dolor sit amet...で始める"
                />
                <span>先頭を「Lorem ipsum dolor sit amet...」で始める</span>
              </label>
            )}
          </div>
        </div>

        <div className="lorem-ipsum-actions">
          <button
            type="button"
            className="btn-primary lorem-ipsum-generate-btn"
            onClick={handleGenerate}
            aria-label="Lorem Ipsumテキストを生成"
          >
            生成
          </button>
        </div>
      </div>

      {/* 出力エリア */}
      <div className="converter-section">
        <div className="lorem-ipsum-output-header">
          <h2 className="section-title">出力</h2>
          <button
            type="button"
            className="btn-secondary lorem-ipsum-copy-btn"
            onClick={handleCopy}
            disabled={!output}
            aria-label="テキストをクリップボードにコピー"
          >
            コピー
          </button>
        </div>
        <textarea
          className="lorem-ipsum-output-area"
          value={output}
          readOnly
          placeholder="生成ボタンを押すとここにテキストが表示されます..."
          aria-label="生成されたLorem Ipsumテキスト"
          aria-live="polite"
          rows={15}
        />
      </div>
    </div>
  );
}
