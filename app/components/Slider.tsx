/**
 * @fileoverview MUIベースの再利用可能なスライダーコンポーネント
 */

import { useId } from "react";
import MuiSlider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormHelperText from "@mui/material/FormHelperText";

/**
 * スライダーコンポーネントのProps
 */
export interface SliderProps {
  /** ラベルテキスト */
  label: string;
  /** 現在の値 */
  value: number;
  /** 値変更時のコールバック */
  onChange: (value: number) => void;
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
  /** ステップ値（デフォルト: 1） */
  step?: number;
  /** 無効状態 */
  disabled?: boolean;
  /** 単位（例: "%", "px"） */
  unit?: string;
  /** ヘルプテキスト（スクリーンリーダー用） */
  helpText?: string;
  /** カスタムID（省略時は自動生成） */
  id?: string;
  /** ラベルに値を表示するか（デフォルト: true） */
  showValue?: boolean;
  /** カスタムの値フォーマット関数 */
  formatValue?: (value: number) => string;
  /** CSSクラス名 */
  className?: string;
  /** サイズ（デフォルト: medium） */
  size?: "small" | "medium";
}

/**
 * MUIベースの再利用可能なスライダーコンポーネント
 *
 * @example
 * ```tsx
 * <Slider
 *   label="音量"
 *   value={volume}
 *   onChange={setVolume}
 *   min={0}
 *   max={100}
 *   unit="%"
 * />
 * ```
 *
 * @example カスタムフォーマット
 * ```tsx
 * <Slider
 *   label="画質"
 *   value={quality}
 *   onChange={setQuality}
 *   min={1}
 *   max={100}
 *   formatValue={(v) => `${v}% (${v < 50 ? '低' : v < 80 ? '中' : '高'})`}
 * />
 * ```
 */
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  unit = "",
  helpText,
  id: customId,
  showValue = true,
  formatValue,
  className,
  size = "medium",
}: SliderProps) {
  const generatedId = useId();
  const id = customId ?? generatedId;

  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  return (
    <Box className={className} sx={{ width: "100%" }}>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{
          display: "block",
          mb: 1,
          color: "text.primary",
          fontWeight: 500,
        }}
      >
        {label}
        {showValue && `: ${displayValue}`}
      </Typography>
      <MuiSlider
        id={id}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        size={size}
        valueLabelDisplay="auto"
        valueLabelFormat={formatValue ?? ((v) => `${v}${unit}`)}
        aria-label={label}
        aria-describedby={helpText ? `${id}-help` : undefined}
      />
      {helpText && (
        <FormHelperText id={`${id}-help`} sx={{ mt: 0.5 }}>
          {helpText}
        </FormHelperText>
      )}
    </Box>
  );
}
