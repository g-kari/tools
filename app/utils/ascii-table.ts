/**
 * ASCII テーブルユーティリティ
 * ASCII 文字コード 0–127 の情報を提供する
 */

/** ASCII 文字エントリの型 */
export interface AsciiEntry {
  /** 10進数コード */
  dec: number;
  /** 16進数コード (例: "0x1F") */
  hex: string;
  /** 8進数コード (例: "037") */
  oct: string;
  /** 2進数コード (8桁) */
  bin: string;
  /** 文字表示 (制御文字は略称) */
  char: string;
  /** 文字が印刷可能かどうか */
  printable: boolean;
  /** HTML エンティティ (例: "&#32;") */
  entity: string;
  /** 文字の説明 */
  description: string;
  /** カテゴリ */
  category: 'control' | 'printable';
}

/** 制御文字の略称と説明 */
const CONTROL_CHARS: Record<number, { abbr: string; description: string }> = {
  0: { abbr: 'NUL', description: 'Null' },
  1: { abbr: 'SOH', description: 'Start of Heading' },
  2: { abbr: 'STX', description: 'Start of Text' },
  3: { abbr: 'ETX', description: 'End of Text' },
  4: { abbr: 'EOT', description: 'End of Transmission' },
  5: { abbr: 'ENQ', description: 'Enquiry' },
  6: { abbr: 'ACK', description: 'Acknowledge' },
  7: { abbr: 'BEL', description: 'Bell' },
  8: { abbr: 'BS', description: 'Backspace' },
  9: { abbr: 'HT', description: 'Horizontal Tab' },
  10: { abbr: 'LF', description: 'Line Feed (\\n)' },
  11: { abbr: 'VT', description: 'Vertical Tab' },
  12: { abbr: 'FF', description: 'Form Feed' },
  13: { abbr: 'CR', description: 'Carriage Return (\\r)' },
  14: { abbr: 'SO', description: 'Shift Out' },
  15: { abbr: 'SI', description: 'Shift In' },
  16: { abbr: 'DLE', description: 'Data Link Escape' },
  17: { abbr: 'DC1', description: 'Device Control 1 (XON)' },
  18: { abbr: 'DC2', description: 'Device Control 2' },
  19: { abbr: 'DC3', description: 'Device Control 3 (XOFF)' },
  20: { abbr: 'DC4', description: 'Device Control 4' },
  21: { abbr: 'NAK', description: 'Negative Acknowledge' },
  22: { abbr: 'SYN', description: 'Synchronous Idle' },
  23: { abbr: 'ETB', description: 'End of Transmission Block' },
  24: { abbr: 'CAN', description: 'Cancel' },
  25: { abbr: 'EM', description: 'End of Medium' },
  26: { abbr: 'SUB', description: 'Substitute' },
  27: { abbr: 'ESC', description: 'Escape' },
  28: { abbr: 'FS', description: 'File Separator' },
  29: { abbr: 'GS', description: 'Group Separator' },
  30: { abbr: 'RS', description: 'Record Separator' },
  31: { abbr: 'US', description: 'Unit Separator' },
  127: { abbr: 'DEL', description: 'Delete' },
};

