# React 19 / UUID feedback migration

Scope: React and React DOM 19.2.6, their 19.x types, and one UUID bulk-copy
visual affordance using a lazily loaded Animate UI Fade primitive. Existing TanStack,
Radix, Lucide, build tooling, security overrides and unrelated dependencies
stay at their original locked versions. PR #307 is independent and untouched.

## Design and compatibility

- The modern JSX transform is already enabled (`react-jsx`). Explicit global JSX
  annotations are changed to imported React JSX types.
- React 19 removed `react-dom/test-utils` Simulate. UI tests dispatch real native
  form events through a shared test-only helper instead.
- UUID clipboard writes remain in the existing hook, including the unsupported
  Clipboard API fallback, failure announcement, repeat-copy and 2-second reset.
  The native button remains mounted; Animate UI never owns clipboard writes or focus.
  Its optional icon module loads only after a successful bulk copy, with a complete
  static icon fallback if loading fails or the state resets before it arrives.
- Only a successful write sets the completion state. Icons are decorative; the
  Japanese button text and status announcement remain the accessible feedback.
- The optional feedback only fades opacity for 150ms, with zero-duration/no fade
  under reduced motion. No initial route or continuous animation is requested. Mobile layout keeps an inline fixed icon
  slot. No user data is sent to a new endpoint.
- MIT + Commons Clause notice is preserved verbatim in ANIMATE-UI-LICENSE.md.
  Verbatim Animate UI and Motion-family notices also ship under
  `public/third-party-licenses/` as application assets; the distinct Framer
  Motion notice is separate. Build-output byte comparisons verify retention.

## Evidence and gates

Official sources:

- https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- https://animate-ui.com/docs/primitives/effects/fade
- https://github.com/imskyleen/animate-ui/blob/main/LICENSE.md

Required before acceptance: exact lock npm ci; vp check; all unit tests; build;
actual UUID browser tests (desktop/mobile, normal/reduced motion, keyboard,
repeated success/reset, failure and fallback); bundle comparison; final-head CI;
independent review and formal merge requirements. Passed focused checks are not
substitutes for any unrun aggregate or browser check.

No dependency age gate is configured in the checked tools repository rules,
package configuration, hooks, or CI. No security setting is changed. New package
release metadata is recorded in the verification evidence; unlike daredakke,
tools has no configured 24-hour exception mechanism to alter.

## Local verification on 2026-10-19

- Clean exact-lock `npm ci`: 636 packages; peer tree has no invalid dependencies.
- `vp check`: no warnings/lint/type errors across 1363 files.
- Complete unit suite: 377 files / 11627 tests passed after the React 19 test migration.
- Production client and SSR build passed. Same-lock baseline main builds also passed.
- Baseline UUID client chunk: 6.43 kB raw / 2.75 kB gzip. Final route: 7.38 kB /
  3.20 kB gzip (about +0.45 kB gzip). Optional success-feedback chunk: 138.39 kB /
  45.62 kB gzip, requested only after successful bulk copy, not on route entry.
  These are static build sizes, not measured browser timing or frame performance.
- Read-only independent review found two native-event helper issues, both corrected;
  re-review found no remaining implementation blockers.
- Local browser tests remain unexecuted: normal dev startup fails in this cloud
  environment at `uv_interface_addresses`; the official Chromium download returned
  truncated ZIP / HTTP 400 GatewayExceptionResponse. No sandbox or security setting
  was relaxed and no alternate URL was used to evade those restrictions.
- The existing hosted CSV JSON app-suite workflow is extended with a UUID-only
  app config, retaining its read-only permissions, normal browser settings, full
  build and preview server. Its exact-head results must be checked.
- Browser coverage is implemented for mobile normal/reduced motion, keyboard,
  successful/repeated/failed clipboard writes, desktop unavailable-Clipboard
  fallback/focus/cleanup, and optional animation-chunk failure.
- Local commit hook references a desktop-only absolute `vp` path unavailable here.
  It was not disabled or edited. Equivalent normal checks above were run; publication
  uses the GitHub connector. Draft status remains until real browser validation,
  final-head CI, and formal review/merge conditions have been met.
