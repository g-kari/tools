/**
 * テキスト統計・分析ユーティリティ
 */

/** 英語ストップワード一覧 */
const STOP_WORDS_EN = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'not', 'no', 'nor',
  'so', 'yet', 'both', 'either', 'neither', 'as', 'if', 'then', 'than',
  'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we',
  'our', 'you', 'your', 'he', 'she', 'his', 'her', 'they', 'their', 'them',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all',
  'each', 'every', 'more', 'most', 'other', 'some', 'such', 'into', 'up',
  'out', 'about', 'after', 'before', 'between', 'through', 'during',
]);

/** テキスト統計の型定義 */
export interface TextStats {
  /** 文字数（スペース含む） */
  charCount: number;
  /** 文字数（スペース除く） */
  charCountNoSpaces: number;
  /** 単語数 */
  wordCount: number;
  /** 文章数 */
  sentenceCount: number;
  /** 段落数 */
  paragraphCount: number;
  /** 行数 */
  lineCount: number;
  /** 推定読書時間（秒） */
  readingTimeSeconds: number;
  /** ユニーク単語数 */
  uniqueWordCount: number;
  /** 平均単語長 */
  averageWordLength: number;
  /** 平均文長（単語数） */
  averageSentenceLength: number;
  /** 最頻出単語（最大10件） */
  topWords: Array<{ word: string; count: number }>;
}

/**
 * 文字数をカウントする（スペース含む）
 * @param text - カウント対象のテキスト
 * @returns 文字数
 */
export function countChars(text: string): number {
  return [...text].length;
}

/**
 * 文字数をカウントする（スペース除く）
 * @param text - カウント対象のテキスト
 * @returns 文字数（スペース除く）
 */
export function countCharsNoSpaces(text: string): number {
  return [...text.replace(/\s/g, '')].length;
}

/**
 * 単語をトークン化する
 * @param text - トークン化対象のテキスト
 * @returns 単語の配列
 */
export function tokenizeWords(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed === '') return [];
  return trimmed
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w\u3040-\u30FF\u4E00-\u9FFF]+|[^\w\u3040-\u30FF\u4E00-\u9FFF]+$/g, ''))
    .filter((w) => w.length > 0);
}

/**
 * 単語数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 単語数
 */
export function countWords(text: string): number {
  return tokenizeWords(text).length;
}

/**
 * 文章数をカウントする（句点・ピリオド・感嘆符・疑問符で区切り）
 * @param text - カウント対象のテキスト
 * @returns 文章数
 */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  const sentences = trimmed
    .split(/[.!?。！？]+/)
    .filter((s) => s.trim().length > 0);
  return sentences.length;
}

/**
 * 段落数をカウントする（空行で区切り）
 * @param text - カウント対象のテキスト
 * @returns 段落数
 */
export function countParagraphs(text: string): number {
  if (text.trim() === '') return 0;
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

/**
 * 行数をカウントする
 * @param text - カウント対象のテキスト
 * @returns 行数
 */
export function countLines(text: string): number {
  if (text === '') return 0;
  return text.split(/\r\n|\r|\n/).length;
}

/**
 * 推定読書時間を計算する（平均読書速度: 200 WPM）
 * @param wordCount - 単語数
 * @returns 推定読書時間（秒）
 */
export function estimateReadingTimeSeconds(wordCount: number): number {
  const WORDS_PER_MINUTE = 200;
  return Math.ceil((wordCount / WORDS_PER_MINUTE) * 60);
}

/**
 * ユニーク単語数を取得する（大文字小文字を区別しない）
 * @param text - カウント対象のテキスト
 * @returns ユニーク単語数
 */
export function countUniqueWords(text: string): number {
  const words = tokenizeWords(text).map((w) => w.toLowerCase());
  return new Set(words).size;
}

/**
 * 平均単語長を計算する
 * @param text - 対象テキスト
 * @returns 平均単語長（小数第1位まで）
 */
export function getAverageWordLength(text: string): number {
  const words = tokenizeWords(text);
  if (words.length === 0) return 0;
  const totalLength = words.reduce((sum, w) => sum + [...w].length, 0);
  return Math.round((totalLength / words.length) * 10) / 10;
}

/**
 * 平均文長（単語数）を計算する
 * @param text - 対象テキスト
 * @returns 平均文長（小数第1位まで）
 */
export function getAverageSentenceLength(text: string): number {
  const sentences = text
    .trim()
    .split(/[.!?。！？]+/)
    .filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  const totalWords = sentences.reduce((sum, s) => sum + countWords(s), 0);
  return Math.round((totalWords / sentences.length) * 10) / 10;
}

/**
 * 最頻出単語を取得する（ストップワードを除外）
 * @param text - 対象テキスト
 * @param limit - 取得件数（デフォルト: 10）
 * @returns 単語と出現回数の配列（頻度降順）
 */
export function getTopWords(
  text: string,
  limit = 10
): Array<{ word: string; count: number }> {
  const words = tokenizeWords(text).map((w) => w.toLowerCase());
  const freq = new Map<string, number>();

  for (const word of words) {
    if (word.length < 2) continue;
    if (STOP_WORDS_EN.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/**
 * テキストを総合的に分析する
 * @param text - 分析対象のテキスト
 * @returns テキスト統計オブジェクト
 */
export function analyzeText(text: string): TextStats {
  const wordCount = countWords(text);
  return {
    charCount: countChars(text),
    charCountNoSpaces: countCharsNoSpaces(text),
    wordCount,
    sentenceCount: countSentences(text),
    paragraphCount: countParagraphs(text),
    lineCount: countLines(text),
    readingTimeSeconds: estimateReadingTimeSeconds(wordCount),
    uniqueWordCount: countUniqueWords(text),
    averageWordLength: getAverageWordLength(text),
    averageSentenceLength: getAverageSentenceLength(text),
    topWords: getTopWords(text),
  };
}

/**
 * 読書時間を人間が読みやすい形式に変換する
 * @param seconds - 秒数
 * @returns フォーマット済み文字列（例: "1分30秒"）
 */
export function formatReadingTime(seconds: number): string {
  if (seconds === 0) return '0秒';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}秒`;
  if (remainingSeconds === 0) return `${minutes}分`;
  return `${minutes}分${remainingSeconds}秒`;
}
