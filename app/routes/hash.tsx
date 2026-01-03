import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/hash")({
  head: () => ({
    meta: [{ title: "ハッシュ生成ツール" }],
  }),
  component: HashGenerator,
});

/**
 * ハッシュアルゴリズムの型定義
 */
type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

/**
 * テキストをハッシュ化する関数
 * @param text - ハッシュ化するテキスト
 * @param algorithm - 使用するハッシュアルゴリズム
 * @param salt - オプションのソルト文字列
 * @returns ハッシュ化された16進数文字列
 */
async function generateHash(
  text: string,
  algorithm: HashAlgorithm,
  salt: string = ""
): Promise<string> {
  const textWithSalt = salt ? text + salt : text;
  const encoder = new TextEncoder();
  const data = encoder.encode(textWithSalt);

  // MD5はWeb Crypto APIでサポートされていないため、簡易実装
  if (algorithm === "MD5") {
    return md5(textWithSalt);
  }

  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * MD5ハッシュの簡易実装
 * @param str - ハッシュ化する文字列
 * @returns MD5ハッシュ値（16進数文字列）
 */
function md5(str: string): string {
  // MD5の簡易実装（RFC 1321準拠）
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function md5cycle(x: number[], k: number[]): void {
    let a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = addUnsigned(a, x[0]);
    x[1] = addUnsigned(b, x[1]);
    x[2] = addUnsigned(c, x[2]);
    x[3] = addUnsigned(d, x[3]);
  }

  function cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number
  ): number {
    a = addUnsigned(addUnsigned(a, q), addUnsigned(x, t));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const utf8Encode = new TextEncoder();
  const bytes = utf8Encode.encode(str);
  const msgLen = bytes.length;
  const wordCount = ((msgLen + 8) >>> 6) + 1;
  const wordArray = new Array(wordCount * 16);

  for (let i = 0; i < wordCount * 16; i++) {
    wordArray[i] = 0;
  }

  for (let i = 0; i < msgLen; i++) {
    wordArray[i >>> 2] |= bytes[i] << ((i % 4) * 8);
  }

  wordArray[msgLen >>> 2] |= 0x80 << ((msgLen % 4) * 8);
  wordArray[wordCount * 16 - 2] = msgLen * 8;

  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  for (let i = 0; i < wordArray.length; i += 16) {
    md5cycle(state, wordArray.slice(i, i + 16));
  }

  const hex = [];
  for (let i = 0; i < 4; i++) {
    const s = state[i];
    hex.push(
      ((s >> 0) & 0xff).toString(16).padStart(2, "0"),
      ((s >> 8) & 0xff).toString(16).padStart(2, "0"),
      ((s >> 16) & 0xff).toString(16).padStart(2, "0"),
      ((s >> 24) & 0xff).toString(16).padStart(2, "0")
    );
  }

  return hex.join("");
}

function HashGenerator() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [salt, setSalt] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [outputHash, setOutputHash] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      // Clear previous timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      const hash = await generateHash(inputText, algorithm, salt);
      setOutputHash(hash);
      announceStatus(
        `${algorithm}ハッシュ生成が完了しました${salt ? "（ソルト付き）" : ""}`
      );
    } catch (error) {
      announceStatus("エラー: ハッシュ生成に失敗しました");
      showToast("ハッシュ生成に失敗しました", "error");
      console.error(error);
    }
  }, [inputText, algorithm, salt, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setSalt("");
    setOutputHash("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!outputHash) {
      announceStatus("エラー: コピーするハッシュがありません");
      showToast("コピーするハッシュがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(outputHash);
      announceStatus("ハッシュをクリップボードにコピーしました");
    } catch {
      announceStatus("エラー: クリップボードへのコピーに失敗しました");
      showToast("クリップボードへのコピーに失敗しました", "error");
    }
  }, [outputHash, announceStatus, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="ハッシュ生成フォーム"
        >
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ハッシュ化したいテキストを入力してください...&#10;例: パスワード123"
              aria-describedby="input-help"
              aria-label="ハッシュ化するテキスト入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドにテキストを入力して、ハッシュ値を生成できます
            </span>
          </div>

          <div className="converter-section">
            <label htmlFor="algorithm" className="section-title">
              ハッシュアルゴリズム
            </label>
            <select
              id="algorithm"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
              aria-label="ハッシュアルゴリズムを選択"
            >
              <option value="MD5">MD5 (128-bit)</option>
              <option value="SHA-1">SHA-1 (160-bit)</option>
              <option value="SHA-256">SHA-256 (256-bit)</option>
              <option value="SHA-512">SHA-512 (512-bit)</option>
            </select>
          </div>

          <div className="converter-section">
            <label htmlFor="salt" className="section-title">
              ソルト（オプション）
            </label>
            <Input
              type="text"
              id="salt"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="ソルト文字列を入力（省略可）"
              aria-label="ソルト文字列入力欄"
            />
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              onClick={handleGenerate}
              aria-label="ハッシュを生成"
            >
              ハッシュ生成
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopy}
              aria-label="ハッシュをクリップボードにコピー"
              disabled={!outputHash}
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          <div className="converter-section">
            <label htmlFor="outputHash" className="section-title">
              ハッシュ値
            </label>
            <Textarea
              id="outputHash"
              value={outputHash}
              readOnly
              placeholder="生成されたハッシュ値がここに表示されます..."
              aria-label="生成されたハッシュ値の出力欄"
              aria-live="polite"
              className="font-mono"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「入力テキスト」欄にハッシュ化したいテキストを入力します",
                "ハッシュアルゴリズムを選択します（MD5, SHA-1, SHA-256, SHA-512）",
                "オプションで「ソルト」を追加することでセキュリティを強化できます",
                "「ハッシュ生成」ボタンでハッシュ値を生成します",
                "「コピー」ボタンでハッシュ値をクリップボードにコピーできます",
                "キーボードショートカット: Ctrl+Enter でハッシュ生成実行",
              ],
            },
            {
              title: "セキュリティに関する注意",
              items: [
                "MD5とSHA-1は暗号学的に脆弱とされており、セキュリティ用途には推奨されません",
                "パスワードのハッシュ化には、より安全なアルゴリズム（bcrypt, argon2など）の使用を推奨します",
                "ソルトを使用することでレインボーテーブル攻撃を防ぐことができます",
              ],
            },
          ]}
        />
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
