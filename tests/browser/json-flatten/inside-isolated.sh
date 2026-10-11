#!/usr/bin/env bash
# Runs only inside run-isolated.sh's disposable, resource-limited namespace.
set -euo pipefail
test "${HOME}" = /scratch/home
test "${TMPDIR}" = /scratch/tmp
mkdir -p /scratch/home /scratch/tmp /scratch/cache /scratch/repo
cp -R /source/app /source/public /source/tests /scratch/repo/
for file in package.json package-lock.json vite.config.ts vitest.config.ts tsconfig.json tailwind.config.ts components.json wrangler.jsonc; do
  cp "/source/${file}" /scratch/repo/
done
cd /scratch/repo
test -d node_modules
npm test -- tests/unit/json-flatten.test.ts tests/unit/json-flatten-collisions.test.ts tests/unit/json-flatten-collisions-ui.test.ts tests/unit/release-notes.test.ts
npm run build
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build --config tests/browser/json-flatten/vite.config.ts
node node_modules/@playwright/test/cli.js test --config tests/browser/json-flatten/playwright.config.ts
