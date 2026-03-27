/**
 * Apache .htaccess ビルダー ユーティリティ
 *
 * Apache .htaccess ファイルの設定を生成するユーティリティ関数群。
 * リダイレクト・キャッシュ制御・セキュリティ・カスタムエラーページに対応。
 */

/**
 * .htaccess の設定インターフェース
 */
export interface HtaccessConfig {
  /** 基本設定 */
  basic: {
    /** DirectoryIndex の設定 */
    directoryIndex: string;
    /** Options の設定 */
    options: {
      /** ディレクトリ一覧を非表示にする */
      noIndexes: boolean;
      /** シンボリックリンクを許可する */
      followSymLinks: boolean;
    };
    /** 文字コード設定 */
    charset: string;
  };
  /** リダイレクト設定 */
  redirect: {
    /** HTTP → HTTPS リダイレクト */
    httpsRedirect: boolean;
    /** www なし → www あり リダイレクト */
    wwwRedirect: 'none' | 'add-www' | 'remove-www';
    /** カスタムリダイレクト一覧 */
    customRedirects: Array<{
      /** リダイレクト元パス */
      from: string;
      /** リダイレクト先 URL */
      to: string;
      /** リダイレクトタイプ */
      type: '301' | '302';
    }>;
  };
  /** キャッシュ制御設定 */
  cache: {
    /** キャッシュ制御を有効にするか */
    enabled: boolean;
    /** 画像のキャッシュ期間 */
    images: string;
    /** CSS/JS のキャッシュ期間 */
    cssJs: string;
    /** HTML のキャッシュ期間 */
    html: string;
    /** フォントのキャッシュ期間 */
    fonts: string;
  };
  /** セキュリティ設定 */
  security: {
    /** .htaccess 自身へのアクセスを禁止する */
    blockHtaccess: boolean;
    /** 機密ファイルへのアクセスを禁止する */
    blockSensitiveFiles: boolean;
    /** X-Frame-Options ヘッダー */
    xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'none';
    /** X-Content-Type-Options ヘッダーを付与するか */
    xContentTypeOptions: boolean;
    /** X-XSS-Protection ヘッダーを付与するか */
    xssProtection: boolean;
    /** Referrer-Policy ヘッダー */
    referrerPolicy: string;
    /** サーバー署名を非表示にするか */
    serverSignature: boolean;
    /** ETag を無効にするか */
    noEtag: boolean;
  };
  /** カスタムエラーページ設定 */
  errorPages: {
    /** 404 エラーページ */
    e404: string;
    /** 500 エラーページ */
    e500: string;
    /** 403 エラーページ */
    e403: string;
  };
  /** GZIP 圧縮設定 */
  compression: {
    /** GZIP 圧縮を有効にするか */
    enabled: boolean;
  };
}

/**
 * デフォルト設定を返す
 */
export function getDefaultConfig(): HtaccessConfig {
  return {
    basic: {
      directoryIndex: 'index.html index.php',
      options: {
        noIndexes: true,
        followSymLinks: true,
      },
      charset: 'UTF-8',
    },
    redirect: {
      httpsRedirect: true,
      wwwRedirect: 'none',
      customRedirects: [],
    },
    cache: {
      enabled: true,
      images: '1 month',
      cssJs: '1 week',
      html: '1 day',
      fonts: '1 year',
    },
    security: {
      blockHtaccess: true,
      blockSensitiveFiles: true,
      xFrameOptions: 'SAMEORIGIN',
      xContentTypeOptions: true,
      xssProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      serverSignature: true,
      noEtag: false,
    },
    errorPages: {
      e404: '',
      e500: '',
      e403: '',
    },
    compression: {
      enabled: true,
    },
  };
}

/**
 * .htaccess の基本設定セクションを生成する
 */
