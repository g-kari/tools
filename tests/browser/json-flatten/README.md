# JSON Flatten collision browser regression

The fixture bundles the real `/json-flatten` component, ToastProvider, and existing production control/Toast/tool styles. It excludes the app shell, Workers bindings, ads, and external services. It checks client-component behavior, not full-app SSR hydration.

Only synthetic JSON is used. The GET-only server binds to `127.0.0.1:4198`, serves fixed built assets, and maps `/json-flatten` to its fixture page. A restrictive CSP blocks connections and external resources; browser assertions reject external requests and JavaScript runtime errors.

Run from the repository root:

```sh
npx vite build --config tests/browser/json-flatten/vite.config.ts
npx playwright test --config tests/browser/json-flatten/playwright.config.ts
```

The scoped workflow checks the exact PR head or main push SHA. Dependency and Chromium installation occur before validation, with repository lifecycle scripts disabled. A fail-closed hosted wrapper then runs related unit tests, the production build, TypeScript, the fixture build, and two Chromium scenarios at desktop 1280px and mobile-width 390px.

Validation uses an OS-enforced namespace with no external network, an empty allowlisted environment, read-only source/toolchain, and a disposable source copy inside 2GiB of temporary scratch. Cgroup limits cap memory at 3GiB without swap, tasks at 128, and CPU bandwidth at two cores; process limits cap CPU at 360 seconds and individual files at 128MiB, with a 480-second wall limit. No alternate execution route is used if these controls fail. Loopback is available only inside the isolated namespace for the fixture server.

The 2GiB scratch budget includes 128MiB of explicitly writable dependency-cache mounts (`.vite-temp`, `.vite`, and `.cache`) beneath the disposable checkout. All dependency code remains read-only. Resource settings and cgroup placement are checked before any target execution.

The trusted cgroup helper immediately drops root to the non-root checkout owner's uid/gid, clears supplementary groups, and sets no-new-privileges before starting bubblewrap. Bubblewrap therefore maps the checkout owner, not host root, when it reads the existing source/cache paths. No host file permissions are changed.

The workflow retains only the trusted checkout's source SHA for one day. Test reports, screenshots and traces stay inside disposable scratch and are discarded; results and isolation failures are visible in the workflow log. The repository's ordinary CI workflow remains unchanged and separately runs all unit tests plus format/lint/type checks.

Covered behavior: duplicate flatten destinations, repeated errors, custom-delimiter recovery, unflatten prefix conflicts in both input orders, literal own special keys, array output, input preservation, stale-output clearing, hidden copy actions on failure, and Ctrl+Enter recovery. The same assertions are registered by the full-app E2E spec.

The existing path format is unchanged. Keys containing the selected delimiter can remain ambiguous without a collision; this change does not introduce escaping or guarantee arbitrary round trips. Duplicate JSON properties and numeric tokens already transformed by `JSON.parse` are outside this repair. Existing numeric-index interpretation, array conversion, and maximum-depth semantics remain unchanged.

Mobile-width Chromium checks layout only. Native mobile hardware, touch/IME, assistive technology, Firefox/WebKit, full-app hydration, and deployment are not covered by this fixture.
