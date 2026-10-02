# Production hydration diagnostic

This is a bounded diagnostic of the shared Base64 application shell. It does not
change product code, production settings, or client entry behavior.

## Question and stopping condition

The cloud browser reported five React hydration errors (`#418`) and one
client-render fallback (`#423`) on Base64 and emoji conversion. Source-only and
exact-owned-bundle DOM replays passed, but those are not real Chromium evidence.

The hosted test answers whether generated equivalent SSR hydrates the exact
production entry and Base64 lazy-chunk graph in an isolated real Chromium. Stop
at a reproducible first host-node difference or an explicit technical limit.
Passing this test does not establish that live third-party or extension scripts
are harmless, or that a user-facing hydration problem has been fixed.

A single additional case reads the normal public production Base64 response at
runtime in a fresh native Chromium context. It rejects redirects, failed or
blocked responses, invalid encoding, and unexpected source markers. HTML,
headers, cookies, and observed external resource URLs remain in memory. The
same pinned client and first-difference detector are used for comparison.

## Snapshot provenance

- Application source: commit `23fb251f1e6a65c299f14902ef4ccc070f6fa28a`
- Production entry: `/assets/main-VJyew4IJ.js`
- Active lazy route: `/assets/base64-pNp3AUSU.js`
- `owned-assets.json`: static route asset metadata, 43 public owned JS pins, and
  exact source-blob pins for the generated SSR graph, client/router, and packages

Each owned JS file is read only from `https://tools.0g0.xyz`, checked against its
exact byte length and SHA-256, and cached outside tracked source. Redirects,
HTTP failures, content-type changes, oversized responses, and changed bytes stop
the diagnostic. There is no retry, alternate host, or unpinned fallback.

Production asset URLs may disappear after a later deployment. That is a snapshot
availability limit, not evidence of an application regression. Refreshing the
snapshot requires a separately verified source/asset comparison; never silently
accept new bytes.
Source or dependency snapshot drift also fails closed before SSR generation.

## Isolation and fidelity

The SSR fixture is generated from the actual root and Base64 source with a
reduced server route tree and the pinned static production manifest. Router
match timestamps and serialization are generated locally. No captured production
HTML, request-specific links, or analytics identifiers are checked into fixtures.
Public ad constants needed to align the exact compiled client are read only at
runtime from verified owned bytes, and omitted from logs and uploaded results.

Playwright serves the fixture and verified scripts through request interception
at a synthetic origin. No local web server is needed. External scripts and fonts
remain inert, stylesheet responses are inert, and unknown runtime requests are
blocked at the HTTP/resource level. Preconnect hints remain in the equivalent
SSR, so resource interception alone is not proof of zero DNS/TCP/TLS activity.
This tests parser, SSR structure, and hydration lifecycle rather than
visual styling, performance, or third-party integrations.

Diagnostic clones add error collection at the production entry's final
`hydrateRoot` call and capture the first expected/actual host-node tags before
React throws. Original pinned bytes remain intact. Clone transformations and
original hashes are recorded. A deliberate synthetic DOM mismatch verifies that
the detector can fail; the real encode/decode controls and completed bootstrap
are checked before accepting an error-free baseline.

Only redacted JSON and the exact checked-out source SHA are uploaded. Cached JS,
generated HTML, browser traces, and raw DOM snapshots are not uploaded.

For the live-response case, source-position inspection changes only identified
inline third-party script type attributes; it never reserializes the document
or repairs markup. Exact observed external scripts/styles are fulfilled inertly
without reading their providers. Actual text and unknown attribute values are
omitted from live host snapshots. The response is buffered for interception,
so this does not reproduce original progressive network delivery. Both buffering
and surgical edits are recorded as diagnostic limits. Reporting-policy headers
(`NEL`, `Report-To`, `Reporting-Endpoints`) and only CSP `report-uri`/`report-to`
directives are removed in memory to prevent browser-managed telemetry outside
request interception. CSP enforcement directives and COOP/COEP are retained.
Ambiguous policies fail closed; only removal names/counts are reported.

Executable inline framework scripts must match generated-reference AST
fingerprints. All strings, identifiers, operators, and properties are retained;
only serializer match-update epoch literals vary. Unknown executable markup,
embedded documents, SVG scripts, and declarative shadow templates stop the case.
The reduced generated manifest may omit inactive-route metadata present in the
live serializer. A strict-envelope rejection is a serializer-validation technical
limit, not evidence of source drift or a product regression; do not rewrite the
live serializer or loosen the check to force a pass.

No device/user-agent preset is used. The runner's automatic failure-context
snapshot is disabled for these tests, in addition to traces, screenshots, and
video, so a failure cannot save the live page's request identifiers.

## Run

```sh
npm ci
npx vp test run tests/unit/hydration-owned-assets.test.ts
node --test tests/browser/hydration/*.test.mjs
npx playwright install --with-deps chromium
npx playwright test --config tests/browser/hydration/playwright.config.ts
```

Use the dedicated **Production hydration diagnostic** hosted workflow where
local browser execution is unavailable. No credentials, deployment, or production
settings are required. Test-only changes need no product release-note entry.
