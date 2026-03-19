/**
 * Cache-Control ヘッダービルダー・パーサーユーティリティ
 * RFC 7234 / RFC 8246 準拠
 */

/**
 * Cache-Control ディレクティブの値の種類
 */
export type DirectiveValueType = 'none' | 'number' | 'optional-number';

/**
 * Cache-Control ディレクティブの適用対象
 */
export type DirectiveTarget = 'response' | 'request' | 'both';

/**
 * Cache-Control ディレクティブの定義情報
 */
export interface CacheControlDirectiveInfo {
  /** ディレクティブ名 */
  name: string;
  /** 説明 */
  description: string;
  /** 適用対象（リクエスト/レスポンス/両方） */
  target: DirectiveTarget;
  /** 値の種類 */
  valueType: DirectiveValueType;
  /** 値の単位（秒など） */
  unit?: string;
  /** デフォルト値（数値型の場合） */
  defaultValue?: number;
  /** 使用例 */
  example?: string;
  /** 非推奨かどうか */
  deprecated?: boolean;
}

/**
 * ディレクティブの状態エントリ
 */
export interface CacheControlDirectiveEntry {
  /** ディレクティブ名 */
  name: string;
  /** 有効かどうか */
  enabled: boolean;
  /** 数値の値（valueType が 'number' または 'optional-number' の場合） */
  value?: number;
}

/**
 * パース済み Cache-Control
 */
export interface ParsedCacheControl {
  /** ディレクティブエントリの配列 */
  directives: CacheControlDirectiveEntry[];
  /** パースエラー一覧 */
  errors: string[];
}

/**
 * 検証結果
 */
export interface CacheControlValidationResult {
  /** 警告メッセージ一覧 */
  warnings: string[];
  /** 提案メッセージ一覧 */
  suggestions: string[];
}

/** レスポンス用ディレクティブ一覧 */
export const RESPONSE_DIRECTIVES: CacheControlDirectiveInfo[] = [
  {
    name: 'max-age',
    description: 'レスポンスが新鮮とみなされる最大秒数。この時間を過ぎると再検証が必要になります。',
    target: 'response',
    valueType: 'number',
    unit: '秒',
    defaultValue: 3600,
    example: 'max-age=3600',
  },
  {
    name: 's-maxage',
    description: '共有キャッシュ（CDN等）における最大秒数。max-age を上書きします。',
    target: 'response',
    valueType: 'number',
    unit: '秒',
    defaultValue: 86400,
    example: 's-maxage=86400',
  },
  {
    name: 'no-cache',
    description: 'キャッシュを使用する前に必ずオリジンサーバーで再検証が必要。ETag/Last-Modified を使った条件付きリクエストを強制します。',
    target: 'response',
    valueType: 'none',
    example: 'no-cache',
  },
  {
    name: 'no-store',
    description: 'レスポンスをいかなるキャッシュにも保存しません。機密情報（ログイン後のページ、個人情報等）に適しています。',
    target: 'response',
    valueType: 'none',
    example: 'no-store',
  },
  {
    name: 'public',
    description: '共有キャッシュ（CDN、プロキシ等）にキャッシュ可能。通常は認証不要のパブリックコンテンツに使用します。',
    target: 'response',
    valueType: 'none',
    example: 'public',
  },
  {
    name: 'private',
    description: 'ブラウザキャッシュにのみ保存可能。CDN・プロキシなどの共有キャッシュには保存されません。',
    target: 'response',
    valueType: 'none',
    example: 'private',
  },
  {
    name: 'must-revalidate',
    description: 'キャッシュが古くなった場合、必ずオリジンサーバーで再検証しなければなりません。オフライン時のキャッシュ利用を防ぎます。',
    target: 'response',
    valueType: 'none',
    example: 'must-revalidate',
  },
  {
    name: 'proxy-revalidate',
    description: '共有キャッシュ（プロキシ等）に対して、古くなった場合の再検証を要求します（must-revalidate の共有キャッシュ版）。',
    target: 'response',
    valueType: 'none',
    example: 'proxy-revalidate',
  },
  {
    name: 'immutable',
    description: 'レスポンスが新鮮な間は変更されないことを示します。ブラウザが条件付きリクエストを行うのを防ぎ、パフォーマンスを向上させます（コンテンツハッシュ付きアセットに最適）。',
    target: 'response',
    valueType: 'none',
    example: 'immutable',
  },
  {
    name: 'stale-while-revalidate',
    description: '古いレスポンスを返しつつ、バックグラウンドで非同期に再検証します（RFC 5861）。UX向上のため短い秒数を推奨します。',
    target: 'response',
    valueType: 'number',
    unit: '秒',
    defaultValue: 60,
    example: 'stale-while-revalidate=60',
  },
  {
    name: 'stale-if-error',
    description: 'オリジンサーバーがエラー（5xx）を返した場合に、指定秒数まで古いレスポンスを使用します（RFC 5861）。',
    target: 'response',
    valueType: 'number',
    unit: '秒',
    defaultValue: 86400,
    example: 'stale-if-error=86400',
  },
  {
    name: 'no-transform',
    description: 'プロキシがレスポンスを変換（圧縮・形式変換等）することを禁止します。',
    target: 'response',
    valueType: 'none',
    example: 'no-transform',
  },
];

