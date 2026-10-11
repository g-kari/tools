# CSV/JSON column-preservation browser regression

This fixture mounts the actual `/csv-json` or `/url-encode` route component and ToastProvider, with the real base, animation, shared-control and CSV/JSON/copy-button styles. The URL component is selected only at the fixed `/url-encode` path. It avoids the application shell, Workers bindings and production hydration path. It is a client-component regression test, not an assertion about live production hydration.

Only synthetic CSV/JSON and URL strings are used. The server binds to `127.0.0.1:4195`, permits GET for exactly three built files (the index also has the fixed URL-route alias) and sets a restrictive CSP. The browser blocks and fails on every attempted external request. No authentication, saved data, remote API, credential or account setting is needed.

Run from the repository root:

```sh
npx vp build --config tests/browser/csv-json/vite.config.ts
npx playwright test --config tests/browser/csv-json/playwright.config.ts
```

The `CSV JSON column preservation` workflow installs the lockfile dependencies, runs format/lint/type checks and the whole unit suite, builds the whole production app, checks TypeScript, builds this fixture, and runs the unchanged five CSV/JSON scenarios plus sixteen URL recovery scenarios on the exact PR head or main push SHA. It uploads the source SHA, browser JSON report, screenshots and any failure traces for one day.

Covered flows: later-only object columns, repeated conversion, mixed-row rejection and repair, duplicate headers and surplus cells across comma/tab/semicolon, headerless recovery with multiline values, empty-array errors, clear/focus and mobile mode switching. Full-app E2E counterparts remain in `tests/e2e/csv-json.spec.ts`; they are not run by this fixture workflow.

URL recovery is exercised independently at desktop and mobile widths: a successful result followed by three invalid percent sequences, three malformed UTF-16 code-unit arrays and empty encode/decode attempts. Every case starts in a fresh page, verifies the new error notification and old-output removal, preserves exact input, then repairs and clears with focus restored. Numeric UTF-16 injection and `charCodeAt` comparisons avoid normalization at the automation boundary. Screenshots wait for the real container opacity and error viewport position without changing animations. The full-app URL tests in `tests/e2e/url-encode.spec.ts` remain separate and are not executed by this fixture workflow.
