import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { executeBrainfuck, BRAINFUCK_SAMPLES, type BrainfuckResult } from "~/utils/brainfuck";
import "~/styles/tools/brainfuck.css";

export const Route = createFileRoute("/brainfuck")({
  head: () => ({
    meta: [
      { title: "Brainfuck インタープリター | Web ツール集" },
      {
        name: "description",
        content:
          "Brainfuck コードをブラウザ上で実行できるオンラインインタープリター。サンプルプログラムとメモリ状態の可視化に対応。",
      },
      {
        property: "og:title",
        content: "Brainfuck インタープリター | Web ツール集",
      },
      {
        property: "og:description",
        content: "Brainfuck コードをブラウザ上で実行できるオンラインインタープリター。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/brainfuck` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Brainfuck インタープリター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "Brainfuck コードをブラウザ上で実行できるオンラインインタープリター。",
      },
    ],
  }),
  component: BrainfuckInterpreter,
});

/** Brainfuck コマンド一覧 */
const COMMANDS = [
  { symbol: ">", desc: "ポインタを1つ右へ移動" },
  { symbol: "<", desc: "ポインタを1つ左へ移動" },
  { symbol: "+", desc: "現在のセルの値を1増加（0xff で折り返し）" },
  { symbol: "-", desc: "現在のセルの値を1減少（0 で折り返し）" },
  { symbol: ".", desc: "現在のセルの値をASCII文字として出力" },
  { symbol: ",", desc: "入力から1バイト読み込み現在のセルに格納" },
  { symbol: "[", desc: "現在のセルが 0 なら対応する ] の次へジャンプ" },
  { symbol: "]", desc: "現在のセルが 0 でなければ対応する [ の次へジャンプ" },
];

/**
 * Brainfuck インタープリターページコンポーネント
 *
 * Brainfuck は8つのコマンドのみからなる難解プログラミング言語です。
 * このツールではコードを入力して実行し、出力とメモリ状態を確認できます。
 *
 * @returns Brainfuck インタープリターページのReactコンポーネント
 */