function buildBasicSection(config: HtaccessConfig['basic']): string[] {
  const lines: string[] = ['# ── 基本設定 ──────────────────────────────────'];

  if (config.directoryIndex) {
    lines.push(`DirectoryIndex ${config.directoryIndex}`);
  }

  const opts: string[] = [];
  if (config.options.followSymLinks) opts.push('+FollowSymLinks');
  if (config.options.noIndexes) opts.push('-Indexes');
  if (opts.length > 0) {
    lines.push(`Options ${opts.join(' ')}`);
  }

  if (config.charset) {
    lines.push(`AddDefaultCharset ${config.charset}`);
  }

  return lines;
}

/**
 * リダイレクト設定セクションを生成する
 */
function buildRedirectSection(config: HtaccessConfig['redirect']): string[] {
  const lines: string[] = [];
  const hasHttps = config.httpsRedirect;
  const hasWww = config.wwwRedirect !== 'none';
  const hasCustom = config.customRedirects.length > 0;

  if (!hasHttps && !hasWww && !hasCustom) return lines;

  lines.push('', '# ── リダイレクト ─────────────────────────────────');
  lines.push('<IfModule mod_rewrite.c>');
  lines.push('  RewriteEngine On');

  if (hasHttps) {
    lines.push('');
    lines.push('  # HTTP → HTTPS リダイレクト');
    lines.push('  RewriteCond %{HTTPS} off');
    lines.push('  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]');
  }

  if (config.wwwRedirect === 'add-www') {
    lines.push('');
    lines.push('  # www なし → www あり リダイレクト');
    lines.push('  RewriteCond %{HTTP_HOST} !^www\\. [NC]');
    lines.push(
      '  RewriteRule ^ https://www.%{HTTP_HOST}%{REQUEST_URI} [R=301,L]'
    );
  } else if (config.wwwRedirect === 'remove-www') {
    lines.push('');
    lines.push('  # www あり → www なし リダイレクト');
    lines.push('  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]');
    lines.push(
      '  RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]'
    );
  }

  if (hasCustom) {
    lines.push('');
    lines.push('  # カスタムリダイレクト');
    for (const r of config.customRedirects) {
      if (r.from && r.to) {
        lines.push(
          `  Redirect ${r.type} ${r.from} ${r.to}`
        );
      }
    }
  }

  lines.push('</IfModule>');
  return lines;
}

/**
 * キャッシュ制御セクションを生成する
 */
function buildCacheSection(config: HtaccessConfig['cache']): string[] {
  if (!config.enabled) return [];

  const lines: string[] = [
    '',
    '# ── キャッシュ制御 ────────────────────────────────',
    '<IfModule mod_expires.c>',
    '  ExpiresActive On',
    '  ExpiresDefault "access plus 1 hour"',
  ];

  if (config.images) {
    lines.push(`  ExpiresByType image/jpeg "access plus ${config.images}"`);
    lines.push(`  ExpiresByType image/png "access plus ${config.images}"`);
    lines.push(`  ExpiresByType image/gif "access plus ${config.images}"`);
    lines.push(`  ExpiresByType image/svg+xml "access plus ${config.images}"`);
    lines.push(`  ExpiresByType image/webp "access plus ${config.images}"`);
    lines.push(`  ExpiresByType image/avif "access plus ${config.images}"`);
  }

  if (config.cssJs) {
    lines.push(`  ExpiresByType text/css "access plus ${config.cssJs}"`);
    lines.push(
      `  ExpiresByType application/javascript "access plus ${config.cssJs}"`
    );
    lines.push(
      `  ExpiresByType text/javascript "access plus ${config.cssJs}"`
    );
  }

  if (config.html) {
    lines.push(`  ExpiresByType text/html "access plus ${config.html}"`);
  }

  if (config.fonts) {
    lines.push(
      `  ExpiresByType font/woff2 "access plus ${config.fonts}"`
    );
    lines.push(
      `  ExpiresByType font/woff "access plus ${config.fonts}"`
    );
    lines.push(
      `  ExpiresByType application/font-woff2 "access plus ${config.fonts}"`
    );
  }

  lines.push('</IfModule>');
  return lines;
}

/**
 * GZIP 圧縮セクションを生成する
 */
