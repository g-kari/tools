/**
 * 正規表現ライブラリユーティリティ
 *
 * よく使われる正規表現パターンのカタログとフィルタリング機能を提供します。
 */

/** 正規表現のカテゴリ */
export type RegexCategory =
  | "email"
  | "url"
  | "network"
  | "datetime"
  | "phone"
  | "password"
  | "code"
  | "japanese"
  | "text"
  | "finance";

/** 正規表現エントリの型定義 */
export interface RegexEntry {
  /** 一意な識別子 */
  id: string;
  /** パターン名（日本語） */
  name: string;
  /** 正規表現パターン文字列 */
  pattern: string;
  /** 正規表現フラグ (例: 'i', 'gm') */
  flags: string;
  /** 説明（日本語） */
  description: string;
  /** カテゴリ */
  category: RegexCategory;
  /** マッチ例と非マッチ例 */
  examples: {
    /** マッチする文字列の例 */
    match: string[];
    /** マッチしない文字列の例 */
    noMatch: string[];
  };
}

/**
 * 正規表現ライブラリデータ
 *
 * よく使われる正規表現パターンの一覧。
 * 各エントリは id・name・pattern・flags・description・category・examples を持つ。
 */
export const REGEX_LIBRARY: RegexEntry[] = [
  // ─── メールアドレス ───────────────────────────────────────
  {
    id: "email-basic",
    name: "メールアドレス（基本）",
    pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
    flags: "i",
    description:
      "ユーザー名 @ ドメイン の形式に一致するメールアドレスの基本パターン。2文字以上の TLD に対応。",
    category: "email",
    examples: {
      match: ["user@example.com", "first.last@company.co.jp", "test+filter@mail.example.org"],
      noMatch: ["user@", "@example.com", "plaintext", "user@.com"],
    },
  },
  {
    id: "email-strict",
    name: "メールアドレス（厳密）",
    pattern:
      "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~\\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$",
    flags: "",
    description:
      "RFC 5321 に準拠したより厳密なメールアドレス検証パターン。ドメインの先頭ハイフンを禁止。",
    category: "email",
    examples: {
      match: ["user@example.com", "user.name+tag@example.co.jp"],
      noMatch: ["user@", "user@-example.com", "user@ example.com"],
    },
  },

  // ─── URL ─────────────────────────────────────────────────
  {
    id: "url-http",
    name: "HTTP/HTTPS URL",
    pattern: "https?://[a-zA-Z0-9\\-._~:/?#[\\]@!$&'()*+,;=%]+",
    flags: "i",
    description: "http:// または https:// で始まる URL に一致するパターン。",
    category: "url",
    examples: {
      match: ["https://example.com", "http://sub.example.co.jp/path?q=1#anchor"],
      noMatch: ["ftp://example.com", "example.com", "//example.com"],
    },
  },
  {
    id: "url-any-scheme",
    name: "URL（スキーム問わず）",
    pattern: "^[a-zA-Z][a-zA-Z0-9+\\-.]*://[^\\s]+$",
    flags: "i",
    description:
      "ftp:// や ssh:// など任意のスキームを持つ URL（://を含む形式）に一致するパターン。",
    category: "url",
    examples: {
      match: [
        "https://example.com",
        "ftp://files.example.org/file.txt",
        "ssh://user@host.example.com",
      ],
      noMatch: ["example.com", "//example.com", "not a url", "mailto:user@example.com"],
    },
  },
  {
    id: "url-slug",
    name: "URL スラッグ",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    flags: "",
    description: "URL スラッグ形式（英小文字・数字・ハイフン）に一致するパターン。",
    category: "url",
    examples: {
      match: ["hello-world", "my-blog-post-123", "abc"],
      noMatch: ["Hello-World", "has spaces", "-starts-with-dash", "ends-with-dash-"],
    },
  },

  // ─── ネットワーク ─────────────────────────────────────────
  {
    id: "ipv4",
    name: "IPv4 アドレス",
    pattern: "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$",
    flags: "",
    description: "0.0.0.0 〜 255.255.255.255 の範囲の IPv4 アドレスに一致するパターン。",
    category: "network",
    examples: {
      match: ["192.168.1.1", "255.255.255.0", "0.0.0.0", "10.0.0.1"],
      noMatch: ["256.0.0.1", "192.168.1", "192.168.1.1.1", "abc.def.ghi.jkl"],
    },
  },
  {
    id: "ipv4-cidr",
    name: "IPv4 CIDR 表記",
    pattern:
      "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\/(?:3[0-2]|[12]?\\d)$",
    flags: "",
    description:
      "192.168.0.0/24 のような CIDR 表記の IPv4 ネットワークアドレスに一致するパターン。",
    category: "network",
    examples: {
      match: ["192.168.0.0/24", "10.0.0.0/8", "172.16.0.0/12"],
      noMatch: ["192.168.0.0", "192.168.0.0/33", "256.0.0.0/24"],
    },
  },
  {
    id: "ipv6",
    name: "IPv6 アドレス（簡易）",
    pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
    flags: "i",
    description: "フル形式（圧縮なし）の IPv6 アドレスに一致するパターン。",
    category: "network",
    examples: {
      match: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
      noMatch: ["::1", "2001:db8::1", "192.168.1.1"],
    },
  },
  {
    id: "mac-address",
    name: "MACアドレス",
    pattern: "^([0-9A-Fa-f]{2}[:\\-]){5}[0-9A-Fa-f]{2}$",
    flags: "i",
    description: "コロン区切りまたはハイフン区切りの MAC アドレスに一致するパターン。",
    category: "network",
    examples: {
      match: ["00:1A:2B:3C:4D:5E", "aa-bb-cc-dd-ee-ff"],
      noMatch: ["00:1A:2B:3C:4D", "001A2B3C4D5E", "GG:HH:II:JJ:KK:LL"],
    },
  },
  {
    id: "port-number",
    name: "ポート番号",
    pattern: "^(?:6553[0-5]|655[0-2]\\d|65[0-4]\\d{2}|6[0-4]\\d{3}|[1-5]\\d{4}|[1-9]\\d{1,3}|\\d)$",
    flags: "",
    description: "有効なネットワークポート番号（0〜65535）に一致するパターン。",
    category: "network",
    examples: {
      match: ["80", "443", "8080", "65535", "0"],
      noMatch: ["65536", "-1", "080", "abc"],
    },
  },

  // ─── 日付・時刻 ───────────────────────────────────────────
  {
    id: "date-iso",
    name: "日付 YYYY-MM-DD（ISO 8601）",
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
    flags: "",
    description: "ISO 8601 形式の日付（YYYY-MM-DD）に一致するパターン。月・日の範囲を検証。",
    category: "datetime",
    examples: {
      match: ["2024-01-15", "1990-12-31", "2000-02-29"],
      noMatch: ["2024-13-01", "2024-00-15", "24-01-15", "2024/01/15"],
    },
  },
  {
    id: "date-jp",
    name: "日付 YYYY/MM/DD（日本式）",
    pattern: "^\\d{4}/(0[1-9]|1[0-2])/(0[1-9]|[12]\\d|3[01])$",
    flags: "",
    description: "日本でよく使われるスラッシュ区切りの日付形式（YYYY/MM/DD）に一致するパターン。",
    category: "datetime",
    examples: {
      match: ["2024/01/15", "1990/12/31"],
      noMatch: ["2024-01-15", "2024/13/01", "24/01/15"],
    },
  },
  {
    id: "time-24h",
    name: "時刻 HH:MM:SS（24時間）",
    pattern: "^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$",
    flags: "",
    description: "24時間表記の時刻（HH:MM:SS）に一致するパターン。",
    category: "datetime",
    examples: {
      match: ["00:00:00", "23:59:59", "12:30:00"],
      noMatch: ["24:00:00", "12:60:00", "1:30:00", "12:30"],
    },
  },
  {
    id: "time-hhmm",
    name: "時刻 HH:MM",
    pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$",
    flags: "",
    description: "24時間表記の HH:MM 形式の時刻に一致するパターン。",
    category: "datetime",
    examples: {
      match: ["00:00", "23:59", "09:30"],
      noMatch: ["24:00", "9:30", "12:60", "12:30:00"],
    },
  },
  {
    id: "datetime-iso",
    name: "日時 ISO 8601",
    pattern:
      "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[+-][01]\\d:[0-5]\\d)?$",
    flags: "",
    description: "ISO 8601 形式の日時文字列（タイムゾーン付き）に一致するパターン。",
    category: "datetime",
    examples: {
      match: ["2024-01-15T12:30:00Z", "2024-01-15T12:30:00+09:00", "2024-01-15T12:30:00.123Z"],
      noMatch: ["2024-01-15 12:30:00", "2024-01-15", "2024-13-01T00:00:00Z"],
    },
  },
  {
    id: "unix-timestamp",
    name: "Unix タイムスタンプ",
    pattern: "^[1-9]\\d{9}$",
    flags: "",
    description: "10桁の Unix タイムスタンプ（秒単位、2001年〜2286年）に一致するパターン。",
    category: "datetime",
    examples: {
      match: ["1700000000", "1000000000", "9999999999"],
      noMatch: ["170000000", "10000000000", "0", "-1700000000"],
    },
  },

  // ─── 電話番号 ─────────────────────────────────────────────
  {
    id: "phone-jp-mobile",
    name: "日本の携帯電話番号",
    pattern: "^0[789]0[-\\s]?\\d{4}[-\\s]?\\d{4}$",
    flags: "",
    description:
      "日本の携帯電話番号（070/080/090 始まり）に一致するパターン。ハイフン・スペースありなし両対応。",
    category: "phone",
    examples: {
      match: ["090-1234-5678", "08012345678", "070 1234 5678"],
      noMatch: ["060-1234-5678", "090-123-5678", "+81-90-1234-5678"],
    },
  },
  {
    id: "phone-jp-landline",
    name: "日本の固定電話番号",
    pattern: "^0\\d{1,4}[-\\s]\\d{1,4}[-\\s]\\d{4}$",
    flags: "",
    description:
      "日本の固定電話番号に一致するパターン。ハイフン・スペース区切りに対応（市外局番2〜5桁）。",
    category: "phone",
    examples: {
      match: ["03-1234-5678", "06-9876-5432", "011-234-5678"],
      noMatch: ["0312345678", "03-12345678", "03-1234-567"],
    },
  },
  {
    id: "phone-us",
    name: "アメリカの電話番号",
    pattern: "^(?:\\+1\\s?)?(?:\\(\\d{3}\\)|\\d{3})[-\\s]?\\d{3}[-\\s]?\\d{4}$",
    flags: "",
    description: "アメリカの電話番号（E.164、括弧付き、ハイフン区切り）に一致するパターン。",
    category: "phone",
    examples: {
      match: ["+1 555-123-4567", "(555) 123-4567", "555-123-4567", "5551234567"],
      noMatch: ["55-123-4567", "+44 555-123-4567"],
    },
  },
  {
    id: "postal-jp",
    name: "日本の郵便番号",
    pattern: "^\\d{3}-\\d{4}$",
    flags: "",
    description: "日本の郵便番号（NNN-NNNN 形式）に一致するパターン。",
    category: "phone",
    examples: {
      match: ["100-0001", "530-0001", "900-0000"],
      noMatch: ["1000001", "100-00010", "ABC-0001"],
    },
  },

  // ─── パスワード ───────────────────────────────────────────
  {
    id: "password-strong",
    name: "強いパスワード",
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$",
    flags: "",
    description: "8文字以上で大文字・小文字・数字・記号を含む強いパスワードに一致するパターン。",
    category: "password",
    examples: {
      match: ["MyP@ssw0rd", "Str0ng!Pass", "C0mplex#1234"],
      noMatch: ["password", "PASSWORD1!", "Pass123", "Sh0rt!A"],
    },
  },
  {
    id: "password-medium",
    name: "中程度のパスワード",
    pattern: "^(?=.*[a-zA-Z])(?=.*\\d).{6,}$",
    flags: "",
    description: "6文字以上で英字と数字を含むパスワードに一致するパターン。",
    category: "password",
    examples: {
      match: ["pass123", "MyPass1", "abc123def"],
      noMatch: ["password", "123456", "ab12"],
    },
  },

  // ─── コード・開発 ─────────────────────────────────────────
  {
    id: "hex-color",
    name: "16進数カラーコード",
    pattern: "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
    flags: "i",
    description: "#RGB、#RRGGBB、#RRGGBBAA 形式の 16進数カラーコードに一致するパターン。",
    category: "code",
    examples: {
      match: ["#fff", "#FF5733", "#1a2b3c", "#FF573380"],
      noMatch: ["#GGHHII", "#12345", "FF5733", "#12345678z"],
    },
  },
  {
    id: "uuid-v4",
    name: "UUID v4",
    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    flags: "i",
    description: "UUID バージョン 4 の形式に一致するパターン。",
    category: "code",
    examples: {
      match: ["550e8400-e29b-41d4-a716-446655440000", "123e4567-e89b-42d3-a456-426614174000"],
      noMatch: [
        "550e8400-e29b-51d4-a716-446655440000",
        "550e8400e29b41d4a716446655440000",
        "not-a-uuid",
      ],
    },
  },
  {
    id: "semver",
    name: "セマンティックバージョニング",
    pattern:
      "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
    flags: "",
    description: "Semantic Versioning 2.0.0 に準拠したバージョン文字列に一致するパターン。",
    category: "code",
    examples: {
      match: ["1.0.0", "2.3.4", "1.0.0-alpha.1", "1.0.0+build.123"],
      noMatch: ["1.0", "01.0.0", "1.0.0.0", "v1.0.0"],
    },
  },
  {
    id: "css-class",
    name: "CSS クラス名",
    pattern: "^-?[_a-zA-Z][_a-zA-Z0-9-]*$",
    flags: "",
    description: "CSS クラス名・ID 名として有効な識別子に一致するパターン。",
    category: "code",
    examples: {
      match: ["container", "_private", "-webkit-box", "my-component-123"],
      noMatch: ["1invalid", "$class", "has space", ""],
    },
  },
  {
    id: "html-tag",
    name: "HTML タグ",
    pattern: "<([a-zA-Z][a-zA-Z0-9]*)(?:\\s[^>]*)?>",
    flags: "g",
    description: "HTML の開始タグに一致するパターン。属性を含む場合も対応。",
    category: "code",
    examples: {
      match: ["<div>", '<p class="text">', '<input type="text" id="foo">'],
      noMatch: ["</div>", "<!-- comment -->", "<123invalid>"],
    },
  },
  {
    id: "json-key",
    name: "JSON キー",
    pattern: '"([^"\\\\]|\\\\.)*"(?=\\s*:)',
    flags: "g",
    description: "JSON オブジェクトのキー（文字列 + コロン）に一致するパターン。",
    category: "code",
    examples: {
      match: ['"name": ', '"user_id": ', '"createdAt": '],
      noMatch: ['"value"', "name: ", '"key" value'],
    },
  },
  {
    id: "username",
    name: "ユーザー名",
    pattern: "^[a-zA-Z][a-zA-Z0-9_]{2,19}$",
    flags: "",
    description:
      "英字始まり、英数字とアンダースコアのみで 3〜20 文字のユーザー名に一致するパターン。",
    category: "code",
    examples: {
      match: ["john_doe", "user123", "Alice_2024"],
      noMatch: ["ab", "a".repeat(21), "1invalid", "has-hyphen", "has space"],
    },
  },
  {
    id: "variable-camel",
    name: "キャメルケース変数名",
    pattern: "^[a-z][a-zA-Z0-9]*$",
    flags: "",
    description: "キャメルケース形式の変数名・関数名（小文字始まり）に一致するパターン。",
    category: "code",
    examples: {
      match: ["myVariable", "getUserId", "parseJSON"],
      noMatch: ["MyVariable", "my_variable", "1invalid", "has-hyphen"],
    },
  },
  {
    id: "env-variable",
    name: "環境変数名",
    pattern: "^[A-Z][A-Z0-9_]*$",
    flags: "",
    description: "大文字・数字・アンダースコアのみで構成される環境変数名に一致するパターン。",
    category: "code",
    examples: {
      match: ["DATABASE_URL", "NODE_ENV", "PORT", "API_KEY_123"],
      noMatch: ["database_url", "NODE-ENV", "1INVALID", "has space"],
    },
  },

  // ─── 数値・テキスト ───────────────────────────────────────
  {
    id: "integer",
    name: "整数",
    pattern: "^-?[1-9]\\d*$|^0$",
    flags: "",
    description: "正・負の整数および 0 に一致するパターン。先頭のゼロは不可。",
    category: "text",
    examples: {
      match: ["0", "42", "-100", "1000000"],
      noMatch: ["3.14", "042", "1e5", "", "1,000"],
    },
  },
  {
    id: "decimal",
    name: "小数（浮動小数点数）",
    pattern: "^-?(?:0|[1-9]\\d*)(?:\\.\\d+)?$",
    flags: "",
    description: "正・負の整数および小数に一致するパターン。",
    category: "text",
    examples: {
      match: ["0", "3.14", "-2.5", "100", "0.001"],
      noMatch: ["3.", ".5", "1e5", "1,000", ""],
    },
  },
  {
    id: "positive-integer",
    name: "正の整数",
    pattern: "^[1-9]\\d*$",
    flags: "",
    description: "1以上の正の整数に一致するパターン。0 は含まない。",
    category: "text",
    examples: {
      match: ["1", "42", "1000000"],
      noMatch: ["0", "-1", "3.14", "042"],
    },
  },
  {
    id: "alphanumeric",
    name: "英数字のみ",
    pattern: "^[a-zA-Z0-9]+$",
    flags: "",
    description: "英字（大文字・小文字）と数字のみで構成されるテキストに一致するパターン。",
    category: "text",
    examples: {
      match: ["abc123", "ABC", "12345", "Hello World".replace(" ", "")],
      noMatch: ["hello world", "has-hyphen", "has_underscore", ""],
    },
  },
  {
    id: "whitespace-only",
    name: "空白のみ",
    pattern: "^\\s+$",
    flags: "",
    description:
      "1文字以上の空白文字（スペース・タブ・改行等）のみで構成されるテキストに一致するパターン。",
    category: "text",
    examples: {
      match: [" ", "\t", "   "],
      noMatch: ["text", " a ", ""],
    },
  },
  {
    id: "newline-normalize",
    name: "改行文字（全種類）",
    pattern: "\\r\\n|\\r|\\n",
    flags: "g",
    description:
      "Windows (CRLF)・Mac 旧形式 (CR)・Unix (LF) の改行文字すべてに一致するパターン。テキスト正規化に使用。",
    category: "text",
    examples: {
      match: ["\r\n", "\n", "\r"],
      noMatch: ["newline", "no-newline-here", "\\n (literal backslash-n)"],
    },
  },

  // ─── 日本語 ───────────────────────────────────────────────
  {
    id: "hiragana",
    name: "ひらがな",
    pattern: "^[ぁ-ん]+$",
    flags: "",
    description: "ひらがな（ぁ〜ん）のみで構成されるテキストに一致するパターン。",
    category: "japanese",
    examples: {
      match: ["あいうえお", "こんにちは", "ふぁ"],
      noMatch: ["アイウエオ", "漢字", "hiragana", "あいう123"],
    },
  },
  {
    id: "katakana",
    name: "カタカナ",
    pattern: "^[ァ-ヶーｦ-ﾟ]+$",
    flags: "",
    description: "全角・半角カタカナのみで構成されるテキストに一致するパターン。",
    category: "japanese",
    examples: {
      match: ["アイウエオ", "カタカナ", "ｱｲｳ"],
      noMatch: ["あいうえお", "漢字", "Katakana", "アイウ123"],
    },
  },
  {
    id: "kanji",
    name: "漢字（CJK統合漢字）",
    pattern: "^[\\u4e00-\\u9fff]+$",
    flags: "",
    description: "CJK 統合漢字（U+4E00〜U+9FFF）のみで構成されるテキストに一致するパターン。",
    category: "japanese",
    examples: {
      match: ["漢字", "日本語", "東京"],
      noMatch: ["ひらがな", "カタカナ", "kanji", "漢字123"],
    },
  },
  {
    id: "japanese-full",
    name: "日本語テキスト（ひらがな・カタカナ・漢字・記号混在）",
    pattern:
      "^[\\u3000-\\u303f\\u3040-\\u309f\\u30a0-\\u30ff\\u4e00-\\u9fff\\uff00-\\uffef\\u3400-\\u4dbf]+$",
    flags: "",
    description:
      "ひらがな・カタカナ・漢字・全角記号のみで構成される日本語テキスト（BMP 範囲）に一致するパターン。",
    category: "japanese",
    examples: {
      match: ["こんにちは", "アイウエオ", "東京都", "漢字とひらがな"],
      noMatch: ["Hello", "abc123", "こんにちはHello"],
    },
  },
  {
    id: "postal-jp-alt",
    name: "日本語テキスト（全角スペース含む）",
    pattern: "^[\\u3000-\\u9fff\\uff00-\\uffef\\u3400-\\u4dbf]+$",
    flags: "",
    description: "日本語文字と全角スペース・全角句読点を含むテキストに一致するパターン。",
    category: "japanese",
    examples: {
      match: ["こんにちは。", "東京都、渋谷区", "アイウ　エオ"],
      noMatch: ["Hello", "123", "こんにちはHello"],
    },
  },

  // ─── 金融 ─────────────────────────────────────────────────
  {
    id: "credit-card-generic",
    name: "クレジットカード番号（汎用）",
    pattern: "^[0-9]{4}[\\s\\-]?[0-9]{4}[\\s\\-]?[0-9]{4}[\\s\\-]?[0-9]{4}$",
    flags: "",
    description:
      "16桁のクレジットカード番号（スペース・ハイフンありなし両対応）に一致するパターン。",
    category: "finance",
    examples: {
      match: ["4111111111111111", "4111 1111 1111 1111", "4111-1111-1111-1111"],
      noMatch: ["411111111111111", "41111111111111111", "abcd-efgh-ijkl-mnop"],
    },
  },
  {
    id: "credit-card-visa",
    name: "Visa カード番号",
    pattern: "^4[0-9]{12}(?:[0-9]{3})?$",
    flags: "",
    description: "4 始まりの Visa カード番号（13桁または16桁）に一致するパターン。",
    category: "finance",
    examples: {
      match: ["4111111111111111", "4012888888881881"],
      noMatch: ["5111111111111111", "411111111111111111", "123456789012345"],
    },
  },
  {
    id: "credit-card-mastercard",
    name: "Mastercard カード番号",
    pattern:
      "^5[1-5][0-9]{14}$|^2(?:2[2-9][1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)[0-9]{12}$",
    flags: "",
    description: "51〜55 始まりまたは 2221〜2720 始まりの Mastercard 番号に一致するパターン。",
    category: "finance",
    examples: {
      match: ["5111111111111111", "5500000000000004", "2221000000000009"],
      noMatch: ["4111111111111111", "5611111111111111"],
    },
  },
  {
    id: "iban",
    name: "IBAN（国際銀行口座番号）",
    pattern: "^[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}(?:[A-Z0-9]?){0,16}$",
    flags: "",
    description: "国際銀行口座番号（IBAN）の形式に一致するパターン。",
    category: "finance",
    examples: {
      match: ["DE89370400440532013000", "GB29NWBK60161331926819", "FR7630006000011234567890189"],
      noMatch: ["de89370400440532013000", "12345678", "1234XXXX0000000"],
    },
  },
];

