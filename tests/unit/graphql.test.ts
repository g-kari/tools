import { describe, it, expect } from 'vite-plus/test';
import {
  tokenizeGraphQL,
  formatGraphQL,
  minifyGraphQL,
  validateGraphQL,
} from '../../app/utils/graphql';

describe('tokenizeGraphQL', () => {
  it('名前トークンを認識する', () => {
    const tokens = tokenizeGraphQL('query');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: 'name', value: 'query' });
  });

  it('コメントトークンを認識する', () => {
    const tokens = tokenizeGraphQL('# これはコメント\nquery');
    expect(tokens[0]).toEqual({ type: 'comment', value: '# これはコメント' });
    expect(tokens[1]).toEqual({ type: 'name', value: 'query' });
  });

  it('文字列トークンを認識する', () => {
    const tokens = tokenizeGraphQL('"hello"');
    expect(tokens[0]).toEqual({ type: 'string', value: '"hello"' });
  });

  it('ブロック文字列トークンを認識する', () => {
    const tokens = tokenizeGraphQL('"""block string"""');
    expect(tokens[0]).toEqual({ type: 'block_string', value: '"""block string"""' });
  });

  it('スプレッド演算子を認識する', () => {
    const tokens = tokenizeGraphQL('...');
    expect(tokens[0]).toEqual({ type: 'spread', value: '...' });
  });

  it('句読点を認識する', () => {
    const tokens = tokenizeGraphQL('{}()[]!|=@:$&');
    const punctuations = '{}()[]!|=@:$&'.split('');
    expect(tokens).toHaveLength(punctuations.length);
    tokens.forEach((t, i) => {
      expect(t).toEqual({ type: 'punctuation', value: punctuations[i] });
    });
  });

  it('整数トークンを認識する', () => {
    const tokens = tokenizeGraphQL('42');
    expect(tokens[0]).toEqual({ type: 'integer', value: '42' });
  });

  it('負の整数トークンを認識する', () => {
    const tokens = tokenizeGraphQL('-10');
    expect(tokens[0]).toEqual({ type: 'integer', value: '-10' });
  });

  it('浮動小数点トークンを認識する', () => {
    const tokens = tokenizeGraphQL('3.14');
    expect(tokens[0]).toEqual({ type: 'float', value: '3.14' });
  });

  it('コンマをスキップする（Ignored Token）', () => {
    const tokens = tokenizeGraphQL('a, b, c');
    expect(tokens).toHaveLength(3);
    expect(tokens.map((t) => t.value)).toEqual(['a', 'b', 'c']);
  });

  it('閉じられていない文字列でエラーをスロー', () => {
    expect(() => tokenizeGraphQL('"unclosed')).toThrow('文字列リテラルが閉じられていません');
  });

  it('閉じられていないブロック文字列でエラーをスロー', () => {
    expect(() => tokenizeGraphQL('"""unclosed')).toThrow(
      'ブロック文字列リテラルが閉じられていません',
    );
  });
});

