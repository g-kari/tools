# shadcn/ui 正式導入計画

## 概要

shadcn/uiをプロジェクトに正式導入する。実験的な対応のため、まず1ページで検証してから段階的に拡大する。

## 現状

- **スタイリング**: styles.css（5,423行、667クラス）でMaterial Design 3準拠
- **コンポーネント**: Toast.tsxのみ（カスタム実装）
- **node_modules**: Radix UI、Tailwind CSS等がextraneousとして存在（package.json未記載）
- **設定ファイル**: components.json、tailwind.config.ts等は存在しない

## 導入計画

### Phase 1: 基盤セットアップ

1. **依存関係のインストール**
   - tailwindcss、@tailwindcss/vite
   - clsx、tailwind-merge、class-variance-authority
   - 必要なRadix UIパッケージ（shadcn/uiコンポーネント追加時に自動インストール）

2. **設定ファイルの作成**
   - `tailwind.config.ts` - Tailwind設定（既存カラーシステム移植）
   - `components.json` - shadcn/ui CLI設定
   - `app/lib/utils.ts` - cn()ユーティリティ関数

3. **CSSの統合**
   - Tailwindのベーススタイルをstyles.cssに追加
   - 既存のCSS変数（Material Design 3カラー）をTailwindテーマに移植

### Phase 2: 実験ページでの検証

1. **対象ページ選定**: UUID生成ページ（/uuid）
   - シンプルな構成（ボタン、入力フィールド）
   - 既存機能への影響が少ない

2. **shadcn/uiコンポーネント導入**
   - Button
   - Input
   - Card（オプション）

3. **検証項目**
   - Cloudflare Workersでの動作確認
   - SSRでの問題有無
   - 既存styles.cssとの共存
   - ビルドサイズの変化

### Phase 3: 段階的展開（Phase 2成功後）

1. 共通コンポーネントをshadcn/uiに置き換え
2. 各ページを順次移行
3. styles.cssから不要なスタイルを削除

## 技術的考慮事項

### カラーシステム

既存のMaterial Design 3カラーをTailwindテーマに移植：

```
Primary: #8b6914 → primary
Secondary: #6b5e3f → secondary
Surface: #ffffef → background
Error: #ba1a1a → destructive
Success: #2e7d32 → success
```

### 既存CSSとの共存

- Phase 2では既存styles.cssを維持
- shadcn/uiコンポーネントのみTailwindクラスを使用
- 段階的に移行し、最終的にstyles.cssを削減

### Cloudflare Workers互換性

- shadcn/uiはクライアントサイドコンポーネント
- SSR時のスタイル適用を確認
- バンドルサイズの監視

## リスクと対策

| リスク | 対策 |
|--------|------|
| SSRでのスタイル不整合 | Tailwind CSSのSSR設定を適切に行う |
| 既存スタイルとの競合 | Tailwind prefixの使用を検討 |
| ビルドサイズ増加 | Tree-shakingの確認、不要コンポーネント除外 |
| E2Eテストの破損 | セレクタの更新が必要 |

## 成功基準

Phase 2完了時点で以下を確認：
- [ ] UUIDページが正常動作
- [ ] ビルド成功
- [ ] ユニットテスト成功
- [ ] 開発サーバーでの動作確認
- [ ] 既存ページへの影響なし
