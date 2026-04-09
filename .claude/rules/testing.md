---
description: テスト方針・コマンド・カバレッジ基準
paths: "**/*.test.*,**/*.spec.*,tests/**"
---

# テスト方針

## テストコマンド

```bash
vp test run              # ユニットテスト実行（= npm test）
vp test                  # ウォッチモード（= npm run test:watch）
vp test run --coverage   # カバレッジレポート生成
playwright test          # E2Eテスト実行（GUI環境のみ）
```

## コミット前の必須事項

`.vite-hooks/pre-commit` が自動で `vp staged` を実行する（フォーマット・lint・テスト）。
手動で確認する場合：

1. `vp check` — フォーマット + lint + 型チェック
2. `vp test run` — ユニットテスト
3. `vp build` — ビルド

## E2Eテストについて

- **実装は必須**: 新しい機能・ページを追加した場合は `tests/e2e/` に対応テストを実装すること
- **実行は任意**: CLI環境ではPlaywrightが動作しないため、コミット前必須事項には含まない
- E2EテストはビルドしてからPR時に実行: `vp build && playwright test`

## カバレッジ

- **80%以上を維持すること**
- 新しい関数・モジュールを追加した場合は、適切なJSDocコメントを記述すること
