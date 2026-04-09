/**
 * XMLトークンの型定義
 */
type XmlToken =
  | { type: "open"; name: string; attrs: string; selfClose: boolean }
  | { type: "close"; name: string }
  | { type: "text"; value: string }
  | { type: "comment"; value: string }
  | { type: "declaration"; value: string }
  | { type: "cdata"; value: string };

/**
 * XML文字列をトークンの配列に分解する。
 * @param xml - 解析対象のXML文字列
 * @returns XmlTokenの配列
 * @throws {Error} XML文字列が空の場合、またはタグ構文が不正な場合
 */
export function tokenizeXml(xml: string): XmlToken[] {
  if (!xml.trim()) {
    throw new Error("XML文字列が空です");
  }

  const tokens: XmlToken[] = [];
  let i = 0;
  const len = xml.length;

  while (i < len) {
    if (xml[i] === "<") {
      // コメント
      if (xml.startsWith("<!--", i)) {
        const end = xml.indexOf("-->", i + 4);
        if (end === -1) {
          throw new Error("コメントが閉じられていません");
        }
        const value = xml.slice(i + 4, end);
        tokens.push({ type: "comment", value });
        i = end + 3;
        continue;
      }

      // CDATA
      if (xml.startsWith("<![CDATA[", i)) {
        const end = xml.indexOf("]]>", i + 9);
        if (end === -1) {
          throw new Error("CDATAセクションが閉じられていません");
        }
        const value = xml.slice(i + 9, end);
        tokens.push({ type: "cdata", value });
        i = end + 3;
        continue;
      }

      // 宣言（<?...?>）
      if (xml.startsWith("<?", i)) {
        const end = xml.indexOf("?>", i + 2);
        if (end === -1) {
          throw new Error("宣言タグが閉じられていません");
        }
        const value = xml.slice(i + 2, end);
        tokens.push({ type: "declaration", value });
        i = end + 2;
        continue;
      }

      // 閉じタグ
      if (xml[i + 1] === "/") {
        const end = xml.indexOf(">", i + 2);
        if (end === -1) {
          throw new Error("閉じタグが正しく閉じられていません");
        }
        const name = xml.slice(i + 2, end).trim();
        tokens.push({ type: "close", name });
        i = end + 1;
        continue;
      }

      // 開きタグまたはセルフクロージングタグ
      const end = xml.indexOf(">", i + 1);
      if (end === -1) {
        throw new Error("開きタグが正しく閉じられていません");
      }
      const tagContent = xml.slice(i + 1, end);
      const selfClose = tagContent.endsWith("/");
      const innerContent = selfClose ? tagContent.slice(0, -1).trim() : tagContent.trim();

      // タグ名と属性を分離
      const spaceIdx = innerContent.search(/\s/);
      let name: string;
      let attrs: string;
      if (spaceIdx === -1) {
        name = innerContent;
        attrs = "";
      } else {
        name = innerContent.slice(0, spaceIdx);
        attrs = innerContent.slice(spaceIdx + 1).trim();
      }

      if (!name) {
        throw new Error("タグ名が空です");
      }

      tokens.push({ type: "open", name, attrs, selfClose });
      i = end + 1;
      continue;
    }

    // テキストノード
    const next = xml.indexOf("<", i);
    const textEnd = next === -1 ? len : next;
    const value = xml.slice(i, textEnd);
    if (value) {
      tokens.push({ type: "text", value });
    }
    i = textEnd;
  }

  return tokens;
}

/**
 * XML文字列を整形（インデント付き）する。
 * @param xml - 整形対象のXML文字列
 * @param indent - インデントのスペース数（デフォルト: 2）
 * @returns 整形されたXML文字列
 * @throws {Error} XML文字列が空の場合、またはXMLが不正な場合
 */
