# Suggested Commands

## Development

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run preview      # プレビュー
npm run deploy       # デプロイ（Cloudflare Workers）
```

## Testing

```bash
npm test             # ユニットテスト実行
npm run test:watch   # ウォッチモード
npm run test:coverage # カバレッジレポート
npm run test:e2e     # E2Eテスト（GUI環境のみ）
```

## Commit Prerequisites (REQUIRED)

```bash
npm test             # ユニットテスト（必須）
npm run build        # ビルド（必須）
```

## Git Worktree (推奨)

```bash
git worktree add wip/tools-feat-example feat/example
git worktree list
git worktree remove wip/tools-feat-example
```
