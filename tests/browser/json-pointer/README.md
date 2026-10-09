# JSON Pointer exact-resolution browser regression

The fixture bundles the production `/json-pointer` component, ToastProvider and real base/animation/control/JSON Pointer styles. It uses the same assertions as the full-app Playwright regression spec. It excludes the application shell, Workers bindings, ads and external services. It checks client-component behavior rather than production SSR hydration.

Only synthetic JSON is used. The GET-only server binds to `127.0.0.1:4197`, serves three fixed built assets and maps `/json-pointer` to its fixture page. A restrictive CSP disables connections and external resources. Browser tests reject every attempted external request and JavaScript runtime error. No secrets, login, saved data or new persistent permissions are required.

Run from the repository root:

```sh
npx vite build --config tests/browser/json-pointer/vite.config.ts
npx playwright test --config tests/browser/json-pointer/playwright.config.ts
```

The `JSON Pointer exact-resolution browser regression` workflow checks the exact PR head or main push SHA. It installs locked dependencies, builds the production app, checks TypeScript, builds the fixture and runs the two scenarios at desktop 1280px and mobile-width 390px. It retains the source SHA, JSON report, final screenshots and failure traces for one day.

Covered behavior: invalid and repeated array indices, stale-output clearing, copy disabling, input preservation, keyboard recovery, inherited-member rejection, malformed-escape rejection and actual special/empty keys. Mobile-width Chromium is a layout check; it does not emulate touch hardware, a native IME, assistive technology, Firefox or WebKit.
