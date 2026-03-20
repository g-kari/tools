/**
 * IBAN（国際銀行口座番号）バリデーションおよびフォーマットユーティリティ
 * MOD-97アルゴリズム（ISO 7064）によるIBAN検証を提供する
 */

/** IBANの国情報 */
export interface IbanCountry {
  /** 国コード（ISO 3166-1 alpha-2） */
  code: string;
  /** 国名（日本語） */
  name: string;
  /** IBANの標準文字数 */
  length: number;
}

/** IBAN対応国一覧（ISO 13616-1:2020準拠） */
export const IBAN_COUNTRIES: ReadonlyArray<IbanCountry> = [
  { code: 'AD', name: 'アンドラ', length: 24 },
  { code: 'AE', name: 'アラブ首長国連邦', length: 23 },
  { code: 'AL', name: 'アルバニア', length: 28 },
  { code: 'AT', name: 'オーストリア', length: 20 },
  { code: 'AZ', name: 'アゼルバイジャン', length: 28 },
  { code: 'BA', name: 'ボスニア・ヘルツェゴビナ', length: 20 },
  { code: 'BE', name: 'ベルギー', length: 16 },
  { code: 'BG', name: 'ブルガリア', length: 22 },
  { code: 'BH', name: 'バーレーン', length: 22 },
  { code: 'BR', name: 'ブラジル', length: 29 },
  { code: 'BY', name: 'ベラルーシ', length: 28 },
  { code: 'CH', name: 'スイス', length: 21 },
  { code: 'CR', name: 'コスタリカ', length: 22 },
  { code: 'CY', name: 'キプロス', length: 28 },
  { code: 'CZ', name: 'チェコ', length: 24 },
  { code: 'DE', name: 'ドイツ', length: 22 },
  { code: 'DK', name: 'デンマーク', length: 18 },
  { code: 'DO', name: 'ドミニカ共和国', length: 28 },
  { code: 'EE', name: 'エストニア', length: 20 },
  { code: 'EG', name: 'エジプト', length: 29 },
  { code: 'ES', name: 'スペイン', length: 24 },
  { code: 'FI', name: 'フィンランド', length: 18 },
  { code: 'FO', name: 'フェロー諸島', length: 18 },
  { code: 'FR', name: 'フランス', length: 27 },
  { code: 'GB', name: 'イギリス', length: 22 },
  { code: 'GE', name: 'ジョージア', length: 22 },
  { code: 'GI', name: 'ジブラルタル', length: 23 },
  { code: 'GL', name: 'グリーンランド', length: 18 },
  { code: 'GR', name: 'ギリシャ', length: 27 },
  { code: 'GT', name: 'グアテマラ', length: 28 },
  { code: 'HR', name: 'クロアチア', length: 21 },
  { code: 'HU', name: 'ハンガリー', length: 28 },
  { code: 'IE', name: 'アイルランド', length: 22 },
  { code: 'IL', name: 'イスラエル', length: 23 },
  { code: 'IQ', name: 'イラク', length: 23 },
  { code: 'IS', name: 'アイスランド', length: 26 },
  { code: 'IT', name: 'イタリア', length: 27 },
  { code: 'JO', name: 'ヨルダン', length: 30 },
  { code: 'KW', name: 'クウェート', length: 30 },
  { code: 'KZ', name: 'カザフスタン', length: 20 },
  { code: 'LB', name: 'レバノン', length: 28 },
  { code: 'LC', name: 'セントルシア', length: 32 },
  { code: 'LI', name: 'リヒテンシュタイン', length: 21 },
  { code: 'LT', name: 'リトアニア', length: 20 },
  { code: 'LU', name: 'ルクセンブルク', length: 20 },
  { code: 'LV', name: 'ラトビア', length: 21 },
  { code: 'LY', name: 'リビア', length: 25 },
  { code: 'MC', name: 'モナコ', length: 27 },
  { code: 'MD', name: 'モルドバ', length: 24 },
  { code: 'ME', name: 'モンテネグロ', length: 22 },
  { code: 'MK', name: '北マケドニア', length: 19 },
  { code: 'MR', name: 'モーリタニア', length: 27 },
  { code: 'MT', name: 'マルタ', length: 31 },
  { code: 'MU', name: 'モーリシャス', length: 30 },
  { code: 'NL', name: 'オランダ', length: 18 },
  { code: 'NO', name: 'ノルウェー', length: 15 },
  { code: 'PK', name: 'パキスタン', length: 24 },
  { code: 'PL', name: 'ポーランド', length: 28 },
  { code: 'PS', name: 'パレスチナ', length: 29 },
  { code: 'PT', name: 'ポルトガル', length: 25 },
  { code: 'QA', name: 'カタール', length: 29 },
  { code: 'RO', name: 'ルーマニア', length: 24 },
  { code: 'RS', name: 'セルビア', length: 22 },
  { code: 'SA', name: 'サウジアラビア', length: 24 },
  { code: 'SC', name: 'セーシェル', length: 31 },
  { code: 'SD', name: 'スーダン', length: 18 },
  { code: 'SE', name: 'スウェーデン', length: 24 },
  { code: 'SI', name: 'スロベニア', length: 19 },
  { code: 'SK', name: 'スロバキア', length: 24 },
  { code: 'SM', name: 'サンマリノ', length: 27 },
  { code: 'ST', name: 'サントメ・プリンシペ', length: 25 },
  { code: 'SV', name: 'エルサルバドル', length: 28 },
  { code: 'TL', name: '東ティモール', length: 23 },
  { code: 'TN', name: 'チュニジア', length: 24 },
  { code: 'TR', name: 'トルコ', length: 26 },
  { code: 'UA', name: 'ウクライナ', length: 29 },
  { code: 'VA', name: 'バチカン市国', length: 22 },
  { code: 'VG', name: '英領バージン諸島', length: 24 },
  { code: 'XK', name: 'コソボ', length: 20 },
];

