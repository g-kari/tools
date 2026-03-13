/**
 * @fileoverview Chmod計算ツールページ
 * Unix/Linuxファイルパーミッションの8進数・シンボリック変換とチェックボックスUIを提供する
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "../components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import {
  parseChmodOctal,
  buildChmodOctal,
  octalToSymbolic,
  symbolicToOctal,
} from "../utils/chmod";
import type { ChmodPermissions } from "../utils/chmod";

export const Route = createFileRoute("/chmod")({
  head: () => ({
    meta: [
      { title: "Chmod計算ツール | Web ツール集" },
      {
        name: "description",
        content:
          "Unixファイルパーミッション（chmod）の計算ツール。8進数・シンボリック表記の相互変換、チェックボックスでの直感的な設定が可能です。",
      },
      {
        property: "og:title",
        content: "Chmod計算ツール | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Unixファイルパーミッション（chmod）の計算ツール。8進数・シンボリック表記の相互変換、チェックボックスでの直感的な設定が可能です。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/chmod` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Chmod計算ツール | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Unixファイルパーミッション（chmod）の計算ツール。8進数・シンボリック表記の相互変換、チェックボックスでの直感的な設定が可能です。",
      },
    ],
  }),
  component: ChmodCalculator,
});

/** よく使うパーミッションプリセット */
const PRESETS: { value: string; desc: string }[] = [
  { value: "755", desc: "rwxr-xr-x" },
  { value: "644", desc: "rw-r--r--" },
  { value: "777", desc: "rwxrwxrwx" },
  { value: "700", desc: "rwx------" },
  { value: "600", desc: "rw-------" },
  { value: "400", desc: "r--------" },
  { value: "664", desc: "rw-rw-r--" },
  { value: "775", desc: "rwxrwxr-x" },
];

/** デフォルトパーミッション（755） */
const DEFAULT_PERMS: ChmodPermissions = {
  special: { setuid: false, setgid: false, sticky: false },
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  others: { read: true, write: false, execute: true },
};

/**
 * Chmod計算ツールコンポーネント
 * 8進数入力・シンボリック入力・チェックボックスの3つの入力方法を提供し、
 * 相互にリアルタイム同期する
 */
