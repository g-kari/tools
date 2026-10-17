import { describe, expect, it } from "vite-plus/test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { EmojiConverter } from "../../app/routes/emoji-converter";

describe("EmojiConverter server render", () => {
  it("renders initial controls without browser globals", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
    const html = renderToString(createElement(EmojiConverter));
    expect(html).toContain("絵文字コンバーター");
    expect(html).toContain("Discord向け");
    expect(html).toContain("ファイル形式");
  });
});