/** 印刷可能文字の説明 */
const PRINTABLE_DESCRIPTIONS: Record<number, string> = {
  32: 'Space',
  33: 'Exclamation Mark',
  34: 'Quotation Mark',
  35: 'Number Sign',
  36: 'Dollar Sign',
  37: 'Percent Sign',
  38: 'Ampersand',
  39: 'Apostrophe',
  40: 'Left Parenthesis',
  41: 'Right Parenthesis',
  42: 'Asterisk',
  43: 'Plus Sign',
  44: 'Comma',
  45: 'Hyphen-Minus',
  46: 'Full Stop',
  47: 'Solidus (Slash)',
  48: 'Digit Zero',
  49: 'Digit One',
  50: 'Digit Two',
  51: 'Digit Three',
  52: 'Digit Four',
  53: 'Digit Five',
  54: 'Digit Six',
  55: 'Digit Seven',
  56: 'Digit Eight',
  57: 'Digit Nine',
  58: 'Colon',
  59: 'Semicolon',
  60: 'Less-Than Sign',
  61: 'Equals Sign',
  62: 'Greater-Than Sign',
  63: 'Question Mark',
  64: 'Commercial At',
  65: 'Latin Capital Letter A',
  66: 'Latin Capital Letter B',
  67: 'Latin Capital Letter C',
  68: 'Latin Capital Letter D',
  69: 'Latin Capital Letter E',
  70: 'Latin Capital Letter F',
  71: 'Latin Capital Letter G',
  72: 'Latin Capital Letter H',
  73: 'Latin Capital Letter I',
  74: 'Latin Capital Letter J',
  75: 'Latin Capital Letter K',
  76: 'Latin Capital Letter L',
  77: 'Latin Capital Letter M',
  78: 'Latin Capital Letter N',
  79: 'Latin Capital Letter O',
  80: 'Latin Capital Letter P',
  81: 'Latin Capital Letter Q',
  82: 'Latin Capital Letter R',
  83: 'Latin Capital Letter S',
  84: 'Latin Capital Letter T',
  85: 'Latin Capital Letter U',
  86: 'Latin Capital Letter V',
  87: 'Latin Capital Letter W',
  88: 'Latin Capital Letter X',
  89: 'Latin Capital Letter Y',
  90: 'Latin Capital Letter Z',
  91: 'Left Square Bracket',
  92: 'Reverse Solidus (Backslash)',
  93: 'Right Square Bracket',
  94: 'Circumflex Accent',
  95: 'Low Line (Underscore)',
  96: 'Grave Accent',
  97: 'Latin Small Letter a',
  98: 'Latin Small Letter b',
  99: 'Latin Small Letter c',
  100: 'Latin Small Letter d',
  101: 'Latin Small Letter e',
  102: 'Latin Small Letter f',
  103: 'Latin Small Letter g',
  104: 'Latin Small Letter h',
  105: 'Latin Small Letter i',
  106: 'Latin Small Letter j',
  107: 'Latin Small Letter k',
  108: 'Latin Small Letter l',
  109: 'Latin Small Letter m',
  110: 'Latin Small Letter n',
  111: 'Latin Small Letter o',
  112: 'Latin Small Letter p',
  113: 'Latin Small Letter q',
  114: 'Latin Small Letter r',
  115: 'Latin Small Letter s',
  116: 'Latin Small Letter t',
  117: 'Latin Small Letter u',
  118: 'Latin Small Letter v',
  119: 'Latin Small Letter w',
  120: 'Latin Small Letter x',
  121: 'Latin Small Letter y',
  122: 'Latin Small Letter z',
  123: 'Left Curly Bracket',
  124: 'Vertical Line',
  125: 'Right Curly Bracket',
  126: 'Tilde',
};

/**
 * 数値を指定桁数の2進数文字列に変換する
 * @param n - 変換する数値
 * @returns 0埋めした8桁の2進数文字列
 */
export function toBinary(n: number): string {
  return n.toString(2).padStart(8, '0');
}

/**
 * 数値を16進数文字列に変換する (0x prefix)
 * @param n - 変換する数値
 * @returns 16進数文字列 (大文字, 2桁, 0x prefix)
 */
export function toHex(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * 数値を8進数文字列に変換する
 * @param n - 変換する数値
 * @returns 8進数文字列 (3桁)
 */
export function toOctal(n: number): string {
  return n.toString(8).padStart(3, '0');
}

/**
 * ASCII テーブルの全エントリを生成する
 * @returns ASCII エントリの配列 (0–127)
 */
export function generateAsciiTable(): AsciiEntry[] {
  const entries: AsciiEntry[] = [];
  for (let i = 0; i <= 127; i++) {
    const isControl = i < 32 || i === 127;
    const ctrlInfo = CONTROL_CHARS[i];
    const printable = !isControl;

    let char: string;
    let description: string;
    if (isControl && ctrlInfo) {
      char = ctrlInfo.abbr;
      description = ctrlInfo.description;
    } else {
      char = String.fromCharCode(i);
      description = PRINTABLE_DESCRIPTIONS[i] ?? char;
    }

    entries.push({
      dec: i,
      hex: toHex(i),
      oct: toOctal(i),
      bin: toBinary(i),
      char,
      printable,
      entity: `&#${i};`,
      description,
      category: isControl ? 'control' : 'printable',
    });
  }
  return entries;
}

/** フィルタカテゴリの型 */
export type AsciiFilter = 'all' | 'control' | 'printable';

/**
 * ASCII エントリをフィルタリングする
 * @param entries - フィルタリング対象のエントリ
 * @param filter - カテゴリフィルタ
 * @param query - 検索クエリ
 * @returns フィルタリング後のエントリ
 */
export function filterAsciiEntries(
  entries: AsciiEntry[],
  filter: AsciiFilter,
  query: string,
): AsciiEntry[] {
  let result = entries;
  if (filter !== 'all') {
    result = result.filter((e) => e.category === filter);
  }
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (e) =>
        e.dec.toString().includes(q) ||
        e.hex.toLowerCase().includes(q) ||
        e.oct.includes(q) ||
        e.char.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }
  return result;
}

/** プリロードしたテーブルデータ */
export const ASCII_TABLE = generateAsciiTable();
