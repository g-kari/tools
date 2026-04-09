import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/fancy-text")({
  head: () => ({
    meta: [
      { title: "ファンシーテキスト変換 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストを Unicode の特殊文字スタイルに変換します。太字・筆記体・等幅・丸囲みなど 11 種類のスタイルをワンクリックでコピーできます。",
      },
      {
        property: "og:title",
        content: "ファンシーテキスト変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストを Unicode 特殊文字スタイルに変換。太字・筆記体・等幅・丸囲みなど 11 種類。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/fancy-text` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ファンシーテキスト変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "テキストを Unicode 特殊文字スタイルに変換。11 種類のスタイル対応。",
      },
    ],
  }),
  component: FancyTextConverter,
});

/** Unicode 変換マップを適用する */
function applyMap(text: string, upper: readonly string[], lower: readonly string[]): string {
  return Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return upper[code - 65];
      if (code >= 97 && code <= 122) return lower[code - 97];
      return ch;
    })
    .join("");
}

/** 数学記号ブロックの変換マップを生成する（例外なしのスタイル用） */
function mathMap(capBase: number, smallBase: number): (text: string) => string {
  const upper = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(capBase + i));
  const lower = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(smallBase + i));
  return (text: string) => applyMap(text, upper, lower);
}

// 二重線（黒板太字）の大文字は例外があるため個別に定義
const DOUBLE_STRUCK_UPPER = Array.from("𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ");
const DOUBLE_STRUCK_LOWER = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1d552 + i));

// スモールキャップス（A-Z に対応した小型大文字）
const SMALL_CAPS_CHARS = Array.from("ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ");

// 上下反転マップ（変換後に文字列を逆順にする）
const UPSIDE_DOWN_MAP: Readonly<Record<string, string>> = {
  a: "ɐ",
  b: "q",
  c: "ɔ",
  d: "p",
  e: "ǝ",
  f: "ɟ",
  g: "ƃ",
  h: "ɥ",
  i: "ı",
  j: "ɾ",
  k: "ʞ",
  l: "l",
  m: "ɯ",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "ɹ",
  s: "s",
  t: "ʇ",
  u: "n",
  v: "ʌ",
  w: "ʍ",
  x: "x",
  y: "ʎ",
  z: "z",
  A: "∀",
  B: "ᗺ",
  C: "Ɔ",
  D: "ᗡ",
  E: "Ǝ",
  F: "Ⅎ",
  G: "פ",
  H: "H",
  I: "I",
  J: "ɾ",
  K: "ʞ",
  L: "⅂",
  M: "W",
  N: "N",
  O: "O",
  P: "Ԁ",
  Q: "Ό",
  R: "ɹ",
  S: "S",
  T: "⊥",
  U: "∩",
  V: "Λ",
  W: "M",
  X: "X",
  Y: "ʎ",
  Z: "Z",
  "0": "0",
  "1": "ı",
  "2": "ᄅ",
  "3": "Ɛ",
  "4": "ㄣ",
  "5": "ϛ",
  "6": "9",
  "7": "L",
  "8": "8",
  "9": "6",
  "!": "¡",
  "?": "¿",
  ".": "˙",
  ",": "'",
  "(": ")",
  ")": "(",
};

/** ファンシースタイル定義 */
export interface FancyStyle {
  id: string;
  name: string;
  description: string;
  convert: (text: string) => string;
}

/** 利用可能なファンシースタイル一覧 */
export const FANCY_STYLES: readonly FancyStyle[] = [
  {
    id: "bold",
    name: "𝐁𝐨𝐥𝐝 太字",
    description: "数学用太字（Mathematical Bold）",
    convert: mathMap(0x1d400, 0x1d41a),
  },
  {
    id: "bold-italic",
    name: "𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄 太字斜体",
    description: "数学用太字斜体（Mathematical Bold Italic）",
    convert: mathMap(0x1d468, 0x1d482),
  },
  {
    id: "bold-script",
    name: "𝓑𝓸𝓵𝓭 𝓢𝓬𝓻𝓲𝓹𝓽 筆記体",
    description: "数学用太字筆記体（Mathematical Bold Script）",
    convert: mathMap(0x1d4d0, 0x1d4ea),
  },
  {
    id: "monospace",
    name: "𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎 等幅",
    description: "数学用等幅（Mathematical Monospace）",
    convert: mathMap(0x1d670, 0x1d68a),
  },
  {
    id: "sans-bold",
    name: "𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱 サンセリフ太字",
    description: "数学用サンセリフ太字（Mathematical Sans-Serif Bold）",
    convert: mathMap(0x1d5d4, 0x1d5ee),
  },
  {
    id: "sans-bold-italic",
    name: "𝙎𝙖𝙣𝙨 𝙄𝙩𝙖𝙡𝙞𝙘 サンセリフ太字斜体",
    description: "数学用サンセリフ太字斜体（Mathematical Sans-Serif Bold Italic）",
    convert: mathMap(0x1d63c, 0x1d656),
  },
  {
    id: "double-struck",
    name: "𝔻𝕠𝕦𝕓𝕝𝕖 二重線",
    description: "黒板太字（Mathematical Double-Struck）",
    convert: (text) => applyMap(text, DOUBLE_STRUCK_UPPER, DOUBLE_STRUCK_LOWER),
  },
  {
    id: "circled",
    name: "Ⓒⓘⓡⓒⓛⓔⓓ 丸囲み",
    description: "Unicode 丸囲みラテン文字（Enclosed Alphanumerics）",
    convert: mathMap(0x24b6, 0x24d0),
  },
  {
    id: "small-caps",
    name: "Sᴍᴀʟʟ Cᴀᴘs スモールキャップス",
    description: "小型大文字（Unicode Small Capitals）",
    convert: (text) => applyMap(text, SMALL_CAPS_CHARS, SMALL_CAPS_CHARS),
  },
  {
    id: "strikethrough",
    name: "S̶t̶r̶i̶k̶e̶ 取り消し線",
    description: "Unicode 結合文字 U+0336 による取り消し線",
    convert: (text) =>
      Array.from(text)
        .map((ch) => (ch.trim() ? ch + "\u0336" : ch))
        .join(""),
  },
  {
    id: "upside-down",
    name: "uʍop ǝpısdn 逆さま",
    description: "文字を上下反転して逆順に並べる",
    convert: (text) =>
      Array.from(text)
        .map((ch) => UPSIDE_DOWN_MAP[ch] ?? ch)
        .reverse()
        .join(""),
  },
];

