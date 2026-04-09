import { describe, it, expect } from 'vite-plus/test';
import {
  generateNginxConfig,
  getDefaultConfig,
  validateDomain,
} from '../../app/utils/nginx-config';

describe('generateNginxConfig', () => {
  it('静的サイト: 基本的な出力を生成する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      domains: ['example.com'],
      port: 80,
      ssl: false,
      root: '/var/www/html',
      index: 'index.html',
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('server {');
    expect(result).toContain('listen 80;');
    expect(result).toContain('server_name example.com;');
    expect(result).toContain('root /var/www/html;');
    expect(result).toContain('index index.html;');
    expect(result).toContain('try_files $uri $uri/ =404;');
  });

  it('リバースプロキシ: proxy_pass を含む出力を生成する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'proxy' as const,
      domains: ['app.example.com'],
      port: 80,
      ssl: false,
      proxyPass: 'http://localhost:3000',
      proxyReadTimeout: 60,
      proxyBuffering: true,
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('proxy_pass http://localhost:3000;');
    expect(result).toContain('proxy_set_header Host $host;');
    expect(result).toContain('proxy_set_header X-Real-IP $remote_addr;');
    expect(result).toContain('proxy_read_timeout 60s;');
    expect(result).not.toContain('proxy_buffering off;');
  });

  it('リバースプロキシ: プロキシバッファリング無効時に proxy_buffering off を出力する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'proxy' as const,
      proxyBuffering: false,
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('proxy_buffering off;');
  });

  it('リダイレクト: return 301 を含む出力を生成する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'redirect' as const,
      domains: ['example.com'],
      port: 80,
      redirectTo: 'https://example.com',
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('return 301 https://example.com$request_uri;');
    expect(result).not.toContain('location /');
    expect(result).not.toContain('proxy_pass');
  });

  it('SSL 有効時: SSL ディレクティブを含む出力を生成する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      ssl: true,
      sslCert: '/etc/nginx/ssl/cert.pem',
      sslKey: '/etc/nginx/ssl/key.pem',
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('listen 443 ssl;');
    expect(result).toContain('ssl_certificate /etc/nginx/ssl/cert.pem;');
    expect(result).toContain('ssl_certificate_key /etc/nginx/ssl/key.pem;');
    expect(result).toContain('ssl_protocols TLSv1.2 TLSv1.3;');
  });

  it('gzip 有効時: gzip ディレクティブを含む出力を生成する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      gzip: true,
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('gzip on;');
    expect(result).toContain('gzip_types');
  });

  it('gzip 無効時: gzip ディレクティブを含まない', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      gzip: false,
    };
    const result = generateNginxConfig(config);
    expect(result).not.toContain('gzip on;');
  });

  it('セキュリティヘッダー: 有効時にヘッダーを出力する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      ssl: true,
      headers: {
        xFrameOptions: 'DENY' as const,
        xContentTypeOptions: true,
        xssProtection: true,
        hsts: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('add_header X-Frame-Options "DENY"');
    expect(result).toContain('add_header X-Content-Type-Options "nosniff"');
    expect(result).toContain('add_header X-XSS-Protection "1; mode=block"');
    expect(result).toContain('add_header Strict-Transport-Security');
    expect(result).toContain(
      'add_header Referrer-Policy "strict-origin-when-cross-origin"'
    );
  });

  it('セキュリティヘッダー: X-Frame-Options が none の場合は出力しない', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      headers: {
        ...getDefaultConfig().headers,
        xFrameOptions: 'none' as const,
        xContentTypeOptions: false,
        xssProtection: false,
        hsts: false,
        referrerPolicy: '',
      },
    };
    const result = generateNginxConfig(config);
    expect(result).not.toContain('X-Frame-Options');
  });

  it('HSTS: SSL 無効時は HSTS ヘッダーを出力しない', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      ssl: false,
      headers: {
        ...getDefaultConfig().headers,
        hsts: true,
      },
    };
    const result = generateNginxConfig(config);
    expect(result).not.toContain('Strict-Transport-Security');
  });

  it('複数ドメイン: server_name にスペース区切りで出力する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      domains: ['example.com', 'www.example.com'],
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('server_name example.com www.example.com;');
  });

  it('静的アセットキャッシュ: 有効時に location ブロックを出力する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      cacheStaticAssets: true,
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('expires 1y;');
    expect(result).toContain('Cache-Control "public, immutable"');
  });

  it('アクセスログ無効時: access_log off を出力する', () => {
    const config = {
      ...getDefaultConfig(),
      serverType: 'static' as const,
      accessLog: false,
    };
    const result = generateNginxConfig(config);
    expect(result).toContain('access_log off;');
  });
});

describe('validateDomain', () => {
  it('有効なドメインを受け入れる', () => {
    expect(validateDomain('example.com')).toBe(true);
    expect(validateDomain('www.example.com')).toBe(true);
    expect(validateDomain('sub.domain.example.co.jp')).toBe(true);
    expect(validateDomain('my-site.example.com')).toBe(true);
  });

  it('ワイルドカードドメインを受け入れる', () => {
    expect(validateDomain('*.example.com')).toBe(true);
  });

  it('無効なドメインを拒否する', () => {
    expect(validateDomain('')).toBe(false);
    expect(validateDomain('localhost')).toBe(false);
    expect(validateDomain('-example.com')).toBe(false);
    expect(validateDomain('example-.com')).toBe(false);
    expect(validateDomain('example..com')).toBe(false);
  });

  it('空文字を拒否する', () => {
    expect(validateDomain('')).toBe(false);
    expect(validateDomain('   ')).toBe(false);
  });
});

describe('getDefaultConfig', () => {
  it('期待されるデフォルト値を返す', () => {
    const config = getDefaultConfig();
    expect(config.serverType).toBe('static');
    expect(config.port).toBe(80);
    expect(config.ssl).toBe(false);
    expect(config.gzip).toBe(true);
    expect(config.domains).toEqual(['example.com']);
    expect(config.root).toBe('/var/www/html');
    expect(config.proxyPass).toBe('http://localhost:3000');
    expect(config.clientMaxBodySize).toBe('10m');
    expect(config.headers.xFrameOptions).toBe('SAMEORIGIN');
    expect(config.headers.xContentTypeOptions).toBe(true);
    expect(config.headers.hsts).toBe(false);
    expect(config.accessLog).toBe(true);
    expect(config.cacheStaticAssets).toBe(true);
  });
});
