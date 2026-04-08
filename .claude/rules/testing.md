---
description: テスト方針・コマンド・カバレッジ基準
paths: "**/*.test.*,**/*.spec.*,tests/**"
---

# テスト方針

## テストコマンド

```bash
npm test                 # ユニットテスト実行
npm run test:watch       # ウォッチモード
npm run test:coverage    # カバレッジレポート生成
npm run test:e2e         # E2Eテスト実行（GUI環境のみ）
```

## コミット前の必須事項

コミット前に必ず以下を実行し、成功を確認すること（hooks で自動化済み）：

1. `npm test` — ユニットテスト
2. `npm run build` — ビルド

## E2Eテストについて

- **実装は必須**: 新しい機能・ページを追加した場合は `tests/e2e/` に対応テストを実装すること
- **実行は任意**: CLI環境ではPlaywrightが動作しないため、コミット前必須事項には含まない
- E2EテストはビルドしてからPRは実行: `npm run build && npm run test:e2e`

## ドキュメントカバレッジ

- **80%以上を維持すること**
- 新しい関数・モジュールを追加した場合は、適切なJSDocコメントを記述すること
