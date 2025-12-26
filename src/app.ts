import { Hono } from 'hono';
import { html } from 'hono/html';
import { homePage } from './tools/home';
import { unicodeToolPage } from './tools/unicode';
import { uuidPage } from './tools/uuid';
import { passwordPage } from './tools/password';
import { jsonPage } from './tools/json';
import { urlPage } from './tools/url';
import { htmlPage } from './tools/html';
import { jwtPage } from './tools/jwt';
import { ipPage, getIpPageWithIP } from './tools/ip';

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
      outline: 3px solid var(--md-sys-color-primary);
      outline-offset: 3px;
    }
    /* Skip link for keyboard navigation */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 0 0 4px 0;
      font-weight: 500;
      z-index: 100;
    }
    .skip-link:focus {
      top: 0;
    }
    /* Status messages for screen readers */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    /* Labels */
    label {
      display: block;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface);
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
  <!-- Skip link for keyboard users -->
  <a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>

  <div class="container">
    <header role="banner">
      <h1>Unicode エスケープ変換ツール</h1>
      <p class="subtitle">日本語などのUnicode文字をエスケープシーケンスに変換します</p>
    </header>

    <main id="main-content" role="main">
      <div class="converter-container">
        <form onsubmit="return false;" aria-label="Unicode変換フォーム">
          <div class="converter-section">
            <label for="inputText" class="section-title">入力テキスト</label>
            <textarea
              id="inputText"
              name="inputText"
              placeholder="変換したいテキストを入力してください...&#10;例: こんにちは"
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄"></textarea>
            <span id="input-help" class="sr-only">このフィールドにテキストを入力して、Unicodeエスケープシーケンスに変換できます</span>
          </div>

          <div class="button-group" role="group" aria-label="変換操作">
            <button
              type="button"
              class="btn-encode"
              onclick="encodeToUnicode()"
              aria-label="入力テキストをUnicodeエスケープに変換">
              Unicode エスケープに変換
            </button>
            <button
              type="button"
              class="btn-decode"
              onclick="decodeFromUnicode()"
              aria-label="Unicodeエスケープを通常のテキストに復元">
              Unicode から復元
            </button>
            <button
              type="button"
              class="btn-clear"
              onclick="clearAll()"
              aria-label="入力と出力をクリア">
              クリア
            </button>
          </div>

          <div class="converter-section">
            <label for="outputText" class="section-title">出力結果</label>
            <textarea
              id="outputText"
              name="outputText"
              placeholder="変換結果がここに表示されます..."
              readonly
              aria-label="変換結果の出力欄"
              aria-live="polite"></textarea>
          </div>
        </form>

        <aside class="info-box" role="complementary" aria-labelledby="usage-title">
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>「入力テキスト」欄にテキストを入力します</li>
            <li>「Unicode エスケープに変換」ボタンで日本語などを \\uXXXX 形式に変換</li>
            <li>「Unicode から復元」ボタンで \\uXXXX 形式を元の文字に変換</li>
            <li>変換結果は「出力結果」欄に表示されます</li>
            <li>キーボードショートカット: Ctrl+Enter で変換実行</li>
          </ul>
        </aside>
      </div>
    </main>
  </div>

  <!-- Status announcements for screen readers -->
  <div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="status-message"></div>
  <script>
    // Announce status to screen readers
    function announceStatus(message) {
      const statusEl = document.getElementById('status-message');
      statusEl.textContent = message;
      // Clear after announcement
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }

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
      if (!input) {
        announceStatus('エラー: テキストを入力してください');
        alert('テキストを入力してください');
        document.getElementById('inputText').focus();
        return;
      }
      const result = toUnicodeEscape(input);
      document.getElementById('outputText').value = result;
      announceStatus('Unicodeエスケープへの変換が完了しました');
    }

    function decodeFromUnicode() {
      const input = document.getElementById('inputText').value;
      if (!input) {
        announceStatus('エラー: テキストを入力してください');
        alert('テキストを入力してください');
        document.getElementById('inputText').focus();
        return;
      }
      const result = fromUnicodeEscape(input);
      document.getElementById('outputText').value = result;
      announceStatus('Unicodeからの復元が完了しました');
    }

    function clearAll() {
      document.getElementById('inputText').value = '';
      document.getElementById('outputText').value = '';
      announceStatus('入力と出力をクリアしました');
      document.getElementById('inputText').focus();
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl+Enter or Cmd+Enter to encode
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        encodeToUnicode();
      }
    });

    // Focus management on page load
    window.addEventListener('load', function() {
      document.getElementById('inputText').focus();
    });
  </script>
</body>
</html>
`;

// Homepage with tool listing
app.get('/', (c) => c.html(homePage));

// Unicode escape tool (with navigation)
app.get('/unicode', (c) => c.html(unicodeToolPage));

// UUID generator
app.get('/uuid', (c) => c.html(uuidPage));

// Password generator
app.get('/password', (c) => c.html(passwordPage));

// JSON formatter
app.get('/json', (c) => c.html(jsonPage));

// URL encode/decode
app.get('/url', (c) => c.html(urlPage));

// HTML escape/unescape
app.get('/html', (c) => c.html(htmlPage));

// JWT decoder
app.get('/jwt', (c) => c.html(jwtPage));

// IP address display
app.get('/ip', (c) => {
  // Get client IP from various headers
  const cfConnectingIP = c.req.header('CF-Connecting-IP');
  const xForwardedFor = c.req.header('X-Forwarded-For');
  const xRealIP = c.req.header('X-Real-IP');
  
  // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > fallback
  const ip = cfConnectingIP || xRealIP || (xForwardedFor?.split(',')[0]?.trim()) || '不明';
  
  return c.html(getIpPageWithIP(ip));
});

// 404 page - also available at /404 for SSG
const notFoundPage = html`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - ページが見つかりません</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --md-sys-color-surface: #ffffef;
      --md-sys-color-on-surface: #1c1b1e;
      --md-sys-color-on-surface-variant: #49454e;
      --md-sys-color-primary: #8b6914;
      --md-sys-color-on-primary: #ffffff;
      --md-sys-color-secondary-container: #f4e7c3;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--md-sys-color-surface);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface);
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      max-width: 500px;
      margin: 20px;
    }
    h1 {
      font-size: 4rem;
      font-weight: 300;
      color: var(--md-sys-color-primary);
      margin-bottom: 10px;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 400;
      margin-bottom: 20px;
    }
    p {
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 30px;
      line-height: 1.6;
    }
    a {
      display: inline-block;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: opacity 0.2s;
    }
    a:hover { opacity: 0.85; }
    a:focus-visible {
      outline: 3px solid var(--md-sys-color-primary);
      outline-offset: 3px;
    }
  </style>
</head>
<body>
  <main class="container" role="main">
    <h1>404</h1>
    <h2>ページが見つかりません</h2>
    <p>お探しのページは存在しないか、移動した可能性があります。</p>
    <a href="/">ホームに戻る</a>
  </main>
</body>
</html>
`;

// Route for SSG to generate 404.html
app.get('/404', (c) => c.html(notFoundPage));

app.notFound((c) => c.html(notFoundPage, 404));

export default app;
