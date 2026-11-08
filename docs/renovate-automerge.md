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

Current-regression jobs that install Playwright browsers use explicit GitHub-hosted images. In the [failing tools run](https://github.com/g-kari/tools/actions/runs/42446535803/job/128626525236), `ubuntu-latest` resolved to Ubuntu 26.04, which the locked Playwright version does not support. GitHub's [migration announcement](https://github.com/actions/runner-images/issues/14748) describes a gradual rollout, so this observation does not imply every `ubuntu-latest` job uses 26.04.

Browser jobs use `ubuntu-22.04`, following the existing Grapheme job's decision to keep Chromium's sandbox enabled without changing host security settings. JSON Flatten instead uses `ubuntu-24.04`: its existing isolation wrapper requires bubblewrap's `--disable-userns`, added in [bubblewrap 0.8](https://github.com/containers/bubblewrap/releases/tag/v0.8.0), while Ubuntu 22.04 provides 0.6.1 and Ubuntu 24.04 provides 0.9. The wrapper's flags and resource controls remain unchanged. Its disposable copy includes `renovate.json` so the new policy test can read the same configuration inside isolation. Any unavailable isolation control still fails closed.

This pin is a compatibility repair, not a permanent upgrade plan. GitHub's [retirement announcement](https://github.com/actions/runner-images/issues/14254) gives April 17, 2027 as the Ubuntu 22.04 runner image retirement date. Before that retirement, validate a supported browser/runtime combination on a newer runner while keeping the sandbox and existing checks enabled. Build-only and result-summary jobs keep their existing runners. The separate historical production-hydration diagnostic is unchanged: its pinned asset snapshot is unavailable (HTTP 404), and current source files differ from its historical pins. Restoring that historical diagnostic requires verified archived assets and matching historical source; it is not current-PR coverage and is not repaired or skipped by this compatibility change.

References:

- [Renovate platform auto-merge](https://docs.renovatebot.com/configuration-options/#platformautomerge)
- [Renovate auto-merge configuration](https://docs.renovatebot.com/key-concepts/automerge/)
- [GitHub required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [GitHub-hosted Ubuntu runner images](https://github.com/actions/runner-images)
