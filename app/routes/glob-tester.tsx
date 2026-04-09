import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { TipsCard } from "~/components/TipsCard";
import { matchGlobPatterns } from "../utils/glob-tester";
import "../styles/tools/glob-tester.css";

export const Route = createFileRoute("/glob-tester")({
  head: () => ({
    meta: [
      { title: "Glob パターンテスター | Web ツール集" },
      {
        name: "description",
        content:
          "globパターンをリアルタイムでテストするツール。*, **, ?, [abc], {a,b}, !（否定）に対応。.gitignore・webpack・vite設定のパターン検証に。",
      },
      { property: "og:title", content: "Glob パターンテスター | Web ツール集" },
      {
        property: "og:description",
        content: "globパターンをリアルタイムでテスト。*, **, ?, {a,b}, 否定パターンに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/glob-tester` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Glob パターンテスター | Web ツール集" },
      {
        name: "twitter:description",
        content: "globパターンをリアルタイムでテスト。.gitignore・webpack・vite設定の検証に。",
      },
    ],
  }),
  component: GlobTesterPage,
});

/** プリセット定義 */
interface GlobPreset {
  label: string;
  patterns: string;
  paths: string;
}

const PRESETS: GlobPreset[] = [
  {
    label: "TypeScript ソース",
    patterns: "src/**/*.ts\n!src/**/*.d.ts\n!src/**/*.test.ts",
    paths: [
      "src/index.ts",
      "src/utils/helper.ts",
      "src/types/index.d.ts",
      "src/utils/helper.test.ts",
      "src/components/Button.tsx",
      "dist/index.js",
    ].join("\n"),
  },
  {
    label: "node_modules 除外",
    patterns: "**/*.{js,ts}\n!node_modules/**\n!dist/**",
    paths: [
      "src/index.ts",
      "src/app.js",
      "node_modules/react/index.js",
      "dist/bundle.js",
      "scripts/build.ts",
    ].join("\n"),
  },
  {
    label: "画像ファイル",
    patterns: "**/*.{png,jpg,jpeg,gif,svg,webp}",
    paths: [
      "public/logo.png",
      "assets/icons/menu.svg",
      "src/components/Banner.tsx",
      "images/hero.jpg",
      "data/config.json",
      "static/favicon.ico",
    ].join("\n"),
  },
  {
    label: "テストファイル",
    patterns: "**/*.{test,spec}.{ts,tsx,js,jsx}\ntests/**",
    paths: [
      "src/utils.test.ts",
      "src/components/Button.spec.tsx",
      "tests/e2e/navigation.spec.ts",
      "src/app.ts",
      "__tests__/index.test.js",
    ].join("\n"),
  },
];

/** 構文リファレンス */
const SYNTAX_REFERENCE = [
  { pattern: "*", desc: "/以外の任意の文字列" },
  { pattern: "**", desc: "/を含む任意の文字列（ディレクトリ横断）" },
  { pattern: "?", desc: "/以外の任意の1文字" },
  { pattern: "[abc]", desc: "文字クラス（[a-z], [^abc]も可）" },
  { pattern: "{a,b}", desc: "ブレース展開（a または b）" },
  { pattern: "!pattern", desc: "否定パターン（マッチを除外）" },
];