describe('formatGraphQL', () => {
  it('空文字列でエラーをスロー', () => {
    expect(() => formatGraphQL('')).toThrow('GraphQL 文字列が空です');
  });

  it('シンプルなクエリを整形する', () => {
    const input = 'query{user{id name}}';
    const result = formatGraphQL(input);
    expect(result).toBe('query {\n  user {\n    id\n    name\n  }\n}');
  });

  it('変数付きクエリを整形する', () => {
    const input = 'query GetUser($id:ID!){user(id:$id){id name}}';
    const result = formatGraphQL(input);
    expect(result).toContain('query GetUser($id: ID!) {');
    expect(result).toContain('  user(id: $id) {');
  });

  it('4スペースインデントで整形する', () => {
    const input = 'query{user{id}}';
    const result = formatGraphQL(input, 4);
    expect(result).toBe('query {\n    user {\n        id\n    }\n}');
  });

  it('ミューテーションを整形する', () => {
    const input = 'mutation CreateUser($name:String!){createUser(name:$name){id}}';
    const result = formatGraphQL(input);
    expect(result).toContain('mutation CreateUser($name: String!) {');
  });

  it('フラグメントを整形する', () => {
    const input = 'fragment UserFields on User{id name email}';
    const result = formatGraphQL(input);
    expect(result).toContain('fragment UserFields on User {');
    expect(result).toContain('  id');
    expect(result).toContain('  name');
    expect(result).toContain('  email');
  });

  it('コメントを保持する', () => {
    const input = '# コメント\nquery{id}';
    const result = formatGraphQL(input);
    expect(result).toContain('# コメント');
  });

  it('インラインフラグメントを整形する', () => {
    const input = 'query{search{...on User{name}...on Post{title}}}';
    const result = formatGraphQL(input);
    expect(result).toContain('  ... on User {');
    expect(result).toContain('  ... on Post {');
  });

  it('スキーマ定義を整形する', () => {
    const input = 'type User{id:ID! name:String! email:String}';
    const result = formatGraphQL(input);
    expect(result).toContain('type User {');
    expect(result).toContain('  id: ID!');
    expect(result).toContain('  name: String!');
  });

  it('無名クエリ（省略記法）を整形する', () => {
    const input = '{user{id}}';
    const result = formatGraphQL(input);
    expect(result).toBe('{\n  user {\n    id\n  }\n}');
  });

  it('ディレクティブを整形する', () => {
    const input = 'query{user{id name @include(if:true)}}';
    const result = formatGraphQL(input);
    expect(result).toContain('@include(if: true)');
  });
});

describe('minifyGraphQL', () => {
  it('空文字列でエラーをスロー', () => {
    expect(() => minifyGraphQL('')).toThrow('GraphQL 文字列が空です');
  });

  it('クエリを圧縮する', () => {
    const input = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
  }
}`;
    const result = minifyGraphQL(input);
    expect(result).not.toContain('\n');
    expect(result).toContain('query GetUser($id: ID!)');
    expect(result).toContain('user(id: $id)');
  });

  it('コメントを削除する', () => {
    const input = '# コメント\nquery { id }';
    const result = minifyGraphQL(input);
    expect(result).not.toContain('#');
    expect(result).toContain('query');
  });
});

describe('validateGraphQL', () => {
  it('空文字列は無効', () => {
    const result = validateGraphQL('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('空');
  });

  it('有効なクエリを検証する', () => {
    const result = validateGraphQL('query { user { id } }');
    expect(result.valid).toBe(true);
  });

  it('有効なミューテーションを検証する', () => {
    const result = validateGraphQL('mutation CreateUser { createUser { id } }');
    expect(result.valid).toBe(true);
  });

  it('有効な無名クエリを検証する', () => {
    const result = validateGraphQL('{ user { id } }');
    expect(result.valid).toBe(true);
  });

  it('波括弧が閉じられていない場合は無効', () => {
    const result = validateGraphQL('query { user { id }');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('波括弧');
  });

  it('余分な閉じ波括弧がある場合は無効', () => {
    const result = validateGraphQL('query { user { id } } }');
    expect(result.valid).toBe(false);
  });

  it('丸括弧が閉じられていない場合は無効', () => {
    const result = validateGraphQL('query { user(id: 1 { id } }');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('括弧');
  });

  it('不正な開始キーワードは無効', () => {
    const result = validateGraphQL('invalid { id }');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid');
  });

  it('有効なスキーマ定義を検証する', () => {
    const result = validateGraphQL('type User { id: ID! name: String! }');
    expect(result.valid).toBe(true);
  });

  it('有効なフラグメントを検証する', () => {
    const result = validateGraphQL('fragment Fields on User { id name }');
    expect(result.valid).toBe(true);
  });

  it('閉じられていない文字列は無効', () => {
    const result = validateGraphQL('query { user(name: "unclosed) { id } }');
    expect(result.valid).toBe(false);
  });
});
