/**
 * @fileoverview PHP serialize/unserialize ユーティリティ
 * PHPのserialize()フォーマットとJavaScript値の相互変換を提供する
 * null, boolean, integer, float, string, array (indexed/associative), object に対応
 */

/** PHPオブジェクト型（クラス名とプロパティを保持） */
export interface PhpObject {
  __className: string;
  properties: Record<string, PhpValue>;
}

/** PHPシリアライズが扱える値の型 */
export type PhpValue =
  | null
  | boolean
  | number
  | string
  | PhpValueArray
  | PhpValueRecord
  | PhpObject;

/** PhpValue の配列型（循環参照回避） */
export interface PhpValueArray extends Array<PhpValue> {}

/** PhpValue の辞書型（循環参照回避） */
export interface PhpValueRecord extends Record<string, PhpValue> {}

/**
 * JavaScript値をPHPシリアライズ形式に変換する
 * @param value - シリアライズするJavaScript値
 * @returns PHPシリアライズ文字列
 * @throws 対応していない型が渡された場合
 */
export function phpSerialize(value: PhpValue): string {
  if (value === null) return "N;";
  if (typeof value === "boolean") return `b:${value ? 1 : 0};`;
  if (typeof value === "number") {
    if (Number.isInteger(value)) return `i:${value};`;
    return `d:${value};`;
  }
  if (typeof value === "string") {
    const byteLen = new TextEncoder().encode(value).length;
    return `s:${byteLen}:"${value}";`;
  }
  if (Array.isArray(value)) {
    const pairs = value.map((v, i) => `${phpSerialize(i)}${phpSerialize(v)}`).join("");
    return `a:${value.length}:{${pairs}}`;
  }
  if (typeof value === "object") {
    if ("__className" in value && typeof (value as PhpObject).__className === "string") {
      const obj = value as PhpObject;
      const className = obj.__className;
      const classNameByteLen = new TextEncoder().encode(className).length;
      const props = obj.properties;
      const count = Object.keys(props).length;
      const pairs = Object.entries(props)
        .map(([k, v]) => `${phpSerialize(k)}${phpSerialize(v)}`)
        .join("");
      return `O:${classNameByteLen}:"${className}":${count}:{${pairs}}`;
    }
    // Plain object → associative array
    const entries = Object.entries(value as Record<string, PhpValue>);
    const pairs = entries.map(([k, v]) => `${phpSerialize(k)}${phpSerialize(v)}`).join("");
    return `a:${entries.length}:{${pairs}}`;
  }
  throw new Error(`対応していない型です: ${typeof value}`);
}

/**
 * カーソルベースのPHPシリアライズパーサー
 */
class Parser {
  private pos = 0;

  constructor(private readonly input: string) {}

  /**
   * 現在位置から値をパースして返す
   */
  parseValue(): PhpValue {
    const type = this.input[this.pos];
    switch (type) {
      case "N":
        return this.parseNull();
      case "b":
        return this.parseBool();
      case "i":
        return this.parseInteger();
      case "d":
        return this.parseDouble();
      case "s":
        return this.parseString();
      case "a":
        return this.parseArray();
      case "O":
        return this.parseObject();
      default:
        throw new Error(
          `PHPシリアライズ文字列の解析エラー: 位置 ${this.pos} で不明な型 "${type ?? "EOF"}"`,
        );
    }
  }

  private parseNull(): null {
    this.consume("N");
    this.consume(";");
    return null;
  }

  private parseBool(): boolean {
    this.consume("b");
    this.consume(":");
    const digit = this.input[this.pos++];
    this.consume(";");
    return digit === "1";
  }

  private parseInteger(): number {
    this.consume("i");
    this.consume(":");
    const raw = this.readUntil(";");
    this.consume(";");
    const n = parseInt(raw, 10);
    if (isNaN(n)) throw new Error(`PHPシリアライズ文字列の解析エラー: 整数値が不正 "${raw}"`);
    return n;
  }

