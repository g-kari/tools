/**
 * Mustache 互換テンプレートエンジン
 *
 * サポートする構文:
 * - {{variable}}          変数展開（HTMLエスケープあり）
 * - {{{variable}}}        変数展開（エスケープなし）
 * - {{&variable}}         変数展開（エスケープなし、{{{...}}} の別記法）
 * - {{#section}}...{{/section}}  セクション（truthy なら表示、配列ならループ）
 * - {{^inverted}}...{{/inverted}} 逆セクション（falsy なら表示）
 * - {{! comment }}        コメント（出力なし）
 * - {{.}}                 現在のコンテキスト値
 * - {{a.b.c}}             ネストされたプロパティアクセス
 */

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/** テンプレートに渡すデータ型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TemplateData = any;

/** レンダリング結果 */
export interface RenderResult {
  /** レンダリングされた出力文字列 */
  output: string;
  /** エラーメッセージ（エラーがなければ null） */
  error: string | null;
}

/** テンプレートのサンプル */
export interface TemplateSample {
  /** サンプル名 */
  name: string;
  /** テンプレート文字列 */
  template: string;
  /** サンプルデータ（JSON文字列） */
  data: string;
}

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * HTML特殊文字をエスケープする
 * @param str - エスケープする文字列
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * ドット区切りのキーでコンテキストからネストされた値を取得する
 * @param context - 検索対象のコンテキスト
 * @param key - ドット区切りのキー（例: "user.name"）
 */
