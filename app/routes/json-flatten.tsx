import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { flattenJsonString, unflattenJsonString } from "../utils/json-flatten";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/json-flatten")({
  head: () => ({
    meta: [
      { title: "JSONフラット化 | Web ツール集" },
      {
        name: "description",
        content:
          "ネストされたJSONをフラットなキー構造に変換・復元するオンラインツール。区切り文字・配列処理・最大深さを設定可能。",
      },
      { property: "og:title", content: "JSONフラット化 | Web ツール集" },
      {
        property: "og:description",
        content:
          "ネストされたJSONをフラットなキー構造に変換・復元するオンラインツール。区切り文字・配列処理・最大深さを設定可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-flatten` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JSONフラット化 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ネストされたJSONをフラットなキー構造に変換・復元するオンラインツール。区切り文字・配列処理・最大深さを設定可能。",
      },
    ],
  }),
  component: JsonFlattenPage,
});

const SAMPLE_NESTED = `{
  "user": {
    "name": "田中太郎",
    "age": 30,
    "address": {
      "city": "東京",
      "zip": "100-0001"
    },
    "hobbies": ["読書", "プログラミング"]
  },
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false
    }
  }
}`;

const SAMPLE_FLAT = `{
  "user.name": "田中太郎",
  "user.age": 30,
  "user.address.city": "東京",
  "user.address.zip": "100-0001",
  "user.hobbies.0": "読書",
  "user.hobbies.1": "プログラミング",
  "settings.theme": "dark",
  "settings.notifications.email": true,
  "settings.notifications.push": false
}`;

/** 区切り文字の選択肢 */
const DELIMITER_OPTIONS = [
  { value: ".", label: "ドット ( . )" },
  { value: "/", label: "スラッシュ ( / )" },
  { value: "_", label: "アンダースコア ( _ )" },
  { value: "__", label: "ダブルアンダースコア ( __ )" },
  { value: "-", label: "ハイフン ( - )" },
  { value: ":", label: "コロン ( : )" },
];

/** 処理モード */
type Mode = "flatten" | "unflatten";

