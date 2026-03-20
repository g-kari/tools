/**
 * 和暦（元号）変換ユーティリティ
 * 西暦と和暦（明治・大正・昭和・平成・令和）を相互変換する
 */

/** 元号の定義 */
export interface Era {
  /** 元号名（漢字） */
  name: string;
  /** ローマ字表記 */
  romaji: string;
  /** 元号が始まる西暦年 */
  startYear: number;
  /** 元号が始まる月（1-12） */
  startMonth: number;
  /** 元号が始まる日（1-31） */
  startDay: number;
  /** 元号が終わる西暦年（null = 現在も継続中） */
  endYear: number | null;
}

/** 元号一覧（新しい順） */
export const ERAS: readonly Era[] = [
  { name: "令和", romaji: "Reiwa", startYear: 2019, startMonth: 5, startDay: 1, endYear: null },
  { name: "平成", romaji: "Heisei", startYear: 1989, startMonth: 1, startDay: 8, endYear: 2019 },
  { name: "昭和", romaji: "Showa", startYear: 1926, startMonth: 12, startDay: 25, endYear: 1989 },
  { name: "大正", romaji: "Taisho", startYear: 1912, startMonth: 7, startDay: 30, endYear: 1926 },
  { name: "明治", romaji: "Meiji", startYear: 1868, startMonth: 1, startDay: 25, endYear: 1912 },
] as const;

/** 和暦変換結果 */
export interface WarekiResult {
  /** 元号名 */
  eraName: string;
  /** ローマ字 */
  eraRomaji: string;
  /** 元号年数 */
  year: number;
  /** 西暦年 */
  westernYear: number;
  /** 遷移年（同じ西暦に複数の元号がある場合）かどうか */
  isTransitionYear: boolean;
}

/**
 * 西暦年を和暦に変換する
 * 遷移年（1912・1926・1989・2019など）は複数の結果を返す
 * @param westernYear - 変換する西暦年
 * @returns 和暦変換結果の配列（通常は1つ、遷移年は2つ）
 */
export function seirekiToWareki(westernYear: number): WarekiResult[] {
  if (!Number.isInteger(westernYear)) return [];
  if (westernYear < 1868) return [];

  const results: WarekiResult[] = [];

  for (const era of ERAS) {
    if (westernYear < era.startYear) continue;
    if (era.endYear !== null && westernYear > era.endYear) continue;

    const eraYear = westernYear - era.startYear + 1;

    // 遷移年チェック: 同じ西暦に別の元号も存在するか
    const isTransition = westernYear === era.startYear || westernYear === era.endYear;

    results.push({
      eraName: era.name,
      eraRomaji: era.romaji,
      year: eraYear,
      westernYear,
      isTransitionYear: isTransition,
    });
  }

  return results;
}

/**
 * 和暦を西暦年に変換する
 * @param eraName - 元号名（漢字）
 * @param eraYear - 元号年数（1以上の正の整数）
 * @returns 西暦年、変換できない場合はnull
 */
export function warekiToSeireki(eraName: string, eraYear: number): number | null {
  if (!Number.isInteger(eraYear) || eraYear < 1) return null;

  const era = ERAS.find((e) => e.name === eraName);
  if (!era) return null;

  const westernYear = era.startYear + eraYear - 1;

  // 元号の有効期間内か確認
  if (era.endYear !== null && westernYear > era.endYear) return null;

  return westernYear;
}

/**
 * 元号名の一覧を取得する
 * @returns 元号名の配列（新しい順）
 */
export function getEraNames(): string[] {
  return ERAS.map((e) => e.name);
}

/**
 * 西暦年を元号表記文字列にフォーマットする
 * @param result - 変換結果
 * @returns "令和6年（2024年）" のようなフォーマット済み文字列
 */
export function formatWareki(result: WarekiResult): string {
  return `${result.eraName}${result.year}年（${result.westernYear}年）`;
}
