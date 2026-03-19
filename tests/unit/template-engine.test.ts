import { describe, it, expect } from 'vitest';
import { renderTemplate, TEMPLATE_SAMPLES } from '../../app/utils/template-engine';

describe('renderTemplate', () => {
  // ---------------------------------------------------------------------------
  // 基本的な変数展開
  // ---------------------------------------------------------------------------
  describe('変数展開', () => {
    it('シンプルな変数を展開できる', () => {
      const result = renderTemplate('Hello, {{name}}!', '{"name": "World"}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('Hello, World!');
    });

    it('数値を文字列として展開できる', () => {
      const result = renderTemplate('{{count}}', '{"count": 42}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('42');
    });

    it('存在しない変数は空文字になる', () => {
      const result = renderTemplate('{{unknown}}', '{}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('null 値は空文字になる', () => {
      const result = renderTemplate('{{val}}', '{"val": null}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('複数の変数を展開できる', () => {
      const result = renderTemplate(
        '{{first}} {{last}}',
        '{"first": "太郎", "last": "山田"}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('太郎 山田');
    });
  });

  // ---------------------------------------------------------------------------
  // HTMLエスケープ
  // ---------------------------------------------------------------------------
  describe('HTMLエスケープ', () => {
    it('{{variable}} は HTML をエスケープする', () => {
      const result = renderTemplate('{{html}}', '{"html": "<script>alert(1)</script>"}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('& がエスケープされる', () => {
      const result = renderTemplate('{{text}}', '{"text": "A & B"}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('A &amp; B');
    });

    it('" がエスケープされる', () => {
      const result = renderTemplate('{{text}}', '{"text": "say \\"hi\\""}');
      expect(result.error).toBeNull();
      expect(result.output).toContain('&quot;');
    });
  });

  // ---------------------------------------------------------------------------
  // エスケープなし展開 ({{{ }}} と {{& }})
  // ---------------------------------------------------------------------------
  describe('エスケープなし展開', () => {
    it('{{{variable}}} は HTML をエスケープしない', () => {
      const result = renderTemplate('{{{html}}}', '{"html": "<b>bold</b>"}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('<b>bold</b>');
    });

    it('{{&variable}} は HTML をエスケープしない', () => {
      const result = renderTemplate('{{&html}}', '{"html": "<b>bold</b>"}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('<b>bold</b>');
    });

    it('{{{...}}} で存在しない変数は空文字になる', () => {
      const result = renderTemplate('{{{missing}}}', '{}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // セクション ({{#section}})
  // ---------------------------------------------------------------------------
  describe('セクション {{#section}}', () => {
    it('truthy な値でセクションを表示する', () => {
      const result = renderTemplate(
        '{{#show}}表示{{/show}}',
        '{"show": true}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('表示');
    });

    it('falsy な値でセクションを非表示にする', () => {
      const result = renderTemplate(
        '{{#show}}表示{{/show}}',
        '{"show": false}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('空配列でセクションを非表示にする', () => {
      const result = renderTemplate(
        '{{#items}}あり{{/items}}',
        '{"items": []}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('配列でループする', () => {
      const result = renderTemplate(
        '{{#items}}{{name}} {{/items}}',
        '{"items": [{"name": "A"}, {"name": "B"}, {"name": "C"}]}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('A B C ');
    });

    it('配列の各要素のプロパティにアクセスできる', () => {
      const result = renderTemplate(
        '{{#people}}{{name}}({{age}}) {{/people}}',
        '{"people": [{"name": "太郎", "age": 25}, {"name": "花子", "age": 30}]}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('太郎(25) 花子(30) ');
    });

    it('truthy なオブジェクトでコンテキストを変更する', () => {
      const result = renderTemplate(
        '{{#user}}{{name}}{{/user}}',
        '{"user": {"name": "山田"}}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('山田');
    });

    it('0 は falsy として扱う', () => {
      const result = renderTemplate(
        '{{#val}}表示{{/val}}',
        '{"val": 0}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('空文字は falsy として扱う', () => {
      const result = renderTemplate(
        '{{#val}}表示{{/val}}',
        '{"val": ""}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // 逆セクション ({{^inverted}})
  // ---------------------------------------------------------------------------
  describe('逆セクション {{^inverted}}', () => {
    it('falsy な値で逆セクションを表示する', () => {
      const result = renderTemplate(
        '{{^show}}非表示時に表示{{/show}}',
        '{"show": false}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('非表示時に表示');
    });

    it('truthy な値で逆セクションを非表示にする', () => {
      const result = renderTemplate(
        '{{^show}}非表示時に表示{{/show}}',
        '{"show": true}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('空配列で逆セクションを表示する', () => {
      const result = renderTemplate(
        '{{^items}}アイテムがありません{{/items}}',
        '{"items": []}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('アイテムがありません');
    });

    it('存在しないキーで逆セクションを表示する', () => {
      const result = renderTemplate(
        '{{^missing}}未定義{{/missing}}',
        '{}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('未定義');
    });
  });

  // ---------------------------------------------------------------------------
  // コメント ({{! comment }})
  // ---------------------------------------------------------------------------
  describe('コメント {{! comment }}', () => {
    it('コメントは出力されない', () => {
      const result = renderTemplate(
        'before{{! this is a comment }}after',
        '{}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('beforeafter');
    });

    it('複数のコメントが除去される', () => {
      const result = renderTemplate(
        '{{! comment1 }}Hello{{! comment2 }}',
        '{}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('Hello');
    });
  });

  // ---------------------------------------------------------------------------
  // 現在のコンテキスト ({{.}})
  // ---------------------------------------------------------------------------
  describe('現在のコンテキスト {{.}}', () => {
    it('配列ループ内で {{.}} が各要素を展開する', () => {
      const result = renderTemplate(
        '{{#tags}}#{{.}} {{/tags}}',
        '{"tags": ["react", "typescript", "vite"]}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('#react #typescript #vite ');
    });
  });

  // ---------------------------------------------------------------------------
  // ネストされたプロパティ
  // ---------------------------------------------------------------------------
  describe('ネストされたプロパティ', () => {
    it('ドット記法でネストにアクセスできる', () => {
      const result = renderTemplate(
        '{{address.city}}',
        '{"address": {"city": "東京"}}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('東京');
    });

    it('深くネストされたプロパティにアクセスできる', () => {
      const result = renderTemplate(
        '{{a.b.c}}',
        '{"a": {"b": {"c": "deep"}}}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('deep');
    });

    it('存在しないネストパスは空文字になる', () => {
      const result = renderTemplate(
        '{{a.b.missing}}',
        '{"a": {"b": {}}}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // エラーハンドリング
  // ---------------------------------------------------------------------------
  describe('エラーハンドリング', () => {
    it('無効な JSON でエラーを返す', () => {
      const result = renderTemplate('{{name}}', 'invalid json');
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('JSONパースエラー');
      expect(result.output).toBe('');
    });

    it('空のテンプレートは空文字を返す', () => {
      const result = renderTemplate('', '{"name": "test"}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });

    it('空の JSON データ（空文字）は {} として扱う', () => {
      const result = renderTemplate('Hello {{name}}', '');
      expect(result.error).toBeNull();
      expect(result.output).toBe('Hello ');
    });

    it('空の JSON オブジェクトは有効', () => {
      const result = renderTemplate('{{name}}', '{}');
      expect(result.error).toBeNull();
      expect(result.output).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // 複合テスト
  // ---------------------------------------------------------------------------
  describe('複合テスト', () => {
    it('セクションと通常変数を組み合わせられる', () => {
      const result = renderTemplate(
        'ユーザー: {{username}}\n{{#isAdmin}}管理者権限あり\n{{/isAdmin}}',
        '{"username": "admin_user", "isAdmin": true}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('ユーザー: admin_user\n管理者権限あり\n');
    });

    it('複数のセクションが独立して動作する', () => {
      const result = renderTemplate(
        '{{#a}}A{{/a}}{{#b}}B{{/b}}{{#c}}C{{/c}}',
        '{"a": true, "b": false, "c": true}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('AC');
    });

    it('配列ループ内でネストされたプロパティにアクセスできる', () => {
      const result = renderTemplate(
        '{{#products}}{{info.name}}: {{info.price}}円\n{{/products}}',
        '{"products": [{"info": {"name": "Apple", "price": 200}}, {"info": {"name": "Banana", "price": 100}}]}',
      );
      expect(result.error).toBeNull();
      expect(result.output).toBe('Apple: 200円\nBanana: 100円\n');
    });
  });

  // ---------------------------------------------------------------------------
  // TEMPLATE_SAMPLES
  // ---------------------------------------------------------------------------
  describe('TEMPLATE_SAMPLES', () => {
    it('サンプルが複数定義されている', () => {
      expect(TEMPLATE_SAMPLES.length).toBeGreaterThan(0);
    });

    it('全サンプルが有効なテンプレートとデータを持つ', () => {
      for (const sample of TEMPLATE_SAMPLES) {
        expect(sample.name).toBeTruthy();
        expect(sample.template).toBeTruthy();
        expect(sample.data).toBeTruthy();

        // JSON パース可能か確認
        expect(() => JSON.parse(sample.data)).not.toThrow();
      }
    });

    it('全サンプルがエラーなくレンダリングできる', () => {
      for (const sample of TEMPLATE_SAMPLES) {
        const result = renderTemplate(sample.template, sample.data);
        expect(result.error).toBeNull();
        expect(result.output).toBeTruthy();
      }
    });
  });
});
