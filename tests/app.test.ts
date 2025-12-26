import { describe, it, expect } from 'vitest';
import app from '../src/app';

describe('Hono App - Main Routes', () => {
  describe('GET /', () => {
    it('should return 200 status code for root path', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
    });

    it('should return HTML content type for root path', async () => {
      const res = await app.request('/');
      expect(res.headers.get('content-type')).toContain('text/html');
    });

    it('should return the Unicode converter page with correct title', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('Unicode エスケープ変換ツール');
    });

    it('should include the main converter form', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('id="inputText"');
      expect(html).toContain('id="outputText"');
    });

    it('should include all three action buttons', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('Unicode エスケープに変換');
      expect(html).toContain('Unicode から復元');
      expect(html).toContain('クリア');
    });

    it('should include Material Design color system variables', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('--md-sys-color-surface');
      expect(html).toContain('--md-sys-color-primary');
      expect(html).toContain('#ffffef');
    });

    it('should include accessibility features - skip link', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('skip-link');
      expect(html).toContain('メインコンテンツへスキップ');
    });

    it('should include ARIA labels for accessibility', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('role="banner"');
      expect(html).toContain('role="main"');
      expect(html).toContain('aria-label');
      expect(html).toContain('aria-live="polite"');
    });

    it('should include the toUnicodeEscape function', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('function toUnicodeEscape');
    });

    it('should include the fromUnicodeEscape function', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('function fromUnicodeEscape');
    });

    it('should include keyboard shortcut handling', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('Ctrl+Enter');
      expect(html).toContain('keydown');
    });

    it('should include proper meta tags for mobile', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include Google Fonts preconnect', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('fonts.googleapis.com');
      expect(html).toContain('fonts.gstatic.com');
    });

    it('should include Roboto font family', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('Roboto');
    });

    it('should have proper language attribute', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('lang="ja"');
    });

    it('should include usage instructions', async () => {
      const res = await app.request('/');
      const html = await res.text();
      expect(html).toContain('使い方');
      expect(html).toContain('入力テキスト');
    });
  });
});