function lookup(context: TemplateData, key: string): TemplateData {
  if (key === '.') return context;
  if (context === null || context === undefined) return undefined;
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/**
 * 値が「truthy」かどうかを Mustache の仕様に従って判定する
 * - 空配列は false（Mustache仕様）
 * - 空文字列は false
 * - 0 は false
 * @param value - 判定する値
 */
function isTruthy(value: TemplateData): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

/**
 * テンプレート文字列の内部レンダリングロジック
 * @param template - Mustache テンプレート文字列
 * @param context - レンダリングに使用するデータコンテキスト
 */
function renderInternal(template: string, context: TemplateData): string {
  let result = '';
  let pos = 0;

  while (pos < template.length) {
    const openIdx = template.indexOf('{{', pos);
    if (openIdx === -1) {
      // 残りのテキストをそのまま追加
      result += template.slice(pos);
      break;
    }

    // {{ 以前のテキストを追加
    result += template.slice(pos, openIdx);

    // {{{ ... }}} トリプル Mustache（エスケープなし）
    if (template[openIdx + 2] === '{') {
      const closeIdx = template.indexOf('}}}', openIdx + 3);
      if (closeIdx === -1) {
        result += template.slice(openIdx);
        break;
      }
      const key = template.slice(openIdx + 3, closeIdx).trim();
      const value = lookup(context, key);
      if (value !== undefined && value !== null) {
        result += String(value);
      }
      pos = closeIdx + 3;
      continue;
    }

    // {{ ... }} ダブル Mustache
    const closeIdx = template.indexOf('}}', openIdx + 2);
    if (closeIdx === -1) {
      result += template.slice(openIdx);
      break;
    }

    const tag = template.slice(openIdx + 2, closeIdx).trim();

    // {{! comment }} コメント
    if (tag.startsWith('!')) {
      pos = closeIdx + 2;
      continue;
    }

    // {{& variable }} エスケープなし変数
    if (tag.startsWith('&')) {
      const key = tag.slice(1).trim();
      const value = lookup(context, key);
      if (value !== undefined && value !== null) {
        result += String(value);
      }
      pos = closeIdx + 2;
      continue;
    }

    // {{# section }} ... {{/ section }} セクション
    if (tag.startsWith('#')) {
      const key = tag.slice(1).trim();
      const closeTag = `{{/${key}}}`;
      // 閉じタグを検索（スペースを含む場合も考慮）
      const closeTagIdx = findCloseTag(template, key, closeIdx + 2);
      if (closeTagIdx === -1) {
        pos = closeIdx + 2;
        continue;
      }
      const { start: sectionStart, end: sectionEnd } = closeTagIdx === -1
        ? { start: closeIdx + 2, end: closeIdx + 2 }
        : { start: closeIdx + 2, end: closeTagIdx };
      const sectionContent = template.slice(sectionStart, sectionEnd);
      const closeTagFull = findCloseTagFull(template, key, closeIdx + 2);
      const value = lookup(context, key);

      if (Array.isArray(value)) {
        // 配列の場合: 各要素でループ
        for (const item of value) {
          result += renderInternal(sectionContent, item);
        }
      } else if (isTruthy(value)) {
        // truthy な値の場合: コンテキストを更新して表示
        const newContext = typeof value === 'object' && value !== null ? value : context;
        result += renderInternal(sectionContent, newContext);
      }
      // falsy の場合は何も出力しない

      pos = closeTagFull;
      continue;
    }

    // {{^ inverted }} ... {{/ inverted }} 逆セクション
    if (tag.startsWith('^')) {
      const key = tag.slice(1).trim();
      const closeTagIdx = findCloseTag(template, key, closeIdx + 2);
      if (closeTagIdx === -1) {
        pos = closeIdx + 2;
        continue;
      }
      const sectionContent = template.slice(closeIdx + 2, closeTagIdx);
      const closeTagFull = findCloseTagFull(template, key, closeIdx + 2);
      const value = lookup(context, key);

      if (!isTruthy(value)) {
        result += renderInternal(sectionContent, context);
      }
      pos = closeTagFull;
      continue;
    }

    // {{/ key }} 閉じタグ（単独で現れた場合は無視）
    if (tag.startsWith('/')) {
      pos = closeIdx + 2;
      continue;
    }

    // {{variable}} 通常の変数展開（HTMLエスケープあり）
    const value = lookup(context, tag);
    if (value !== undefined && value !== null) {
      result += escapeHtml(String(value));
    }
    pos = closeIdx + 2;
  }

  return result;
}

/**
 * 対応する閉じタグの開始位置を検索する
 * @param template - テンプレート文字列
 * @param key - セクションキー
 * @param startPos - 検索開始位置
 * @returns 閉じタグの開始インデックス（見つからない場合 -1）
 */
function findCloseTag(template: string, key: string, startPos: number): number {
  // {{/key}} または {{/ key }} の形式を検索
  const pattern1 = `{{/${key}}}`;
  const pattern2 = `{{/ ${key} }}`;
  const pattern3 = `{{/ ${key}}}`;
  const pattern4 = `{{/${key} }}`;

  let minIdx = -1;
  for (const pattern of [pattern1, pattern2, pattern3, pattern4]) {
    const idx = template.indexOf(pattern, startPos);
    if (idx !== -1 && (minIdx === -1 || idx < minIdx)) {
      minIdx = idx;
    }
  }
  return minIdx;
}

/**
 * 対応する閉じタグの終了位置（次の解析開始位置）を返す
 * @param template - テンプレート文字列
 * @param key - セクションキー
 * @param startPos - 検索開始位置
 * @returns 閉じタグ後の位置
 */
function findCloseTagFull(template: string, key: string, startPos: number): number {
  const patterns = [
    `{{/${key}}}`,
    `{{/ ${key} }}`,
    `{{/ ${key}}}`,
    `{{/${key} }}`,
  ];

  let minIdx = -1;
  let minPattern = patterns[0]!;
  for (const pattern of patterns) {
    const idx = template.indexOf(pattern, startPos);
    if (idx !== -1 && (minIdx === -1 || idx < minIdx)) {
      minIdx = idx;
      minPattern = pattern;
    }
  }
  if (minIdx === -1) return startPos;
  return minIdx + minPattern.length;
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * Mustache テンプレートを JSON データでレンダリングする
 * @param template - Mustache テンプレート文字列
 * @param jsonData - JSON 形式のデータ文字列
 * @returns レンダリング結果（output と error を含む）
 */
export function renderTemplate(template: string, jsonData: string): RenderResult {
  // 空テンプレートの処理
  if (!template.trim()) {
    return { output: '', error: null };
  }

  // JSON パース
  let data: TemplateData;
  try {
    data = JSON.parse(jsonData.trim() || '{}');
  } catch (e) {
    return {
      output: '',
      error: `JSONパースエラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // レンダリング
  try {
    const output = renderInternal(template, data);
    return { output, error: null };
  } catch (e) {
    return {
      output: '',
      error: `レンダリングエラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * サンプルテンプレートと対応する JSON データの一覧
 */
export const TEMPLATE_SAMPLES: TemplateSample[] = [
  {
    name: '基本的な変数展開',
    template: `こんにちは、{{name}} さん！
あなたは {{age}} 歳です。
お住まいは {{address.city}} です。`,
    data: JSON.stringify(
      {
        name: '山田太郎',
        age: 30,
        address: {
          city: '東京',
          zip: '100-0001',
        },
      },
      null,
      2,
    ),
  },
  {
    name: 'リストのループ',
    template: `買い物リスト:
{{#items}}
- {{name}}（{{price}}円）
{{/items}}

合計: {{total}}円`,
    data: JSON.stringify(
      {
        items: [
          { name: 'りんご', price: 150 },
          { name: 'バナナ', price: 200 },
          { name: 'みかん', price: 120 },
        ],
        total: 470,
      },
      null,
      2,
    ),
  },
  {
    name: '条件分岐',
    template: `{{#isAdmin}}
管理者としてログインしています。
{{/isAdmin}}
{{^isAdmin}}
一般ユーザーとしてログインしています。
{{/isAdmin}}

ユーザー名: {{username}}`,
    data: JSON.stringify(
      {
        username: 'user123',
        isAdmin: false,
      },
      null,
      2,
    ),
  },
  {
    name: 'HTMLエスケープ',
    template: `通常変数（エスケープあり）: {{html}}
トリプル波括弧（エスケープなし）: {{{html}}}
アンパサンド記法（エスケープなし）: {{&html}}`,
    data: JSON.stringify(
      {
        html: '<strong>太字テキスト</strong>',
      },
      null,
      2,
    ),
  },
  {
    name: 'ネストされたデータ',
    template: `プロジェクト: {{project.name}}
バージョン: {{project.version}}

メンバー一覧:
{{#project.members}}
  - {{name}} ({{role}})
{{/project.members}}`,
    data: JSON.stringify(
      {
        project: {
          name: 'Web ツール集',
          version: '1.0.0',
          members: [
            { name: '田中', role: 'フロントエンド' },
            { name: '鈴木', role: 'バックエンド' },
            { name: '佐藤', role: 'デザイナー' },
          ],
        },
      },
      null,
      2,
    ),
  },
];
