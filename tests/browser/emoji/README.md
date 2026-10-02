# Actual EmojiConverter browser regression

The fixture imports the production `EmojiConverter` route component and its actual
base, component, and tool styles. It does not rebuild the editor as a test harness.
Only `@ffmpeg/ffmpeg` is replaced in the deterministic build. Browser canvas work,
frame PNGs, encoder argument construction, byte validation, Blob URL ownership,
preview, capacity checks, and downloads all run through the production code.

The real build uses installed `@ffmpeg/ffmpeg` and the exact existing core source,
`https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm`. It validates the resulting GIF's
MIME, magic, 128×128 canvas, frame count, centisecond timing, finite/infinite loop
extension, and byte equality between preview and downloaded output. No new
dependency or CDN is introduced. Synthetic images remain in the browser; request
guards reject non-GET requests, unknown hosts, and unknown resource paths.

Run where loopback sockets are permitted (the focused GitHub-hosted workflow does
this). Do not use this server as a fallback after a local socket access denial:

```
npx vite build --config tests/browser/emoji/vite.config.ts
EMOJI_REAL_FFMPEG=1 npx vite build --config tests/browser/emoji/vite.config.ts
npx playwright test --config tests/browser/emoji/playwright.config.ts
```

The suite includes explicit generation, exact/one-byte-over Discord and Slack
limits, empty/invalid/error/retry output, palette settings, every generation-key
change, stale encodes interrupted by settings/reset/file replacement/unmount,
Blob URL cleanup, static GIF/PNG separation, and keyboard flows at 320, 390, and
1280 pixels with both light and dark browser color-scheme preferences. The
production app currently has fixed terminal-dark colors; these are preference
compatibility checks, not an invented light-theme implementation.

Screenshots, real GIF binaries, structural inspection JSON, traces on failures,
the Playwright JSON report, and the exact tested source SHA are retained for one
day as the `emoji-gif-browser-results` workflow artifact.