/**
 * カテゴリの表示ラベルを返す
 * @param category - 正規表現カテゴリ
 * @returns 日本語ラベル
 */
export function getCategoryLabel(category: RegexCategory | "all"): string {
  switch (category) {
    case "all":
      return "すべて";
    case "email":
      return "メール";
    case "url":
      return "URL";
    case "network":
      return "ネットワーク";
    case "datetime":
      return "日付・時刻";
    case "phone":
      return "電話・郵便";
    case "password":
      return "パスワード";
    case "code":
      return "コード";
    case "japanese":
      return "日本語";
    case "text":
      return "数値・テキスト";
    case "finance":
      return "金融";
  }
}

/**
 * カテゴリに対応する CSS クラスを返す
 * @param category - 正規表現カテゴリ
 * @returns CSSクラス文字列
 */
export function getCategoryClass(category: RegexCategory): string {
  return `regex-lib-cat-${category}`;
}

/**
 * 正規表現エントリをフィルタリングする
 * @param entries - フィルタリング対象のエントリ一覧
 * @param query - 検索クエリ（名前・説明・パターンを対象）
 * @param category - カテゴリフィルタ（'all' またはカテゴリ名）
 * @returns フィルタリングされたエントリ一覧
 */
export function filterRegexEntries(
  entries: RegexEntry[],
  query: string,
  category: RegexCategory | "all",
): RegexEntry[] {
  const lowerQuery = query.toLowerCase().trim();

  return entries.filter((entry) => {
    if (category !== "all" && entry.category !== category) {
      return false;
    }

    if (!lowerQuery) return true;

    return (
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.pattern.toLowerCase().includes(lowerQuery) ||
      entry.id.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * パターン文字列から RegExp オブジェクトを生成する（例外をキャッチ）
 * @param pattern - 正規表現パターン文字列
 * @param flags - 正規表現フラグ
 * @returns RegExp オブジェクト、または無効な場合は null
 */
export function safeCreateRegex(pattern: string, flags: string): RegExp | null {
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
 * テスト文字列が正規表現にマッチするか判定する
 * @param pattern - 正規表現パターン文字列
 * @param flags - 正規表現フラグ
 * @param testStr - テスト対象の文字列
 * @returns マッチする場合 true、しない場合 false、無効なパターンの場合 null
 */
export function testRegex(pattern: string, flags: string, testStr: string): boolean | null {
  const re = safeCreateRegex(pattern, flags);
  if (!re) return null;
  return re.test(testStr);
}
