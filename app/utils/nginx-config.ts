/**
 * Nginx 設定ジェネレーター ユーティリティ
 *
 * Nginx サーバーブロックの設定を生成するユーティリティ関数群。
 * 静的サイト・リバースプロキシ・HTTPSリダイレクトに対応。
 */

/**
 * Nginx サーバーブロックの設定インターフェース
 */
export interface NginxServerConfig {
  /** サーバータイプ */
  serverType: 'static' | 'proxy' | 'redirect';
  /** ドメイン名（server_name にスペース区切りで設定される） */
  domains: string[];
  /** リッスンポート */
  port: number;
  /** SSL を有効にするか */
  ssl: boolean;
  /** SSL 証明書のパス */
  sslCert: string;
  /** SSL 秘密鍵のパス */
  sslKey: string;
  /** ドキュメントルート（static タイプで使用） */
  root: string;
  /** プロキシ先 URL（proxy タイプで使用） */
  proxyPass: string;
  /** リダイレクト先 URL（redirect タイプで使用） */
  redirectTo: string;
  /** gzip 圧縮を有効にするか */
  gzip: boolean;
  /** クライアント最大ボディサイズ */
  clientMaxBodySize: string;
  /** セキュリティヘッダー設定 */
  headers: {
    /** X-Frame-Options ヘッダーの値 */
    xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'none';
    /** X-Content-Type-Options ヘッダーを付与するか */
    xContentTypeOptions: boolean;
    /** X-XSS-Protection ヘッダーを付与するか */
    xssProtection: boolean;
    /** HSTS ヘッダーを付与するか（SSL 必須） */
    hsts: boolean;
    /** Referrer-Policy ヘッダーの値 */
    referrerPolicy: string;
  };
  /** アクセスログを有効にするか */
  accessLog: boolean;
  /** インデックスファイル（static タイプで使用） */
  index: string;
  /** プロキシバッファリングを有効にするか */
  proxyBuffering: boolean;
  /** プロキシ読み取りタイムアウト（秒） */
  proxyReadTimeout: number;
  /** 静的アセットをキャッシュするか */
  cacheStaticAssets: boolean;
}

/**
 * デフォルト設定を返す
 *
 * @returns デフォルトの NginxServerConfig オブジェクト
 */
export function getDefaultConfig(): NginxServerConfig {
  return {
    serverType: 'static',
    domains: ['example.com'],
    port: 80,
    ssl: false,
    sslCert: '/etc/nginx/ssl/cert.pem',
    sslKey: '/etc/nginx/ssl/key.pem',
    root: '/var/www/html',
    proxyPass: 'http://localhost:3000',
    redirectTo: 'https://example.com',
    gzip: true,
    clientMaxBodySize: '10m',
    headers: {
      xFrameOptions: 'SAMEORIGIN',
      xContentTypeOptions: true,
      xssProtection: true,
      hsts: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    accessLog: true,
    index: 'index.html index.htm',
    proxyBuffering: true,
    proxyReadTimeout: 60,
    cacheStaticAssets: true,
  };
}

/**
 * ドメイン名を検証する
 *
 * @param domain - 検証するドメイン名
 * @returns ドメイン名が有効な場合 true
 */
export function validateDomain(domain: string): boolean {
  if (!domain || domain.trim() === '') return false;
  // ワイルドカードドメインを許可
  const normalized = domain.startsWith('*.') ? domain.slice(2) : domain;
  // ラベルは英数字・ハイフンのみ、先頭・末尾はハイフン不可
  const labelPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  const labels = normalized.split('.');
  if (labels.length < 2) return false;
  return labels.every((label) => labelPattern.test(label));
}

/**
 * インデントを付与するヘルパー
 */
function indent(text: string, spaces: number = 4): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : pad + line))
    .join('\n');
}

/**
 * Nginx サーバーブロック設定を生成する
 *
 * @param config - Nginx サーバー設定オブジェクト
 * @returns 生成された Nginx 設定文字列
 */