/** IBAN検証の結果 */
export interface IbanResult {
  /** 正規化されたIBAN（スペース・ハイフン除去・大文字化） */
  normalized: string;
  /** フォーマット済み文字列（4文字ごとにスペース区切り） */
  formatted: string;
  /** MOD-97アルゴリズムによる有効性 */
  isValid: boolean;
  /** 国コード（最初の2文字） */
  countryCode: string;
  /** チェックディジット（3・4文字目） */
  checkDigits: string;
  /** BBAN（基本銀行口座番号部分） */
  bban: string;
  /** 国情報（対応国の場合） */
  country: IbanCountry | null;
  /** 桁数の有効性 */
  isValidLength: boolean;
  /** エラーメッセージ（エラーの場合） */
  errorMessage: string | null;
}

/**
 * 数値文字列に対してMOD-97演算を行う
 * 大きな数値を文字列のまま処理してオーバーフローを回避する
 * @param numStr - 数値のみの文字列
 * @returns MOD-97の余り
 */
function mod97(numStr: string): number {
  let remainder = 0;
  for (const char of numStr) {
    remainder = (remainder * 10 + parseInt(char, 10)) % 97;
  }
  return remainder;
}

/**
 * IBAN文字列をMOD-97検証用の数値文字列に変換する
 * アルファベットをA=10, B=11, ..., Z=35に変換する
 * @param iban - 正規化されたIBAN（スペースなし、大文字）
 * @returns 数値文字列
 */
function ibanToNumericString(iban: string): string {
  return iban
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return (code - 55).toString(); // A=10, B=11, ..., Z=35
      }
      return char;
    })
    .join('');
}

/**
 * IBANを4文字ごとにスペース区切りでフォーマットする
 * @param iban - 正規化されたIBAN
 * @returns フォーマット済み文字列
 * @example formatIban('DE89370400440532013000') // 'DE89 3704 0044 0532 0130 00'
 */
export function formatIban(iban: string): string {
  return iban.match(/.{1,4}/g)?.join(' ') ?? iban;
}

/**
 * IBAN文字列を総合検証する
 * @param input - 入力文字列（スペース・ハイフン含む場合も可）
 * @returns 検証結果オブジェクト
 * @example validateIban('DE89 3704 0044 0532 0130 00') // { isValid: true, ... }
 */
export function validateIban(input: string): IbanResult {
  const normalized = input.replace(/[\s\-]/g, '').toUpperCase();
  const formatted = formatIban(normalized);

  if (normalized.length < 5) {
    return {
      normalized,
      formatted,
      isValid: false,
      countryCode: normalized.slice(0, 2),
      checkDigits: normalized.slice(2, 4),
      bban: normalized.slice(4),
      country: null,
      isValidLength: false,
      errorMessage: '文字数が不足しています（最低5文字必要）',
    };
  }

  const countryCode = normalized.slice(0, 2);
  const checkDigits = normalized.slice(2, 4);
  const bban = normalized.slice(4);

  const country = IBAN_COUNTRIES.find((c) => c.code === countryCode) ?? null;

  // 英数字のみ許可
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return {
      normalized,
      formatted,
      isValid: false,
      countryCode,
      checkDigits,
      bban,
      country,
      isValidLength: false,
      errorMessage: '英数字以外の文字が含まれています',
    };
  }

  // 桁数の検証
  const isValidLength = country
    ? normalized.length === country.length
    : normalized.length >= 15 && normalized.length <= 34;

  // MOD-97検証
  // Step 1: 最初の4文字（国コード+チェックディジット）を末尾に移動
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  // Step 2: アルファベットを数値に変換
  const numericString = ibanToNumericString(rearranged);
  // Step 3: MOD-97を計算（結果が1なら有効）
  const modResult = mod97(numericString);
  const isValid = modResult === 1;

  return {
    normalized,
    formatted,
    isValid,
    countryCode,
    checkDigits,
    bban,
    country,
    isValidLength,
    errorMessage: null,
  };
}

/** テスト用IBAN番号リスト（ISO 13616-1:2020 / Wikipediaのサンプルより） */
export const TEST_IBAN_NUMBERS: ReadonlyArray<{
  country: string;
  iban: string;
  note: string;
}> = [
  { country: 'ドイツ', iban: 'DE89370400440532013000', note: '22桁' },
  { country: 'イギリス', iban: 'GB29NWBK60161331926819', note: '22桁' },
  { country: 'フランス', iban: 'FR7630006000011234567890189', note: '27桁' },
  { country: 'スペイン', iban: 'ES9121000418450200051332', note: '24桁' },
  { country: 'オランダ', iban: 'NL91ABNA0417164300', note: '18桁' },
  { country: 'スイス', iban: 'CH9300762011623852957', note: '21桁' },
  { country: 'ベルギー', iban: 'BE68539007547034', note: '16桁' },
  { country: 'イタリア', iban: 'IT60X0542811101000000123456', note: '27桁' },
];
