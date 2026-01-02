/**
 * @fileoverview MUIベースのカラー入力コンポーネント
 * カラーピッカーとHEX値入力を組み合わせた色選択UI
 */

import { useCallback } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

/**
 * ColorInputコンポーネントのプロパティ
 */
interface ColorInputProps {
  /** 現在の色（HEX形式） */
  value: string;
  /** 色が変更された時のコールバック */
  onChange: (color: string) => void;
  /** 入力フィールドのID */
  id?: string;
  /** 無効化状態 */
  disabled?: boolean;
  /** アクセシビリティ用のラベル */
  ariaLabel?: string;
  /** ラベルテキスト */
  label?: string;
  /** カスタムクラス名 */
  className?: string;
  /** サイズ */
  size?: "small" | "medium";
}

/**
 * HEX形式の色かどうかを検証
 */
function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * MUIベースのカラーピッカーとHEXテキスト入力を組み合わせたコンポーネント
 *
 * @example
 * ```tsx
 * <ColorInput
 *   value={backgroundColor}
 *   onChange={setBackgroundColor}
 *   label="背景色"
 * />
 * ```
 */
export function ColorInput({
  value,
  onChange,
  id,
  disabled = false,
  ariaLabel = "色を選択",
  label,
  className = "",
  size = "small",
}: ColorInputProps) {
  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // #で始まらない場合は追加
      const formatted = newValue.startsWith("#") ? newValue : `#${newValue}`;
      onChange(formatted);
    },
    [onChange]
  );

  return (
    <Box className={className} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <TextField
        id={id}
        label={label}
        value={value}
        onChange={handleTextChange}
        disabled={disabled}
        size={size}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  component="input"
                  type="color"
                  value={isValidHex(value) ? value : "#000000"}
                  onChange={handleColorChange}
                  disabled={disabled}
                  aria-label={ariaLabel}
                  sx={{
                    width: 32,
                    height: 32,
                    p: 0,
                    border: "none",
                    borderRadius: 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    "&::-webkit-color-swatch-wrapper": {
                      p: 0,
                    },
                    "&::-webkit-color-swatch": {
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    },
                  }}
                />
              </InputAdornment>
            ),
          },
          htmlInput: {
            "aria-label": `${ariaLabel}のHEX値`,
            maxLength: 7,
            pattern: "^#[0-9A-Fa-f]{6}$",
          },
        }}
        sx={{
          minWidth: 150,
          "& .MuiInputBase-input": {
            fontFamily: "monospace",
          },
        }}
      />
    </Box>
  );
}