function BrainfuckInterpreter() {
  const [code, setCode] = useState(BRAINFUCK_SAMPLES[0].code);
  const [input, setInput] = useState(BRAINFUCK_SAMPLES[0].input);
  const [result, setResult] = useState<BrainfuckResult | null>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  /**
   * Brainfuck コードを実行する
   */
  const handleRun = useCallback(() => {
    if (!code.trim()) {
      announceStatus("コードを入力してください");
      return;
    }
    const res = executeBrainfuck(code, input);
    setResult(res);
    if (res.error) {
      announceStatus(`エラー: ${res.error}`);
    } else {
      announceStatus(
        `実行完了。出力: ${res.output.length} 文字、${res.steps.toLocaleString()} ステップ`,
      );
    }
  }, [code, input, announceStatus]);

  /**
   * サンプルプログラムを読み込む
   */
  const handleLoadSample = useCallback(
    (index: number) => {
      const sample = BRAINFUCK_SAMPLES[index];
      setCode(sample.code);
      setInput(sample.input);
      setResult(null);
      announceStatus(`サンプル「${sample.name}」を読み込みました`);
    },
    [announceStatus],
  );

  /**
   * 出力をクリップボードにコピーする
   */
  const handleCopyOutput = useCallback(async () => {
    if (!result?.output) return;
    const success = await copy(result.output);
    if (success) announceStatus("出力をコピーしました");
  }, [result, copy, announceStatus]);

  return (
    <div className="tool-container" role="main" aria-label="Brainfuck インタープリター">
      <a href="#main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>

      <header className="tool-header" role="banner">
        <h1 className="tool-title">Brainfuck インタープリター</h1>
        <p className="tool-description">
          Brainfuck
          コードをブラウザ上で実行します。8つのコマンドのみからなる難解プログラミング言語です。
        </p>
      </header>

      <StatusAnnouncer statusRef={statusRef} />

      <main id="main-content">
        {/* サンプル選択 */}
        <section className="tool-section" aria-labelledby="samples-heading">
          <h2 className="section-title" id="samples-heading">
            サンプルプログラム
          </h2>
          <div className="brainfuck-samples" role="list">
            {BRAINFUCK_SAMPLES.map((sample, i) => (
              <button
                key={sample.name}
                className="brainfuck-sample-btn"
                onClick={() => handleLoadSample(i)}
                title={sample.description}
                role="listitem"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </section>

        {/* エディタと出力 */}
        <div className="brainfuck-layout">
          {/* 入力エリア */}
          <div className="brainfuck-editor">
            <section className="tool-section" aria-labelledby="code-heading">
              <h2 className="section-title" id="code-heading">
                コード入力
              </h2>
              <Textarea
                id="brainfuck-code"
                className="brainfuck-code-area"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setResult(null);
                }}
                placeholder="Brainfuck コードを入力してください..."
                aria-label="Brainfuck コード"
                spellCheck={false}
              />
            </section>

            <section className="tool-section" aria-labelledby="input-heading">
              <h2 className="section-title" id="input-heading">
                標準入力（, コマンド用）
              </h2>
              <Textarea
                id="brainfuck-input"
                className="brainfuck-input-area"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setResult(null);
                }}
                placeholder="入力文字列（省略可）"
                aria-label="標準入力"
                spellCheck={false}
              />
            </section>

            <Button onClick={handleRun} className="btn-primary" aria-label="Brainfuck コードを実行">
              ▶ 実行
            </Button>
          </div>

          {/* 出力エリア */}
          <div className="brainfuck-output">
            <section className="tool-section" aria-labelledby="output-heading">
              <div className="section-header">
                <h2 className="section-title" id="output-heading">
                  出力
                </h2>
                {result && !result.error && result.output && (
                  <Button
                    onClick={handleCopyOutput}
                    className="btn-secondary btn-sm"
                    aria-label="出力をコピー"
                  >
                    コピー
                  </Button>
                )}
              </div>

              <div
                className={`brainfuck-result-box${result?.error ? " has-error" : ""}`}
                role="region"
                aria-label="実行結果"
                aria-live="polite"
              >
                {result === null ? (
                  <span className="brainfuck-result-placeholder">
                    コードを入力して「実行」ボタンを押してください
                  </span>
                ) : result.error ? (
                  <span>⚠️ {result.error}</span>
                ) : result.output === "" ? (
                  <span className="brainfuck-result-placeholder">（出力なし）</span>
                ) : (
                  result.output
                )}
              </div>

              {result && (
                <div className="brainfuck-stats" aria-label="実行統計">
                  <span className="brainfuck-stat-badge">
                    {result.steps.toLocaleString()} ステップ
                  </span>
                  <span className="brainfuck-stat-badge">出力 {result.output.length} 文字</span>
                  <span className="brainfuck-stat-badge">ポインタ位置: {result.pointer}</span>
                </div>
              )}
            </section>

            {/* メモリ状態 */}
            {result && (
              <section className="tool-section" aria-labelledby="memory-heading">
                <h2 className="section-title" id="memory-heading">
                  メモリ状態（先頭20セル）
                </h2>
                <div className="brainfuck-memory-grid" role="list" aria-label="メモリセル">
                  {result.memory.map((val, i) => (
                    <div
                      key={i}
                      className={`brainfuck-memory-cell${i === result.pointer ? " active" : val !== 0 ? " nonzero" : ""}`}
                      role="listitem"
                      aria-label={`セル${i}: ${val}${i === result.pointer ? "（現在位置）" : ""}`}
                    >
                      <span className="brainfuck-cell-index">[{i}]</span>
                      <span className="brainfuck-cell-value">{val}</span>
                      <span className="brainfuck-cell-char">
                        {val >= 32 && val <= 126 ? String.fromCharCode(val) : "·"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* コマンドリファレンス */}
        <section className="tool-section" aria-labelledby="reference-heading">
          <h2 className="section-title" id="reference-heading">
            コマンドリファレンス
          </h2>
          <div className="brainfuck-command-ref" role="list">
            {COMMANDS.map((cmd) => (
              <div key={cmd.symbol} className="brainfuck-cmd-item" role="listitem">
                <span className="brainfuck-cmd-symbol" aria-label={`コマンド ${cmd.symbol}`}>
                  {cmd.symbol}
                </span>
                <span className="brainfuck-cmd-desc">{cmd.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 使い方説明 */}
        <TipsCard
          sections={[
            {
              title: "Brainfuck とは",
              items: [
                "1993年に Urban Müller が作成した難解プログラミング言語です。メモリはバイト配列で構成され、8つのコマンドのみでプログラムを記述します。",
                "実行制限：無限ループを防ぐため、最大 1,000,000 ステップで実行を停止します。",
                "メモリ：30,000 バイトの配列を使用します。各セルは 0〜255 の値を持ち、オーバーフロー時は折り返します。",
              ],
            },
          ]}
        />
      </main>
    </div>
  );
}