export function formatXml(xml: string, indent: number = 2): string {
  if (!xml.trim()) {
    throw new Error("XML文字列が空です");
  }

  const tokens = tokenizeXml(xml);
  const indentStr = " ".repeat(indent);
  const lines: string[] = [];
  let depth = 0;

  /**
   * 現在の深さに応じたインデント文字列を返す
   */
  function getIndent(d: number): string {
    return indentStr.repeat(d);
  }

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "declaration") {
      lines.push(`<?${token.value}?>`);
      i++;
      continue;
    }

    if (token.type === "comment") {
      lines.push(`${getIndent(depth)}<!--${token.value}-->`);
      i++;
      continue;
    }

    if (token.type === "cdata") {
      lines.push(`${getIndent(depth)}<![CDATA[${token.value}]]>`);
      i++;
      continue;
    }

    if (token.type === "open" && !token.selfClose) {
      // 次のトークンがテキストで、その次が閉じタグ → インライン表示
      const nextToken = tokens[i + 1];
      const afterNext = tokens[i + 2];
      if (
        nextToken &&
        nextToken.type === "text" &&
        afterNext &&
        afterNext.type === "close" &&
        afterNext.name === token.name
      ) {
        const attrsStr = token.attrs ? ` ${token.attrs}` : "";
        lines.push(
          `${getIndent(depth)}<${token.name}${attrsStr}>${nextToken.value}</${token.name}>`,
        );
        i += 3;
        continue;
      }

      const attrsStr = token.attrs ? ` ${token.attrs}` : "";
      lines.push(`${getIndent(depth)}<${token.name}${attrsStr}>`);
      depth++;
      i++;
      continue;
    }

    if (token.type === "open" && token.selfClose) {
      const attrsStr = token.attrs ? ` ${token.attrs}` : "";
      lines.push(`${getIndent(depth)}<${token.name}${attrsStr}/>`);
      i++;
      continue;
    }

    if (token.type === "close") {
      depth = Math.max(0, depth - 1);
      lines.push(`${getIndent(depth)}</${token.name}>`);
      i++;
      continue;
    }

    if (token.type === "text") {
      const trimmed = token.value.trim();
      if (trimmed) {
        lines.push(`${getIndent(depth)}${trimmed}`);
      }
      i++;
      continue;
    }

    i++;
  }

  return lines.join("\n");
}

/**
 * XML文字列を圧縮（ミニファイ）する。タグ間の空白と改行を除去する。
 * @param xml - 圧縮対象のXML文字列
 * @returns 圧縮されたXML文字列
 * @throws {Error} XML文字列が空の場合、またはXMLが不正な場合
 */
export function minifyXml(xml: string): string {
  if (!xml.trim()) {
    throw new Error("XML文字列が空です");
  }

  // tokenizeXmlで構文チェックを行う
  tokenizeXml(xml);

  // タグ間の空白・改行を除去
  return xml.replace(/>\s+</g, "><").replace(/^\s+/, "").replace(/\s+$/, "");
}

/**
 * XML文字列の構文を検証する。
 * タグの対応チェックとルート要素の唯一性を確認する。
 * @param xml - 検証対象のXML文字列
 * @returns 検証結果オブジェクト。validがtrueなら有効、falseならerrorにエラーメッセージを含む
 */
export function validateXml(xml: string): { valid: boolean; error?: string } {
  if (!xml.trim()) {
    return { valid: false, error: "XML文字列が空です" };
  }

  let tokens: XmlToken[];
  try {
    tokens = tokenizeXml(xml);
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "XML解析エラーが発生しました",
    };
  }

  const stack: string[] = [];
  let rootCount = 0;

  for (const token of tokens) {
    if (token.type === "declaration" || token.type === "comment" || token.type === "cdata") {
      continue;
    }

    if (token.type === "open" && !token.selfClose) {
      if (stack.length === 0) {
        rootCount++;
        if (rootCount > 1) {
          return { valid: false, error: "ルート要素は1つでなければなりません" };
        }
      }
      stack.push(token.name);
      continue;
    }

    if (token.type === "open" && token.selfClose) {
      if (stack.length === 0) {
        rootCount++;
        if (rootCount > 1) {
          return { valid: false, error: "ルート要素は1つでなければなりません" };
        }
      }
      continue;
    }

    if (token.type === "close") {
      if (stack.length === 0) {
        return {
          valid: false,
          error: `対応する開きタグがない閉じタグ: </${token.name}>`,
        };
      }
      const expected = stack[stack.length - 1];
      if (expected !== token.name) {
        return {
          valid: false,
          error: `タグの対応が不一致: <${expected}> に対して </${token.name}> が来ています`,
        };
      }
      stack.pop();
      continue;
    }
  }

  if (stack.length > 0) {
    return {
      valid: false,
      error: `閉じられていないタグがあります: <${stack[stack.length - 1]}>`,
    };
  }

  if (rootCount === 0) {
    return { valid: false, error: "ルート要素が存在しません" };
  }

  return { valid: true };
}
