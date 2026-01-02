/**
 * @fileoverview プリセットボタンコンポーネント
 * サイズやアスペクト比などの定義済みオプションを選択するためのボタングループ
 */

import { type ReactNode } from "react";

/**
 * プリセットアイテムの基本型
 */
interface PresetItem {
  /** 表示ラベル */
  label: string;
  /** 一意のキー（省略時はlabelを使用） */
  key?: string;
}

/**
 * PresetButtonsコンポーネントのプロパティ
 */
interface PresetButtonsProps<T extends PresetItem> {
  /** プリセットアイテムの配列 */
  items: T[];
  /** アイテムが選択された時のコールバック */
  onSelect: (item: T) => void;
  /** 現在選択されているかどうかを判定する関数 */
  isSelected?: (item: T) => boolean;
  /** 無効化状態 */
  disabled?: boolean;
  /** アクセシビリティ用のグループラベル */
  ariaLabel?: string;
  /** ボタンのスタイルバリアント */
  variant?: "default" | "chip";
  /** 追加のサブラベルをレンダリングする関数 */
  renderSubLabel?: (item: T) => ReactNode;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * プリセット選択用のボタングループコンポーネント
 *
 * @example
 * ```tsx
 * const PRESET_SIZES = [
 *   { label: "SNSアイコン", width: 400, height: 400 },
 *   { label: "OGP画像", width: 1200, height: 630 },
 * ];
 *
 * <PresetButtons
 *   items={PRESET_SIZES}
 *   onSelect={(preset) => handlePresetSelect(preset)}
 *   isSelected={(preset) => width === preset.width && height === preset.height}
 *   renderSubLabel={(preset) => `${preset.width}×${preset.height}`}
 *   ariaLabel="プリセットサイズ選択"
 * />
 * ```
 */
export function PresetButtons<T extends PresetItem>({
  items,
  onSelect,
  isSelected,
  disabled = false,
  ariaLabel = "プリセット選択",
  variant = "default",
  renderSubLabel,
  className = "",
}: PresetButtonsProps<T>) {
  const buttonClass = variant === "chip" ? "btn-chip" : "btn-preset";

  return (
    <div
      className={`preset-buttons ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const key = item.key ?? item.label;
        const selected = isSelected?.(item) ?? false;

        return (
          <button
            key={key}
            type="button"
            className={`${buttonClass} ${selected ? "active" : ""}`}
            onClick={() => onSelect(item)}
            disabled={disabled}
            aria-label={item.label}
            aria-pressed={selected}
          >
            {item.label}
            {renderSubLabel && (
              <span className="preset-size">{renderSubLabel(item)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * アスペクト比プリセット用の型定義
 */
export interface AspectRatioPreset extends PresetItem {
  /** アスペクト比（nullは自由比率） */
  ratio: number | null;
}

/**
 * サイズプリセット用の型定義
 */
export interface SizePreset extends PresetItem {
  /** 幅 */
  width: number;
  /** 高さ */
  height: number;
}
