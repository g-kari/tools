import { html } from 'hono/html';
import { toolLayout } from './layout';

export const jsonPage = toolLayout('JSON フォーマット', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">JSON フォーマットツール</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">JSONのフォーマット、圧縮、検証を行います</p>
  </header>

  <div class="tool-container">
    <div class="tool-section">
      <label for="input" class="section-title">入力 JSON</label>
      <textarea id="input" placeholder='{"name": "example", "value": 123}' aria-label="入力JSON"></textarea>
    </div>

    <div class="button-group">
      <button type="button" class="btn-primary" onclick="formatJSON()" aria-label="JSONをフォーマット">
        フォーマット
      </button>
      <button type="button" class="btn-secondary" onclick="compressJSON()" aria-label="JSONを圧縮">
        圧縮
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
      <h3>使い方</h3>
      <ul>
        <li>入力欄にJSONを入力してください</li>
        <li>「フォーマット」で読みやすく整形します（インデント付き）</li>
        <li>「圧縮」で余分な空白を削除します</li>
        <li>構文エラーがある場合はエラーメッセージを表示します</li>
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

  function formatJSON() {
    hideError();
    const input = document.getElementById('input').value.trim();
    if (!input) {
      alert('JSONを入力してください');
      return;
    }
    
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      document.getElementById('output').value = formatted;
      announceStatus('フォーマットしました');
    } catch (error) {
      showError('JSONの解析に失敗しました: ' + error.message);
      announceStatus('エラー: ' + error.message);
    }
  }

  function compressJSON() {
    hideError();
    const input = document.getElementById('input').value.trim();
    if (!input) {
      alert('JSONを入力してください');
      return;
    }
    
    try {
      const parsed = JSON.parse(input);
      const compressed = JSON.stringify(parsed);
      document.getElementById('output').value = compressed;
      announceStatus('圧縮しました');
    } catch (error) {
      showError('JSONの解析に失敗しました: ' + error.message);
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