export function generateNginxConfig(config: NginxServerConfig): string {
  const {
    serverType,
    domains,
    port,
    ssl,
    sslCert,
    sslKey,
    root,
    proxyPass,
    redirectTo,
    gzip,
    clientMaxBodySize,
    headers,
    accessLog,
    index,
    proxyBuffering,
    proxyReadTimeout,
    cacheStaticAssets,
  } = config;

  const serverName =
    domains.length > 0 ? domains.join(' ') : 'example.com';
  const lines: string[] = [];

  // redirect タイプは HTTP→HTTPS リダイレクト用のシンプルなブロックを生成
  if (serverType === 'redirect') {
    lines.push('server {');
    lines.push(`    listen ${port};`);
    lines.push(`    server_name ${serverName};`);
    lines.push('');
    lines.push('    # HTTPSへリダイレクト');
    lines.push(`    return 301 ${redirectTo}$request_uri;`);
    lines.push('}');
    return lines.join('\n');
  }

  // --- 通常のサーバーブロック ---
  lines.push('server {');

  // listen ディレクティブ
  if (ssl) {
    lines.push('    listen 443 ssl;');
    lines.push('    listen [::]:443 ssl;');
  } else {
    lines.push(`    listen ${port};`);
    lines.push(`    listen [::]:${port};`);
  }

  lines.push('');
  lines.push(`    server_name ${serverName};`);

  // SSL 設定
  if (ssl) {
    lines.push('');
    lines.push('    # SSL/TLS 設定');
    lines.push(`    ssl_certificate ${sslCert};`);
    lines.push(`    ssl_certificate_key ${sslKey};`);
    lines.push('    ssl_protocols TLSv1.2 TLSv1.3;');
    lines.push('    ssl_ciphers HIGH:!aNULL:!MD5;');
    lines.push('    ssl_prefer_server_ciphers on;');
    lines.push('    ssl_session_cache shared:SSL:10m;');
    lines.push('    ssl_session_timeout 10m;');
  }

  // アクセスログ
  if (!accessLog) {
    lines.push('');
    lines.push('    # アクセスログ無効');
    lines.push('    access_log off;');
  }

  // クライアント最大ボディサイズ
  lines.push('');
  lines.push(`    client_max_body_size ${clientMaxBodySize};`);

  // セキュリティヘッダー
  const hasHeaders =
    headers.xFrameOptions !== 'none' ||
    headers.xContentTypeOptions ||
    headers.xssProtection ||
    (headers.hsts && ssl) ||
    headers.referrerPolicy !== '';

  if (hasHeaders) {
    lines.push('');
    lines.push('    # セキュリティヘッダー');
    if (headers.xFrameOptions !== 'none') {
      lines.push(
        `    add_header X-Frame-Options "${headers.xFrameOptions}" always;`
      );
    }
    if (headers.xContentTypeOptions) {
      lines.push(
        '    add_header X-Content-Type-Options "nosniff" always;'
      );
    }
    if (headers.xssProtection) {
      lines.push(
        '    add_header X-XSS-Protection "1; mode=block" always;'
      );
    }
    if (headers.hsts && ssl) {
      lines.push(
        '    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;'
      );
    }
    if (headers.referrerPolicy !== '') {
      lines.push(
        `    add_header Referrer-Policy "${headers.referrerPolicy}" always;`
      );
    }
  }

  // gzip 設定
  if (gzip) {
    lines.push('');
    lines.push('    # gzip 圧縮');
    lines.push('    gzip on;');
    lines.push('    gzip_vary on;');
    lines.push('    gzip_min_length 1024;');
    lines.push(
      '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;'
    );
  }

  // サーバータイプごとのコンテンツ設定
  if (serverType === 'static') {
    lines.push('');
    lines.push('    # ドキュメントルート');
    lines.push(`    root ${root};`);
    lines.push(`    index ${index};`);
    lines.push('');
    lines.push('    location / {');
    lines.push('        try_files $uri $uri/ =404;');
    lines.push('    }');

    if (cacheStaticAssets) {
      lines.push('');
      lines.push('    # 静的アセットのキャッシュ');
      lines.push(
        '    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {'
      );
      lines.push('        expires 1y;');
      lines.push('        add_header Cache-Control "public, immutable";');
      lines.push('    }');
    }
  } else if (serverType === 'proxy') {
    lines.push('');
    lines.push('    # リバースプロキシ設定');
    lines.push('    location / {');
    lines.push(`        proxy_pass ${proxyPass};`);
    lines.push('        proxy_http_version 1.1;');
    lines.push('        proxy_set_header Upgrade $http_upgrade;');
    lines.push('        proxy_set_header Connection "upgrade";');
    lines.push('        proxy_set_header Host $host;');
    lines.push('        proxy_set_header X-Real-IP $remote_addr;');
    lines.push(
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
    );
    lines.push('        proxy_set_header X-Forwarded-Proto $scheme;');
    lines.push(`        proxy_read_timeout ${proxyReadTimeout}s;`);
    lines.push('        proxy_connect_timeout 10s;');
    lines.push('        proxy_send_timeout 60s;');
    if (!proxyBuffering) {
      lines.push('        proxy_buffering off;');
    }
    lines.push('    }');

    if (cacheStaticAssets) {
      lines.push('');
      lines.push('    # 静的アセットのキャッシュ');
      lines.push(
        '    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {'
      );
      lines.push('        expires 1y;');
      lines.push('        add_header Cache-Control "public, immutable";');
      lines.push('    }');
    }
  }

  lines.push('}');

  return lines.join('\n');
}
