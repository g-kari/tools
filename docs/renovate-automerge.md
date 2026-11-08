# Renovate auto-merge guard

Dependency PRs remain available, but Renovate auto-merge is paused for every update type, including minor and patch updates. The final `packageRules` entry is an unconditional manual-review guard. Platform-native auto-merge is also disabled.

This prevents a later broad minor/patch allow rule from overriding the existing manual exclusions. The 14-day release age, required release timestamp, strict internal-check handling, disabled lifecycle scripts, pre-1.0 review rule, manual vulnerability updates and disabled lockfile maintenance remain unchanged.

`npm run test:renovate` uses only Node's standard library. It reads the configuration as JSON, checks the repository policy, and rejects fixtures that enable auto-merge or weaken the guard. `npm test` runs this check before the existing application unit suite. This is a policy regression test, not the official Renovate configuration validator or a simulation of Renovate's rule matching.

## Why the pause is needed

`ignoreTests: false` is not proof that an expected application check exists. With `platformAutomerge: true`, GitHub applies its configured merge requirements; it does not invent missing required checks. A successful comment or summary job is not a substitute for successful build and test jobs.

Before proposing a narrower auto-merge allowlist:

1. Verify the effective requirements on `main`, including required check names and their expected GitHub App, current-base testing, review requirements and any applicable bypasses. Unavailable information is unknown, not permission to merge.
2. Verify that the expected real CI checks register on dependency PRs and fail when necessary validation fails, is cancelled or is missing. Do not rely on a comment-only summary or ambiguous duplicate check names.
3. Review a separate change that limits eligible managers, packages, update types and files. Keep manual exclusions after any allow rule and add boundary fixtures for that scope.
4. Confirm any required security-sensitive settings change separately before applying it. This change does not alter branch protection, permissions, credentials or GitHub's repository-level auto-merge setting.

The deleted generic Auto Merge workflow must not be restored as part of this guard. Changing this file does not cancel existing workflow runs or remove auto-merge that is already enabled on an open PR. Those need separate verification before claiming that all previously queued actions have stopped.

## Browser CI compatibility

Every job that installs Playwright browsers uses the explicit `ubuntu-22.04` GitHub-hosted image. The floating `ubuntu-latest` image moved to Ubuntu 26.04, which the locked Playwright version does not support. The existing Grapheme job already uses 22.04 because Ubuntu 24.04 blocks its downloaded Chromium sandbox. Reuse that supported image without disabling Chromium's sandbox, changing host security settings, or weakening the JSON Flatten isolation scripts.

This pin is a compatibility repair, not a permanent upgrade plan. GitHub has announced that the Ubuntu 22.04 runner image will be unsupported in April 2027. Before that retirement, validate a supported browser/runtime combination on a newer runner while keeping the sandbox and existing checks enabled. Build-only and result-summary jobs keep their existing runners.

References:

- [Renovate platform auto-merge](https://docs.renovatebot.com/configuration-options/#platformautomerge)
- [Renovate auto-merge configuration](https://docs.renovatebot.com/key-concepts/automerge/)
- [GitHub required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [GitHub-hosted Ubuntu runner images](https://github.com/actions/runner-images)