describe('Hono App - 404 Not Found Handler', () => {
  describe('404 handler basics', () => {
    it('should return 404 status code for undefined routes', async () => {
      const res = await app.request('/nonexistent-route');
      expect(res.status).toBe(404);
    });

    it('should return 404 for deeply nested undefined routes', async () => {
      const res = await app.request('/some/deep/path/that/does/not/exist');
      expect(res.status).toBe(404);
    });

    it('should return HTML content type for 404 page', async () => {
      const res = await app.request('/not-found');
      expect(res.headers.get('content-type')).toContain('text/html');
    });

    it('should return 404 page content', async () => {
      const res = await app.request('/undefined-path');
      const html = await res.text();
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(0);
    });
  });

  describe('404 page content validation', () => {
    it('should display "404" heading', async () => {
      const res = await app.request('/missing');
      const html = await res.text();
      expect(html).toContain('<h1>404</h1>');
    });

    it('should display Japanese error message', async () => {
      const res = await app.request('/not-here');
      const html = await res.text();
      expect(html).toContain('ページが見つかりません');
    });

    it('should include explanation text', async () => {
      const res = await app.request('/wrong-path');
      const html = await res.text();
      expect(html).toContain('お探しのページは存在しないか、移動した可能性があります');
    });

    it('should include link back to home', async () => {
      const res = await app.request('/bad-url');
      const html = await res.text();
      expect(html).toContain('ホームに戻る');
      expect(html).toContain('href="/"');
    });

    it('should have proper page title', async () => {
      const res = await app.request('/nowhere');
      const html = await res.text();
      expect(html).toContain('<title>404 - ページが見つかりません</title>');
    });

    it('should have proper language attribute', async () => {
      const res = await app.request('/invalid');
      const html = await res.text();
      expect(html).toContain('lang="ja"');
    });

    it('should have proper DOCTYPE', async () => {
      const res = await app.request('/fake-route');
      const html = await res.text();
      expect(html).toContain('<!DOCTYPE html>');
    });
  });

  describe('404 page styling and design', () => {
    it('should include Material Design color variables', async () => {
      const res = await app.request('/nope');
      const html = await res.text();
      expect(html).toContain('--md-sys-color-surface');
      expect(html).toContain('--md-sys-color-primary');
      expect(html).toContain('#ffffef');
      expect(html).toContain('#8b6914');
    });

    it('should include consistent color palette with main page', async () => {
      const res = await app.request('/xyz');
      const html = await res.text();
      expect(html).toContain('--md-sys-color-on-surface: #1c1b1e');
      expect(html).toContain('--md-sys-color-on-surface-variant: #49454e');
    });

    it('should use Roboto font family', async () => {
      const res = await app.request('/404-test');
      const html = await res.text();
      expect(html).toContain('Roboto');
      expect(html).toContain('fonts.googleapis.com');
    });

    it('should include responsive styling', async () => {
      const res = await app.request('/mobile-test');
      const html = await res.text();
      expect(html).toContain('min-height: 100vh');
      expect(html).toContain('flex');
    });

    it('should have centered layout', async () => {
      const res = await app.request('/centered');
      const html = await res.text();
      expect(html).toContain('display: flex');
      expect(html).toContain('align-items: center');
      expect(html).toContain('justify-content: center');
    });

    it('should style the container appropriately', async () => {
      const res = await app.request('/container-test');
      const html = await res.text();
      expect(html).toContain('text-align: center');
      expect(html).toContain('border-radius: 8px');
      expect(html).toContain('max-width: 500px');
    });

    it('should style the heading with large font', async () => {
      const res = await app.request('/heading-test');
      const html = await res.text();
      expect(html).toContain('font-size: 4rem');
      expect(html).toContain('font-weight: 300');
    });

    it('should style the link with primary color', async () => {
      const res = await app.request('/link-test');
      const html = await res.text();
      expect(html).toContain('background: var(--md-sys-color-primary)');
      expect(html).toContain('color: var(--md-sys-color-on-primary)');
    });

    it('should include hover effects', async () => {
      const res = await app.request('/hover-test');
      const html = await res.text();
      expect(html).toContain('opacity: 0.85');
      expect(html).toContain(':hover');
    });

    it('should include focus-visible styles for accessibility', async () => {
      const res = await app.request('/focus-test');
      const html = await res.text();
      expect(html).toContain(':focus-visible');
      expect(html).toContain('outline: 3px solid');
    });
  });

  describe('404 page accessibility', () => {
    it('should include semantic HTML with main role', async () => {
      const res = await app.request('/semantic-test');
      const html = await res.text();
      expect(html).toContain('role="main"');
      expect(html).toContain('<main');
    });

    it('should have proper meta viewport for mobile', async () => {
      const res = await app.request('/viewport-test');
      const html = await res.text();
      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width, initial-scale=1.0');
    });

    it('should use UTF-8 charset', async () => {
      const res = await app.request('/charset-test');
      const html = await res.text();
      expect(html).toContain('charset="UTF-8"');
    });

    it('should have preconnect for fonts to improve performance', async () => {
      const res = await app.request('/preconnect-test');
      const html = await res.text();
      expect(html).toContain('rel="preconnect"');
      expect(html).toContain('fonts.gstatic.com');
    });

    it('should include crossorigin attribute for font preconnect', async () => {
      const res = await app.request('/crossorigin-test');
      const html = await res.text();
      expect(html).toContain('crossorigin');
    });
  });

  describe('404 edge cases and various paths', () => {
    it('should handle paths with special characters', async () => {
      const res = await app.request('/path-with-!@#$%');
      expect(res.status).toBe(404);
    });

    it('should handle paths with spaces (encoded)', async () => {
      const res = await app.request('/path%20with%20spaces');
      expect(res.status).toBe(404);
    });

    it('should handle paths with Unicode characters', async () => {
      const res = await app.request('/日本語/パス');
      expect(res.status).toBe(404);
    });

    it('should handle very long paths', async () => {
      const longPath = '/' + 'a'.repeat(1000);
      const res = await app.request(longPath);
      expect(res.status).toBe(404);
    });

    it('should handle paths with query parameters', async () => {
      const res = await app.request('/notfound?query=param&foo=bar');
      expect(res.status).toBe(404);
    });

    it('should handle paths with fragments', async () => {
      const res = await app.request('/notfound#section');
      expect(res.status).toBe(404);
    });

    it('should handle paths with trailing slashes', async () => {
      const res = await app.request('/notfound/');
      expect(res.status).toBe(404);
    });

    it('should handle multiple consecutive slashes', async () => {
      const res = await app.request('///multiple///slashes///');
      expect(res.status).toBe(404);
    });

    it('should handle uppercase paths', async () => {
      const res = await app.request('/UPPERCASE/PATH');
      expect(res.status).toBe(404);
    });

    it('should handle mixed case paths', async () => {
      const res = await app.request('/MiXeD/CaSe/PaTh');
      expect(res.status).toBe(404);
    });

    it('should handle paths with dots', async () => {
      const res = await app.request('/path/with/dots.../test');
      expect(res.status).toBe(404);
    });

    it('should handle relative path attempts', async () => {
      const res = await app.request('/../../../etc/passwd');
      expect(res.status).toBe(404);
    });

    it('should handle API-like paths', async () => {
      const res = await app.request('/api/v1/users/123');
      expect(res.status).toBe(404);
    });

    it('should handle file extension paths', async () => {
      const res = await app.request('/file.txt');
      expect(res.status).toBe(404);
    });

    it('should handle paths that look like hidden files', async () => {
      const res = await app.request('/.env');
      expect(res.status).toBe(404);
    });
  });

  describe('HTTP method support on 404', () => {
    it('should return 404 for POST to undefined route', async () => {
      const res = await app.request('/undefined', { method: 'POST' });
      expect(res.status).toBe(404);
    });

    it('should return 404 for PUT to undefined route', async () => {
      const res = await app.request('/undefined', { method: 'PUT' });
      expect(res.status).toBe(404);
    });

    it('should return 404 for DELETE to undefined route', async () => {
      const res = await app.request('/undefined', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('should return 404 for PATCH to undefined route', async () => {
      const res = await app.request('/undefined', { method: 'PATCH' });
      expect(res.status).toBe(404);
    });

    it('should return 404 for HEAD to undefined route', async () => {
      const res = await app.request('/undefined', { method: 'HEAD' });
      expect(res.status).toBe(404);
    });

    it('should return 404 for OPTIONS to undefined route', async () => {
      const res = await app.request('/undefined', { method: 'OPTIONS' });
      expect(res.status).toBe(404);
    });
  });

  describe('404 handler integration', () => {
    it('should not affect valid routes', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
    });

    it('should properly distinguish between valid and invalid routes', async () => {
      const validRes = await app.request('/');
      const invalidRes = await app.request('/invalid');
      
      expect(validRes.status).toBe(200);
      expect(invalidRes.status).toBe(404);
    });

    it('should serve different content for home vs 404', async () => {
      const homeRes = await app.request('/');
      const notFoundRes = await app.request('/404');
      
      const homeHtml = await homeRes.text();
      const notFoundHtml = await notFoundRes.text();
      
      expect(homeHtml).not.toBe(notFoundHtml);
      expect(homeHtml).toContain('Unicode エスケープ変換ツール');
      expect(notFoundHtml).toContain('ページが見つかりません');
    });

    it('should maintain consistent branding across pages', async () => {
      const homeRes = await app.request('/');
      const notFoundRes = await app.request('/missing');
      
      const homeHtml = await homeRes.text();
      const notFoundHtml = await notFoundRes.text();
      
      // Both should use the same color scheme
      expect(homeHtml).toContain('#ffffef');
      expect(notFoundHtml).toContain('#ffffef');
      expect(homeHtml).toContain('#8b6914');
      expect(notFoundHtml).toContain('#8b6914');
    });

    it('should maintain consistent font loading across pages', async () => {
      const homeRes = await app.request('/');
      const notFoundRes = await app.request('/nowhere');
      
      const homeHtml = await homeRes.text();
      const notFoundHtml = await notFoundRes.text();
      
      // Both should load Roboto
      expect(homeHtml).toContain('Roboto');
      expect(notFoundHtml).toContain('Roboto');
    });
  });

  describe('Response consistency', () => {
    it('should return same 404 page for different invalid paths', async () => {
      const res1 = await app.request('/path1');
      const res2 = await app.request('/path2');
      const res3 = await app.request('/completely/different/path');
      
      const html1 = await res1.text();
      const html2 = await res2.text();
      const html3 = await res3.text();
      
      expect(html1).toBe(html2);
      expect(html2).toBe(html3);
    });

    it('should consistently return HTML content type', async () => {
      const paths = ['/a', '/b', '/c/d/e', '/xyz123'];
      
      for (const path of paths) {
        const res = await app.request(path);
        expect(res.headers.get('content-type')).toContain('text/html');
      }
    });

    it('should consistently return 404 status', async () => {
      const paths = ['/test1', '/test2', '/foo/bar', '/api/test'];
      
      for (const path of paths) {
        const res = await app.request(path);
        expect(res.status).toBe(404);
      }
    });
  });
});

describe('Hono App - WHOIS Page', () => {
  describe('GET /whois', () => {
    it('should return 200 status code for whois path', async () => {
      const res = await app.request('/whois');
      expect(res.status).toBe(200);
    });

    it('should return HTML content type for whois path', async () => {
      const res = await app.request('/whois');
      expect(res.headers.get('content-type')).toContain('text/html');
    });

    it('should return the WHOIS page with correct title', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('WHOIS検索ツール');
    });

    it('should include the domain input field', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('id="domainInput"');
    });

    it('should include the search button', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('btn-search');
      expect(html).toContain('検索');
    });

    it('should include Material Design color system variables', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('--md-sys-color-surface');
      expect(html).toContain('--md-sys-color-primary');
    });

    it('should include accessibility features - skip link', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('skip-link');
      expect(html).toContain('メインコンテンツへスキップ');
    });

    it('should include ARIA labels for accessibility', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('role="banner"');
      expect(html).toContain('role="main"');
      expect(html).toContain('aria-label');
    });

    it('should include the searchWhois function', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('function searchWhois');
    });

    it('should include usage instructions', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('使い方');
      expect(html).toContain('ドメイン名');
    });

    it('should have navigation links', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('nav-links');
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/whois"');
    });

    it('should have proper language attribute', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('lang="ja"');
    });

    it('should include proper meta tags for mobile', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include Google Fonts preconnect', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('fonts.googleapis.com');
      expect(html).toContain('fonts.gstatic.com');
    });

    it('should include Roboto font family', async () => {
      const res = await app.request('/whois');
      const html = await res.text();
      expect(html).toContain('Roboto');
    });
  });
});

