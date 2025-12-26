import { html } from 'hono/html';
import { toolLayout } from './layout';

export const uuidPage = toolLayout('UUID 生成', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">UUID 生成ツール</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">ランダムなUUID（v4）を生成します</p>
  </header>

  <div class="tool-container">
    <div class="tool-section">
      <label for="uuidCount" class="section-title">生成する数</label>
      <input type="number" id="uuidCount" value="1" min="1" max="100" aria-label="生成するUUIDの数">
    </div>

    <div class="button-group">
      <button type="button" class="btn-primary" onclick="generateUUIDs()" aria-label="UUIDを生成">
        生成
      </button>
      <button type="button" class="btn-clear" onclick="clearOutput()" aria-label="クリア">
        クリア
      </button>
    </div>

    <div class="tool-section">
      <label for="output" class="section-title">生成結果</label>
      <textarea id="output" readonly aria-label="生成されたUUID" aria-live="polite"></textarea>
    </div>

    <aside class="info-box">
      <h3>UUIDとは？</h3>
      <ul>
        <li>Universally Unique Identifierの略で、世界中で一意な識別子です</li>
        <li>バージョン4はランダムに生成されます</li>
        <li>形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx</li>
        <li>データベースの主キーやセッションIDなどに使用されます</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function generateUUIDs() {
    const count = parseInt(document.getElementById('uuidCount').value) || 1;
    const uuids = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      uuids.push(generateUUID());
    }
    document.getElementById('output').value = uuids.join('\\n');
    announceStatus(\`\${uuids.length}個のUUIDを生成しました\`);
  }

  function clearOutput() {
    document.getElementById('uuidCount').value = '1';
    document.getElementById('output').value = '';
    announceStatus('クリアしました');
  }

  function announceStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  }

  // Generate on load
  window.addEventListener('load', generateUUIDs);
</script>
`);
