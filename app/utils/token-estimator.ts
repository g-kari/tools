/**
 * LLMトークン推定ユーティリティ
 *
 * 各種LLMモデルに対してテキストのトークン数をヒューリスティックに推定します。
 * 実際のトークナイザー（tiktoken等）ではなく文字種別統計による近似値です。
 *
 * 文字種別トークン比率:
 * - 英語/Latin:   約 4 文字/トークン
 * - CJK (日中韓): 約 1.5 文字/トークン
 * - コード/記号:  約 3.5 文字/トークン
 * - その他:       約 3.0 文字/トークン
 */

/** LLMモデル情報 */
export interface ModelInfo {
  /** モデル名 */
  name: string;
  /** プロバイダー名 */
  provider: string;
  /** 入力トークン価格（USD/1Mトークン） */
  inputPricePer1M: number;
  /** 出力トークン価格（USD/1Mトークン） */
  outputPricePer1M: number;
  /** コンテキストウィンドウ（トークン） */
  contextWindow: number;
}

/** 1モデルあたりのトークン推定結果 */
export interface ModelTokenEstimate {
  model: ModelInfo;
  /** 推定トークン数 */
  estimatedTokens: number;
  /** 入力コスト推定（USD） */
  inputCost: number;
  /** コンテキストウィンドウ使用率（0〜1） */
  contextUsage: number;
}

/** テキスト全体のトークン分析結果 */
export interface TokenAnalysisResult {
  /** 総文字数 */
  totalChars: number;
  /** Latin/ASCII 文字数 */
  latinChars: number;
  /** CJK 文字数（漢字・ひらがな・カタカナ・ハングル） */
  cjkChars: number;
  /** コード/記号文字数 */
  codeChars: number;
  /** その他の文字数 */
  otherChars: number;
  /** 推定総トークン数 */
  estimatedTokens: number;
  /** 単語数（半角スペース区切り） */
  wordCount: number;
  /** 各モデル別の推定結果 */
  modelEstimates: ModelTokenEstimate[];
}

/** 文字種別トークン変換比率 */
const CHARS_PER_TOKEN = {
  latin: 4.0,
  cjk: 1.5,
  code: 3.5,
  other: 3.0,
} as const;

/**
 * 主要LLMモデル一覧
 * 価格は2025年初頭時点の概算値（変動する可能性あり）
 */
export const LLM_MODELS: ModelInfo[] = [
  {
    name: "GPT-4o",
    provider: "OpenAI",
    inputPricePer1M: 2.5,
    outputPricePer1M: 10.0,
    contextWindow: 128_000,
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.6,
    contextWindow: 128_000,
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    inputPricePer1M: 0.5,
    outputPricePer1M: 1.5,
    contextWindow: 16_385,
  },
  {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
    contextWindow: 200_000,
  },
  {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    contextWindow: 200_000,
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    inputPricePer1M: 15.0,
    outputPricePer1M: 75.0,
    contextWindow: 200_000,
  },
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    inputPricePer1M: 1.25,
    outputPricePer1M: 5.0,
    contextWindow: 2_000_000,
  },
  {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    inputPricePer1M: 0.075,
    outputPricePer1M: 0.3,
    contextWindow: 1_000_000,
  },
];

/**
 * 文字がCJK（日中韓）文字かどうかを判定する
 * @param cp - コードポイント
 * @returns CJK文字であれば true
 */
function isCjkCodePoint(cp: number): boolean {
  return (
    (cp >= 0x3040 && cp <= 0x30ff) || // ひらがな・カタカナ
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK統合漢字
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK統合漢字拡張A
    (cp >= 0xac00 && cp <= 0xd7af) || // ハングル音節
    (cp >= 0x20000 && cp <= 0x2a6df) // CJK統合漢字拡張B
  );
}

/**
 * 文字がコード/記号かどうかを判定する
 * @param char - 1文字
 * @returns コード/記号文字であれば true
 */
function isCodeChar(char: string): boolean {
  return /[{}()[\]<>;:=!@#$%^&*+\-|\\/?~`]/.test(char);
}

/**
 * テキストのトークン数を推定する
 * @param text - 推定対象のテキスト
 * @returns 推定トークン数
 */
export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;

  let latinChars = 0;
  let cjkChars = 0;
  let codeChars = 0;
  let otherChars = 0;

  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    if (isCjkCodePoint(cp)) {
      cjkChars++;
    } else if (isCodeChar(char)) {
      codeChars++;
    } else if (/[a-zA-Z0-9\s]/.test(char)) {
      latinChars++;
    } else {
      otherChars++;
    }
  }

  const tokens =
    latinChars / CHARS_PER_TOKEN.latin +
    cjkChars / CHARS_PER_TOKEN.cjk +
    codeChars / CHARS_PER_TOKEN.code +
    otherChars / CHARS_PER_TOKEN.other;

  return Math.ceil(tokens);
}

/**
 * 単語数を推定する（半角スペース区切り）
 * @param text - テキスト
 * @returns 単語数
 */
function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

/**
 * テキストのトークン分析を行う
 * @param text - 分析対象テキスト
 * @returns トークン分析結果
 */
export function analyzeTokens(text: string): TokenAnalysisResult {
  let latinChars = 0;
  let cjkChars = 0;
  let codeChars = 0;
  let otherChars = 0;
  let totalChars = 0;

  for (const char of text) {
    totalChars++;
    const cp = char.codePointAt(0) ?? 0;
    if (isCjkCodePoint(cp)) {
      cjkChars++;
    } else if (isCodeChar(char)) {
      codeChars++;
    } else if (/[a-zA-Z0-9\s]/.test(char)) {
      latinChars++;
    } else {
      otherChars++;
    }
  }

  const estimatedTokens = estimateTokens(text);

  const modelEstimates: ModelTokenEstimate[] = LLM_MODELS.map((model) => ({
    model,
    estimatedTokens,
    inputCost: (estimatedTokens / 1_000_000) * model.inputPricePer1M,
    contextUsage: Math.min(1, estimatedTokens / model.contextWindow),
  }));

  return {
    totalChars,
    latinChars,
    cjkChars,
    codeChars,
    otherChars,
    estimatedTokens,
    wordCount: countWords(text),
    modelEstimates,
  };
}

/**
 * 価格をフォーマットする（小さい数値に対応）
 * @param usd - USD金額
 * @returns フォーマット済み文字列
 */
export function formatCost(usd: number): string {
  if (usd === 0) return "$0.000000";
  if (usd < 0.000001) return "< $0.000001";
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

/**
 * コンテキストウィンドウ使用率のバッジクラスを返す
 * @param usage - 使用率（0〜1）
 * @returns CSSクラス名
 */
export function getContextUsageClass(usage: number): string {
  if (usage >= 0.9) return "te-ctx-danger";
  if (usage >= 0.7) return "te-ctx-warning";
  return "te-ctx-ok";
}