describe('Hono App - WHOIS API', () => {
  describe('GET /api/whois', () => {
    it('should return 400 when domain parameter is missing', async () => {
      const res = await app.request('/api/whois');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('domain parameter is required');
    });

    it('should return 400 for invalid domain format', async () => {
      const res = await app.request('/api/whois?domain=invalid');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('無効なドメイン形式です');
    });

    it('should return 400 for domain with invalid characters', async () => {
      const res = await app.request('/api/whois?domain=test@domain.com');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('無効なドメイン形式です');
    });

    it('should return 400 for domain starting with hyphen', async () => {
      const res = await app.request('/api/whois?domain=-example.com');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('無効なドメイン形式です');
    });

    it('should return JSON content type', async () => {
      const res = await app.request('/api/whois?domain=example.com');
      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('should accept valid domain format', async () => {
      // This test just checks that a valid format passes validation
      // The actual RDAP query may succeed or fail depending on network
      const res = await app.request('/api/whois?domain=example.com');
      // Should not be 400 (bad request) - could be 200 or 404 depending on RDAP
      expect(res.status).not.toBe(400);
    });

    it('should accept subdomain format', async () => {
      const res = await app.request('/api/whois?domain=sub.example.com');
      // Should pass validation (not 400)
      expect(res.status).not.toBe(400);
    });
  });
});

describe('Navigation - Main page has nav links', () => {
  it('should have navigation links on main page', async () => {
    const res = await app.request('/');
    const html = await res.text();
    expect(html).toContain('nav-links');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/whois"');
  });

  it('should have Unicode変換 link marked as active on main page', async () => {
    const res = await app.request('/');
    const html = await res.text();
    expect(html).toContain('<a href="/" class="active">Unicode変換</a>');
  });

  it('should have WHOIS検索 link marked as active on whois page', async () => {
    const res = await app.request('/whois');
    const html = await res.text();
    expect(html).toContain('<a href="/whois" class="active">WHOIS検索</a>');
  });
});

describe('App export', () => {
  it('should export the Hono app instance', () => {
    expect(app).toBeDefined();
    expect(typeof app.request).toBe('function');
  });

  it('should be a valid Hono instance with fetch method', () => {
    expect(typeof app.fetch).toBe('function');
  });

  it('should have route registration methods', () => {
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
  });

  it('should have notFound method', () => {
    expect(typeof app.notFound).toBe('function');
  });
});