function JsonFlattenPage() {
  const [mode, setMode] = useState<Mode>("flatten");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState(".");
  const [flattenArrays, setFlattenArrays] = useState(true);
  const [maxDepth, setMaxDepth] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleConvert = useCallback(() => {
    if (!inputText.trim()) {
      setError("JSONを入力してください");
      announceStatus("エラー: JSONを入力してください");
      showToast("JSONを入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    try {
      let result: string;
      if (mode === "flatten") {
        result = flattenJsonString(inputText, {
          delimiter,
          flattenArrays,
          maxDepth,
        });
        announceStatus("JSONのフラット化が完了しました");
        showToast("JSONをフラット化しました", "success");
      } else {
        result = unflattenJsonString(inputText, { delimiter });
        announceStatus("JSONのアンフラット化が完了しました");
        showToast("JSONをアンフラット化しました", "success");
      }
      setOutputText(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "変換に失敗しました";
      setError(message);
      setOutputText("");
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, mode, delimiter, flattenArrays, maxDepth, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setError(null);
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    const sample = mode === "flatten" ? SAMPLE_NESTED : SAMPLE_FLAT;
    setInputText(sample);
    setOutputText("");
    setError(null);
    announceStatus("サンプルデータを読み込みました");
  }, [mode, announceStatus]);

  const handleCopyOutput = useCallback(async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      showToast("クリップボードにコピーしました", "success");
      announceStatus("出力をクリップボードにコピーしました");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, showToast, announceStatus]);

  useKeyboardShortcut("Enter", handleConvert, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        {/* モード切り替え */}
        <div className="button-group" role="group" aria-label="変換モード選択">
          <Button
            type="button"
            className={mode === "flatten" ? "btn-primary" : "btn-secondary"}
            onClick={() => {
              setMode("flatten");
              setInputText("");
              setOutputText("");
              setError(null);
            }}
            aria-pressed={mode === "flatten"}
          >
            フラット化
          </Button>
          <Button
            type="button"
            className={mode === "unflatten" ? "btn-primary" : "btn-secondary"}
            onClick={() => {
              setMode("unflatten");
              setInputText("");
              setOutputText("");
              setError(null);
            }}
            aria-pressed={mode === "unflatten"}
          >
            アンフラット化
          </Button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} aria-label="JSONフラット化フォーム">
          {/* オプション設定 */}
          <div className="converter-section">
            <fieldset className="options-fieldset">
              <legend className="section-title">オプション</legend>
              <div className="options-grid">
                {/* 区切り文字 */}
                <div className="option-item">
                  <label htmlFor="delimiter" className="option-label">
                    区切り文字
                  </label>
                  <select
                    id="delimiter"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="option-select"
                    aria-label="キーの区切り文字を選択"
                  >
                    {DELIMITER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 配列フラット化（フラット化モードのみ） */}
                {mode === "flatten" && (
                  <>
                    <div className="option-item">
                      <label className="option-label option-checkbox-label">
                        <input
                          type="checkbox"
                          checked={flattenArrays}
                          onChange={(e) => setFlattenArrays(e.target.checked)}
                          className="option-checkbox"
                          aria-label="配列もフラット化する"
                        />
                        配列をフラット化
                      </label>
                    </div>

                    <div className="option-item">
                      <label htmlFor="maxDepth" className="option-label">
                        最大深さ（0=無制限）
                      </label>
                      <input
                        id="maxDepth"
                        type="number"
                        min={0}
                        max={20}
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(Math.max(0, Number(e.target.value)))}
                        className="option-input-number"
                        aria-label="フラット化する最大深さ（0は無制限）"
                      />
                    </div>
                  </>
                )}
              </div>
            </fieldset>
          </div>

          {/* 入力エリア */}
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              {mode === "flatten" ? "入力 JSON（ネストあり）" : "入力 JSON（フラット）"}
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "flatten"
                  ? 'ネストされたJSONを入力してください...\n例: {"user": {"name": "太郎", "age": 30}}'
                  : 'フラットなJSONを入力してください...\n例: {"user.name": "太郎", "user.age": 30}'
              }
              aria-describedby="input-help"
              aria-label={mode === "flatten" ? "ネストされたJSON入力欄" : "フラットなJSON入力欄"}
            />
            <span id="input-help" className="sr-only">
              {mode === "flatten"
                ? "ネストされたJSONを入力してフラット化できます"
                : "フラットなJSONを入力してネスト化できます"}
            </span>
          </div>

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleConvert}
              aria-label={mode === "flatten" ? "JSONをフラット化" : "JSONをアンフラット化"}
            >
              {mode === "flatten" ? "フラット化" : "アンフラット化"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleLoadSample}
              aria-label="サンプルデータを読み込む"
            >
              サンプル
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          <ErrorMessage message={error} />

          {/* 出力エリア */}
          <div className="output-section">
            <div className="output-header">
              <label htmlFor="outputText" className="section-title">
                {mode === "flatten" ? "出力 JSON（フラット）" : "出力 JSON（ネストあり）"}
              </label>
              {outputText && (
                <Button
                  type="button"
                  variant="outline"
                  className="btn-copy-small"
                  onClick={handleCopyOutput}
                  aria-label="出力をクリップボードにコピー"
                >
                  コピー
                </Button>
              )}
            </div>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              placeholder="変換結果がここに表示されます..."
              aria-label="変換結果の出力欄"
              aria-live="polite"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "フラット化とは",
              items: [
                "ネストされたJSONを「親キー.子キー」形式のフラットな構造に変換します",
                '例: {"user":{"name":"太郎"}} → {"user.name":"太郎"}',
                "配列は数値インデックスキーでフラット化されます",
                '例: {"tags":["a","b"]} → {"tags.0":"a","tags.1":"b"}',
              ],
            },
            {
              title: "使い方",
              items: [
                "「フラット化」モード: ネストされたJSONを入力してフラット化",
                "「アンフラット化」モード: フラットなJSONを入力してネスト化",
                "区切り文字を変更するとキーの結合文字を切り替えられます",
                "最大深さを設定すると指定レベルまでフラット化を制限できます",
                "キーボードショートカット: Ctrl+Enter で変換実行",
              ],
            },
            {
              title: "活用例",
              items: [
                "設定ファイルのフラット化（環境変数への変換）",
                "多言語ファイル（i18n）のキー一覧確認",
                "データベースのフラットな列構造とJSONの相互変換",
                "APIレスポンスの深いネスト構造の解析",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
