import { html } from 'hono/html';
import { toolLayout } from './layout';

export const ipPage = toolLayout('グローバル IP', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">グローバル IP 確認</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">あなたのグローバルIPアドレスを表示します</p>
  </header>

  <div class="tool-container">
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 0.9rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 15px;">
        あなたのIPアドレス
      </div>
      <div id="ipAddress" style="font-size: 2.5rem; font-family: 'Roboto Mono', monospace; color: var(--md-sys-color-primary); font-weight: 500; margin-bottom: 20px;">
        読み込み中...
      </div>
      <button type="button" class="btn-secondary" onclick="copyIP()" aria-label="IPアドレスをコピー" style="min-width: 200px;">
        コピー
      </button>
    </div>

    <div id="ipInfo" style="margin-top: 30px; display: none;">
      <div class="section-title">接続情報</div>
      <div style="background: var(--md-sys-color-surface-variant); padding: 20px; border-radius: 4px; font-family: 'Roboto Mono', monospace; font-size: 0.9rem;">
        <div style="margin-bottom: 10px;"><strong>User Agent:</strong> <span id="userAgent"></span></div>
        <div style="margin-bottom: 10px;"><strong>言語:</strong> <span id="language"></span></div>
        <div><strong>画面解像度:</strong> <span id="screen"></span></div>
      </div>
    </div>

    <aside class="info-box">
      <h3>グローバルIPアドレスとは？</h3>
      <ul>
        <li>インターネット上であなたを識別するための一意のアドレスです</li>
        <li>ISP（インターネットサービスプロバイダー）から割り当てられます</li>
        <li>IPv4形式（例: 192.0.2.1）またはIPv6形式で表示されます</li>
        <li>VPNやプロキシを使用している場合、それらのサーバーのIPが表示されます</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  let currentIP = '';

  window.addEventListener('load', function() {
    // Get IP from server (will be set in the app.ts route)
    currentIP = document.getElementById('ipAddress').getAttribute('data-ip') || '';
    if (currentIP) {
      document.getElementById('ipAddress').textContent = currentIP;
    }

    // Show browser info
    document.getElementById('userAgent').textContent = navigator.userAgent;
    document.getElementById('language').textContent = navigator.language;
    document.getElementById('screen').textContent = screen.width + ' x ' + screen.height;
    document.getElementById('ipInfo').style.display = 'block';
  });

  async function copyIP() {
    if (!currentIP) {
      alert('IPアドレスが取得できていません');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(currentIP);
      alert('IPアドレスをクリップボードにコピーしました');
      announceStatus('コピーしました');
    } catch (err) {
      alert('コピーに失敗しました');
    }
  }

  function announceStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  }
</script>
`, `
  #ipAddress { word-break: break-all; }
`);

// This function will be used to inject the IP address into the page
export function getIpPageWithIP(ip: string): any {
  const pageStr = ipPage.toString();
  return pageStr.replace(
    'data-ip="" id="ipAddress"',
    `data-ip="${ip}" id="ipAddress"`
  ).replace(
    '>読み込み中...</div>',
    `>${ip}</div>`
  );
}
