/**
 * ランダムデータ生成ユーティリティ
 * 開発・テスト用のランダムデータを生成する関数群
 */

/** 生成するフィールドの種別 */
export type FieldType =
  | 'japaneseName'
  | 'englishName'
  | 'email'
  | 'japanesePhone'
  | 'japaneseAddress'
  | 'companyName'
  | 'uuid'
  | 'number'
  | 'date'
  | 'loremText'
  | 'color'
  | 'ipv4'
  | 'ipv6'
  | 'mac';

/** 出力フォーマット */
export type OutputFormat = 'json' | 'csv' | 'tsv';

/** フィールド設定 */
export interface FieldConfig {
  type: FieldType;
  label: string;
  description: string;
}

/** 数値生成オプション */
export interface NumberOptions {
  min: number;
  max: number;
}

/** 日付生成オプション */
export interface DateOptions {
  startYear: number;
  endYear: number;
}

/** ランダムデータ生成オプション */
export interface RandomDataOptions {
  fields: FieldType[];
  count: number;
  format: OutputFormat;
  numberOptions: NumberOptions;
  dateOptions: DateOptions;
}

/** フィールド設定一覧 */
export const FIELD_CONFIGS: FieldConfig[] = [
  { type: 'japaneseName', label: '日本語氏名', description: '田中 太郎 形式' },
  { type: 'englishName', label: '英語氏名', description: 'John Smith 形式' },
  { type: 'email', label: 'メールアドレス', description: 'user@example.com 形式' },
  { type: 'japanesePhone', label: '電話番号（日本）', description: '090-XXXX-XXXX 形式' },
  { type: 'japaneseAddress', label: '住所（日本）', description: '都道府県から番地まで' },
  { type: 'companyName', label: '会社名', description: 'XXX株式会社 形式' },
  { type: 'uuid', label: 'UUID', description: 'UUID v4形式' },
  { type: 'number', label: '数値', description: '指定範囲の整数' },
  { type: 'date', label: '日付', description: 'YYYY-MM-DD形式' },
  { type: 'loremText', label: 'ダミーテキスト', description: 'Lorem Ipsum短文' },
  { type: 'color', label: 'カラーコード', description: '#RRGGBB形式' },
  { type: 'ipv4', label: 'IPv4アドレス', description: 'X.X.X.X形式' },
  { type: 'ipv6', label: 'IPv6アドレス', description: '完全形式' },
  { type: 'mac', label: 'MACアドレス', description: 'XX:XX:XX:XX:XX:XX形式' },
];

// ---- データリスト ----

/** 日本語姓リスト */
const JAPANESE_LAST_NAMES = [
  '田中', '鈴木', '佐藤', '高橋', '伊藤', '山本', '渡辺', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '中島', '森', '池田', '橋本', '阿部', '石川', '山下', '前田', '藤田',
];

/** 日本語名リスト */
const JAPANESE_FIRST_NAMES = [
  '太郎', '花子', '一郎', '幸子', '健一', '美子', '次郎', '恵子', '三郎', '裕子',
  '翔', '葵', '蓮', '咲', '大輝', '七海', '悠斗', '彩', '陸', '凛',
  '颯太', '莉子', '湊', '紗月', '樹', '美咲', '航', '結衣', '昂', '紬',
];

/** 英語ファーストネームリスト */
const ENGLISH_FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa',
];

/** 英語ラストネームリスト */
const ENGLISH_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Moore', 'Robinson', 'Clark', 'Lewis', 'Walker',
];

/** 都道府県リスト（全47都道府県） */
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

/** 市区リスト */
const CITIES = [
  '新宿区', '渋谷区', '千代田区', '横浜市', '大阪市', '名古屋市', '札幌市', '仙台市',
  '広島市', '福岡市', '神戸市', '京都市', 'さいたま市', '千葉市', '川崎市',
  '北区', '江東区', '品川区', '港区', '文京区',
];

/** 町名リスト */
const TOWNS = [
  '本町', '中央', '東', '西', '南', '北', '上町', '下町',
  '新町', '元町', '花町', '松町',
];

/** 会社名語幹リスト */
const COMPANY_NAMES = [
  'テクノ', 'アドバンス', 'グローバル', 'ネクスト', 'クリエイト',
  'インフォ', 'デジタル', 'ソリューション', 'システム', 'コンサルティング',
  'マーケティング', 'デザイン', 'エンジニアリング', 'サービス', 'ネットワーク',
];

