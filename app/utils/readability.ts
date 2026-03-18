/**
 * 可読性スコア計算ユーティリティ
 *
 * 対応メトリクス（英語）:
 * - Flesch Reading Ease（高いほど読みやすい）
 * - Flesch-Kincaid Grade Level（米国学年レベル）
 * - Gunning Fog Index（教育年数）
 * - SMOG Index（理解に必要な教育年数）
 *
 * 対応メトリクス（日本語）:
 * - 平均文長（文字数）
 * - 漢字密度・ひらがな密度・カタカナ密度
 * - 推定難易度スコア
 */

/** 英語テキストの可読性スコア */
export interface EnglishReadabilityScores {
  /** Flesch Reading Ease (0〜100; 高いほど読みやすい) */
  fleschReadingEase: number;
  /** Flesch Reading Ease の難易度ラベル */
  fleschLabel: string;
  /** Flesch-Kincaid Grade Level (米国学年) */
  fleschKincaidGrade: number;
  /** Gunning Fog Index */
  gunningFog: number;
  /** SMOG Index */
  smogIndex: number | null;
  /** 音節の総数 */
  totalSyllables: number;
  /** 複雑な単語数（3音節以上） */
  complexWordCount: number;
  /** 単語数 */
  wordCount: number;
  /** 文章数 */
  sentenceCount: number;
  /** 平均文長（単語数） */
  avgWordsPerSentence: number;
  /** 平均音節数/単語 */
  avgSyllablesPerWord: number;
}

/** 日本語テキストの可読性スコア */
export interface JapaneseReadabilityScores {
  /** 文章数 */
  sentenceCount: number;
  /** 文字数（空白除く） */
  charCount: number;
  /** 平均文長（文字数） */
  avgCharsPerSentence: number;
  /** 漢字数 */
  kanjiCount: number;
  /** 漢字密度（%） */
  kanjiDensity: number;
  /** ひらがな密度（%） */
  hiraganaDensity: number;
  /** カタカナ密度（%） */
  katakanaDensity: number;
  /** 推定難易度スコア（0〜100; 高いほど難しい） */
  difficultyScore: number;
  /** 難易度ラベル */
  difficultyLabel: string;
}

/** 可読性分析結果 */
export interface ReadabilityResult {
  /** 検出された言語 */
  language: 'english' | 'japanese' | 'mixed';
  english: EnglishReadabilityScores | null;
  japanese: JapaneseReadabilityScores | null;
}

/** Flesch Reading Ease のラベルマッピング */
const FLESCH_LABELS: Array<{ min: number; label: string; description: string }> = [
  { min: 90, label: '非常に簡単', description: '小学4-5年生レベル' },
  { min: 80, label: '簡単', description: '一般的な読者向け' },
  { min: 70, label: 'やや簡単', description: '中学生レベル' },
  { min: 60, label: '標準', description: '高校生レベル' },
  { min: 50, label: 'やや難しい', description: '大学受験レベル' },
  { min: 30, label: '難しい', description: '大卒レベル' },
  { min: 0, label: '非常に難しい', description: '専門家レベル' },
];

/** 日本語難易度ラベルマッピング */
const JP_DIFFICULTY_LABELS: Array<{ min: number; label: string }> = [
  { min: 80, label: '非常に難しい' },
  { min: 60, label: '難しい' },
  { min: 40, label: '標準' },
  { min: 20, label: '簡単' },
  { min: 0, label: '非常に簡単' },
];

/**
 * 英語の単語の音節数を推定する（ヒューリスティック）
 * @param word - 英語単語
 * @returns 推定音節数（最低1）
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;

  // サイレントeを除去
  let normalized = w.replace(/e$/, '');

  // 母音グループをカウント
  const vowelGroups = normalized.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // 特定の接尾辞の補正
  if (w.endsWith('le') && w.length > 2 && !/[aeiouy]/.test(w[w.length - 3])) {
    count += 1;
  }
  if (w.endsWith('es') || w.endsWith('ed')) {
    // 必要に応じて補正（ここでは単純化）
  }

  return Math.max(1, count);
}

/**
 * 英語テキストを文に分割する
 * @param text - 入力テキスト
 * @returns 文の配列
 */
