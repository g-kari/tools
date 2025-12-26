import { Hono } from 'hono';
import { html } from 'hono/html';
import { commonStyles } from './styles';

const whois = new Hono();

// Contact information
interface ContactInfo {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// WHOIS API types
interface WhoisResult {
  domain: string;
  registrar?: string;
  createdDate?: string;
  expiryDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  registrant?: ContactInfo;
  administrative?: ContactInfo;
  technical?: ContactInfo;
  billing?: ContactInfo;
  abuse?: ContactInfo;
  raw?: string;
  error?: string;
}

// RDAP response types
interface RdapResponse {
  ldhName?: string;
  handle?: string;
  status?: string[];
  events?: Array<{
    eventAction: string;
    eventDate: string;
  }>;
  nameservers?: Array<{
    ldhName: string;
  }>;
  entities?: Array<{
    roles?: string[];
    vcardArray?: [string, Array<[string, Record<string, unknown>, string, string]>];
    publicIds?: Array<{
      type: string;
      identifier: string;
    }>;
  }>;
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  errorCode?: number;
  title?: string;
  description?: string[];
}

// IANA RDAP Bootstrap file URL
const IANA_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

// Cache for bootstrap data (TLD -> RDAP server URL)
let bootstrapCache: Record<string, string> | null = null;
let bootstrapCacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Bootstrap file structure
interface BootstrapFile {
  version: string;
  publication: string;
  services: Array<[string[], string[]]>;
}

// Function to get TLD from domain
function getTld(domain: string): string {
  const parts = domain.split('.');
  return parts[parts.length - 1].toLowerCase();
}

// Function to fetch and parse IANA bootstrap file
async function getBootstrapData(): Promise<Record<string, string>> {
  const now = Date.now();

  // Return cached data if still valid
  if (bootstrapCache && (now - bootstrapCacheTime) < CACHE_TTL) {
    return bootstrapCache;
  }

  try {
    const response = await fetch(IANA_BOOTSTRAP_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bootstrap: ${response.status}`);
    }

    const data: BootstrapFile = await response.json();
    const mapping: Record<string, string> = {};

    // Parse services array: [[tlds], [urls]]
    for (const service of data.services) {
      const tlds = service[0];
      const urls = service[1];
      if (urls.length > 0) {
        const serverUrl = urls[0].replace(/\/$/, ''); // Remove trailing slash
        for (const tld of tlds) {
          mapping[tld.toLowerCase()] = serverUrl;
        }
      }
    }

    bootstrapCache = mapping;
    bootstrapCacheTime = now;
    return mapping;
  } catch {
    // Return empty object on error, will fallback to rdap.org
    return bootstrapCache || {};
  }
}

// Function to query a single RDAP server
async function queryRdapServer(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'Accept': 'application/rdap+json',
    },
  });
}

// Function to query RDAP
async function queryRdap(domain: string): Promise<WhoisResult> {
  const result: WhoisResult = { domain };
  const tld = getTld(domain);

  // Get bootstrap data for TLD-specific server
  const bootstrap = await getBootstrapData();
  const serversToTry: string[] = [];

  // Add TLD-specific server from IANA bootstrap if available
  if (bootstrap[tld]) {
    serversToTry.push(`${bootstrap[tld]}/domain/${encodeURIComponent(domain)}`);
  }

  // Add rdap.org as fallback
  serversToTry.push(`https://rdap.org/domain/${encodeURIComponent(domain)}`);

  let lastError = '';

  for (const serverUrl of serversToTry) {
    try {
      const response = await queryRdapServer(serverUrl);

      if (response.ok) {
        const data: RdapResponse = await response.json();
        return parseRdapResponse(data, domain);
      }

      if (response.status === 404) {
        result.error = 'ドメインが見つかりませんでした';
        return result;
      }

      lastError = `HTTP ${response.status}`;
      // Continue to next server on 403 or other errors
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      // Continue to next server
    }
  }

  result.error = `WHOIS情報を取得できませんでした (${lastError})`;
  return result;
}

// Parse RDAP response into WhoisResult
function parseRdapResponse(data: RdapResponse, domain: string): WhoisResult {
  const result: WhoisResult = { domain };

  // Parse domain name
  result.domain = data.ldhName || domain;

  // Parse status
  if (data.status) {
    result.status = data.status;
  }

  // Parse events (registration, expiration, last update)
  if (data.events) {
    for (const event of data.events) {
      switch (event.eventAction) {
        case 'registration':
          result.createdDate = event.eventDate;
          break;
        case 'expiration':
          result.expiryDate = event.eventDate;
          break;
        case 'last changed':
        case 'last update of RDAP database':
          if (!result.updatedDate) {
            result.updatedDate = event.eventDate;
          }
          break;
      }
    }
  }

  // Parse nameservers
  if (data.nameservers) {
    result.nameServers = data.nameservers.map(ns => ns.ldhName).filter(Boolean);
  }

  // Parse entities (registrar, registrant, admin, tech, billing, abuse)
  if (data.entities) {
    for (const entity of data.entities) {
      const roles = entity.roles || [];

      // Handle registrar separately (just name)
      if (roles.includes('registrar')) {
        if (entity.vcardArray && entity.vcardArray[1]) {
          const fnEntry = entity.vcardArray[1].find(entry => entry[0] === 'fn');
          if (fnEntry) {
            result.registrar = fnEntry[3] as string;
          }
        }
        if (!result.registrar && entity.publicIds) {
          const ianaId = entity.publicIds.find(id => id.type === 'IANA Registrar ID');
          if (ianaId) {
            result.registrar = `IANA ID: ${ianaId.identifier}`;
          }
        }
      }

      // Parse contact info for other roles
      const contactInfo = parseVcardToContact(entity.vcardArray);

      if (roles.includes('registrant') && contactInfo) {
        result.registrant = contactInfo;
      }
      if (roles.includes('administrative') && contactInfo) {
        result.administrative = contactInfo;
      }
      if (roles.includes('technical') && contactInfo) {
        result.technical = contactInfo;
      }
      if (roles.includes('billing') && contactInfo) {
        result.billing = contactInfo;
      }
      if (roles.includes('abuse') && contactInfo) {
        result.abuse = contactInfo;
      }
    }
  }

  return result;
}

// Helper function to parse vCard array into ContactInfo
function parseVcardToContact(vcardArray?: [string, Array<[string, Record<string, unknown>, string, string | string[]]>]): ContactInfo | undefined {
  if (!vcardArray || !vcardArray[1]) {
    return undefined;
  }

  const vcard = vcardArray[1];
  const contact: ContactInfo = {};

  for (const entry of vcard) {
    const [type, , , value] = entry;

    switch (type) {
      case 'fn':
        contact.name = typeof value === 'string' ? value : undefined;
        break;
      case 'org':
        contact.organization = typeof value === 'string' ? value : (Array.isArray(value) ? value[0] : undefined);
        break;
      case 'email':
        contact.email = typeof value === 'string' ? value : undefined;
        break;
      case 'tel':
        contact.phone = typeof value === 'string' ? value : undefined;
        break;
      case 'adr':
        if (Array.isArray(value)) {
          // vCard address format: [PO Box, Extended, Street, City, Region, Postal, Country]
          const parts = value.filter(v => v && typeof v === 'string');
          contact.address = parts.join(', ');
        }
        break;
    }
  }

  // Return undefined if no meaningful data
  if (!contact.name && !contact.organization && !contact.email) {
    return undefined;
  }

  return contact;
}

// WHOIS API endpoint
whois.get('/api/whois', async (c) => {
  const domain = c.req.query('domain');

  if (!domain) {
    return c.json({ error: 'domain parameter is required' }, 400);
  }

  // Basic domain validation (supports subdomains)
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return c.json({ error: '無効なドメイン形式です' }, 400);
  }

  const result = await queryRdap(domain.toLowerCase());

  if (result.error) {
    return c.json(result, 404);
  }

  return c.json(result);
});

// WHOIS Lookup page
const whoisPage = html`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WHOIS検索ツール</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap" rel="stylesheet">
  <style>
    ${commonStyles}
    .tool-container {
      background: white;
      border-radius: 4px;
      padding: 30px;
    }
    .input-section { margin-bottom: 30px; }
    .section-title {
      font-size: 1.2rem;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 15px;
      font-weight: 500;
    }
    .search-form {
      display: flex;
      gap: 15px;
      align-items: flex-end;
    }
    .input-group {
      flex: 1;
    }
    label {
      display: block;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface);
    }
    input[type="text"] {
      width: 100%;
      padding: 15px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 4px;
      font-size: 16px;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      transition: border-color 0.2s;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
    }
    input[type="text"]:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      background: white;
    }
    button {
      padding: 15px 30px;
      font-size: 16px;
      font-weight: 500;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .btn-search {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    button:hover { opacity: 0.85; }
    button:active { opacity: 0.7; }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button:focus-visible {
      outline: 3px solid var(--md-sys-color-primary);
      outline-offset: 3px;
    }
    .result-section {
      margin-top: 30px;
      display: none;
    }
    .result-section.visible {
      display: block;
    }
    .result-card {
      background: var(--md-sys-color-surface-variant);
      border-radius: 4px;
      padding: 20px;
      margin-top: 15px;
    }
    .result-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .result-row:last-child {
      border-bottom: none;
    }
    .result-label {
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      width: 150px;
      flex-shrink: 0;
    }
    .result-value {
      color: var(--md-sys-color-on-surface-variant);
      font-family: 'Roboto Mono', 'Courier New', monospace;
      word-break: break-all;
    }
    .result-value.list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .error-message {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-error);
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }
    .loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--md-sys-color-outline-variant);
      border-top-color: var(--md-sys-color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
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
      .search-form { flex-direction: column; }
      button { width: 100%; }
      .result-row { flex-direction: column; gap: 5px; }
      .result-label { width: auto; }
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>

  <div class="container">
    <header role="banner">
      <h1>WHOIS検索ツール</h1>
      <p class="subtitle">ドメイン名の登録情報を検索します</p>
      <nav class="nav-links" aria-label="ツールナビゲーション">
        <a href="/">Unicode変換</a>
        <a href="/whois" class="active">WHOIS検索</a>
      </nav>
    </header>

    <main id="main-content" role="main">
      <div class="tool-container">
        <form id="whoisForm" onsubmit="return false;" aria-label="WHOIS検索フォーム">
          <div class="input-section">
            <div class="search-form">
              <div class="input-group">
                <label for="domainInput">ドメイン名</label>
                <input
                  type="text"
                  id="domainInput"
                  name="domain"
                  placeholder="example.com"
                  aria-describedby="domain-help"
                  aria-label="検索するドメイン名"
                  autocomplete="off"
                  spellcheck="false">
              </div>
              <button
                type="submit"
                class="btn-search"
                onclick="searchWhois()"
                aria-label="WHOIS情報を検索">
                検索
              </button>
            </div>
            <span id="domain-help" class="sr-only">example.comのような形式でドメイン名を入力してください</span>
          </div>
        </form>

        <div id="loadingSection" class="loading" style="display: none;" aria-live="polite">
          <div class="spinner" aria-hidden="true"></div>
          <span>検索中...</span>
        </div>

        <div id="errorSection" class="error-message" style="display: none;" role="alert" aria-live="assertive"></div>

        <section id="resultSection" class="result-section" aria-labelledby="result-title">
          <h2 id="result-title" class="section-title">検索結果</h2>
          <div id="resultCard" class="result-card" aria-live="polite"></div>
        </section>

        <aside class="info-box" role="complementary" aria-labelledby="usage-title">
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>ドメイン名を入力して「検索」ボタンをクリック</li>
            <li>例: google.com, github.com</li>
            <li>登録者、有効期限、ネームサーバーなどの情報を表示</li>
            <li>キーボードショートカット: Enterキーで検索実行</li>
          </ul>
        </aside>
      </div>
    </main>
  </div>

  <div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="status-message"></div>

  <script>
    function announceStatus(message) {
      const statusEl = document.getElementById('status-message');
      statusEl.textContent = message;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }

    function formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    }

    function showLoading(show) {
      document.getElementById('loadingSection').style.display = show ? 'flex' : 'none';
      document.querySelector('.btn-search').disabled = show;
    }

    function showError(message) {
      const errorSection = document.getElementById('errorSection');
      errorSection.textContent = message;
      errorSection.style.display = 'block';
      document.getElementById('resultSection').classList.remove('visible');
    }

    function hideError() {
      document.getElementById('errorSection').style.display = 'none';
    }

    function formatContact(contact) {
      if (!contact) return null;
      const parts = [];
      if (contact.name) parts.push(contact.name);
      if (contact.organization) parts.push(contact.organization);
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      if (contact.address) parts.push(contact.address);
      return parts.length > 0 ? parts : null;
    }

    function displayResult(data) {
      const resultCard = document.getElementById('resultCard');
      const rows = [];

      rows.push({ label: 'ドメイン名', value: data.domain || '-' });
      rows.push({ label: 'レジストラ', value: data.registrar || '-' });
      rows.push({ label: '登録日', value: formatDate(data.createdDate) });
      rows.push({ label: '有効期限', value: formatDate(data.expiryDate) });
      rows.push({ label: '更新日', value: formatDate(data.updatedDate) });

      if (data.nameServers && data.nameServers.length > 0) {
        rows.push({
          label: 'ネームサーバー',
          value: data.nameServers,
          isList: true
        });
      }

      // Contact information
      const registrantInfo = formatContact(data.registrant);
      if (registrantInfo) {
        rows.push({ label: '登録者', value: registrantInfo, isList: true });
      }

      const adminInfo = formatContact(data.administrative);
      if (adminInfo) {
        rows.push({ label: '管理連絡先', value: adminInfo, isList: true });
      }

      const techInfo = formatContact(data.technical);
      if (techInfo) {
        rows.push({ label: '技術連絡先', value: techInfo, isList: true });
      }

      const abuseInfo = formatContact(data.abuse);
      if (abuseInfo) {
        rows.push({ label: '不正利用連絡先', value: abuseInfo, isList: true });
      }

      if (data.status && data.status.length > 0) {
        rows.push({
          label: 'ステータス',
          value: data.status.slice(0, 5),
          isList: true
        });
      }

      let html = '';
      for (const row of rows) {
        html += '<div class="result-row">';
        html += '<div class="result-label">' + escapeHtml(row.label) + '</div>';
        if (row.isList && Array.isArray(row.value)) {
          html += '<div class="result-value list">';
          for (const item of row.value) {
            html += '<span>' + escapeHtml(item) + '</span>';
          }
          html += '</div>';
        } else {
          html += '<div class="result-value">' + escapeHtml(String(row.value)) + '</div>';
        }
        html += '</div>';
      }

      resultCard.innerHTML = html;
      document.getElementById('resultSection').classList.add('visible');
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    async function searchWhois() {
      const domainInput = document.getElementById('domainInput');
      const domain = domainInput.value.trim();

      if (!domain) {
        announceStatus('エラー: ドメイン名を入力してください');
        alert('ドメイン名を入力してください');
        domainInput.focus();
        return;
      }

      hideError();
      showLoading(true);
      announceStatus('検索中...');

      try {
        const response = await fetch('/api/whois?domain=' + encodeURIComponent(domain));
        const data = await response.json();

        if (!response.ok || data.error) {
          showError(data.error || '検索に失敗しました');
          announceStatus('エラー: ' + (data.error || '検索に失敗しました'));
          return;
        }

        displayResult(data);
        announceStatus('検索が完了しました');
      } catch (err) {
        showError('通信エラーが発生しました');
        announceStatus('エラー: 通信エラーが発生しました');
      } finally {
        showLoading(false);
      }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && document.activeElement.id === 'domainInput') {
        e.preventDefault();
        searchWhois();
      }
    });

    // Focus management on page load
    window.addEventListener('load', function() {
      document.getElementById('domainInput').focus();
    });
  </script>
</body>
</html>
`;

whois.get('/whois', (c) => c.html(whoisPage));

export default whois;