/** GlobTesterPage コンポーネント */
function GlobTesterPage(): JSX.Element {
  const [patterns, setPatterns] = useState(PRESETS[0].patterns);
  const [paths, setPaths] = useState(PRESETS[0].paths);

  const results = useMemo(() => {
    const patternList = patterns
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    const pathList = paths
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    if (patternList.length === 0 || pathList.length === 0) return [];
    return matchGlobPatterns(patternList, pathList);
  }, [patterns, paths]);

  const matchedCount = results.filter((r) => r.matched).length;
  const unmatchedCount = results.filter((r) => !r.matched && !r.negated).length;
  const negatedCount = results.filter((r) => r.negated).length;

  function applyPreset(preset: GlobPreset): void {
    setPatterns(preset.patterns);
    setPaths(preset.paths);
  }

  return (
    <main className="tool-container" id="main-content">
      <h1 className="tool-title">Glob パターンテスター</h1>
      <p className="tool-description">
        glob パターンをリアルタイムでテストします。<code>*</code>、<code>**</code>、<code>?</code>
        、文字クラス、ブレース展開、否定パターン（<code>!</code>）に対応しています。
      </p>

      <section className="glob-section" aria-label="プリセット">
        <p className="glob-section-title">プリセット</p>
        <div className="glob-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="glob-preset-btn"
              onClick={() => applyPreset(preset)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <div className="glob-tester-layout">
        <div className="glob-input-section">
          <section className="glob-section" aria-label="パターン入力">
            <p className="glob-section-title">パターン（1行1パターン）</p>
            <textarea
              className="glob-textarea"
              value={patterns}
              onChange={(e) => setPatterns(e.target.value)}
              placeholder={"src/**/*.ts\n!src/**/*.test.ts"}
              spellCheck={false}
              aria-label="globパターン入力"
            />
            <p className="glob-hint">
              複数パターンはいずれかにマッチすればOK。<code>!</code> で始まる行は否定パターン。
            </p>
          </section>

          <section className="glob-section" aria-label="テストパス入力">
            <p className="glob-section-title">テストするパス（1行1パス）</p>
            <textarea
              className="glob-textarea"
              value={paths}
              onChange={(e) => setPaths(e.target.value)}
              placeholder={"src/index.ts\nnode_modules/react/index.js"}
              spellCheck={false}
              aria-label="テストパス入力"
            />
          </section>
        </div>

        <div>
          <section className="glob-results-section" aria-label="マッチ結果" aria-live="polite">
            <div className="glob-results-header">
              <p className="glob-results-title">結果</p>
              {results.length > 0 && (
                <div className="glob-results-stats">
                  <span className="glob-stat-matched" aria-label={`マッチ ${matchedCount}件`}>
                    ✓ {matchedCount}
                  </span>
                  {negatedCount > 0 && (
                    <span className="glob-stat-negated" aria-label={`否定 ${negatedCount}件`}>
                      ∅ {negatedCount}
                    </span>
                  )}
                  <span className="glob-stat-unmatched" aria-label={`不一致 ${unmatchedCount}件`}>
                    ✗ {unmatchedCount}
                  </span>
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <p className="glob-empty-state">パターンとパスを入力してください</p>
            ) : (
              <ul className="glob-results-list" aria-label="マッチ結果一覧">
                {results.map((result, idx) => (
                  <li
                    key={idx}
                    className={`glob-result-item ${result.matched ? "matched" : result.negated ? "negated" : "unmatched"}`}
                  >
                    <span className="glob-result-icon" aria-hidden="true">
                      {result.matched ? "✓" : result.negated ? "∅" : "✗"}
                    </span>
                    <span className="glob-result-path" title={result.path}>
                      {result.path}
                    </span>
                    <span
                      className={`glob-result-badge ${result.matched ? "badge-matched" : result.negated ? "badge-negated" : "badge-unmatched"}`}
                      aria-hidden="true"
                    >
                      {result.matched ? "match" : result.negated ? "negated" : "no match"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glob-section glob-section-mt" aria-label="構文リファレンス">
            <p className="glob-section-title">構文リファレンス</p>
            <dl className="glob-syntax-grid">
              {SYNTAX_REFERENCE.map(({ pattern, desc }) => (
                <>
                  <dt key={`dt-${pattern}`} className="glob-syntax-pattern">
                    {pattern}
                  </dt>
                  <dd key={`dd-${pattern}`} className="glob-syntax-desc">
                    {desc}
                  </dd>
                </>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <TipsCard
        tips={[
          "複数のパターンを指定した場合、いずれかにマッチすればマッチとなります",
          "`!` で始まるパターンは否定パターンです。マッチしたパスを結果から除外します",
          "`**` は `/` を含む任意のパスにマッチします（例: `src/**/index.ts` → `src/a/b/index.ts`）",
          "`{ts,tsx}` のようなブレース展開を使うと、複数の拡張子を一度に指定できます",
        ]}
      />
    </main>
  );
}