  private parseDouble(): number {
    this.consume("d");
    this.consume(":");
    const raw = this.readUntil(";");
    this.consume(";");
    const n = parseFloat(raw);
    if (isNaN(n)) throw new Error(`PHPシリアライズ文字列の解析エラー: 浮動小数点値が不正 "${raw}"`);
    return n;
  }

  private parseString(): string {
    this.consume("s");
    this.consume(":");
    const lenStr = this.readUntil(":");
    this.consume(":");
    const byteLen = parseInt(lenStr, 10);
    if (isNaN(byteLen))
      throw new Error(`PHPシリアライズ文字列の解析エラー: 文字列長が不正 "${lenStr}"`);
    this.consume('"');
    // byteLen バイト分をデコード（マルチバイト文字対応）
    const remaining = this.input.slice(this.pos);
    const bytes = new TextEncoder().encode(remaining);
    if (bytes.length < byteLen) {
      throw new Error(`PHPシリアライズ文字列の解析エラー: 文字列データが短すぎます`);
    }
    const slice = bytes.slice(0, byteLen);
    const str = new TextDecoder().decode(slice);
    this.pos += str.length;
    this.consume('"');
    this.consume(";");
    return str;
  }

  private parseArray(): PhpValue[] | Record<string, PhpValue> {
    this.consume("a");
    this.consume(":");
    const countStr = this.readUntil(":");
    this.consume(":");
    const count = parseInt(countStr, 10);
    if (isNaN(count)) throw new Error(`PHPシリアライズ文字列の解析エラー: 配列要素数が不正`);
    this.consume("{");
    const result: Record<string, PhpValue> = {};
    let isIndexed = true;
    for (let i = 0; i < count; i++) {
      const key = this.parseValue();
      const val = this.parseValue();
      const keyStr = typeof key === "object" ? JSON.stringify(key) : String(key);
      result[keyStr] = val;
      if (typeof key !== "number" || key !== i) isIndexed = false;
    }
    this.consume("}");
    if (count === 0) return [];
    if (isIndexed) {
      return Array.from({ length: count }, (_, i) => result[String(i)]);
    }
    return result;
  }

  private parseObject(): PhpObject {
    this.consume("O");
    this.consume(":");
    const classLenStr = this.readUntil(":");
    this.consume(":");
    const classLen = parseInt(classLenStr, 10);
    if (isNaN(classLen)) throw new Error(`PHPシリアライズ文字列の解析エラー: クラス名長が不正`);
    this.consume('"');
    const className = this.input.slice(this.pos, this.pos + classLen);
    this.pos += classLen;
    this.consume('"');
    this.consume(":");
    const countStr = this.readUntil(":");
    this.consume(":");
    const count = parseInt(countStr, 10);
    if (isNaN(count)) throw new Error(`PHPシリアライズ文字列の解析エラー: プロパティ数が不正`);
    this.consume("{");
    const properties: Record<string, PhpValue> = {};
    for (let i = 0; i < count; i++) {
      const key = this.parseValue();
      const val = this.parseValue();
      properties[typeof key === "object" ? JSON.stringify(key) : String(key)] = val;
    }
    this.consume("}");
    return { __className: className, properties };
  }

  private consume(char: string): void {
    if (this.input[this.pos] !== char) {
      throw new Error(
        `PHPシリアライズ文字列の解析エラー: 位置 ${this.pos} で "${char}" が期待されましたが "${this.input[this.pos] ?? "EOF"}" がありました`,
      );
    }
    this.pos++;
  }

  private readUntil(char: string): string {
    const start = this.pos;
    while (this.pos < this.input.length && this.input[this.pos] !== char) {
      this.pos++;
    }
    return this.input.slice(start, this.pos);
  }
}

/**
 * PHPシリアライズ文字列をJavaScript値に変換する
 * @param input - PHPシリアライズ文字列
 * @returns デシリアライズされたJavaScript値
 * @throws 不正な形式の場合
 */
export function phpUnserialize(input: string): PhpValue {
  if (!input.trim()) throw new Error("入力が空です");
  const parser = new Parser(input);
  return parser.parseValue();
}
