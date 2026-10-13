# CSV/JSON column-preservation browser regression

This fixture mounts the actual `/csv-json`, `/base64` or `/url-encode` route component and ToastProvider, with the real base, animation, shared-control and route styles. The component is selected only at those fixed paths. It avoids the application shell, Workers bindings and production hydration path. It is a client-component regression test, not an assertion about live production hydration.

Only synthetic CSV/JSON and URL strings are used. The server binds to `127.0.0.1:4195`, permits GET for exactly three built files (the index also has the fixed Base64 and URL route aliases) and sets a restrictive CSP. The browser blocks and fails on every attempted external request. No authentication, saved data, remote API, credential or account setting is needed.

Run from the repository root:

```sh
npx vp build --config tests/browser/csv-json/vite.config.ts
npx playwright test --config tests/browser/csv-json/playwright.config.ts
```

The `CSV JSON column preservation` workflow installs the lockfile dependencies, runs format/lint/type checks and the whole unit suite, builds the whole production app, checks TypeScript, builds this fixture, and runs the unchanged five CSV/JSON scenarios plus sixteen URL recovery scenarios on the exact PR head or main push SHA. It uploads the source SHA, browser JSON report, screenshots and any failure traces for one day.

Covered flows: later-only object columns, repeated conversion, mixed-row rejection and repair, duplicate headers and surplus cells across comma/tab/semicolon, headerless recovery with multiline values, empty-array errors, clear/focus and mobile mode switching. Full-app E2E counterparts remain in `tests/e2e/csv-json.spec.ts`; they are not run by this fixture workflow.

URL recovery is exercised independently at desktop and mobile widths: a successful result followed by three invalid percent sequences, three malformed UTF-16 code-unit arrays and empty encode/decode attempts. Every case starts in a fresh page, verifies the new error notification and old-output removal, preserves exact input, then repairs and clears with focus restored. Numeric UTF-16 injection and `charCodeAt` comparisons avoid normalization at the automation boundary. Screenshots wait for the real container opacity and error viewport position without changing animations. The full-app URL tests in `tests/e2e/url-encode.spec.ts` remain separate from the client fixture.

## Bounded real application URL check

After the unchanged client fixture, the same low-permission job starts the already-built application with `npm run preview` on `127.0.0.1:8788` and runs the original twelve plus eight recovery URL tests via `url-app.config.ts`. This uses the actual shell, server rendering and hydrated application, not the fixed component index. It keeps the fixture browser launch options, blocks service workers, grants no extra clipboard permission, and adds no sandbox-disabling flags. No account binding, secret, deployment or dependency change is needed. The existing ten-minute job timeout and all checks/build/client cases remain.

The URL test fixture aborts every external HTTP request before transmission. The known shell Google Fonts and AdSense origins are recorded as blocked attempts; any other external origin or page error fails the test. No raw request URLs or input values are included in the transport annotations. Consequently this checks the real shell with external HTTP resources blocked, fallback fonts and blocked ads, not live font/ad delivery or production traffic. The guard does not establish zero DNS/TCP/TLS preconnect traffic or zero preview-process egress. The real root declares preconnect hints for these origins. Console warning/error messages matching hydration mismatch diagnostics also fail the test. The JSON report and any failures are included in the same one-day artifact.

```sh
npm run build
CI=true WRANGLER_SEND_METRICS=false npx playwright test --config tests/browser/csv-json/url-app.config.ts
```

The `CSV JSON column preservation` workflow installs the lockfile dependencies, runs format/lint/type checks and the whole unit suite, builds the whole production app, checks TypeScript, builds this fixture, and runs five CSV/JSON plus six Base64 component Chromium scenarios followed by three full-app Base64 scenarios on the exact PR head or main push SHA. It uploads the source SHA, browser JSON report, screenshots and any failure traces for one day.

Covered flows: later-only object columns, repeated conversion, mixed-row rejection and repair, duplicate headers and surplus cells across comma/tab/semicolon, headerless recovery with multiline values, empty-array errors, clear/focus and mobile mode switching. Full-app E2E counterparts remain in `tests/e2e/csv-json.spec.ts`; they are not run by this fixture workflow.

## Base64 input-recovery validation

The same component fixture also mounts the actual `/base64` route and runs six input-recovery cases across desktop and mobile. It preserves the five CSV/JSON cases and the fixture's fixed file map, CSP and external-request rejection.

The workflow additionally runs the three existing `tests/e2e/base64-input-recovery.spec.ts` cases against the already-built full application through `vp preview` on loopback port 8788. This covers the real shell, SSR and hydrated input/error/repair operations, rather than interpreting the component fixture as the full application.

```sh
npm run build
npx playwright test --config tests/browser/csv-json/base64-app.config.ts
```

The app-specific transport blocks every external HTTP resource, records the known Google Fonts/ads origins without request paths, and fails on unknown origins, page errors or hydration warnings. Service workers stay blocked and no browser launch flags or clipboard grants are added. Root preconnect hints may still attempt DNS/TCP/TLS; HTTP interception does not establish process-wide network isolation. The app screenshots use a separate prefix so they do not overwrite the six component-fixture images. This local preview validation does not prove production traffic or live account behavior.
