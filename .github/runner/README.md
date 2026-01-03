# GitHub Actions Self-Hosted Runner

E2Eテストの並列実行を高速化するためのself-hosted runner設定です。

## セットアップ

### 1. GitHub Personal Access Token の作成

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token (classic)」をクリック
3. 以下のスコープを選択:
   - `repo` (プライベートリポジトリの場合)
   - または `public_repo` (パブリックリポジトリの場合)
4. トークンを生成してコピー

### 2. 環境設定

```bash
cd .github/runner

# .env ファイルを作成
cp .env.example .env

# .env ファイルを編集して値を設定
# GITHUB_REPOSITORY=owner/repo
# GITHUB_TOKEN=ghp_xxxx
```

### 3. Runner の起動

```bash
# ビルドして起動
docker compose up -d --build

# ログを確認
docker compose logs -f

# 複数のrunnerを起動（並列実行用）
docker compose up -d --scale runner=3
```

### 4. 動作確認

1. GitHub リポジトリ → Settings → Actions → Runners
2. self-hosted runner が登録されていることを確認
3. ステータスが「Idle」になっていれば準備完了

## 運用

### Runner の停止

```bash
# 停止（runnerをGitHubから削除）
docker compose down

# 一時停止（再開可能）
docker compose stop
```

### Runner のスケール変更

```bash
# 3台に増やす
docker compose up -d --scale runner=3

# 1台に減らす
docker compose up -d --scale runner=1
```

### ログの確認

```bash
# リアルタイムログ
docker compose logs -f

# 特定のrunnerのログ
docker compose logs runner
```

### イメージの更新

Runner のバージョンを更新する場合:

1. `Dockerfile` の `RUNNER_VERSION` を変更
2. 再ビルド:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

## トラブルシューティング

### Runner が登録されない

- `GITHUB_TOKEN` のスコープを確認
- トークンが有効期限切れでないか確認
- リポジトリ名が正しいか確認

### テストが失敗する

- `shm_size` を増やす（Chromiumのメモリ不足対策）
- リソース制限を調整

### Playwright が動作しない

- 必要な依存関係がDockerfileに含まれているか確認
- `seccomp=unconfined` が設定されているか確認

## ワークフロー

E2Eテストは `.github/workflows/e2e-tests.yml` で定義されています:

1. **build** ジョブ: GitHub-hosted runner でビルド
2. **e2e** ジョブ: self-hosted runner で各テストファイルを並列実行
3. **summary** ジョブ: 結果を集約してPRにコメント

## セキュリティ注意事項

- `.env` ファイルは `.gitignore` に含まれています
- `GITHUB_TOKEN` は絶対にコミットしないでください
- パブリックリポジトリでは、self-hosted runner のセキュリティリスクに注意してください
