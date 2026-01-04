/**
 * @fileoverview 結果表示カードコンポーネント
 * 各ツールの結果を統一された形式で表示
 */

import * as React from "react";

/**
 * 結果行の型定義
 */
export interface ResultRow {
  /** 行のラベル */
  label: string;
  /** 表示する値 */
  value: React.ReactNode;
  /** リスト形式で表示するかどうか */
  isList?: boolean;
  /** 値がない場合のフォールバックテキスト */
  fallback?: string;
}

/**
 * ResultCard コンポーネントのProps
 */
interface ResultCardProps {
  /** 表示する行の配列 */
  rows: ResultRow[];
  /** カードのタイトル（オプション） */
  title?: string;
  /** カードのID（アクセシビリティ用） */
  id?: string;
  /** aria-live属性の値 */
  ariaLive?: "polite" | "assertive" | "off";
}

/**
 * 結果表示カードコンポーネント
 *
 * 各ツールの処理結果を統一されたラベル・値形式で表示します。
 * アクセシビリティに対応し、リスト形式の値も表示可能です。
 *
 * @example
 * ```tsx
 * <ResultCard
 *   title="検索結果"
 *   rows={[
 *     { label: "ドメイン", value: "example.com" },
 *     { label: "登録者", value: "John Doe", fallback: "不明" },
 *     { label: "ネームサーバー", value: ["ns1.example.com", "ns2.example.com"], isList: true },
 *   ]}
 * />
 * ```
 */
export function ResultCard({
  rows,
  title,
  id,
  ariaLive = "polite",
}: ResultCardProps) {
  return (
    <section aria-labelledby={id} aria-live={ariaLive}>
      {title && (
        <h2 id={id} className="section-title">
          {title}
        </h2>
      )}
      <div className="result-card">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="result-row">
            <div className="result-label">{row.label}</div>
            <div className="result-value">
              {row.isList && Array.isArray(row.value) ? (
                <ul className="result-list">
                  {row.value.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              ) : (
                row.value ?? row.fallback ?? "-"
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 単一の結果行コンポーネント
 *
 * ResultCard の外で単独で結果行を表示する場合に使用します。
 */
export function ResultRow({ label, value, isList, fallback }: ResultRow) {
  return (
    <div className="result-row">
      <div className="result-label">{label}</div>
      <div className="result-value">
        {isList && Array.isArray(value) ? (
          <ul className="result-list">
            {value.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          value ?? fallback ?? "-"
        )}
      </div>
    </div>
  );
}