/** 業種リスト */
const INDUSTRIES = [
  '製造', '商事', '物産', '産業', '工業', 'コーポレーション',
  'エンタープライズ', 'ホールディングス', 'インターナショナル', 'グループ',
];

/** 会社種別 */
const COMPANY_TYPES = ['株式会社', '有限会社', '合同会社'];

/** メールドメインリスト */
const EMAIL_DOMAINS = ['example.com', 'test.jp', 'sample.net', 'dummy.co.jp', 'mock.org'];

/** Lorem Ipsum単語リスト */
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'labore', 'dolore', 'magna',
  'aliqua', 'enim', 'veniam', 'nostrud', 'exercitation', 'ullamco', 'laboris',
  'nisi', 'aliquip', 'commodo', 'consequat', 'duis', 'aute', 'irure',
  'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla',
];

// ---- ヘルパー関数 ----

/**
 * 暗号学的に安全なランダムな整数を生成する（min以上max以下）
 * @param min - 最小値
 * @param max - 最大値
 * @returns ランダムな整数
 */
export function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return min + (buf[0] % range);
}

/**
 * 配列からランダムな要素を取得する
 * @param arr - 配列
 * @returns ランダムな要素
 */
export function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

// ---- ジェネレーター関数 ----

/**
 * 日本語氏名を生成する
 * @returns '田中 太郎' 形式の氏名
 */
export function generateJapaneseName(): string {
  return `${randomElement(JAPANESE_LAST_NAMES)} ${randomElement(JAPANESE_FIRST_NAMES)}`;
}

/**
 * 英語氏名を生成する
 * @returns 'John Smith' 形式の氏名
 */
export function generateEnglishName(): string {
  return `${randomElement(ENGLISH_FIRST_NAMES)} ${randomElement(ENGLISH_LAST_NAMES)}`;
}

/**
 * メールアドレスを生成する
 * @returns 'user@example.com' 形式のメールアドレス
 */
export function generateEmail(): string {
  const first = randomElement(ENGLISH_FIRST_NAMES).toLowerCase();
  const last = randomElement(ENGLISH_LAST_NAMES).toLowerCase();
  const num = randomInt(1, 999);
  const domain = randomElement(EMAIL_DOMAINS);
  return `${first}.${last}${num}@${domain}`;
}

/**
 * 日本の電話番号を生成する
 * @returns '090-XXXX-XXXX' 形式の電話番号
 */
export function generateJapanesePhone(): string {
  const prefixes = ['090', '080', '070', '050'];
  const prefix = randomElement(prefixes);
  const mid = String(randomInt(1000, 9999));
  const last = String(randomInt(1000, 9999));
  return `${prefix}-${mid}-${last}`;
}

/**
 * 日本の住所を生成する
 * @returns '東京都 新宿区 本町 1-2-3' 形式の住所
 */
export function generateJapaneseAddress(): string {
  const prefecture = randomElement(PREFECTURES);
  const city = randomElement(CITIES);
  const town = randomElement(TOWNS);
  const block = randomInt(1, 9);
  const num1 = randomInt(1, 30);
  const num2 = randomInt(1, 20);
  return `${prefecture}${city}${town}${block}-${num1}-${num2}`;
}

/**
 * 会社名を生成する
 * @returns 'XXX株式会社' 形式の会社名
 */
export function generateCompanyName(): string {
  const name = randomElement(COMPANY_NAMES);
  const industry = randomElement(INDUSTRIES);
  const type = randomElement(COMPANY_TYPES);
  // 50%の確率で会社種別を前または後に配置
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  if (buf[0] % 2 === 0) {
    return `${type}${name}${industry}`;
  }
  return `${name}${industry}${type}`;
}

/**
 * UUID v4を生成する（RFC 4122準拠）
 * @returns UUID v4形式の文字列
 */
export function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // variant bits
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * 指定範囲の整数を生成する
 * @param options - 数値生成オプション
 * @returns ランダムな整数
 */
export function generateNumber(options: NumberOptions): number {
  return randomInt(options.min, options.max);
}

/**
 * 有効な日付を生成する（閏年考慮）
 * @param options - 日付生成オプション
 * @returns 'YYYY-MM-DD' 形式の日付文字列
 */