/** リクエスト用ディレクティブ一覧 */
export const REQUEST_DIRECTIVES: CacheControlDirectiveInfo[] = [
  {
    name: 'max-age',
    description: 'この秒数より古いキャッシュは受け入れません。',
    target: 'request',
    valueType: 'number',
    unit: '秒',
    defaultValue: 0,
    example: 'max-age=0',
  },
  {
    name: 'max-stale',
    description: '指定秒数まで古いレスポンスを受け入れます。値省略時は任意の古さを許可します。',
    target: 'request',
    valueType: 'optional-number',
    unit: '秒',
    defaultValue: 3600,
    example: 'max-stale=3600',
  },
  {
    name: 'min-fresh',
    description: 'この秒数以上新鮮なレスポンスのみ受け入れます。',
    target: 'request',
    valueType: 'number',
    unit: '秒',
    defaultValue: 60,
    example: 'min-fresh=60',
  },
  {
    name: 'no-cache',
    description: 'キャッシュに保存されたレスポンスを使用せず、オリジンサーバーからの新鮮なレスポンスを要求します。',
    target: 'request',
    valueType: 'none',
    example: 'no-cache',
  },
  {
    name: 'no-store',
    description: 'キャッシュがリクエスト・レスポンスを保存することを禁止します。',
    target: 'request',
    valueType: 'none',
    example: 'no-store',
  },
  {
    name: 'no-transform',
    description: 'プロキシがリクエストを変換することを禁止します。',
    target: 'request',
    valueType: 'none',
    example: 'no-transform',
  },
  {
    name: 'only-if-cached',
    description: 'キャッシュにある場合のみレスポンスを要求します。ネットワークアクセスを行わず、キャッシュがなければ504を返します。',
    target: 'request',
    valueType: 'none',
    example: 'only-if-cached',
  },
];

/** 全ディレクティブ（応答用） */
export const ALL_RESPONSE_DIRECTIVES: CacheControlDirectiveInfo[] = RESPONSE_DIRECTIVES;
/** 全ディレクティブ（要求用） */
export const ALL_REQUEST_DIRECTIVES: CacheControlDirectiveInfo[] = REQUEST_DIRECTIVES;

/**
 * ディレクティブ名から定義情報を取得する（レスポンス用）
 * @param name ディレクティブ名
 * @returns ディレクティブ情報（見つからない場合は undefined）
 */
export function findResponseDirectiveInfo(name: string): CacheControlDirectiveInfo | undefined {
  return RESPONSE_DIRECTIVES.find((d) => d.name === name.toLowerCase().trim());
}

/**
 * ディレクティブ名から定義情報を取得する（リクエスト用）
 * @param name ディレクティブ名
 * @returns ディレクティブ情報（見つからない場合は undefined）
 */
export function findRequestDirectiveInfo(name: string): CacheControlDirectiveInfo | undefined {
  return REQUEST_DIRECTIVES.find((d) => d.name === name.toLowerCase().trim());
}

/**
 * Cache-Control ヘッダー文字列をパースする
 * @param headerValue Cache-Control ヘッダー値
 * @param target 'response' または 'request'
 * @returns パース済みオブジェクト
 */
export function parseCacheControl(
  headerValue: string,
  target: 'response' | 'request' = 'response',
): ParsedCacheControl {
  const directives: CacheControlDirectiveEntry[] = [];
  const errors: string[] = [];

  if (!headerValue.trim()) {
    return { directives, errors };
  }

  const seen = new Set<string>();
  const tokens = headerValue.split(',').map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    const eqIdx = token.indexOf('=');
    let name: string;
    let rawValue: string | undefined;

    if (eqIdx !== -1) {
      name = token.slice(0, eqIdx).trim().toLowerCase();
      rawValue = token.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1');
    } else {
      name = token.toLowerCase();
      rawValue = undefined;
    }

    if (seen.has(name)) {
      errors.push(`ディレクティブ "${name}" が重複しています。最初の定義のみ有効です。`);
      continue;
    }
    seen.add(name);

    const allDirs = target === 'response' ? RESPONSE_DIRECTIVES : REQUEST_DIRECTIVES;
    const info = allDirs.find((d) => d.name === name);

    let value: number | undefined;
    if (rawValue !== undefined) {
      const parsed = parseInt(rawValue, 10);
      if (isNaN(parsed)) {
        errors.push(`ディレクティブ "${name}" の値 "${rawValue}" は有効な整数ではありません。`);
      } else {
        value = parsed;
      }
    }

    if (info && info.valueType === 'number' && value === undefined) {
      errors.push(`ディレクティブ "${name}" には秒数の値が必要です（例: ${name}=3600）。`);
    }

    directives.push({ name, enabled: true, value });
  }

  return { directives, errors };
}

