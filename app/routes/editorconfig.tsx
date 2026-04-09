import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useId } from "react";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateEditorConfig,
  createDefaultOverride,
  applyPreset,
  FILE_TYPES,
  PRESETS,
  DEFAULT_GLOBAL,
  type EditorConfigGlobal,
  type FileTypeOverride,
  type IndentStyle,
  type EndOfLine,
  type Charset,
} from "~/utils/editorconfig";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import "../styles/tools/editorconfig.css";

export const Route = createFileRoute("/editorconfig")({
  head: () => ({
    meta: [
      { title: "EditorConfig ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "インデント・改行コード・文字エンコードなどを設定して .editorconfig ファイルを自動生成。ファイルタイプ別のオーバーライドや Python・Go・フロントエンドなどのプリセットに対応。",
      },
      {
        property: "og:title",
        content: "EditorConfig ジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "インデント・改行コード・文字エンコードを設定して .editorconfig を自動生成。プリセットとファイルタイプ別オーバーライドに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/editorconfig` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "EditorConfig ジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: ".editorconfig ファイルを簡単生成。プリセット・ファイルタイプ別設定に対応。",
      },
    ],
  }),
  component: EditorConfigPage,
});

/** グローバル設定フォームコンポーネント */
function GlobalSettingsForm({
  global: g,
  onChange,
}: {
  global: EditorConfigGlobal;
  onChange: (updated: EditorConfigGlobal) => void;
}) {
  const rootId = useId();
  const indentStyleId = useId();
  const indentSizeId = useId();
  const eolId = useId();
  const charsetId = useId();
  const trimId = useId();
  const finalNewlineId = useId();

  return (
    <section className="tool-section" aria-labelledby="global-section-heading">
      <h2 id="global-section-heading" className="tool-section-title">
        グローバル設定
      </h2>

      <div className="editorconfig-global-grid">
        {/* インデントスタイル */}
        <div className="form-field">
          <label htmlFor={indentStyleId}>インデントスタイル</label>
          <select
            id={indentStyleId}
            value={g.indentStyle}
            onChange={(e) => onChange({ ...g, indentStyle: e.target.value as IndentStyle })}
          >
            <option value="space">スペース</option>
            <option value="tab">タブ</option>
          </select>
        </div>

        {/* インデントサイズ */}
        <div className="form-field">
          <label htmlFor={indentSizeId}>インデントサイズ</label>
          <select
            id={indentSizeId}
            value={g.indentSize}
            onChange={(e) => onChange({ ...g, indentSize: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* 改行コード */}
        <div className="form-field">
          <label htmlFor={eolId}>改行コード</label>
          <select
            id={eolId}
            value={g.endOfLine}
            onChange={(e) => onChange({ ...g, endOfLine: e.target.value as EndOfLine })}
          >
            <option value="lf">LF（Unix / macOS）</option>
            <option value="crlf">CRLF（Windows）</option>
            <option value="cr">CR（旧 Mac）</option>
          </select>
        </div>

        {/* 文字エンコード */}
        <div className="form-field">
          <label htmlFor={charsetId}>文字エンコード</label>
          <select
            id={charsetId}
            value={g.charset}
            onChange={(e) => onChange({ ...g, charset: e.target.value as Charset })}
          >
            <option value="utf-8">UTF-8</option>
            <option value="utf-8-bom">UTF-8 BOM</option>
            <option value="utf-16be">UTF-16 BE</option>
            <option value="utf-16le">UTF-16 LE</option>
            <option value="latin1">Latin-1</option>
          </select>
        </div>
      </div>

      {/* チェックボックス系 */}
      <div className="editorconfig-toggle-list">
        <div className="editorconfig-toggle-row">
          <label htmlFor={rootId} className="editorconfig-toggle-label">
            <code>root = true</code>（上位ディレクトリを探索しない）
          </label>
          <input
            id={rootId}
            type="checkbox"
            checked={g.root}
            onChange={(e) => onChange({ ...g, root: e.target.checked })}
            aria-label="root = true を設定する"
          />
        </div>

        <div className="editorconfig-toggle-row">
          <label htmlFor={trimId} className="editorconfig-toggle-label">
            末尾の空白を削除（<code>trim_trailing_whitespace</code>）
          </label>
          <input
            id={trimId}
            type="checkbox"
            checked={g.trimTrailingWhitespace}
            onChange={(e) => onChange({ ...g, trimTrailingWhitespace: e.target.checked })}
            aria-label="trim_trailing_whitespace を有効にする"
          />
        </div>

        <div className="editorconfig-toggle-row">
          <label htmlFor={finalNewlineId} className="editorconfig-toggle-label">
            最終行に改行を挿入（<code>insert_final_newline</code>）
          </label>
          <input
            id={finalNewlineId}
            type="checkbox"
            checked={g.insertFinalNewline}
            onChange={(e) => onChange({ ...g, insertFinalNewline: e.target.checked })}
            aria-label="insert_final_newline を有効にする"
          />
        </div>
      </div>
    </section>
  );
}

/** メインページ */
function EditorConfigPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const [global, setGlobal] = useState<EditorConfigGlobal>(DEFAULT_GLOBAL);

  // ファイルタイプ別オーバーライド設定（パターンをキーとするマップ）
  const [overrides, setOverrides] = useState<Record<string, FileTypeOverride>>(() =>
    Object.fromEntries(FILE_TYPES.map((ft) => [ft.pattern, createDefaultOverride(ft)])),
  );

  const output = useMemo(() => generateEditorConfig(global, overrides), [global, overrides]);

  const handlePreset = useCallback(
    (presetIdx: number) => {
      const preset = PRESETS[presetIdx];
      setGlobal(applyPreset(preset));
      showToast(`プリセット「${preset.name}」を適用しました`, "success");
    },
    [showToast],
  );

  const handleOverrideToggle = useCallback((pattern: string, enabled: boolean) => {
    setOverrides((prev) => ({
      ...prev,
      [pattern]: { ...prev[pattern], enabled },
    }));
  }, []);

  const handleOverrideChange = useCallback(
    (pattern: string, field: keyof FileTypeOverride, value: unknown) => {
      setOverrides((prev) => ({
        ...prev,
        [pattern]: { ...prev[pattern], [field]: value },
      }));
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const success = await copy(output);
    if (success) {
      showToast("クリップボードにコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, showToast]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".editorconfig";
    a.click();
    URL.revokeObjectURL(url);
    showToast(".editorconfig をダウンロードしました", "success");
  }, [output, showToast]);

  const handleReset = useCallback(() => {
    setGlobal(DEFAULT_GLOBAL);
    setOverrides(
      Object.fromEntries(FILE_TYPES.map((ft) => [ft.pattern, createDefaultOverride(ft)])),
    );
    showToast("設定をリセットしました", "info");
  }, [showToast]);

  return (
    <div className="tool-container editorconfig-container">
      <h1 className="tool-title">EditorConfig ジェネレーター</h1>
      <p className="tool-description">
        インデント・改行コード・文字エンコードなどを設定して <code>.editorconfig</code>{" "}
        ファイルを生成します。 ファイルタイプ別のオーバーライドも設定できます。
      </p>

      {/* プリセット */}
      <section className="tool-section" aria-labelledby="preset-heading">
        <h2 id="preset-heading" className="tool-section-title">
          プリセット
        </h2>
        <div className="editorconfig-presets">
          {PRESETS.map((preset, idx) => (
            <button
              key={preset.name}
              type="button"
              className="editorconfig-preset-btn"
              onClick={() => handlePreset(idx)}
              aria-label={`プリセット「${preset.name}」を適用`}
            >
              <span className="editorconfig-preset-btn-name">{preset.name}</span>
              <span className="editorconfig-preset-btn-desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* グローバル設定 */}
      <GlobalSettingsForm global={global} onChange={setGlobal} />

      {/* ファイルタイプ別設定 */}
      <section className="tool-section" aria-labelledby="filetypes-section-heading">
        <h2 id="filetypes-section-heading" className="tool-section-title">
          ファイルタイプ別オーバーライド
        </h2>
        <p className="tool-description editorconfig-filetypes-desc">
          有効にしたファイルタイプのみ、グローバル設定と異なる値が出力されます。
        </p>
        <div className="editorconfig-table-wrapper">
          <table
            className="editorconfig-filetypes-table"
            aria-label="ファイルタイプ別オーバーライド設定"
          >
            <thead>
              <tr>
                <th scope="col">有効</th>
                <th scope="col">ファイルタイプ</th>
                <th scope="col">パターン</th>
                <th scope="col">インデントスタイル</th>
                <th scope="col">インデントサイズ</th>
              </tr>
            </thead>
            <tbody>
              {FILE_TYPES.map((ft) => {
                const ov = overrides[ft.pattern];
                return (
                  <tr key={ft.pattern}>
                    <td>
                      <input
                        type="checkbox"
                        checked={ov.enabled}
                        onChange={(e) => handleOverrideToggle(ft.pattern, e.target.checked)}
                        aria-label={`${ft.label} のオーバーライドを有効にする`}
                      />
                    </td>
                    <td>{ft.label}</td>
                    <td>
                      <code className="editorconfig-pattern-code">{ft.pattern}</code>
                    </td>
                    <td>
                      <select
                        value={ov.indentStyle}
                        disabled={!ov.enabled}
                        onChange={(e) =>
                          handleOverrideChange(
                            ft.pattern,
                            "indentStyle",
                            e.target.value as IndentStyle,
                          )
                        }
                        aria-label={`${ft.label} のインデントスタイル`}
                      >
                        <option value="space">スペース</option>
                        <option value="tab">タブ</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={ov.indentSize}
                        disabled={!ov.enabled}
                        onChange={(e) =>
                          handleOverrideChange(ft.pattern, "indentSize", Number(e.target.value))
                        }
                        aria-label={`${ft.label} のインデントサイズ`}
                      >
                        {[1, 2, 3, 4, 6, 8].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 出力 */}
      <section className="tool-section" aria-labelledby="output-heading">
        <h2 id="output-heading" className="tool-section-title">
          生成された .editorconfig
        </h2>
        <textarea
          className="editorconfig-output"
          value={output}
          readOnly
          aria-label="生成された .editorconfig の内容"
          aria-readonly="true"
          spellCheck={false}
        />
        <div className="tool-actions">
          <button
            type="button"
            className="tool-btn tool-btn-primary"
            onClick={handleCopy}
            aria-label=".editorconfig の内容をクリップボードにコピー"
          >
            コピー
          </button>
          <button
            type="button"
            className="tool-btn tool-btn-secondary"
            onClick={handleDownload}
            aria-label=".editorconfig ファイルをダウンロード"
          >
            ダウンロード
          </button>
          <button
            type="button"
            className="tool-btn tool-btn-ghost"
            onClick={handleReset}
            aria-label="設定をリセット"
          >
            リセット
          </button>
        </div>
      </section>

      <TipsCard>
        <ul>
          <li>
            <code>.editorconfig</code> はプロジェクトルートに配置します。
            <code>root = true</code> を設定すると上位ディレクトリを探索しません。
          </li>
          <li>VS Code・JetBrains・Vim・Emacs など主要エディタが標準でサポートしています。</li>
          <li>
            チームで異なるOSを使う場合、改行コードを統一（<code>lf</code>
            ）することで Git の差分ノイズを防げます。
          </li>
          <li>
            Go は <code>gofmt</code> がタブを使うため、<code>indent_style = tab</code> が標準です。
          </li>
        </ul>
      </TipsCard>
    </div>
  );
}
