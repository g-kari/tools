import { describe, it, expect } from "vite-plus/test";
import {
  generateHtaccess,
  getDefaultConfig,
  type HtaccessConfig,
} from "../../app/utils/htaccess-builder";

describe("htaccess-builder", () => {
  describe("getDefaultConfig", () => {
    it("デフォルト設定を返す", () => {
      const config = getDefaultConfig();
      expect(config.basic.charset).toBe("UTF-8");
      expect(config.redirect.httpsRedirect).toBe(true);
      expect(config.redirect.wwwRedirect).toBe("none");
      expect(config.cache.enabled).toBe(true);
      expect(config.compression.enabled).toBe(true);
      expect(config.security.blockHtaccess).toBe(true);
    });
  });

  describe("generateHtaccess - 基本設定", () => {
    it("DirectoryIndex を出力する", () => {
      const config = getDefaultConfig();
      config.basic.directoryIndex = "index.html";
      const result = generateHtaccess(config);
      expect(result).toContain("DirectoryIndex index.html");
    });

    it("Options -Indexes を出力する", () => {
      const config = getDefaultConfig();
      config.basic.options.noIndexes = true;
      const result = generateHtaccess(config);
      expect(result).toContain("-Indexes");
    });

    it("Options +FollowSymLinks を出力する", () => {
      const config = getDefaultConfig();
      config.basic.options.followSymLinks = true;
      const result = generateHtaccess(config);
      expect(result).toContain("+FollowSymLinks");
    });

    it("AddDefaultCharset を出力する", () => {
      const config = getDefaultConfig();
      config.basic.charset = "UTF-8";
      const result = generateHtaccess(config);
      expect(result).toContain("AddDefaultCharset UTF-8");
    });

    it("Indexes を含めない設定が正しく動作する", () => {
      const config = getDefaultConfig();
      config.basic.options.noIndexes = false;
      const result = generateHtaccess(config);
      expect(result).not.toContain("-Indexes");
    });
  });

  describe("generateHtaccess - HTTPS リダイレクト", () => {
    it("HTTPS リダイレクトを出力する", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = true;
      const result = generateHtaccess(config);
      expect(result).toContain("RewriteEngine On");
      expect(result).toContain("RewriteCond %{HTTPS} off");
      expect(result).toContain("https://%{HTTP_HOST}%{REQUEST_URI}");
      expect(result).toContain("[R=301,L]");
    });

    it("HTTPS リダイレクトをスキップする", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "none";
      config.redirect.customRedirects = [];
      const result = generateHtaccess(config);
      expect(result).not.toContain("HTTPS");
    });
  });

  describe("generateHtaccess - www リダイレクト", () => {
    it("www を追加するリダイレクトを出力する", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "add-www";
      const result = generateHtaccess(config);
      expect(result).toContain("RewriteCond %{HTTP_HOST} !^www\\.");
      expect(result).toContain("www.%{HTTP_HOST}");
    });

    it("www を削除するリダイレクトを出力する", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "remove-www";
      const result = generateHtaccess(config);
      expect(result).toContain("RewriteCond %{HTTP_HOST} ^www\\.");
    });

    it("www リダイレクトなしの設定が正しく動作する", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "none";
      config.redirect.customRedirects = [];
      const result = generateHtaccess(config);
      expect(result).not.toContain("www.");
    });
  });

  describe("generateHtaccess - カスタムリダイレクト", () => {
    it("301 リダイレクトを出力する", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "none";
      config.redirect.customRedirects = [
        { from: "/old", to: "https://example.com/new", type: "301" },
      ];
      const result = generateHtaccess(config);
      expect(result).toContain("Redirect 301 /old https://example.com/new");
    });

    it("302 リダイレクトを出力する", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "none";
      config.redirect.customRedirects = [
        { from: "/temp", to: "https://example.com/", type: "302" },
      ];
      const result = generateHtaccess(config);
      expect(result).toContain("Redirect 302 /temp https://example.com/");
    });

    it("from または to が空のリダイレクトを出力しない", () => {
      const config = getDefaultConfig();
      config.redirect.httpsRedirect = false;
      config.redirect.wwwRedirect = "none";
      config.redirect.customRedirects = [{ from: "", to: "https://example.com/", type: "301" }];
      const result = generateHtaccess(config);
      expect(result).not.toContain("Redirect 301");
    });
  });

  describe("generateHtaccess - キャッシュ制御", () => {
    it("キャッシュ制御セクションを出力する", () => {
      const config = getDefaultConfig();
      config.cache.enabled = true;
      const result = generateHtaccess(config);
      expect(result).toContain("mod_expires.c");
      expect(result).toContain("ExpiresActive On");
    });

    it("キャッシュ期間を含む設定を出力する", () => {
      const config = getDefaultConfig();
      config.cache.enabled = true;
      config.cache.images = "1 month";
      const result = generateHtaccess(config);
      expect(result).toContain("access plus 1 month");
    });

    it("キャッシュ無効時はキャッシュセクションを出力しない", () => {
      const config = getDefaultConfig();
      config.cache.enabled = false;
      const result = generateHtaccess(config);
      expect(result).not.toContain("mod_expires.c");
    });
  });

  describe("generateHtaccess - GZIP 圧縮", () => {
    it("GZIP 圧縮セクションを出力する", () => {
      const config = getDefaultConfig();
      config.compression.enabled = true;
      const result = generateHtaccess(config);
      expect(result).toContain("mod_deflate.c");
      expect(result).toContain("DEFLATE");
    });

    it("GZIP 無効時は圧縮セクションを出力しない", () => {
      const config = getDefaultConfig();
      config.compression.enabled = false;
      const result = generateHtaccess(config);
      expect(result).not.toContain("mod_deflate.c");
    });
  });

  describe("generateHtaccess - セキュリティ", () => {
    it(".htaccess へのアクセス禁止を出力する", () => {
      const config = getDefaultConfig();
      config.security.blockHtaccess = true;
      const result = generateHtaccess(config);
      expect(result).toContain('<Files ".htaccess">');
      expect(result).toContain("Require all denied");
    });

    it("機密ファイルへのアクセス禁止を出力する", () => {
      const config = getDefaultConfig();
      config.security.blockSensitiveFiles = true;
      const result = generateHtaccess(config);
      expect(result).toContain("FilesMatch");
      expect(result).toContain("env");
    });

    it("X-Frame-Options を出力する", () => {
      const config = getDefaultConfig();
      config.security.xFrameOptions = "DENY";
      const result = generateHtaccess(config);
      expect(result).toContain('X-Frame-Options "DENY"');
    });

    it("X-Frame-Options が none の場合は出力しない", () => {
      const config = getDefaultConfig();
      config.security.xFrameOptions = "none";
      const result = generateHtaccess(config);
      expect(result).not.toContain("X-Frame-Options");
    });

    it("X-Content-Type-Options を出力する", () => {
      const config = getDefaultConfig();
      config.security.xContentTypeOptions = true;
      const result = generateHtaccess(config);
      expect(result).toContain('X-Content-Type-Options "nosniff"');
    });

    it("X-XSS-Protection を出力する", () => {
      const config = getDefaultConfig();
      config.security.xssProtection = true;
      const result = generateHtaccess(config);
      expect(result).toContain('X-XSS-Protection "1; mode=block"');
    });

    it("Referrer-Policy を出力する", () => {
      const config = getDefaultConfig();
      config.security.referrerPolicy = "no-referrer";
      const result = generateHtaccess(config);
      expect(result).toContain('Referrer-Policy "no-referrer"');
    });

    it("ServerSignature Off を出力する", () => {
      const config = getDefaultConfig();
      config.security.serverSignature = true;
      const result = generateHtaccess(config);
      expect(result).toContain("ServerSignature Off");
    });

    it("ETag 無効化を出力する", () => {
      const config = getDefaultConfig();
      config.security.noEtag = true;
      const result = generateHtaccess(config);
      expect(result).toContain("FileETag None");
    });
  });

  describe("generateHtaccess - カスタムエラーページ", () => {
    it("404 エラーページを出力する", () => {
      const config = getDefaultConfig();
      config.errorPages.e404 = "/404.html";
      const result = generateHtaccess(config);
      expect(result).toContain("ErrorDocument 404 /404.html");
    });

    it("500 エラーページを出力する", () => {
      const config = getDefaultConfig();
      config.errorPages.e500 = "/500.html";
      const result = generateHtaccess(config);
      expect(result).toContain("ErrorDocument 500 /500.html");
    });

    it("403 エラーページを出力する", () => {
      const config = getDefaultConfig();
      config.errorPages.e403 = "/403.html";
      const result = generateHtaccess(config);
      expect(result).toContain("ErrorDocument 403 /403.html");
    });

    it("エラーページが未設定の場合は出力しない", () => {
      const config = getDefaultConfig();
      config.errorPages.e404 = "";
      config.errorPages.e500 = "";
      config.errorPages.e403 = "";
      const result = generateHtaccess(config);
      expect(result).not.toContain("ErrorDocument");
    });
  });

  describe("generateHtaccess - 出力形式", () => {
    it("前後の空白が除去されている", () => {
      const config: HtaccessConfig = {
        basic: {
          directoryIndex: "index.html",
          options: { noIndexes: false, followSymLinks: false },
          charset: "",
        },
        redirect: {
          httpsRedirect: false,
          wwwRedirect: "none",
          customRedirects: [],
        },
        cache: {
          enabled: false,
          images: "1 month",
          cssJs: "1 week",
          html: "1 day",
          fonts: "1 year",
        },
        security: {
          blockHtaccess: false,
          blockSensitiveFiles: false,
          xFrameOptions: "none",
          xContentTypeOptions: false,
          xssProtection: false,
          referrerPolicy: "",
          serverSignature: false,
          noEtag: false,
        },
        errorPages: { e404: "", e500: "", e403: "" },
        compression: { enabled: false },
      };
      const result = generateHtaccess(config);
      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });
});
