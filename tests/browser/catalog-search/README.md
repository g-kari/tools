# Catalog search browser regression

The fixture bundles the production catalog page, SearchModal, shared matcher, styles and TanStack Router links. Navigation stays in a memory history; it does not load tool services, ads or external data. The GET-only loopback server has a restrictive CSP, and every test rejects unexpected external requests and runtime errors.

Run `npx vite build --config tests/browser/catalog-search/vite.config.ts`, then `npx playwright test --config tests/browser/catalog-search/playwright.config.ts`.

Official Chromium runs at desktop 1280px and mobile-width 390px. This covers AND matching, width/kana normalization, category/path lookup, ordering/caps, keyboard clearing, normal navigation, synthetic IME key flags, empty-result recovery and repeated dismissal/reopening. It does not emulate a real OS IME, touch hardware, assistive technology, Firefox or WebKit.
