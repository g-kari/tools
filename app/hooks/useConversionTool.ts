/**
 * @fileoverview 変換ツールの共通ロジックを提供するフック
 *
 * エンコード/デコード切替・入力状態・オプション・結果計算・エラー判定を一元化する。
 * Base 系エンコードや将来的な他の可逆変換系ツールで再利用できる。
 */

import { useCallback, useMemo, useState } from "react";
import type {
  ConversionConfig,
  ConversionMode,
  DecodeSuccessResult,
  EncodeResult,
} from "~/types/converter";

interface UseConversionToolReturn<T> {
  /** 現在のモード */
  mode: ConversionMode;
  /** 入力テキスト */
  input: string;
  /** ツール固有オプション */
  options: T;
  /** 表示すべき出力（エンコード結果 or デコード結果。エラー時は空文字） */
  output: string;
  /** エンコード結果（エンコードモードかつ入力がある場合のみ） */
  encodeResult: EncodeResult | null;
  /** デコード成功結果（デコードモードかつ成功時のみ） */
  decodeResult: DecodeSuccessResult | null;
  /** デコードエラーメッセージ（デコードモードかつエラー時のみ） */
  error: string | null;
  /** 入力テキストを更新する */
  setInput: (text: string) => void;
  /** オプションを更新する（部分更新） */
  updateOptions: (patch: Partial<T>) => void;
  /** モードを切り替える（入力はクリアされる） */
  handleModeChange: (mode: ConversionMode) => void;
  /** 出力を入力欄に入れ替え、モードも反転する */
  handleSwap: () => void;
  /** 入力をクリアする */
  handleClear: () => void;
}

/**
 * 変換ツールの共通状態管理フック
 *
 * @remarks
 * `config` に含まれる encode/decode/validate 関数は安定参照で渡すこと
 * （モジュールトップレベル定義、または useMemo/useCallback でラップ）。
 * 毎レンダーで新しい関数を渡すと再計算が走ります。
 *
 * @param config - encode/decode/validate/defaultOptions を定義する変換コンフィグ
 * @returns 変換状態とハンドラ
 *
 * @example
 * ```ts
 * const {
 *   mode, input, output, error,
 *   setInput, handleModeChange, handleSwap, handleClear,
 * } = useConversionTool({
 *   encode: (text) => ({ encoded: btoa(text), inputBytes: text.length, outputLength: 0 }),
 *   decode: (text) => ({ success: true, decoded: atob(text), bytes: new Uint8Array() }),
 *   defaultOptions: {},
 * });
 * ```
 */
export function useConversionTool<T>(config: ConversionConfig<T>): UseConversionToolReturn<T> {
  const { encode, decode, validate, defaultOptions } = config;
  const [mode, setMode] = useState<ConversionMode>("encode");
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<T>(defaultOptions);

  const encodeResult = useMemo<EncodeResult | null>(() => {
    if (mode !== "encode" || !input) return null;
    return encode(input, options);
  }, [mode, input, options, encode]);

  const { decodeResult, error } = useMemo<{
    decodeResult: DecodeSuccessResult | null;
    error: string | null;
  }>(() => {
    if (mode !== "decode" || !input.trim()) {
      return { decodeResult: null, error: null };
    }
    const validationError = validate?.(input, options);
    if (validationError) {
      return { decodeResult: null, error: validationError };
    }
    const result = decode(input, options);
    if (!result.success) {
      return { decodeResult: null, error: result.error };
    }
    return { decodeResult: result, error: null };
  }, [mode, input, options, decode, validate]);

  const output = mode === "encode" ? (encodeResult?.encoded ?? "") : (decodeResult?.decoded ?? "");

  const updateOptions = useCallback((patch: Partial<T>) => {
    setOptions((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleModeChange = useCallback((newMode: ConversionMode) => {
    setMode(newMode);
    setInput("");
  }, []);

  const handleSwap = useCallback(() => {
    if (!output) return;
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInput(output);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  return {
    mode,
    input,
    options,
    output,
    encodeResult,
    decodeResult,
    error,
    setInput,
    updateOptions,
    handleModeChange,
    handleSwap,
    handleClear,
  };
}
