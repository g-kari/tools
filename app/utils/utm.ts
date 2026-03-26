/**
 * @fileoverview UTMパラメータ処理ユーティリティ
 * Google Analytics / GA4のUTMパラメータを生成・解析する関数群
 */

/**
 * UTMパラメータのインターフェース
 */
export interface UtmParams {
  /** トラフィックの送信元（例: google, newsletter, facebook） */
  source: string;
  /** マーケティングメディア（例: cpc, email, social） */
  medium: string;
  /** キャンペーン名（例: spring_sale） */
  campaign: string;
  /** 検索キーワード */
  term: string;
  /** コンテンツ識別子（A/Bテスト用） */
  content: string;
}

/**
 * URLが有効かチェックする
 *
 * @param url - 検証するURL文字列
 * @returns 有効なURLであれば true、それ以外は false
 *
 * @example
 * isValidUrl("https://example.com") // => true
 * isValidUrl("not-a-url") // => false
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * UTMパラメータ付きURLを生成する
 *
 * 空文字列のパラメータは除外される。
 * utm_source と utm_medium は必須パラメータ。
 *
 * @param baseUrl - ベースURL（例: https://example.com/page）
 * @param params - UTMパラメータ（空文字列のフィールドは無視）
 * @returns UTMパラメータ付きURL文字列
 *
 * @example
 * buildUtmUrl("https://example.com", { source: "google", medium: "cpc" })
 * // => "https://example.com?utm_source=google&utm_medium=cpc"
 */
export function buildUtmUrl(baseUrl: string, params: Partial<UtmParams>): string {
  if (!baseUrl || baseUrl.trim() === '') return '';

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return '';
  }

  const utmMapping: Array<[keyof UtmParams, string]> = [
    ['source', 'utm_source'],
    ['medium', 'utm_medium'],
    ['campaign', 'utm_campaign'],
    ['term', 'utm_term'],
    ['content', 'utm_content'],
  ];

  for (const [key, paramName] of utmMapping) {
    const value = params[key];
    if (value && value.trim() !== '') {
      url.searchParams.set(paramName, value.trim());
    }
  }

  return url.toString();
}

/**
 * URLからUTMパラメータを解析する
 *
 * @param url - 解析するURL文字列（UTMパラメータを含む）
 * @returns ベースURLとUTMパラメータのオブジェクト
 *
 * @example
 * parseUtmUrl("https://example.com?utm_source=google&utm_medium=cpc")
 * // => { baseUrl: "https://example.com", params: { source: "google", medium: "cpc" } }
 */
export function parseUtmUrl(url: string): { baseUrl: string; params: Partial<UtmParams> } {
  const empty = { baseUrl: '', params: {} };
  if (!url || url.trim() === '') return empty;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return empty;
  }

  const params: Partial<UtmParams> = {};

  const source = parsed.searchParams.get('utm_source');
  const medium = parsed.searchParams.get('utm_medium');
  const campaign = parsed.searchParams.get('utm_campaign');
  const term = parsed.searchParams.get('utm_term');
  const content = parsed.searchParams.get('utm_content');

  if (source) params.source = source;
  if (medium) params.medium = medium;
  if (campaign) params.campaign = campaign;
  if (term) params.term = term;
  if (content) params.content = content;

  // ベースURLはUTMパラメータを除去したもの
  const baseUrl = new URL(parsed.toString());
  baseUrl.searchParams.delete('utm_source');
  baseUrl.searchParams.delete('utm_medium');
  baseUrl.searchParams.delete('utm_campaign');
  baseUrl.searchParams.delete('utm_term');
  baseUrl.searchParams.delete('utm_content');

  return { baseUrl: baseUrl.toString(), params };
}
