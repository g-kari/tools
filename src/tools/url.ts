import { html } from 'hono/html';
import { toolLayout } from './layout';

export const urlPage = toolLayout('URL エンコード・デコード', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">URL エンコード・デコードツール</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">URLのエンコードとデコードを行います</p>
  </header>

  <div class="tool-container">
    <div class="tool-section">
      <label for="input" class="section-title">入力テキスト</label>
      <textarea id="input" placeholder="エンコード/デコードしたいテキストを入力..." aria-label="入力テキスト"></textarea>
    </div>

    <div class="button-group">
      <button type="button" class="btn-primary" onclick="encodeURL()" aria-label="URLエンコード">
        エンコード
      </button>
      <button type="button" class="btn-secondary" onclick="decodeURL()" aria-label="URLデコード">
        デコード
      </button>
      <button type="button" class="btn-clear" onclick="clearAll()" aria-label="クリア">
        クリア
      </button>
    </div>

    <div class="tool-section">
      <label for="output" class="section-title">出力結果</label>
      <textarea id="output" readonly aria-label="出力結果" aria-live="polite"></textarea>
    </div>

    <div id="errorBox" style="display: none; background: #ffebee; border-left: 4px solid #c62828; padding: 15px; border-radius: 4px; margin-top: 20px;">
      <h3 style="color: #c62828; font-size: 1rem; margin-bottom: 10px;">エラー</h3>
      <p id="errorMessage" style="color: #c62828; font-size: 0.9rem;"></p>
    </div>

    <aside class="info-box">
      <h3>URLエンコードとは？</h3>
      <ul>
        <li>URLに使用できない文字を%XX形式に変換します</li>
        <li>日本語や特殊文字をURLに含める際に使用します</li>
        <li>例: "こんにちは" → "%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"</li>
        <li>スペースは"%20"または"+"に変換されます</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  function showError(message) {
    document.getElementById('errorBox').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
  }

  function hideError() {
    document.getElementById('errorBox').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
  }

  function encodeURL() {
    hideError();
    const input = document.getElementById('input').value;
    if (!input) {
      alert('テキストを入力してください');
      return;
    }
    
    try {
      const encoded = encodeURIComponent(input);
      document.getElementById('output').value = encoded;
      announceStatus('エンコードしました');
    } catch (error) {
      showError('エンコードに失敗しました: ' + error.message);
      announceStatus('エラー: ' + error.message);
    }
  }

  function decodeURL() {
    hideError();
    const input = document.getElementById('input').value;
    if (!input) {
      alert('テキストを入力してください');
      return;
    }
    
    try {
      const decoded = decodeURIComponent(input);
      document.getElementById('output').value = decoded;
      announceStatus('デコードしました');
    } catch (error) {
      showError('デコードに失敗しました: ' + error.message);
      announceStatus('エラー: ' + error.message);
    }
  }

  function clearAll() {
    document.getElementById('input').value = '';
    document.getElementById('output').value = '';
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