/**
 * ディレクティブエントリの配列から Cache-Control ヘッダー値を生成する
 * @param directives ディレクティブエントリの配列
 * @param target 'response' または 'request'
 * @returns Cache-Control ヘッダー値文字列
 */
export function buildCacheControl(
  directives: CacheControlDirectiveEntry[],
  target: 'response' | 'request' = 'response',
): string {
  const parts: string[] = [];
  const allDirs = target === 'response' ? RESPONSE_DIRECTIVES : REQUEST_DIRECTIVES;

  for (const entry of directives) {
    if (!entry.enabled) continue;
    if (!entry.name.trim()) continue;

    const info = allDirs.find((d) => d.name === entry.name);

    if (!info || info.valueType === 'none') {
      parts.push(entry.name);
    } else if (info.valueType === 'optional-number') {
      if (entry.value !== undefined) {
        parts.push(`${entry.name}=${entry.value}`);
      } else {
        parts.push(entry.name);
      }
    } else {
      // number
      if (entry.value === undefined) continue;
      parts.push(`${entry.name}=${entry.value}`);
    }
  }

  return parts.join(', ');
}

/**
 * Cache-Control ディレクティブを検証し警告・提案を返す
 * @param directives ディレクティブエントリの配列
 * @returns 検証結果
 */
export function validateCacheControl(
  directives: CacheControlDirectiveEntry[],
): CacheControlValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const enabled = directives.filter((d) => d.enabled);
  const names = new Set(enabled.map((d) => d.name));

  // no-store と他のディレクティブの競合チェック
  if (names.has('no-store') && names.size > 1) {
    const others = enabled.filter((d) => d.name !== 'no-store').map((d) => d.name);
    warnings.push(
      `"no-store" が設定されている場合、他のディレクティブ（${others.join(', ')}）は無視されます。no-store はキャッシュを完全に無効化します。`,
    );
  }

  // public と private の競合チェック
  if (names.has('public') && names.has('private')) {
    warnings.push('"public" と "private" は同時に指定できません。どちらか一方を選択してください。');
  }

  // no-cache と no-store の重複指定チェック
  if (names.has('no-cache') && names.has('no-store')) {
    suggestions.push(
      '"no-cache" と "no-store" が両方指定されています。機密情報には "no-store" のみで十分です。',
    );
  }

  // max-age=0 と no-cache の冗長チェック
  const maxAge = enabled.find((d) => d.name === 'max-age');
  if (maxAge?.value === 0 && names.has('no-cache')) {
    suggestions.push(
      '"max-age=0" と "no-cache" が両方指定されています。"no-cache" のみで再検証を強制できます。',
    );
  }

  // immutable と no-cache/max-age=0 の矛盾チェック
  if (names.has('immutable') && names.has('no-cache')) {
    warnings.push(
      '"immutable" と "no-cache" は矛盾します。immutable は変更がないことを示しますが、no-cache は毎回再検証を要求します。',
    );
  }

  if (names.has('immutable') && maxAge?.value === 0) {
    warnings.push(
      '"immutable" と "max-age=0" は矛盾します。immutable は十分に長い max-age（例: 1年 = 31536000）と組み合わせてください。',
    );
  }

  // immutable には長い max-age を推奨
  if (names.has('immutable') && maxAge !== undefined && maxAge.value !== undefined && maxAge.value < 86400) {
    suggestions.push(
      `"immutable" が設定されていますが、max-age が ${maxAge.value} 秒と短めです。immutable はコンテンツハッシュ付きアセットに使用し、max-age=31536000（1年）のような長い値と組み合わせることを推奨します。`,
    );
  }

  // must-revalidate と stale-while-revalidate の競合
  if (names.has('must-revalidate') && names.has('stale-while-revalidate')) {
    warnings.push(
      '"must-revalidate" と "stale-while-revalidate" は競合する場合があります。must-revalidate は古いレスポンスの使用を禁止しますが、stale-while-revalidate は古いレスポンスを返すことを許可します。',
    );
  }

  // private と s-maxage の競合
  if (names.has('private') && names.has('s-maxage')) {
    warnings.push(
      '"private" が設定されている場合、"s-maxage" は共有キャッシュに適用されません。s-maxage を削除するか、"public" に変更することを検討してください。',
    );
  }

  // s-maxage なしで CDN キャッシュを設定している場合の提案
  if (names.has('public') && !names.has('s-maxage') && names.has('max-age')) {
    suggestions.push(
      '"public" と "max-age" が設定されています。CDN/プロキシに異なるキャッシュ時間を設定したい場合は "s-maxage" を追加することを検討してください。',
    );
  }

  // no-cache なしで動的コンテンツに max-age が大きい場合の提案
  if (maxAge !== undefined && maxAge.value !== undefined && maxAge.value > 86400 && !names.has('no-cache')) {
    if (!names.has('immutable') && !names.has('public')) {
      suggestions.push(
        `"max-age=${maxAge.value}" と設定されています（${Math.round(maxAge.value / 86400)} 日）。頻繁に更新されるコンテンツの場合は "no-cache" または "must-revalidate" と ETag を組み合わせることを検討してください。`,
      );
    }
  }

  return { warnings, suggestions };
}