function buildCompressionSection(
  config: HtaccessConfig['compression']
): string[] {
  if (!config.enabled) return [];

  return [
    '',
    '# ── GZIP 圧縮 ────────────────────────────────────',
    '<IfModule mod_deflate.c>',
    '  AddOutputFilterByType DEFLATE text/plain',
    '  AddOutputFilterByType DEFLATE text/html',
    '  AddOutputFilterByType DEFLATE text/css',
    '  AddOutputFilterByType DEFLATE application/javascript',
    '  AddOutputFilterByType DEFLATE application/json',
    '  AddOutputFilterByType DEFLATE image/svg+xml',
    '  AddOutputFilterByType DEFLATE application/xml',
    '  AddOutputFilterByType DEFLATE font/woff2',
    '  AddOutputFilterByType DEFLATE font/woff',
    '</IfModule>',
  ];
}

/**
 * セキュリティ設定セクションを生成する
 */
function buildSecuritySection(config: HtaccessConfig['security']): string[] {
  const lines: string[] = [
    '',
    '# ── セキュリティ ─────────────────────────────────',
  ];

  if (config.blockHtaccess) {
    lines.push('# .htaccess へのアクセス禁止');
    lines.push('<Files ".htaccess">');
    lines.push('  Require all denied');
    lines.push('</Files>');
  }

  if (config.blockSensitiveFiles) {
    lines.push('');
    lines.push('# 機密ファイルへのアクセス禁止');
    lines.push(
      '<FilesMatch "\\.(env|log|ini|conf|bak|sql|sh|py)$">'
    );
    lines.push('  Require all denied');
    lines.push('</FilesMatch>');
  }

  if (config.serverSignature) {
    lines.push('');
    lines.push('# サーバー情報の非表示');
    lines.push('ServerSignature Off');
  }

  if (config.noEtag) {
    lines.push('');
    lines.push('# ETag を無効化');
    lines.push('FileETag None');
    lines.push('Header unset ETag');
  }

  const hasHeaders =
    config.xFrameOptions !== 'none' ||
    config.xContentTypeOptions ||
    config.xssProtection ||
    config.referrerPolicy;

  if (hasHeaders) {
    lines.push('');
    lines.push('# セキュリティヘッダー');
    lines.push('<IfModule mod_headers.c>');

    if (config.xFrameOptions !== 'none') {
      lines.push(`  Header always set X-Frame-Options "${config.xFrameOptions}"`);
    }
    if (config.xContentTypeOptions) {
      lines.push('  Header always set X-Content-Type-Options "nosniff"');
    }
    if (config.xssProtection) {
      lines.push('  Header always set X-XSS-Protection "1; mode=block"');
    }
    if (config.referrerPolicy) {
      lines.push(
        `  Header always set Referrer-Policy "${config.referrerPolicy}"`
      );
    }

    lines.push('</IfModule>');
  }

  return lines;
}

/**
 * カスタムエラーページセクションを生成する
 */
function buildErrorPagesSection(
  config: HtaccessConfig['errorPages']
): string[] {
  const lines: string[] = [];
  const has404 = config.e404.trim() !== '';
  const has500 = config.e500.trim() !== '';
  const has403 = config.e403.trim() !== '';

  if (!has404 && !has500 && !has403) return lines;

  lines.push('', '# ── カスタムエラーページ ─────────────────────────');

  if (has403) lines.push(`ErrorDocument 403 ${config.e403.trim()}`);
  if (has404) lines.push(`ErrorDocument 404 ${config.e404.trim()}`);
  if (has500) lines.push(`ErrorDocument 500 ${config.e500.trim()}`);

  return lines;
}

/**
 * .htaccess ファイルの内容を生成する
 *
 * @param config - .htaccess の設定
 * @returns 生成された .htaccess の文字列
 */
export function generateHtaccess(config: HtaccessConfig): string {
  const sections: string[][] = [
    buildBasicSection(config.basic),
    buildRedirectSection(config.redirect),
    buildCompressionSection(config.compression),
    buildCacheSection(config.cache),
    buildSecuritySection(config.security),
    buildErrorPagesSection(config.errorPages),
  ];

  return sections
    .flat()
    .join('\n')
    .trim();
}
