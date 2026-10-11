import { createFileRoute } from "@tanstack/react-router";
import { ConversionTool } from "~/components/ConversionTool";
import { useConversionTool } from "~/hooks/useConversionTool";
import type { ConversionConfig } from "~/types/converter";
import { decodeBase64, encodeBase64, validateBase64 } from "~/utils/base64";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

/**
 * @tool Base64エンコード・デコード
 * @description テキストをBase64形式にエンコード・デコードするブラウザ内完結ツール。
 * @example
 *   入力: "こんにちは"
 *   出力: "44GT44KT44Gr44Gh44Gv"
 * @limitations
 *   - UTF-8 テキストを対象とする。バイナリには非対応
 *   - 外部ネットワーク送信なし（全てブラウザ内で処理）
 */
export const Route = createFileRoute("/base64")({
  head: () => ({
    meta: [
      { title: "Base64エンコード・デコード | Web ツール集" },
      {
        name: "description",
        content: "テキストをBase64形式にエンコード・デコードするオンラインツール。",
      },
      { property: "og:title", content: "Base64エンコード・デコード | Web ツール集" },
      {
        property: "og:description",
        content: "テキストをBase64形式にエンコード・デコードするオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/base64` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Base64エンコード・デコード | Web ツール集" },
      {
        name: "twitter:description",
        content: "テキストをBase64形式にエンコード・デコードするオンラインツール。",
      },
    ],
  }),
  component: Base64Converter,
});

const BASE64_CONFIG: ConversionConfig<Record<string, never>> = {
  encode: encodeBase64,
  decode: decodeBase64,
  validate: validateBase64,
  defaultOptions: {},
};

function Base64Converter() {
  const {
    mode,
    input,
    output,
    encodeResult,
    decodeResult,
    error,
    setInput,
    handleModeChange,
    handleSwap,
    handleClear,
  } = useConversionTool(BASE64_CONFIG);

  const outputMeta =
    mode === "encode" && encodeResult
      ? `${encodeResult.inputBytes} バイト → ${encodeResult.outputLength} 文字`
      : mode === "decode" && decodeResult
        ? `${decodeResult.bytes.length} バイト`
        : null;

  return (
    <ConversionTool
      mode={mode}
      onModeChange={handleModeChange}
      input={input}
      onInputChange={setInput}
      output={output}
      onSwap={handleSwap}
      onClear={handleClear}
      encodeLabel="Base64 エンコード"
      decodeLabel="Base64 デコード"
      encodePlaceholder="エンコードしたいテキストを入力...&#10;例: こんにちは 世界"
      decodePlaceholder="デコードしたい Base64 文字列を入力...&#10;例: 44GT44KT44Gr44Gh44Gv"
      encodeInputLabel="入力テキスト"
      decodeInputLabel="Base64 文字列"
      encodeOutputLabel="Base64 出力"
      decodeOutputLabel="デコード結果"
      outputMeta={outputMeta}
      error={error}
      tips={[
        {
          title: "使い方",
          items: [
            "「エンコード」タブでテキストを Base64 形式に変換",
            "「デコード」タブで Base64 文字列を元のテキストに変換",
            "「⇄ 入れ替え」で出力を入力欄に移動し、モードを反転",
            "「コピー」で変換結果をクリップボードにコピー",
            "UTF-8 に対応（日本語・絵文字も扱えます）",
          ],
        },
      ]}
    />
  );
}