/**
 * プリセットプロファイルの定義
 */
export interface CacheControlPreset {
  /** プリセット名 */
  name: string;
  /** プリセットの説明 */
  description: string;
  /** ユースケース */
  useCase: string;
  /** ディレクティブエントリ */
  directives: CacheControlDirectiveEntry[];
}

/**
 * レスポンス用プリセット一覧
 */
export const RESPONSE_PRESETS: CacheControlPreset[] = [
  {
    name: 'キャッシュなし（機密情報）',
    description: 'キャッシュを完全に禁止します',
    useCase: 'ログイン後のページ・個人情報・認証コンテンツ',
    directives: [
      { name: 'no-store', enabled: true },
    ],
  },
  {
    name: '再検証必須（動的コンテンツ）',
    description: 'キャッシュはするが毎回再検証を要求します',
    useCase: 'HTMLページ・動的に変わるAPI・頻繁に更新されるデータ',
    directives: [
      { name: 'no-cache', enabled: true },
      { name: 'private', enabled: true },
    ],
  },
  {
    name: '短期キャッシュ（1時間）',
    description: '1時間キャッシュします',
    useCase: '準動的なコンテンツ・数時間有効なAPI',
    directives: [
      { name: 'public', enabled: true },
      { name: 'max-age', enabled: true, value: 3600 },
      { name: 'stale-while-revalidate', enabled: true, value: 60 },
    ],
  },
  {
    name: '中期キャッシュ（1日）',
    description: '1日キャッシュします',
    useCase: '変更頻度の低いAPIレスポンス・画像等のメディア',
    directives: [
      { name: 'public', enabled: true },
      { name: 'max-age', enabled: true, value: 86400 },
      { name: 's-maxage', enabled: true, value: 604800 },
      { name: 'stale-while-revalidate', enabled: true, value: 3600 },
    ],
  },
  {
    name: '長期キャッシュ（コンテンツハッシュ付き）',
    description: '1年間キャッシュします（ファイル名にハッシュを含む場合）',
    useCase: 'JS/CSS/フォント等のビルド済みアセット（ファイル名に content hash を含む）',
    directives: [
      { name: 'public', enabled: true },
      { name: 'max-age', enabled: true, value: 31536000 },
      { name: 'immutable', enabled: true },
    ],
  },
  {
    name: 'SWR パターン（Stale-While-Revalidate）',
    description: '古いデータを即座に返しつつバックグラウンドで更新します',
    useCase: 'UX重視のコンテンツ・SWR/React Query 等と組み合わせる',
    directives: [
      { name: 'public', enabled: true },
      { name: 'max-age', enabled: true, value: 60 },
      { name: 'stale-while-revalidate', enabled: true, value: 600 },
      { name: 'stale-if-error', enabled: true, value: 86400 },
    ],
  },
];

/**
 * 秒数を人間が読みやすい形式に変換する
 * @param seconds 秒数
 * @returns 人間が読みやすい文字列（例: "1時間", "7日"）
 */
export function formatSeconds(seconds: number): string {
  if (seconds === 0) return '0秒';
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}分` : `${m}分${s}秒`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m === 0 ? `${h}時間` : `${h}時間${m}分`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h === 0 ? `${d}日` : `${d}日${h}時間`;
}
