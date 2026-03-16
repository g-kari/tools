/**
 * 数値フォーマットユーティリティ
 * Intl.NumberFormat を活用した多言語・多形式の数値フォーマットを提供する
 */

/** サポートするロケール一覧 */
export const SUPPORTED_LOCALES = [
  { code: 'ja-JP', name: '日本語（日本）' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)' },
  { code: 'fr-FR', name: 'Français (France)' },
  { code: 'zh-CN', name: '中文（中国）' },
  { code: 'ko-KR', name: '한국어（한국）' },
  { code: 'ar-SA', name: 'العربية（السعودية）' },
  { code: 'hi-IN', name: 'हिन्दी（भारत）' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
] as const;

/** サポートする通貨一覧 */
export const SUPPORTED_CURRENCIES = [
  { code: 'JPY', name: '日本円 (JPY)' },
  { code: 'USD', name: '米ドル (USD)' },
  { code: 'EUR', name: 'ユーロ (EUR)' },
  { code: 'GBP', name: '英ポンド (GBP)' },
  { code: 'CNY', name: '人民元 (CNY)' },
  { code: 'KRW', name: '韓国ウォン (KRW)' },
  { code: 'INR', name: 'インドルピー (INR)' },
  { code: 'BRL', name: 'ブラジルレアル (BRL)' },
  { code: 'CHF', name: 'スイスフラン (CHF)' },
  { code: 'AUD', name: '豪ドル (AUD)' },
] as const;

/** フォーマット種別 */
export type FormatStyle = 'decimal' | 'currency' | 'percent';

/** コンパクト表記種別 */
export type CompactDisplay = 'none' | 'short' | 'long';

/** 数値フォーマットオプション */
export interface NumberFormatOptions {
  /** ロケールコード (例: 'ja-JP') */
  locale: string;
  /** フォーマット種別 */
  style: FormatStyle;
  /** 通貨コード（style が 'currency' の場合に使用）*/
  currency?: string;
  /** コンパクト表記 */
  compact: CompactDisplay;
  /** 小数点以下の最小桁数 */
  minimumFractionDigits?: number;
  /** 小数点以下の最大桁数 */
  maximumFractionDigits?: number;
  /** 3桁区切りを使用するか */
  useGrouping: boolean;
}

/** フォーマット結果 */
export interface FormatResult {
  /** フォーマット済み文字列 */
  formatted: string;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

/** 全ロケール比較結果 */
export interface LocaleComparisonEntry {
  locale: string;
  name: string;
  formatted: string;
}

/**
 * 数値を指定オプションでフォーマットする
 * @param value フォーマットする数値
 * @param options フォーマットオプション
 * @returns フォーマット結果
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions
): FormatResult {
  if (!isFinite(value)) {
    return { formatted: '', error: '有効な数値を入力してください' };
  }

  try {
    const intlOptions: Intl.NumberFormatOptions = {
      useGrouping: options.useGrouping,
    };

    if (options.style === 'currency') {
      intlOptions.style = 'currency';
      intlOptions.currency = options.currency ?? 'JPY';
    } else if (options.style === 'percent') {
      intlOptions.style = 'percent';
    } else {
      intlOptions.style = 'decimal';
    }

    if (options.compact !== 'none') {
      intlOptions.notation = 'compact';
      intlOptions.compactDisplay = options.compact;
    }

    if (options.minimumFractionDigits !== undefined) {
      intlOptions.minimumFractionDigits = options.minimumFractionDigits;
    }
    if (options.maximumFractionDigits !== undefined) {
      intlOptions.maximumFractionDigits = options.maximumFractionDigits;
    }

    const formatted = new Intl.NumberFormat(options.locale, intlOptions).format(
      value
    );
    return { formatted };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'フォーマットに失敗しました';
    return { formatted: '', error: message };
  }
}

/**
 * 数値をサポート全ロケールでフォーマットして比較一覧を生成する
 * @param value フォーマットする数値
 * @param options ロケール以外のフォーマットオプション
 * @returns ロケールごとのフォーマット結果一覧
 */
export function formatForAllLocales(
  value: number,
  options: Omit<NumberFormatOptions, 'locale'>
): LocaleComparisonEntry[] {
  return SUPPORTED_LOCALES.map(({ code, name }) => {
    const result = formatNumber(value, { ...options, locale: code });
    return {
      locale: code,
      name,
      formatted: result.error ? `(エラー: ${result.error})` : result.formatted,
    };
  });
}

/**
 * 入力文字列を数値に安全にパースする
 * @param input 入力文字列
 * @returns パース結果（NaN の場合は undefined）
 */
export function parseNumberInput(input: string): number | undefined {
  if (!input.trim()) return undefined;
  const value = Number(input.replace(/,/g, ''));
  return isFinite(value) ? value : undefined;
}
