import { Hono } from 'hono';
import { html } from 'hono/html';

const app = new Hono();

const page = html`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unicode エスケープ変換ツール</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap" rel="stylesheet">
  <style>
    /* Material Design 3 - Color System (WCAG AA Compliant) */
    :root {
      /* Brand color #ffffef used as surface */
      --md-sys-color-surface: #ffffef;
      --md-sys-color-on-surface: #1c1b1e;
      --md-sys-color-on-surface-variant: #49454e;

      /* Primary colors - warm golden brown palette */
      --md-sys-color-primary: #8b6914;
      --md-sys-color-on-primary: #ffffff;
      --md-sys-color-primary-container: #ffedb3;
      --md-sys-color-on-primary-container: #2d1f00;

      /* Secondary colors - warm earth tones */
      --md-sys-color-secondary: #6b5e3f;
      --md-sys-color-on-secondary: #ffffff;
      --md-sys-color-secondary-container: #f4e7c3;
      --md-sys-color-on-secondary-container: #231b04;

      /* Neutral colors */
      --md-sys-color-surface-variant: #e7e0ec;
      --md-sys-color-outline: #79747e;
      --md-sys-color-outline-variant: #cac4cf;
    }

    /* Material Design - Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--md-sys-color-surface);
      min-height: 100vh;
      padding: 20px;
      color: var(--md-sys-color-on-surface);
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header { text-align: center; color: var(--md-sys-color-on-surface); margin-bottom: 40px; }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 400;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 1.1rem;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 300;
    }
    .converter-container {
      background: white;
      border-radius: 4px;
      padding: 30px;
    }
    .converter-section { margin-bottom: 30px; }
    .section-title {
      font-size: 1.2rem;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 15px;
      font-weight: 500;
    }
    textarea {
      width: 100%;
      min-height: 150px;
      padding: 15px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 4px;
      font-size: 14px;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      resize: vertical;
      transition: border-color 0.2s;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
    }
    textarea:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      background: white;
    }
    .button-group { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
    button {
      flex: 1;
      min-width: 200px;
      padding: 15px 30px;
      font-size: 16px;
      font-weight: 500;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-encode {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .btn-decode {
      background: var(--md-sys-color-secondary);
      color: var(--md-sys-color-on-secondary);
    }
    .btn-clear {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      flex: 0 0 auto;
      min-width: 120px;
    }
    button:hover { opacity: 0.85; }
    button:active { opacity: 0.7; }
    button:focus-visible {
      outline: 3px solid #333;
      outline-offset: 3px;
    }
    .info-box {
      background: var(--md-sys-color-primary-container);
      border-left: 4px solid var(--md-sys-color-primary);
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .info-box h3 {
      font-size: 1rem;
      margin-bottom: 10px;
      color: var(--md-sys-color-on-primary-container);
      font-weight: 500;
    }
    .info-box ul {
      list-style-position: inside;
      color: var(--md-sys-color-on-primary-container);
      font-size: 0.9rem;
      line-height: 1.8;
    }
    @media (max-width: 768px) {
      h1 { font-size: 2rem; }
      .button-group { flex-direction: column; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Unicode エスケープ変換ツール</h1>
      <p class="subtitle">日本語などのUnicode文字をエスケープシーケンスに変換します</p>
    </header>
    <div class="converter-container">
      <div class="converter-section">
        <h2 class="section-title">入力テキスト</h2>
        <textarea id="inputText" placeholder="変換したいテキストを入力してください...&#10;例: こんにちは"></textarea>
      </div>
      <div class="button-group">
        <button class="btn-encode" onclick="encodeToUnicode()">Unicode エスケープに変換</button>
        <button class="btn-decode" onclick="decodeFromUnicode()">Unicode から復元</button>
        <button class="btn-clear" onclick="clearAll()">クリア</button>
      </div>
      <div class="converter-section">
        <h2 class="section-title">出力結果</h2>
        <textarea id="outputText" placeholder="変換結果がここに表示されます..." readonly></textarea>
      </div>
      <div class="info-box">
        <h3>使い方</h3>
        <ul>
          <li>「入力テキスト」欄にテキストを入力します</li>
          <li>「Unicode エスケープに変換」ボタンで日本語などを \\uXXXX 形式に変換</li>
          <li>「Unicode から復元」ボタンで \\uXXXX 形式を元の文字に変換</li>
          <li>変換結果は「出力結果」欄に表示されます</li>
        </ul>
      </div>
    </div>
  </div>
  <script>
    function toUnicodeEscape(text) {
      let result = '';
      for (let i = 0; i < text.length; ) {
        const cp = text.codePointAt(i);
        if (cp > 0xFFFF) {
          const high = ((cp - 0x10000) >> 10) + 0xD800;
          const low = ((cp - 0x10000) & 0x3FF) + 0xDC00;
          result += '\\\\u' + high.toString(16).padStart(4, '0');
          result += '\\\\u' + low.toString(16).padStart(4, '0');
          i += 2;
        } else if (cp > 127) {
          result += '\\\\u' + cp.toString(16).padStart(4, '0');
          i += 1;
        } else {
          result += text[i];
          i += 1;
        }
      }
      return result;
    }
    function fromUnicodeEscape(text) {
      return text.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    }
    function encodeToUnicode() {
      const input = document.getElementById('inputText').value;
      if (!input) { alert('テキストを入力してください'); return; }
      document.getElementById('outputText').value = toUnicodeEscape(input);
    }
    function decodeFromUnicode() {
      const input = document.getElementById('inputText').value;
      if (!input) { alert('テキストを入力してください'); return; }
      document.getElementById('outputText').value = fromUnicodeEscape(input);
    }
    function clearAll() {
      document.getElementById('inputText').value = '';
      document.getElementById('outputText').value = '';
    }
  </script>
</body>
</html>
`;

app.get('/', (c) => c.html(page));

export default app;