function ChmodCalculator() {
  const [perms, setPerms] = useState<ChmodPermissions>(DEFAULT_PERMS);
  const [octalInput, setOctalInput] = useState("755");
  const [symbolicInput, setSymbolicInput] = useState("rwxr-xr-x");
  const [octalError, setOctalError] = useState(false);
  const [symbolicError, setSymbolicError] = useState(false);

  const { showToast } = useToast();
  const { copy } = useClipboard();

  const currentOctal = buildChmodOctal(perms);
  const currentSymbolic = octalToSymbolic(currentOctal);
  const chmodCommand = `chmod ${currentOctal} filename`;

  /**
   * 8進数入力が変更されたときの処理
   * 有効な値の場合はチェックボックスとシンボリック表記に反映する
   */
  const handleOctalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setOctalInput(value);

      const parsed = parseChmodOctal(value);
      if (parsed) {
        setPerms(parsed);
        setSymbolicInput(octalToSymbolic(buildChmodOctal(parsed)));
        setOctalError(false);
      } else {
        setOctalError(value.length > 0);
      }
    },
    []
  );

  /**
   * シンボリック入力が変更されたときの処理
   * 有効な9文字の場合はチェックボックスと8進数に反映する
   */
  const handleSymbolicChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSymbolicInput(value);

      const octal = symbolicToOctal(value);
      if (octal !== null) {
        const parsed = parseChmodOctal(octal);
        if (parsed) {
          setPerms(parsed);
          setOctalInput(octal);
          setSymbolicError(false);
        }
      } else {
        setSymbolicError(value.length > 0);
      }
    },
    []
  );

  /**
   * チェックボックス変更時の汎用ハンドラ
   * パーミッション変更後に8進数・シンボリック入力を同期する
   */
  const handlePermChange = useCallback(
    (
      category: "owner" | "group" | "others",
      bit: "read" | "write" | "execute",
      value: boolean
    ) => {
      setPerms((prev) => {
        const next = {
          ...prev,
          [category]: { ...prev[category], [bit]: value },
        };
        const octal = buildChmodOctal(next);
        setOctalInput(octal);
        setSymbolicInput(octalToSymbolic(octal));
        setOctalError(false);
        setSymbolicError(false);
        return next;
      });
    },
    []
  );

  /**
   * 特殊ビット変更時のハンドラ
   */
  const handleSpecialChange = useCallback(
    (bit: "setuid" | "setgid" | "sticky", value: boolean) => {
      setPerms((prev) => {
        const next = {
          ...prev,
          special: { ...prev.special, [bit]: value },
        };
        const octal = buildChmodOctal(next);
        setOctalInput(octal);
        setSymbolicInput(octalToSymbolic(octal));
        setOctalError(false);
        setSymbolicError(false);
        return next;
      });
    },
    []
  );

  /**
   * プリセットボタンが押されたときの処理
   */
  const handlePreset = useCallback((value: string) => {
    const parsed = parseChmodOctal(value);
    if (parsed) {
      setPerms(parsed);
      setOctalInput(value);
      setSymbolicInput(octalToSymbolic(value));
      setOctalError(false);
      setSymbolicError(false);
    }
  }, []);

  /**
   * コマンドをクリップボードにコピーする
   */
  const handleCopyCommand = useCallback(async () => {
    const success = await copy(chmodCommand);
    if (success) {
      showToast(`"${chmodCommand}" をコピーしました`, "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [chmodCommand, copy, showToast]);

  /**
   * 8進数をクリップボードにコピーする
   */
  const handleCopyOctal = useCallback(async () => {
    const success = await copy(currentOctal);
    if (success) {
      showToast(`"${currentOctal}" をコピーしました`, "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [currentOctal, copy, showToast]);

  return (
    <div className="tool-container chmod-container">
      {/* 入力フィールド */}
      <section aria-label="パーミッション入力">
        <div className="chmod-inputs">
          <div className="chmod-input-group">
            <label htmlFor="chmod-octal-input" className="chmod-input-label">
              8進数
            </label>
            <input
              id="chmod-octal-input"
              type="text"
              className={`chmod-input${octalError ? " error" : ""}`}
              value={octalInput}
              onChange={handleOctalChange}
              placeholder="755"
              maxLength={4}
              aria-label="パーミッションの8進数値（3〜4桁）"
              aria-invalid={octalError}
              aria-describedby={octalError ? "octal-error" : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            {octalError && (
              <span id="octal-error" className="chmod-input-error" role="alert">
                0〜7の3〜4桁で入力してください（例: 755, 0644）
              </span>
            )}
          </div>

          <div className="chmod-input-group">
            <label
              htmlFor="chmod-symbolic-input"
              className="chmod-input-label"
            >
              シンボリック表記
            </label>
            <input
              id="chmod-symbolic-input"
              type="text"
              className={`chmod-input${symbolicError ? " error" : ""}`}
              value={symbolicInput}
              onChange={handleSymbolicChange}
              placeholder="rwxr-xr-x"
              maxLength={9}
              aria-label="パーミッションのシンボリック表記（9文字）"
              aria-invalid={symbolicError}
              aria-describedby={
                symbolicError ? "symbolic-error" : undefined
              }
              autoComplete="off"
              spellCheck={false}
            />
            {symbolicError && (
              <span
                id="symbolic-error"
                className="chmod-input-error"
                role="alert"
              >
                rwxr-xr-x 形式の9文字で入力してください
              </span>
            )}
          </div>
        </div>
      </section>

      {/* チェックボックスグリッド */}
      <section aria-label="パーミッションチェックボックス">
        <div
          className="chmod-grid"
          role="group"
          aria-label="Owner/Group/Others のパーミッション設定"
        >
          <div className="chmod-grid-header" aria-hidden="true">
            <div className="chmod-grid-header-cell"></div>
            <div className="chmod-grid-header-cell">Owner</div>
            <div className="chmod-grid-header-cell">Group</div>
            <div className="chmod-grid-header-cell">Others</div>
          </div>

          {(
            [
              { key: "read", label: "Read (r)" },
              { key: "write", label: "Write (w)" },
              { key: "execute", label: "Execute (x)" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="chmod-grid-row">
              <div className="chmod-row-label">{label}</div>
              {(["owner", "group", "others"] as const).map((category) => (
                <div key={category} className="chmod-checkbox-cell">
                  <label
                    className="chmod-checkbox-item"
                    aria-label={`${category} ${label}`}
                  >
                    <input
                      type="checkbox"
                      checked={perms[category][key]}
                      onChange={(e) =>
                        handlePermChange(category, key, e.target.checked)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 特殊ビット */}
      <section aria-label="特殊ビット設定">
        <div className="chmod-special">
          <p className="chmod-special-title">特殊ビット</p>
          <div className="chmod-special-items">
            <label className="chmod-special-item">
              <input
                type="checkbox"
                checked={perms.special.setuid}
                onChange={(e) =>
                  handleSpecialChange("setuid", e.target.checked)
                }
                aria-label="Setuid ビット"
              />
              <span className="chmod-special-item-label">
                Setuid (4000)
              </span>
            </label>
            <label className="chmod-special-item">
              <input
                type="checkbox"
                checked={perms.special.setgid}
                onChange={(e) =>
                  handleSpecialChange("setgid", e.target.checked)
                }
                aria-label="Setgid ビット"
              />
              <span className="chmod-special-item-label">
                Setgid (2000)
              </span>
            </label>
            <label className="chmod-special-item">
              <input
                type="checkbox"
                checked={perms.special.sticky}
                onChange={(e) =>
                  handleSpecialChange("sticky", e.target.checked)
                }
                aria-label="スティッキービット"
              />
              <span className="chmod-special-item-label">
                Sticky bit (1000)
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* 結果表示 */}
      <section aria-label="計算結果" aria-live="polite">
        <div className="chmod-result">
          <div className="chmod-result-row">
            <span className="chmod-result-label">8進数</span>
            <span className="chmod-octal" aria-label={`8進数: ${currentOctal}`}>
              {currentOctal}
            </span>
            <button
              type="button"
              className="chmod-copy-btn"
              onClick={handleCopyOctal}
              aria-label={`8進数 ${currentOctal} をコピー`}
            >
              コピー
            </button>
          </div>
          <div className="chmod-result-row">
            <span className="chmod-result-label">シンボリック</span>
            <span
              className="chmod-symbolic"
              aria-label={`シンボリック表記: ${currentSymbolic}`}
            >
              {currentSymbolic}
            </span>
          </div>
          <div className="chmod-result-row">
            <span className="chmod-result-label">コマンド</span>
            <code
              className="chmod-command"
              aria-label={`chmodコマンド: ${chmodCommand}`}
            >
              {chmodCommand}
            </code>
            <button
              type="button"
              className="chmod-copy-btn"
              onClick={handleCopyCommand}
              aria-label={`コマンド ${chmodCommand} をコピー`}
            >
              コピー
            </button>
          </div>
        </div>
      </section>

      {/* プリセット */}
      <section aria-label="よく使うプリセット">
        <div className="chmod-presets">
          <p className="chmod-presets-title">よく使うプリセット</p>
          <div className="chmod-presets-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className="chmod-preset-btn"
                onClick={() => handlePreset(preset.value)}
                aria-label={`プリセット ${preset.value} (${preset.desc}) を適用`}
              >
                <span className="chmod-preset-value">{preset.value}</span>
                <span className="chmod-preset-desc">{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <TipsCard
        sections={[
          {
            title: "Chmod計算ツールとは",
            items: [
              "Unix/Linuxのファイルパーミッション（chmod）を計算するツールです",
              "8進数（755など）・シンボリック表記（rwxr-xr-x）・チェックボックスの3種類の入力方法に対応しています",
              "入力値は相互にリアルタイムで同期されます",
              "結果として chmod コマンドをそのままコピーできます",
            ],
          },
          {
            title: "パーミッションの読み方",
            items: [
              "r（read）: 読み取り権限（値: 4）",
              "w（write）: 書き込み権限（値: 2）",
              "x（execute）: 実行権限（値: 1）",
              "Owner: ファイルの所有者の権限",
              "Group: ファイルの所有グループの権限",
              "Others: その他のユーザーの権限",
              "例: 755 = Owner(rwx=7) + Group(r-x=5) + Others(r-x=5)",
            ],
          },
          {
            title: "特殊ビットについて",
            items: [
              "Setuid (4000): 実行時にファイルオーナーの権限で実行する",
              "Setgid (2000): 実行時にファイルのグループ権限で実行する",
              "Sticky bit (1000): ディレクトリに設定すると所有者のみ削除可能",
              "シンボリック表記ではsetuid/setgidはs/S、stickyはt/Tで表される",
              "例: 4755 → rwsr-xr-x (setuid + 755)",
            ],
          },
          {
            title: "よく使うパーミッション",
            items: [
              "755 (rwxr-xr-x): ディレクトリや実行ファイルの標準的な設定",
              "644 (rw-r--r--): 一般ファイルの標準的な設定",
              "600 (rw-------): 秘密鍵など機密ファイルの設定",
              "777 (rwxrwxrwx): 全ユーザーに全権限（セキュリティ上非推奨）",
              "400 (r--------): 読み取り専用（バックアップなど）",
            ],
          },
        ]}
      />
    </div>
  );
}
