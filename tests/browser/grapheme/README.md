# Grapheme browser regression

This bounded fixture bundles the unchanged production character-count and text-statistics components and their real styles. It reuses all six canonical scenarios from `tests/e2e/grapheme-count.spec.ts`: normal compound-input/update/reset/re-entry, unsupported Segmenter, and 320px keyboard/no-overflow behavior on both routes.

The GET-only server binds to `127.0.0.1:4199` and serves fixed built files. CSP blocks connections and external resources; every browser test additionally rejects attempted external requests and JavaScript runtime errors. Service workers are blocked. Chromium uses its sandbox, one worker and no retry; isolation errors remain failures. No credentials, private inputs, bindings, saved state or external services are involved.

Run from the repository root after locked dependencies are installed:

    npx vite build --config tests/browser/grapheme/vite.config.ts
    npx playwright test --config tests/browser/grapheme/playwright.config.ts

The dedicated workflow uses the exact PR head/main SHA, builds the complete app, then builds this fixture and runs the six cases. It retains source SHA, JSON results, all final-state screenshots and failure traces for one day. Existing CI and full-app E2E definitions remain unchanged.

The dedicated job selects the standard `ubuntu-22.04` hosted VM because the initial Ubuntu 24.04 run failed to launch the downloaded Chromium sandbox before all six assertions. Chromium sandboxing remains enabled; no host security policy, privileges or browser flags are relaxed. Ubuntu 22.04 is currently listed by [GitHub](https://github.com/actions/runner-images) and [Playwright](https://playwright.dev/docs/intro#system-requirements). It is in a deprecation transition, so runner support must be rechecked before its scheduled retirement; this is a bounded compatibility choice, not a permanent support guarantee.

These are actual Chromium client-component tests, not full-app SSR hydration, a native mobile device/IME, assistive-technology or production verification. SSR/initial-render consistency has separate unit assertions. Successful fixture tests do not prove a production rollout.
