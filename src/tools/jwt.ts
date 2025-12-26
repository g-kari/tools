import { html } from 'hono/html';
import { toolLayout } from './layout';

export const jwtPage = toolLayout('JWT デコーダー', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">JWT デコーダー</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">JSON Web Tokenの内容を確認します</p>
  </header>

  <div class="tool-container">
    <div class="tool-section">
      <label for="input" class="section-title">JWT トークン</label>
      <textarea id="input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" aria-label="JWTトークン入力"></textarea>
    </div>

    <div class="button-group">
      <button type="button" class="btn-primary" onclick="decodeJWT()" aria-label="JWTをデコード">
        デコード
      </button>
      <button type="button" class="btn-clear" onclick="clearAll()" aria-label="クリア">
        クリア
      </button>
    </div>

    <div id="output" style="display: none;">
      <div class="tool-section">
        <label class="section-title">ヘッダー (Header)</label>
        <textarea id="header" readonly aria-label="JWTヘッダー" style="min-height: 100px;"></textarea>
      </div>

      <div class="tool-section">
        <label class="section-title">ペイロード (Payload)</label>
        <textarea id="payload" readonly aria-label="JWTペイロード" style="min-height: 150px;"></textarea>
      </div>

      <div class="tool-section">
        <label class="section-title">署名 (Signature)</label>
        <textarea id="signature" readonly aria-label="JWT署名" style="min-height: 60px; font-size: 12px;"></textarea>
      </div>
    </div>

    <div id="errorBox" style="display: none; background: #ffebee; border-left: 4px solid #c62828; padding: 15px; border-radius: 4px; margin-top: 20px;">
      <h3 style="color: #c62828; font-size: 1rem; margin-bottom: 10px;">エラー</h3>
      <p id="errorMessage" style="color: #c62828; font-size: 0.9rem;"></p>
    </div>

    <aside class="info-box">
      <h3>JWTとは？</h3>
      <ul>
        <li>JSON Web Tokenの略で、認証情報を安全に伝送するための形式です</li>
        <li>3つの部分から構成: ヘッダー、ペイロード、署名</li>
        <li>各部分はBase64URLでエンコードされています</li>
        <li>このツールは署名の検証は行いません（デコードのみ）</li>
        <li>セキュリティ上、本番環境のトークンを公開ツールに入力しないでください</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  function base64UrlDecode(str) {
    // Base64URL to Base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' to make length multiple of 4
    while (str.length % 4 !== 0) {
      str += '=';
    }
    try {
      // Decode Base64
      const decoded = atob(str);
      // Convert to UTF-8
      return decodeURIComponent(escape(decoded));
    } catch (e) {
      throw new Error('Base64デコードに失敗しました');
    }
  }

  function showError(message) {
    document.getElementById('errorBox').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('output').style.display = 'none';
  }

  function hideError() {
    document.getElementById('errorBox').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
  }

  function decodeJWT() {
    hideError();
    const input = document.getElementById('input').value.trim();
    if (!input) {
      alert('JWTトークンを入力してください');
      return;
    }
    
    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('JWTは3つの部分（ヘッダー.ペイロード.署名）で構成される必要があります');
      }

      // Decode header
      const headerJson = base64UrlDecode(parts[0]);
      const header = JSON.parse(headerJson);
      document.getElementById('header').value = JSON.stringify(header, null, 2);

      // Decode payload
      const payloadJson = base64UrlDecode(parts[1]);
      const payload = JSON.parse(payloadJson);
      document.getElementById('payload').value = JSON.stringify(payload, null, 2);

      // Signature (keep as is)
      document.getElementById('signature').value = parts[2];

      document.getElementById('output').style.display = 'block';
      announceStatus('JWTをデコードしました');
    } catch (error) {
      showError('JWTのデコードに失敗しました: ' + error.message);
      announceStatus('エラー: ' + error.message);
    }
  }

  function clearAll() {
    document.getElementById('input').value = '';
    document.getElementById('header').value = '';
    document.getElementById('payload').value = '';
    document.getElementById('signature').value = '';
    document.getElementById('output').style.display = 'none';
    hideError();
    announceStatus('クリアしました');
  }

  function announceStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  }
</script>
`);