function splitEnglishSentences(text: string): string[] {
  return text
    .trim()
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 英語テキストを単語に分割する
 * @param text - 入力テキスト
 * @returns 単語の配列
 */
function tokenizeEnglish(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z'-]/g, ''))
    .filter((w) => w.length > 0);
}

/**
 * Flesch Reading Ease のラベルを取得する
 * @param score - スコア
 * @returns ラベルオブジェクト
 */
export function getFleschLabel(score: number): { label: string; description: string } {
  for (const entry of FLESCH_LABELS) {
    if (score >= entry.min) {
      return { label: entry.label, description: entry.description };
    }
  }
  return { label: '非常に難しい', description: '専門家レベル' };
}

/**
 * 日本語難易度ラベルを取得する
 * @param score - 難易度スコア（0〜100）
 * @returns ラベル文字列
 */
export function getJapaneseDifficultyLabel(score: number): string {
  for (const entry of JP_DIFFICULTY_LABELS) {
    if (score >= entry.min) {
      return entry.label;
    }
  }
  return '非常に簡単';
}

/**
 * 英語テキストの可読性スコアを計算する
 * @param text - 英語テキスト
 * @returns 可読性スコアオブジェクト、または計算不可能な場合 null
 */
export function analyzeEnglishReadability(text: string): EnglishReadabilityScores | null {
  const sentences = splitEnglishSentences(text);
  const words = tokenizeEnglish(text);

  const sentenceCount = sentences.length;
  const wordCount = words.length;

  if (sentenceCount === 0 || wordCount === 0) return null;

  // 音節カウント
  let totalSyllables = 0;
  let complexWordCount = 0;
  for (const word of words) {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) complexWordCount++;
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;

  // Flesch Reading Ease
  const fleschReadingEase =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const clampedFlesch = Math.max(0, Math.min(100, fleschReadingEase));
  const fleschInfo = getFleschLabel(clampedFlesch);

  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade =
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Gunning Fog Index
  const gunningFog = 0.4 * (avgWordsPerSentence + 100 * (complexWordCount / wordCount));

  // SMOG Index（30文以上で有効）
  let smogIndex: number | null = null;
  if (sentenceCount >= 3) {
    smogIndex = 3 + Math.sqrt(complexWordCount * (30 / sentenceCount));
  }

  return {
    fleschReadingEase: Math.round(clampedFlesch * 10) / 10,
    fleschLabel: fleschInfo.label,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    gunningFog: Math.round(gunningFog * 10) / 10,
    smogIndex: smogIndex !== null ? Math.round(smogIndex * 10) / 10 : null,
    totalSyllables,
    complexWordCount,
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

/**
 * 日本語テキストを文に分割する（句点・感嘆符・疑問符で区切り）
 * @param text - 日本語テキスト
 * @returns 文の配列
 */
function splitJapaneseSentences(text: string): string[] {
  return text
    .trim()
    .split(/[。！？!?.]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 日本語テキストの可読性スコアを計算する
 * @param text - 日本語テキスト
 * @returns 可読性スコアオブジェクト、または計算不可能な場合 null
 */
export function analyzeJapaneseReadability(text: string): JapaneseReadabilityScores | null {
  const sentences = splitJapaneseSentences(text);
  // 空白・改行を除いた文字
  const chars = [...text.replace(/[\s\r\n]/g, '')];
  const charCount = chars.length;

  if (sentences.length === 0 || charCount === 0) return null;

  const sentenceCount = sentences.length;
  const avgCharsPerSentence = charCount / sentenceCount;

  // 漢字（CJK Unified Ideographs）
  const kanjiCount = chars.filter((c) => /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(c)).length;
  // ひらがな
  const hiraganaCount = chars.filter((c) => /[\u3041-\u3096]/.test(c)).length;
  // カタカナ
  const katakanaCount = chars.filter((c) => /[\u30A0-\u30FF]/.test(c)).length;

  const kanjiDensity = Math.round((kanjiCount / charCount) * 1000) / 10;
  const hiraganaDensity = Math.round((hiraganaCount / charCount) * 1000) / 10;
  const katakanaDensity = Math.round((katakanaCount / charCount) * 1000) / 10;

  // 難易度スコア計算
  // 漢字密度（高いほど難しい）と平均文長（長いほど難しい）から算出
  const kanjiWeight = Math.min(100, kanjiDensity * 2);
  const sentenceLengthWeight = Math.min(100, avgCharsPerSentence * 1.5);
  const difficultyScore = Math.round((kanjiWeight * 0.6 + sentenceLengthWeight * 0.4));
  const clampedDifficulty = Math.max(0, Math.min(100, difficultyScore));

  return {
    sentenceCount,
    charCount,
    avgCharsPerSentence: Math.round(avgCharsPerSentence * 10) / 10,
    kanjiCount,
    kanjiDensity,
    hiraganaDensity,
    katakanaDensity,
    difficultyScore: clampedDifficulty,
    difficultyLabel: getJapaneseDifficultyLabel(clampedDifficulty),
  };
}

/**
 * テキストの言語を自動検出する
 * @param text - 入力テキスト
 * @returns 検出された言語
 */
export function detectLanguage(text: string): 'english' | 'japanese' | 'mixed' {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'english';

  const chars = [...trimmed];
  const japaneseChars = chars.filter((c) =>
    /[\u3040-\u30FF\u4E00-\u9FFF\u3400-\u4DBF]/.test(c)
  ).length;
  const englishChars = chars.filter((c) => /[a-zA-Z]/.test(c)).length;
  const total = japaneseChars + englishChars;

  if (total === 0) return 'english';

  const jpRatio = japaneseChars / total;
  if (jpRatio >= 0.7) return 'japanese';
  if (jpRatio >= 0.2) return 'mixed';
  return 'english';
}

/**
 * テキストの可読性を総合的に分析する
 * @param text - 分析対象テキスト
 * @returns 可読性分析結果
 */
export function analyzeReadability(text: string): ReadabilityResult {
  const language = detectLanguage(text);

  const english =
    language === 'english' || language === 'mixed'
      ? analyzeEnglishReadability(text)
      : null;

  const japanese =
    language === 'japanese' || language === 'mixed'
      ? analyzeJapaneseReadability(text)
      : null;

  return { language, english, japanese };
}
