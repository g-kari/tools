import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { bigIntToBase, parseStringToBigInt } from "~/utils/numberBase";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/number-base")({
  head: () => ({
    meta: [
      { title: "数値進数変換ツール | Web ツール集" },
      {
        name: "description",
        content:
          "2進数・8進数・10進数・16進数の相互変換ツール。いずれかの欄に入力すると他の欄がリアルタイムで更新されます。",
      },
      { property: "og:title", content: "数値進数変換ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "2進数・8進数・10進数・16進数の相互変換ツール。いずれかの欄に入力すると他の欄がリアルタイムで更新されます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/number-base` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "数値進数変換ツール | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "2進数・8進数・10進数・16進数の相互変換ツール。いずれかの欄に入力すると他の欄がリアルタイムで更新されます。",
      },
    ],
  }),
  component: NumberBaseConverter,
});

/**
 * 進数フィールドの定義
 */
interface BaseField {
  /** 進数 */
  base: number;
  /** ラベル */
  label: string;
  /** 入力フィールドのプレースホルダー */
  placeholder: string;
  /** 入力フィールドのID */
  id: string;
  /** 入力バリデーション用パターン（大文字・小文字区別なし） */
  validChars: RegExp;
}

const BASE_FIELDS: BaseField[] = [
  {
    base: 2,
    label: "2進数",
    placeholder: "例: 1010",
    id: "binary",
    validChars: /^[01]*$/,
  },
  {
    base: 8,
    label: "8進数",
    placeholder: "例: 12",
    id: "octal",
    validChars: /^[0-7]*$/,
  },
  {
    base: 10,
    label: "10進数",
    placeholder: "例: 10",
    id: "decimal",
    validChars: /^[0-9]*$/,
  },
  {
    base: 16,
    label: "16進数",
    placeholder: "例: A",
    id: "hexadecimal",
    validChars: /^[0-9a-fA-F]*$/,
  },
];


/**
 * 数値進数変換コンポーネント
 * 2進数・8進数・10進数・16進数の相互変換を行う
 */
function NumberBaseConverter() {
  // 各フィールドの入力値（表示用）
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    binary: "",
    octal: "",
    decimal: "",
    hexadecimal: "",
  });
  // エラーメッセージ（フィールドIDをキーとする）
  const [errors, setErrors] = useState<Record<string, string>>({});
  // コピー状態
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  /**
   * フィールド値変更ハンドラ
   * 入力値を検証し、有効な場合は他のフィールドを更新する
   */
  const handleChange = useCallback(
    (fieldId: string, base: number, value: string) => {
      const field = BASE_FIELDS.find((f) => f.id === fieldId);
      if (!field) return;

      // 空文字の場合は全フィールドをクリア
      if (value === "") {
        setFieldValues({
          binary: "",
          octal: "",
          decimal: "",
          hexadecimal: "",
        });
        setErrors({});
        return;
      }

      // バリデーション
      if (!field.validChars.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [fieldId]: `${field.label}に使用できない文字が含まれています`,
        }));
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
        return;
      }

      // BigIntに変換
      const bigValue = parseStringToBigInt(value, base);
      if (bigValue === null) {
        setErrors((prev) => ({
          ...prev,
          [fieldId]: "入力値が無効です",
        }));
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
        return;
      }

      // 全フィールドを更新
      const newFieldValues: Record<string, string> = {};
      for (const f of BASE_FIELDS) {
        if (f.id === fieldId) {
          // 入力フィールドはそのまま（大文字に正規化）
          newFieldValues[f.id] = value.toUpperCase();
        } else {
          newFieldValues[f.id] = bigIntToBase(bigValue, f.base);
        }
      }
      setFieldValues(newFieldValues);
      setErrors({});
    },
    []
  );

  /**
   * コピーボタンクリックハンドラ
   */
  const handleCopy = useCallback(
    async (fieldId: string) => {
      const value = fieldValues[fieldId];
      if (!value) return;

      const success = await copy(value);
      if (success) {
        setCopiedId(fieldId);
        announceStatus(`${BASE_FIELDS.find((f) => f.id === fieldId)?.label ?? "値"}をコピーしました`);
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
      } else {
        announceStatus("コピーに失敗しました");
      }
    },
    [fieldValues, copy, announceStatus]
  );

  /**
   * クリアボタンクリックハンドラ
   */
  const handleClear = useCallback(() => {
    setFieldValues({
      binary: "",
      octal: "",
      decimal: "",
      hexadecimal: "",
    });
    setErrors({});
    announceStatus("フィールドをクリアしました");
  }, [announceStatus]);

  const hasAnyValue = Object.values(fieldValues).some((v) => v !== "");

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">数値進数変換</h2>
          <p className="tool-description">
            いずれかの欄に数値を入力すると、他の進数へ自動変換されます。
          </p>

          <div className="number-base-container" role="group" aria-label="進数変換フィールド">
            <div className="number-base-fields">
              {BASE_FIELDS.map((field) => {
                const hasError = !!errors[field.id];
                const value = fieldValues[field.id];
                const isCopied = copiedId === field.id;

                return (
                  <div key={field.id} className="number-base-field">
                    <label
                      htmlFor={field.id}
                      className="number-base-label"
                    >
                      {field.label}
                      <span className="number-base-label-prefix">
                        (基数 {field.base})
                      </span>
                    </label>
                    <div className="number-base-input-row">
                      <input
                        id={field.id}
                        type="text"
                        inputMode="text"
                        className={`number-base-input${hasError ? " error" : ""}`}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          handleChange(field.id, field.base, e.target.value)
                        }
                        aria-label={`${field.label}入力フィールド`}
                        aria-invalid={hasError}
                        aria-describedby={
                          hasError ? `${field.id}-error` : undefined
                        }
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        className={`number-base-copy-btn${isCopied ? " copied" : ""}`}
                        onClick={() => handleCopy(field.id)}
                        disabled={!value || hasError}
                        aria-label={`${field.label}の値をクリップボードにコピー`}
                      >
                        {isCopied ? "コピー済" : "コピー"}
                      </button>
                    </div>
                    {hasError && (
                      <p
                        id={`${field.id}-error`}
                        className="number-base-error"
                        role="alert"
                        aria-live="polite"
                      >
                        {errors[field.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {hasAnyValue && (
              <button
                type="button"
                className="number-base-clear-btn"
                onClick={handleClear}
                aria-label="すべてのフィールドをクリア"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "いずれかの入力欄に数値を入力すると、他の進数へ自動変換されます",
                "2進数は0と1のみ使用できます",
                "8進数は0〜7の数字のみ使用できます",
                "16進数は0〜9とA〜Fが使用できます（大文字・小文字どちらも可）",
                "各欄右の「コピー」ボタンで値をクリップボードにコピーできます",
              ],
            },
            {
              title: "進数の基礎知識",
              items: [
                "2進数（Binary）: コンピュータ内部で使われる0と1のみの表現",
                "8進数（Octal）: UNIXファイル権限など、0〜7の8つの数字",
                "10進数（Decimal）: 日常的に使う0〜9の10個の数字",
                "16進数（Hexadecimal）: 0〜9とA〜Fの16個の文字で、色コードやメモリアドレスに使用",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
