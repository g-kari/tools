import { describe, it, expect } from "vite-plus/test";
import { renderTemplate, TEMPLATE_SAMPLES } from "../../app/utils/template-engine";

describe("Mustache Template Engine", () => {
  describe("renderTemplate - 基本的な変数展開", () => {
    it("シンプルな変数を展開できる", () => {
      const result = renderTemplate("こんにちは、{{name}}！", '{"name": "太郎"}');
      expect(result.output).toBe("こんにちは、太郎！");
      expect(result.error).toBeNull();
    });

    it("数値変数を展開できる", () => {
      const result = renderTemplate("年齢: {{age}}", '{"age": 30}');
      expect(result.output).toBe("年齢: 30");
      expect(result.error).toBeNull();
    });

    it("存在しない変数は空文字列になる", () => {
      const result = renderTemplate("{{missing}}", "{}");
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });

    it("HTMLエスケープが機能する", () => {
      const result = renderTemplate("{{html}}", '{"html": "<script>alert(1)</script>"}');
      expect(result.output).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(result.error).toBeNull();
    });

    it("& をエスケープする", () => {
      const result = renderTemplate("{{text}}", '{"text": "A & B"}');
      expect(result.output).toBe("A &amp; B");
    });

    it('" をエスケープする', () => {
      const result = renderTemplate("{{text}}", '{"text": "say \\"hello\\""}');
      expect(result.output).toBe("say &quot;hello&quot;");
    });
  });

  describe("renderTemplate - エスケープなし展開", () => {
    it("{{{variable}}} でHTMLエスケープなしで展開できる", () => {
      const result = renderTemplate("{{{html}}}", '{"html": "<b>太字</b>"}');
      expect(result.output).toBe("<b>太字</b>");
      expect(result.error).toBeNull();
    });

    it("{{&variable}} でHTMLエスケープなしで展開できる", () => {
      const result = renderTemplate("{{&html}}", '{"html": "<b>太字</b>"}');
      expect(result.output).toBe("<b>太字</b>");
      expect(result.error).toBeNull();
    });
  });

  describe("renderTemplate - コメント", () => {
    it("{{! comment }} が出力されない", () => {
      const result = renderTemplate("before{{! this is a comment }}after", "{}");
      expect(result.output).toBe("beforeafter");
      expect(result.error).toBeNull();
    });
  });

  describe("renderTemplate - セクション（条件/ループ）", () => {
    it("truthy なセクションを表示する", () => {
      const result = renderTemplate("{{#show}}表示{{/show}}", '{"show": true}');
      expect(result.output).toBe("表示");
      expect(result.error).toBeNull();
    });

    it("falsy なセクションを非表示にする", () => {
      const result = renderTemplate("{{#show}}表示{{/show}}", '{"show": false}');
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });

    it("配列でループできる", () => {
      const result = renderTemplate("{{#items}}{{.}} {{/items}}", '{"items": ["a", "b", "c"]}');
      expect(result.output).toBe("a b c ");
      expect(result.error).toBeNull();
    });

    it("オブジェクト配列でループできる", () => {
      const result = renderTemplate(
        "{{#users}}{{name}} {{/users}}",
        '{"users": [{"name": "太郎"}, {"name": "花子"}]}',
      );
      expect(result.output).toBe("太郎 花子 ");
      expect(result.error).toBeNull();
    });

    it("空配列のセクションは何も出力しない", () => {
      const result = renderTemplate("{{#items}}item{{/items}}", '{"items": []}');
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });
  });

  describe("renderTemplate - 逆セクション", () => {
    it("falsy な値で逆セクションを表示する", () => {
      const result = renderTemplate("{{^show}}非表示{{/show}}", '{"show": false}');
      expect(result.output).toBe("非表示");
      expect(result.error).toBeNull();
    });

    it("truthy な値で逆セクションを非表示にする", () => {
      const result = renderTemplate("{{^show}}非表示{{/show}}", '{"show": true}');
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });

    it("空配列で逆セクションを表示する", () => {
      const result = renderTemplate("{{^items}}アイテムなし{{/items}}", '{"items": []}');
      expect(result.output).toBe("アイテムなし");
      expect(result.error).toBeNull();
    });

    it("存在しないキーで逆セクションを表示する", () => {
      const result = renderTemplate("{{^missing}}表示{{/missing}}", "{}");
      expect(result.output).toBe("表示");
      expect(result.error).toBeNull();
    });
  });

  describe("renderTemplate - ネストされたプロパティ", () => {
    it("ドット記法でネストされた値を取得できる", () => {
      const result = renderTemplate("{{user.name}}", '{"user": {"name": "太郎"}}');
      expect(result.output).toBe("太郎");
      expect(result.error).toBeNull();
    });

    it("深くネストされた値を取得できる", () => {
      const result = renderTemplate("{{a.b.c}}", '{"a": {"b": {"c": "deep"}}}');
      expect(result.output).toBe("deep");
      expect(result.error).toBeNull();
    });

    it("存在しないネストパスは空文字列になる", () => {
      const result = renderTemplate("{{user.missing}}", '{"user": {}}');
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });
  });

  describe("renderTemplate - エラーハンドリング", () => {
    it("空テンプレートで空文字列を返す", () => {
      const result = renderTemplate("", '{"name": "太郎"}');
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });

    it("空白のみのテンプレートで空文字列を返す", () => {
      const result = renderTemplate("   ", '{"name": "太郎"}');
      expect(result.output).toBe("");
      expect(result.error).toBeNull();
    });

    it("無効なJSONでエラーを返す", () => {
      const result = renderTemplate("{{name}}", "{invalid json}");
      expect(result.output).toBe("");
      expect(result.error).not.toBeNull();
      expect(result.error).toContain("JSONパースエラー");
    });

    it("空JSONでもテンプレートをレンダリングできる", () => {
      const result = renderTemplate("Hello!", "{}");
      expect(result.output).toBe("Hello!");
      expect(result.error).toBeNull();
    });
  });

  describe("renderTemplate - Mustacheタグなし", () => {
    it("プレーンテキストをそのまま出力する", () => {
      const result = renderTemplate("Hello, World!", "{}");
      expect(result.output).toBe("Hello, World!");
      expect(result.error).toBeNull();
    });

    it("改行を含むテキストをそのまま出力する", () => {
      const result = renderTemplate("line1\nline2", "{}");
      expect(result.output).toBe("line1\nline2");
      expect(result.error).toBeNull();
    });
  });

  describe("TEMPLATE_SAMPLES", () => {
    it("サンプルが存在する", () => {
      expect(TEMPLATE_SAMPLES.length).toBeGreaterThan(0);
    });

    it("各サンプルにname・template・dataが含まれる", () => {
      for (const sample of TEMPLATE_SAMPLES) {
        expect(sample.name).toBeTruthy();
        expect(sample.template).toBeTruthy();
        expect(sample.data).toBeTruthy();
      }
    });

    it("各サンプルのデータが有効なJSONである", () => {
      for (const sample of TEMPLATE_SAMPLES) {
        expect(() => JSON.parse(sample.data)).not.toThrow();
      }
    });

    it("各サンプルをエラーなくレンダリングできる", () => {
      for (const sample of TEMPLATE_SAMPLES) {
        const result = renderTemplate(sample.template, sample.data);
        expect(result.error).toBeNull();
        expect(result.output.length).toBeGreaterThan(0);
      }
    });
  });
});
