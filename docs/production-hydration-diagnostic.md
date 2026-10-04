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
The current investigation permits one runtime-only GET per run for PR #250 and
source snapshot `9a0f02f2620e52dc82ac7d7b09e0b6aec0e53ad4` only. The workflow and
runner both enforce that boundary. Other pull requests remain disabled by
default. A separately approved manual workflow run must explicitly enable the
`live_response` input; local invocation requires `HYDRATION_LIVE_RESPONSE=1`.
Do not enable a live read merely to retry a rejected response.

## Snapshot provenance

- Application source: commit `9a0f02f2620e52dc82ac7d7b09e0b6aec0e53ad4`
- Production entry: `/assets/main-DgnOJ0SI.js`
- Active lazy route: `/assets/base64-pNp3AUSU.js`
- `owned-assets.json`: static route asset metadata, 43 public owned JS pins, and
  22 exact source-blob pins for the generated SSR graph, client/router, SSR entry,
  Vite configuration, and packages

The current source-built full manifest has 304 routes. Its 302 inactive routes
have no assets and are pruned by TanStack's actual dehydration algorithm. The
remaining two-route manifest matches the previous snapshot after only the entry
and release-notes paths change. Inactive metadata is not an established cause
of this snapshot's framework-envelope rejection.

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
match timestamps and serialization are generated locally. The same stream
renderer and Cloudflare conditional exports are required. Plain Node resolves
an extra 919-character scroll-restoration ScriptOnce; the Worker build's
`browser` condition resolves its null helper instead. This was a diagnostic
reference mismatch, not evidence of a product fault. The runtime verifies the
React readable-stream, isServer server export, and scroll helper browser export
before claiming equivalence. No captured production
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

The native live replay after the approved tools-host Zaraz exclusion reached
completed hydration, bootstrap cleanup and encode/decode with no React errors,
but failed because an unknown `GET` of resource type `other` was blocked before
owned JavaScript. Its URL was not exported. Cloudflare Speed Brain is enabled;
its documented `Speculation-Rules` response header causes an independent
browser-managed ruleset fetch. This is a supported candidate mechanism, not
attribution of the earlier redacted request.

The fixture now reports only the count and finite classifications of that header.
Only the exact singleton relative value `"/cdn-cgi/speculation"` (with optional
ASCII spaces) is omitted from the in-memory replay response to prevent speculative
network activity outside the hydration question. Other values, destinations,
URL lists, query strings, fragments and parameters stay unchanged; the original
unknown-request rejection and assertion remain in place. No remote speculation
rules are fetched or allowed, and no production Speed Brain setting is changed.
A synthetic Chromium control checks that the header triggers a ruleset fetch
without any document script and that omission produces no fetch during a
250-millisecond post-load observation in a fresh context. The synthetic ruleset
is empty inert JSON fulfilled entirely by interception. This native control
requires an exact-head hosted pass; the Node contracts separately verify the
exact removal and preservation rules.
Speculative loading is therefore an additional excluded behavior, and a resulting
pass still establishes contained-response hydration rather than the full live
production runtime. CSP enforcement, COOP/COEP and all script/source trust checks
remain unchanged. Header values and request URLs never enter the report.
See [Cloudflare Speed Brain](https://developers.cloudflare.com/speed/optimization/content/speed-brain/)
and the [Speculation-Rules header](https://html.spec.whatwg.org/multipage/speculative-loading.html#the-speculation-rules-header).

Executable inline framework scripts must match generated-reference AST
fingerprints. All strings, identifiers, operators, and properties are retained;
only serializer match-update epoch literals vary. Unknown executable markup,
embedded documents, SVG scripts, and declarative shadow templates stop the case.
A strict-envelope rejection is a serializer-validation technical limit, not
evidence of source drift or a product regression; do not rewrite the live
serializer or loosen the check to force a pass. Rejected scripts can report only
fixed numeric syntax categories, lengths, and known namespace-marker booleans.
No literal, identifier, source, attribute value, or parser diagnostic is exported.

Before the original live guard checks executable markup, `sourceDifference`
inertly compares the whole buffered response with generated SSR. This remains
available on a later rejection, including when the first unknown inline script
precedes a new external module. It reports non-script host/text counts,
positional structural/attribute differences, a first host difference with finite
tag/attribute-name labels and numeric paths, and byte-exact equality outside all
script elements. Host attribute values and text stay in memory. Unknown names
become `other`; no observed URL or unknown script fingerprint is exported.

Inline framework comparison uses the original trusted AST fingerprint function:
identifiers, properties, strings and operators remain significant; only the
existing serializer epoch literals can normalize. The report records entry and
serializer match counts, plus framework order/multiplicity agreement. External
scripts compare their resolved URL and MIME type only in memory against generated
resources, then export a finite match label. An unmatched external module is
classified without downloading or executing it. Template scripts do not consume
executable reference-resource matches. These comparisons cannot authenticate a
provider or establish the hydration cause.

This is source inspection, not a browser intervention. Original guard decisions,
rejection codes, surgical edits and runtime URL allowlists are unchanged. Unknown
script markup is never removed, rewritten or replayed to force a pass. Inspection
is bounded to 50,000 nodes, depth 256 and 128 script elements; an unavailable
comparison produces only a static diagnostic and cannot change the guard result.
Unsupported script namespaces or incomplete script-tag source offsets also make
the comparison unavailable, rather than misclassifying foreign templates,
omitting nested foreign-script elements, or reporting unclosed scripts as empty.
Positional parser-tree differences are not React expected-host differences, and
an insertion can shift later comparisons. Outside-script equality deliberately
excludes whole script elements, including attributes; it does not establish full
document equivalence. Conditional live responses and clean generated/replayed
cases are not evidence that the production hydration issue is fixed.

No device/user-agent preset is used. The runner's automatic failure-context
snapshot is disabled for these tests, in addition to traces, screenshots, and
video, so a failure cannot save the live page's request identifiers.

## Run

```sh
npm ci
npx vp test run tests/unit/hydration-owned-assets.test.ts
NODE_OPTIONS='--conditions=workerd --conditions=worker --conditions=module --conditions=browser' node --test tests/browser/hydration/*.test.mjs
npx playwright install --with-deps chromium
NODE_OPTIONS='--conditions=workerd --conditions=worker --conditions=module --conditions=browser' npx playwright test --config tests/browser/hydration/playwright.config.ts
```

Use the dedicated **Production hydration diagnostic** hosted workflow where
local browser execution is unavailable. No credentials, deployment, or production
settings are required. Test-only changes need no product release-note entry.
