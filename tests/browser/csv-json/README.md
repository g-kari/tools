# CSV/JSON column-preservation browser regression

This fixture mounts the actual `/csv-json`, `/base64`, `/url-encode`, `/csv-sql` or `/yaml-json` route component and ToastProvider, with the real base, animation, shared-control and route styles. The component is selected only at those fixed paths. It avoids the application shell, Workers bindings and production hydration path. It is a client-component regression test, not an assertion about live production hydration.

Only synthetic conversion strings are used. The server binds to `127.0.0.1:4195`, permits GET for exactly three built files (the index also has the fixed Base64, URL, CSV SQL and YAML/JSON route aliases) and sets a restrictive CSP. The browser blocks and fails on every attempted external request. No authentication, saved data, remote API, credential or account setting is needed.

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

## CSV SQL malformed-quote recovery

The same component fixture adds six CSV SQL cases: unclosed quoted fields, bare quotes in unquoted fields and characters after closing quotes, each at desktop (1280px) and mobile (390px) widths. Every case starts with valid SQL, then checks a visible accessible alert with record/column coordinates, retained exact input and focus, absent SQL/statistics and disabled Copy. Corrected quoted commas, multiline content, escaped quotes and a terminal empty cell restore SQL/statistics/Copy; clear removes input and output again. The component transport rejects every attempted external request.

The existing read-only workflow also runs all fourteen original `csv-sql.spec.ts` cases and the six quote-recovery cases against the built application through `csv-sql-app.config.ts`. All twenty use the same external-HTTP-blocking transport as the URL checks, including page-error and hydration-warning checks. Known shell fonts/ads attempts are aborted and recorded; unknown origins fail. The same preconnect/process-egress caveat applies. Component and full-app screenshots use separate prefixes.

```sh
npx vp build --config tests/browser/csv-json/vite.config.ts
npx playwright test --config tests/browser/csv-json/playwright.config.ts
npm run build
npx playwright test --config tests/browser/csv-json/csv-sql-app.config.ts
```

## YAML/JSON failure recovery

The same workflow and component fixture run 22 YAML/JSON cases at desktop (1280px) and mobile (390px) widths. They seed a successful result before syntax errors in both directions, empty/whitespace attempts, comment-only/null YAML and a small cyclic YAML value that fails JSON serialization. They check exact input retention, focus, disabled Copy, cleared output, an input-associated persistent alert after the toast disappears, successful repair and Clear. Syntax-error screenshots and the JSON report are included in the existing one-day artifact; the screenshots also check horizontal overflow.

The mode/indent/Copy component cases observe writes at a synthetic Clipboard API boundary, without extra browser permissions or changes to the shared clipboard hook. They verify the repaired output is passed to Copy and the disabled button cannot write. This fixture does not prove native clipboard permissions or real-app hydration.

The workflow additionally runs all thirteen original plus twenty-two recovery cases in `tests/e2e/yaml-json.spec.ts` through `yaml-json-app.config.ts` against the production build on loopback. These use the existing external-HTTP, page-error and hydration guard. The app-only configuration grants Chromium clipboard read/write permissions for the existing real Clipboard API assertions; component fixtures keep their synthetic clipboard boundary. The existing runner, time budget, permissions and sandbox flags are unchanged. No dependency or deployment configuration changes.

## XML/JSON full-application validation

The workflow runs all 21 cases in `tests/e2e/xml-json.spec.ts` through `xml-json-app.config.ts` against the production build on loopback. The unmodified functional assertions include escaped attribute values and repeated conversion, CDATA, mixed content and invalid-input recovery. The shared full-app transport rejects unexpected external origins, page errors and hydration warnings; known fonts and ad HTTP requests are blocked and recorded. Service workers remain blocked and no extra browser permissions or launch flags are added. These are executed browser cases, not a manual UI checklist; a run must succeed before it is reported as passed.

## Generated password strength snapshot

The bounded real-route component fixture also mounts `/password-generator`. Two desktop/mobile Chromium cases preserve the generated output, strength and synthetic Clipboard API call target while changing next-generation character types and length, then verify regeneration, clear and the minimum length. External HTTP is blocked and every attempted origin/page error fails. Generated values are disposable synthetic test values; no saved credential is read. Clipboard writes are intercepted, so native OS clipboard and the full application shell/SSR are not verified by these two cases. Workflow permissions, browser flags and service isolation are unchanged.

## Global navigation focus baseline

The existing normal workflow first runs twenty navigation-focus scenarios (ten flows at 1280px and 390px) through `navigation-focus-app.config.ts` against the actual built shell and `/env-parser` route. They cover pointer hover with retained input and selection, pointer Clear after tab changes, keyboard navigation/Escape/Tab with a different category under the pointer, and keyboard activation of a hover-open menu followed by real route navigation. They wait for the route's own initial input-focus effect before filling, do not force input focus, and type with `page.keyboard` to verify the actual current target. The unchanged full-app transport blocks external HTTP and fails unknown origins, page errors and hydration warnings; the existing preconnect/process-egress caveat applies. No extra permissions, flags, retry or time budget is added.

The initial diagnostic PR intentionally retains the exact main application source. A failed baseline is not a fix or a browser pass. This is separate from PR314's YAML serialization and from the unresolved pre-readiness input observation. Required final verification follows any later production change. Narrow viewport is not real mobile-device validation.

The unchanged-main baseline at head `331840a6` / tree `5fa3dbf3` ran under the usual pull-request workflow: all 377 files / 11,627 unit tests, quality checks, production build and standalone TypeScript passed; the eight original real-app cases had six failures and two passes. Hover replaced input focus, replaced another menu link's focus, and replaced its trigger's focus at both widths. Both Clear probes passed, so the earlier scroll-specific conditions were not independently reproduced. The native report, screenshots, traces and source SHA were matched to artifact 12227215278 (SHA-256 `8f4272042c0e925e454f41be4184f3627758b0111d0be4a197a52c5bb0338bc0`). A failed baseline is not a fix-verification pass.

The candidate adds hover-open Space/ArrowDown activation, direct native Tab/Shift+Tab exit, pointer leave/re-entry timer protection and click-toggle/blur recovery. The timer case waits for the other pointer-only menu's actual closure rather than sleeping. Native keyboard destination assertions use `page.keyboard`, not locator-driven focus. The original eight case assertions remain, with the Clear title narrowed to the behavior actually observed. Success screenshots record retained input focus at both widths. These do not establish screen-reader, touch-device, production-hydration or pre-readiness input preservation.
