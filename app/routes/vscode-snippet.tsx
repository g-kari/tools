import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useId } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateVscodeSnippetJson,
  createEmptySnippet,
  SCOPE_PRESETS,
  TAB_STOP_GUIDE,
  type SnippetDefinition,
} from "~/utils/vscode-snippet";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

export const Route = createFileRoute("/vscode-snippet")({
  head: () => ({
    meta: [
      { title: "VSCode スニペットジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "VS Code 用のスニペット JSON を生成するツール。プレフィックス・本文・説明・スコープを入力するだけで、.code-snippets ファイルに貼り付けられる JSON を自動生成します。",
      },
      {
        property: "og:title",
        content: "VSCode スニペットジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "VS Code 用のスニペット JSON を生成するツール。プレフィックス・本文・説明・スコープを設定して JSON を自動生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/vscode-snippet` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "VSCode スニペットジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "VS Code 用のスニペット JSON を生成するツール。プレフィックス・本文を入力してすぐ使えます。",
      },
    ],
  }),
  component: VscodeSnippetPage,
});

/** スニペットカードコンポーネント */
function SnippetCard({
  snippet,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  snippet: SnippetDefinition & { id: string };
  index: number;
  canRemove: boolean;
  onChange: (id: string, field: keyof SnippetDefinition, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const nameId = useId();
  const prefixId = useId();
  const scopeId = useId();
  const bodyId = useId();
  const descId = useId();

  return (
    <div className="vscode-snippet-card" aria-label={`スニペット ${index + 1}`}>
      <div className="vscode-snippet-card-header">
        <span className="vscode-snippet-card-number">Snippet #{index + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="vscode-snippet-remove-btn"
            onClick={() => onRemove(snippet.id)}
            aria-label={`スニペット ${index + 1} を削除`}
          >
            削除
          </button>
        )}
      </div>

      {/* 名前・プレフィックス */}
      <div className="vscode-snippet-fields-row">
        <div className="vscode-snippet-field">
          <label htmlFor={nameId}>スニペット名 *</label>
          <input
            id={nameId}
            type="text"
            value={snippet.name}
            onChange={(e) => onChange(snippet.id, "name", e.target.value)}
            placeholder="例: Console Log"
            autoComplete="off"
            spellCheck={false}
            aria-required="true"
          />
        </div>
        <div className="vscode-snippet-field">
          <label htmlFor={prefixId}>プレフィックス</label>
          <input
            id={prefixId}
            type="text"
            value={snippet.prefix}
            onChange={(e) => onChange(snippet.id, "prefix", e.target.value)}
            placeholder="例: cl（空欄はスニペット名を使用）"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* スコープ */}
      <div className="vscode-snippet-fields-row">
        <div className="vscode-snippet-field">
          <label htmlFor={scopeId}>スコープ（対象言語）</label>
          <select
            id={scopeId}
            value={snippet.scope}
            onChange={(e) => onChange(snippet.id, "scope", e.target.value)}
          >
            {SCOPE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="vscode-snippet-field">
          <label htmlFor={descId}>説明</label>
          <input
            id={descId}
            type="text"
            value={snippet.description}
            onChange={(e) => onChange(snippet.id, "description", e.target.value)}
            placeholder="例: console.log shortcut"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Body */}
      <div className="vscode-snippet-body-field">
        <label htmlFor={bodyId}>本文（Body） *</label>
        <textarea
          id={bodyId}
          className="vscode-snippet-body-textarea"
          value={snippet.body}
          onChange={(e) => onChange(snippet.id, "body", e.target.value)}
          placeholder={"console.log($1);"}
          spellCheck={false}
          aria-required="true"
          aria-describedby={`${bodyId}-hint`}
        />
        <p id={`${bodyId}-hint`} className="vscode-snippet-tabstop-hint">
          {TAB_STOP_GUIDE}
        </p>
      </div>
    </div>
  );
}

/** メインページ */
function VscodeSnippetPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  type SnippetWithId = SnippetDefinition & { id: string };

  const newSnippet = (): SnippetWithId => ({
    ...createEmptySnippet(),
    id: Math.random().toString(36).slice(2),
  });

  const [snippets, setSnippets] = useState<SnippetWithId[]>([newSnippet()]);
  const [copied, setCopied] = useState(false);

  const output = generateVscodeSnippetJson(snippets);

  const handleChange = useCallback((id: string, field: keyof SnippetDefinition, value: string) => {
    setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }, []);

  const handleAdd = useCallback(() => {
    setSnippets((prev) => [...prev, newSnippet()]);
    announceStatus("スニペットを追加しました");
  }, [announceStatus]);

  const handleRemove = useCallback(
    (id: string) => {
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      announceStatus("スニペットを削除しました");
    },
    [announceStatus],
  );

  const handleClear = useCallback(() => {
    setSnippets([newSnippet()]);
    setCopied(false);
    announceStatus("フォームをリセットしました");
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    const success = await copy(output.json);
    if (success) {
      setCopied(true);
      announceStatus("JSON をコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output.json, copy, announceStatus, showToast]);

  return (
    <>
      <div className="tool-container">
        {/* ── スニペット定義セクション ── */}
        <div className="converter-section">
          <h2 className="section-title">スニペット定義</h2>

          <div className="vscode-snippet-list" role="list" aria-label="スニペット定義リスト">
            {snippets.map((snippet, index) => (
              <div key={snippet.id} role="listitem">
                <SnippetCard
                  snippet={snippet}
                  index={index}
                  canRemove={snippets.length > 1}
                  onChange={handleChange}
                  onRemove={handleRemove}
                />
              </div>
            ))}
          </div>

          <div className="vscode-snippet-add-row">
            <div className="button-group" role="group" aria-label="操作">
              <button type="button" className="btn-secondary" onClick={handleAdd}>
                ＋ スニペットを追加
              </button>
              <button type="button" className="btn-clear" onClick={handleClear}>
                リセット
              </button>
            </div>
          </div>
        </div>

        {/* ── 出力セクション ── */}
        <div className="converter-section">
          <div className="vscode-snippet-output-header">
            <h2 className="section-title">
              生成された JSON
              {output.snippetCount > 0 && (
                <span className="vscode-snippet-count-badge">（{output.snippetCount} 件）</span>
              )}
            </h2>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopy}
              disabled={output.snippetCount === 0}
            >
              {copied ? "コピーしました" : "JSON をコピー"}
            </button>
          </div>

          <textarea
            className="vscode-snippet-output-area"
            readOnly
            value={output.json}
            aria-label="生成された VSCode スニペット JSON"
            aria-live="polite"
            spellCheck={false}
          />

          <p className="vscode-snippet-filename-hint">
            保存先の例: <code>~/.config/Code/User/snippets/my-snippets.code-snippets</code>
          </p>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "VS Code スニペットとは",
            items: [
              "スニペットとは、よく使うコードをプレフィックスで素早く挿入できるテンプレート機能です",
              "ユーザースニペット（グローバル）、ワークスペーススニペット、言語別スニペットの3種類があります",
              "スニペットファイルは JSON 形式で記述し、拡張子は .code-snippets です",
            ],
          },
          {
            title: "タブストップの使い方",
            items: [
              "$1, $2 … で Tab キーでカーソルが順番に移動するタブストップを設定できます",
              "$0 はスニペット挿入後の最終カーソル位置です",
              "${1:placeholder} でデフォルト値付きタブストップを設定できます",
              "${1|option1,option2|} でドロップダウン選択肢を設定できます",
              "\\n で改行、\\t でタブを表現できます（本ツールでは直接入力可）",
            ],
          },
          {
            title: "スニペットの登録方法",
            items: [
              "VS Code で Ctrl+Shift+P → 「Snippets: Configure Snippets」を開きます",
              "グローバルスニペット・言語別スニペット・ワークスペーススニペットから選択できます",
              "生成した JSON をスニペットファイルに貼り付けて保存すれば完了です",
              "エディタ上でプレフィックスを入力すると IntelliSense で補完候補に表示されます",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