const SAMPLE_TEXTS = [
  { label: "英文", text: "Hello World" },
  { label: "プログラミング", text: "const foo = 'bar'" },
  { label: "SNS 投稿向け", text: "Follow me on Twitter" },
  { label: "アルファベット", text: "The quick brown fox" },
];

/**
 * ファンシーテキスト変換コンポーネント
 */
function FancyTextConverter() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const [input, setInput] = useState("Hello World");

  const results = useMemo(
    () =>
      FANCY_STYLES.map((style) => ({
        style,
        output: style.convert(input),
      })),
    [input],
  );

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast, announceStatus],
  );

  const handleSample = useCallback(
    (text: string) => {
      setInput(text);
      announceStatus("サンプルテキストを設定しました");
    },
    [announceStatus],
  );

  return (
    <>
      <div className="tool-container">
        {/* サンプルボタン */}
        <div className="fancy-text-samples" role="group" aria-label="サンプルテキスト選択">
          <span className="fancy-text-samples-label">サンプル：</span>
          {SAMPLE_TEXTS.map(({ label, text }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="fancy-text-sample-btn"
              onClick={() => handleSample(text)}
              aria-label={`サンプル「${label}」を入力`}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* テキスト入力 */}
        <div className="fancy-text-input-section">
          <label htmlFor="fancy-text-input" className="fancy-text-input-label">
            変換するテキストを入力
          </label>
          <input
            id="fancy-text-input"
            type="text"
            className="fancy-text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="テキストを入力してください（英字対応）..."
            aria-label="変換対象のテキスト"
            aria-describedby="fancy-text-input-help"
          />
          <span id="fancy-text-input-help" className="sr-only">
            英字を入力すると自動的に各スタイルに変換します。日本語・数字・記号はそのまま出力されます。
          </span>
        </div>

        {/* スタイル一覧 */}
        {input && (
          <div className="fancy-text-grid" aria-live="polite" aria-label="変換結果一覧">
            {results.map(({ style, output }) => (
              <div
                key={style.id}
                className="fancy-text-card"
                aria-label={`${style.name}スタイルの変換結果`}
              >
                <div className="fancy-text-card-header">
                  <span className="fancy-text-card-name">{style.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="fancy-text-copy-btn"
                    onClick={() => handleCopy(output, style.name)}
                    aria-label={`${style.name}をコピー`}
                    disabled={!output}
                  >
                    コピー
                  </Button>
                </div>
                <p className="fancy-text-card-desc">{style.description}</p>
                <div
                  className="fancy-text-card-output"
                  aria-label={`${style.name}変換結果: ${output}`}
                >
                  {output || <span className="fancy-text-empty">—</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "ファンシーテキストとは",
              items: [
                "Unicode に収録された数学用記号・装飾文字ブロックを使ったテキスト変換です",
                "フォントを変えているわけではなく、実際に異なる Unicode コードポイントの文字です",
                "SNS・チャット・プロフィールなど、書式変更できない場所でのテキスト装飾に便利です",
                "スクリーンリーダーで正しく読み上げられない場合があるため、アクセシビリティに注意してください",
              ],
            },
            {
              title: "スタイル解説",
              items: [
                "太字・斜体系：Unicode 数学記号ブロック（U+1D400〜）を使用",
                "二重線（黒板太字）：数学でよく使われる ℝ、ℂ、ℕ などの拡張",
                "丸囲み：Unicode の「エンクロージドアルファベット」ブロック（U+24B6〜）",
                "スモールキャップス：IPA 発音記号などを流用した小型大文字",
                "取り消し線：Unicode 結合文字（U+0336）を各文字に追加",
                "逆さま：専用の反転文字に置換し、文字列を逆順に並べます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