export function generateDate(options: DateOptions): string {
  const year = randomInt(options.startYear, options.endYear);
  const month = randomInt(1, 12);

  const isLeapYear = (y: number) =>
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];

  const day = randomInt(1, daysInMonth[month - 1]);

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Lorem Ipsumの短文を生成する（5〜15単語）
 * @returns Lorem Ipsum短文
 */
export function generateLoremIpsum(): string {
  const wordCount = randomInt(5, 15);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(randomElement(LOREM_WORDS));
  }
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

/**
 * カラーコードを生成する
 * @returns '#RRGGBB' 形式のカラーコード
 */
export function generateColor(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return '#' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * IPv4アドレスを生成する
 * @returns 'X.X.X.X' 形式のIPv4アドレス
 */
export function generateIPv4(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).join('.');
}

/**
 * IPv6アドレスを生成する（完全形式、小文字）
 * @returns 完全形式のIPv6アドレス
 */
export function generateIPv6(): string {
  const shorts = new Uint16Array(8);
  crypto.getRandomValues(shorts);
  return Array.from(shorts).map((n) => n.toString(16).padStart(4, '0')).join(':');
}

/**
 * MACアドレスを生成する（大文字hex、コロン区切り）
 * @returns 'XX:XX:XX:XX:XX:XX' 形式のMACアドレス
 */
export function generateMAC(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

/**
 * 指定されたフィールドタイプの値を1件生成する
 * @param type - フィールドタイプ
 * @param numberOptions - 数値生成オプション
 * @param dateOptions - 日付生成オプション
 * @returns 生成された値
 */
function generateValue(
  type: FieldType,
  numberOptions: NumberOptions,
  dateOptions: DateOptions
): string | number {
  switch (type) {
    case 'japaneseName':
      return generateJapaneseName();
    case 'englishName':
      return generateEnglishName();
    case 'email':
      return generateEmail();
    case 'japanesePhone':
      return generateJapanesePhone();
    case 'japaneseAddress':
      return generateJapaneseAddress();
    case 'companyName':
      return generateCompanyName();
    case 'uuid':
      return generateUUID();
    case 'number':
      return generateNumber(numberOptions);
    case 'date':
      return generateDate(dateOptions);
    case 'loremText':
      return generateLoremIpsum();
    case 'color':
      return generateColor();
    case 'ipv4':
      return generateIPv4();
    case 'ipv6':
      return generateIPv6();
    case 'mac':
      return generateMAC();
    default:
      return '';
  }
}

/**
 * CSV/TSVのデータ値をクォートする（カンマ/タブを含む場合）
 * @param value - クォート対象の値
 * @param separator - 区切り文字（カンマまたはタブ）
 * @returns クォート処理済みの値
 */
function quoteValue(value: string, separator: string): string {
  if (value.includes(separator) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * ランダムデータを生成して指定フォーマットで返す
 * @param options - 生成オプション
 * @returns 生成されたデータ文字列
 */
export function generateRandomData(options: RandomDataOptions): string {
  const { fields, count, format, numberOptions, dateOptions } = options;

  if (fields.length === 0 || count === 0) {
    return '';
  }

  // ラベルのマッピングを作成
  const labelMap = new Map<FieldType, string>(
    FIELD_CONFIGS.map((c) => [c.type, c.label])
  );

  // レコードを生成
  const records: Record<string, string | number>[] = [];
  for (let i = 0; i < count; i++) {
    const record: Record<string, string | number> = {};
    for (const field of fields) {
      const label = labelMap.get(field) ?? field;
      record[label] = generateValue(field, numberOptions, dateOptions);
    }
    records.push(record);
  }

  if (format === 'json') {
    return JSON.stringify(records, null, 2);
  }

  const separator = format === 'csv' ? ',' : '\t';

  // ヘッダー行
  const headers = fields.map((f) => {
    const label = labelMap.get(f) ?? f;
    return quoteValue(label, separator);
  });

  // データ行
  const rows = records.map((record) => {
    return fields.map((f) => {
      const label = labelMap.get(f) ?? f;
      const value = String(record[label] ?? '');
      return quoteValue(value, separator);
    }).join(separator);
  });

  return [headers.join(separator), ...rows].join('\n');
}
