import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

export const Route = createFileRoute("/text-case")({
  head: () => ({
    meta: [
      { title: "テキストケース変換 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをcamelCase、PascalCase、snake_case、kebab-caseなど様々な命名規則に一括変換するツール",
      },
      {
        property: "og:title",
        content: "テキストケース変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストをcamelCase、PascalCase、snake_case、kebab-caseなど様々な命名規則に一括変換するツール",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/text-case` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TextCaseConverter,
});

/**
 * 入力文字列を単語に分割する
 * camelCase/PascalCase/snake_case/kebab-case/dot.case/スペース区切りに対応
 * @param input 分割する入力文字列
 * @returns 小文字に変換された単語の配列
 */
export function splitIntoWords(input: string): string[] {
  if (!input) return [];
  // camelCase/PascalCaseの境界を識別して分割
  const step1 = input.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  // 区切り文字（_-. スペース）で分割
  const words = step1.split(/[-_.\s]+/).filter(Boolean);
  return words.map((w) => w.toLowerCase());
}

/**
 * 単語配列をcamelCase形式に変換する
 * @param words 変換する単語配列
 * @returns camelCase文字列
 */
export function toCamelCase(words: string[]): string {
  if (words.length === 0) return "";
  return words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join("");
}

/**
 * 単語配列をPascalCase形式に変換する
 * @param words 変換する単語配列
 * @returns PascalCase文字列
 */
export function toPascalCase(words: string[]): string {
  if (words.length === 0) return "";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

/**
 * 単語配列をsnake_case形式に変換する
 * @param words 変換する単語配列
 * @returns snake_case文字列
 */
export function toSnakeCase(words: string[]): string {
  return words.join("_");
}

/**
 * 単語配列をSCREAMING_SNAKE_CASE形式に変換する
 * @param words 変換する単語配列
 * @returns SCREAMING_SNAKE_CASE文字列
 */
export function toScreamingSnakeCase(words: string[]): string {
  return words.join("_").toUpperCase();
}

/**
 * 単語配列をkebab-case形式に変換する
 * @param words 変換する単語配列
 * @returns kebab-case文字列
 */
export function toKebabCase(words: string[]): string {
  return words.join("-");
}

/**
 * 単語配列をCOBOL-CASE形式に変換する
 * @param words 変換する単語配列
 * @returns COBOL-CASE文字列
 */
export function toCobolCase(words: string[]): string {
  return words.join("-").toUpperCase();
}

/**
 * 単語配列をdot.case形式に変換する
 * @param words 変換する単語配列
 * @returns dot.case文字列
 */
export function toDotCase(words: string[]): string {
  return words.join(".");
}

/**
 * 単語配列をTrain-Case形式に変換する
 * @param words 変換する単語配列
 * @returns Train-Case文字列
 */
export function toTrainCase(words: string[]): string {
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}

/**
 * 単語配列をflatcase形式に変換する
 * @param words 変換する単語配列
 * @returns flatcase文字列
 */
export function toFlatCase(words: string[]): string {
  return words.join("");
}

/**
 * 単語配列をUPPERCASE（スペース区切り）形式に変換する
 * @param words 変換する単語配列
 * @returns UPPERCASE文字列
 */
export function toUpperCaseWords(words: string[]): string {
  return words.join(" ").toUpperCase();
}

/**
 * 単語配列をlowercase（スペース区切り）形式に変換する
 * @param words 変換する単語配列
 * @returns lowercase文字列
 */
export function toLowerCaseWords(words: string[]): string {
  return words.join(" ");
}

/**
 * ケース変換結果の型定義
 */
export interface CaseResult {
  /** ラベル名 */
  label: string;
  /** 識別キー */
  key: string;
  /** 変換後の値 */
  value: string;
  /** 使用例 */
  example: string;
}

/**
 * 入力テキストを全てのケース形式に変換する
 * @param input 変換する入力テキスト
 * @returns 全ケース形式の変換結果配列
 */
export function convertAllCases(input: string): CaseResult[] {
  const words = splitIntoWords(input);
  return [
    {
      label: "camelCase",
      key: "camel",
      value: toCamelCase(words),
      example: "helloWorldFoo",
    },
    {
      label: "PascalCase",
      key: "pascal",
      value: toPascalCase(words),
      example: "HelloWorldFoo",
    },
    {
      label: "snake_case",
      key: "snake",
      value: toSnakeCase(words),
      example: "hello_world_foo",
    },
    {
      label: "SCREAMING_SNAKE_CASE",
      key: "screaming",
      value: toScreamingSnakeCase(words),
      example: "HELLO_WORLD_FOO",
    },
    {
      label: "kebab-case",
      key: "kebab",
      value: toKebabCase(words),
      example: "hello-world-foo",
    },
    {
      label: "COBOL-CASE",
      key: "cobol",
      value: toCobolCase(words),
      example: "HELLO-WORLD-FOO",
    },
    {
      label: "dot.case",
      key: "dot",
      value: toDotCase(words),
      example: "hello.world.foo",
    },
    {
      label: "Train-Case",
      key: "train",
      value: toTrainCase(words),
      example: "Hello-World-Foo",
    },
    {
      label: "flatcase",
      key: "flat",
      value: toFlatCase(words),
      example: "helloworldfoo",
    },
    {
      label: "UPPERCASE",
      key: "upper",
      value: toUpperCaseWords(words),
      example: "HELLO WORLD FOO",
    },
    {
      label: "lowercase",
      key: "lower",
      value: toLowerCaseWords(words),
      example: "hello world foo",
    },
  ];
}

/**
 * テキストケース変換コンポーネント
 */
function TextCaseConverter() {
  const [inputText, setInputText] = useState("");
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const results = useMemo(() => convertAllCases(inputText), [inputText]);
  const hasInput = inputText.trim().length > 0;

  const handleCopy = async (value: string, label: string) => {
    if (!value) return;
    const success = await copy(value);
    if (success) {
      showToast(`${label}をコピーしました`, "success");
      announceStatus(`${label}をコピーしました`);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <label htmlFor="text-case-input" className="section-title">
            変換するテキスト
          </label>
          <textarea
            id="text-case-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="helloWorldFoo または hello_world_foo など"
            rows={3}
            aria-describedby="text-case-input-hint"
          />
          <p id="text-case-input-hint" className="text-case-hint">
            入力するとすべての形式に自動変換されます
          </p>
        </div>

        {hasInput ? (
          <div className="text-case-results-grid" role="list" aria-label="変換結果一覧">
            {results.map((result) => (
              <div
                key={result.key}
                className="text-case-result-item"
                role="listitem"
                aria-label={`${result.label}形式: ${result.value}`}
              >
                <div className="text-case-result-header">
                  <span className="text-case-result-label">{result.label}</span>
                  <span className="text-case-result-example">例: {result.example}</span>
                </div>
                <div className="text-case-result-value-wrapper">
                  <code className="text-case-result-value">{result.value || "（入力なし）"}</code>
                </div>
                <div className="text-case-result-footer">
                  <button
                    className="text-case-copy-btn"
                    onClick={() => handleCopy(result.value, result.label)}
                    disabled={!result.value}
                    aria-label={`${result.label}形式の結果をコピー`}
                  >
                    コピー
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-case-empty-state" aria-live="polite">
            <p>テキストを入力すると、変換結果が表示されます</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "変換したいテキストを入力欄に入力します",
                "入力と同時に全ての形式に自動変換されます",
                "各形式の「コピー」ボタンでクリップボードにコピーできます",
                "camelCase、PascalCase、snake_case、kebab-caseなど11種類の形式に対応しています",
              ],
            },
            {
              title: "対応する入力形式",
              items: [
                "camelCase: helloWorldFoo",
                "PascalCase: HelloWorldFoo",
                "snake_case: hello_world_foo",
                "kebab-case: hello-world-foo",
                "dot.case: hello.world.foo",
                "スペース区切り: hello world foo",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
