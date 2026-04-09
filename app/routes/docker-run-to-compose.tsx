import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { convertDockerRun } from "../utils/docker-run-to-compose";
import "../styles/tools/docker-run-to-compose.css";

export const Route = createFileRoute("/docker-run-to-compose")({
  head: () => ({
    meta: [
      { title: "docker run → Compose 変換 | Web ツール集" },
      {
        name: "description",
        content:
          "docker run コマンドを docker-compose.yml 形式に変換するツール。-p / -e / -v / --name などのオプションに対応。ブラウザ内完結。",
      },
      {
        property: "og:title",
        content: "docker run → Compose 変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "docker run コマンドを docker-compose.yml に変換。ポート・環境変数・ボリューム・ネットワークに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/docker-run-to-compose` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "docker run → Compose 変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "docker run コマンドを docker-compose.yml に変換するツール。",
      },
    ],
  }),
  component: DockerRunToComposePage,
});

/** サンプル docker run コマンド集 */
const SAMPLES = [
  {
    label: "Nginx",
    value: `docker run -d \\
  --name nginx \\
  -p 80:80 \\
  -p 443:443 \\
  -v /path/to/html:/usr/share/nginx/html:ro \\
  --restart unless-stopped \\
  nginx:latest`,
  },
  {
    label: "PostgreSQL",
    value: `docker run -d \\
  --name postgres \\
  -e POSTGRES_USER=admin \\
  -e POSTGRES_PASSWORD=secret \\
  -e POSTGRES_DB=mydb \\
  -p 5432:5432 \\
  -v pgdata:/var/lib/postgresql/data \\
  --restart unless-stopped \\
  postgres:16`,
  },
  {
    label: "Redis",
    value: `docker run -d \\
  --name redis \\
  -p 6379:6379 \\
  -v redis-data:/data \\
  --restart always \\
  redis:7-alpine`,
  },
  {
    label: "Node.js アプリ",
    value: `docker run -d \\
  --name myapp \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL=postgres://admin:secret@db:5432/mydb \\
  -v /app/logs:/app/logs \\
  --network my-network \\
  --restart on-failure \\
  myapp:latest`,
  },
] as const;

/**
 * docker run → docker-compose.yml 変換ツール
 */
function DockerRunToComposePage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return convertDockerRun(input);
  }, [input]);

  const handleClear = () => {
    setInput("");
    announceStatus("入力をクリアしました");
  };

  const handleCopy = async () => {
    if (!result?.yaml) return;
    const success = await copy(result.yaml);
    if (success) {
      showToast("YAMLをコピーしました", "success");
      announceStatus("YAMLをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleSample = (value: string) => {
    setInput(value);
    announceStatus("サンプルを読み込みました");
  };

  return (
    <>
      <div className="drc-container">
        {/* 入力セクション */}
        <section className="drc-section" aria-labelledby="drc-input-heading">
          <h2 id="drc-input-heading" className="section-title">
            docker run → docker-compose.yml 変換
          </h2>

          {/* サンプルボタン */}
          <div className="drc-samples" role="group" aria-label="サンプルを読み込む">
            <span className="drc-samples-label">サンプル：</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                className="drc-sample-btn"
                onClick={() => handleSample(s.value)}
                aria-label={`${s.label}のサンプルを読み込む`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 入力 */}
          <div className="drc-input-wrapper">
            <label htmlFor="drc-input" className="drc-label">
              docker run コマンド
            </label>
            <textarea
              id="drc-input"
              className="drc-textarea drc-textarea--input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`docker run -d \\
  --name myapp \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  myapp:latest`}
              aria-label="docker run コマンドを入力"
              spellCheck={false}
              autoComplete="off"
              rows={7}
            />
          </div>

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!input}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
            {result?.yaml && (
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleCopy}
                aria-label="YAMLをコピー"
              >
                コピー
              </Button>
            )}
          </div>
        </section>

        {/* 出力セクション */}
        <section className="drc-section" aria-labelledby="drc-output-heading">
          <h2 id="drc-output-heading" className="section-title">
            docker-compose.yml
          </h2>

          {/* 警告メッセージ */}
          {result?.warnings && result.warnings.length > 0 && (
            <ul className="drc-warnings" role="list" aria-label="変換時の注意">
              {result.warnings.map((w, i) => (
                <li key={i} className="drc-warning-item">
                  <span aria-hidden="true">⚠</span> {w}
                </li>
              ))}
            </ul>
          )}

          {/* YAML出力 */}
          <div className="drc-output-wrapper">
            <pre
              className="drc-code-block"
              aria-label="変換された docker-compose.yml"
              aria-live="polite"
            >
              {result?.yaml ? (
                <code>{result.yaml}</code>
              ) : (
                <span className="drc-placeholder">
                  docker run コマンドを入力すると docker-compose.yml が生成されます
                </span>
              )}
            </pre>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                'docker run コマンドをそのまま貼り付けてください（"docker run" の有無は問いません）',
                "バックスラッシュ改行（\\）による複数行のコマンドにも対応しています",
                "「サンプル」ボタンで典型的なパターンをすぐに試せます",
                "「コピー」ボタンで生成された YAML をクリップボードにコピーできます",
              ],
            },
            {
              title: "対応オプション",
              items: [
                "--name : コンテナ名 → container_name",
                "-p / --publish : ポートマッピング → ports",
                "-e / --env : 環境変数 → environment",
                "-v / --volume : ボリューム → volumes",
                "--network : ネットワーク → networks",
                "--restart : 再起動ポリシー → restart",
                "-d / --detach : バックグラウンド実行（省略）",
                "-it : インタラクティブTTY → tty + stdin_open",
                "-w / --workdir : 作業ディレクトリ → working_dir",
                "--entrypoint : エントリーポイント → entrypoint",
                "-u / --user : ユーザー → user",
                "-m / --memory : メモリ制限 → deploy.resources.limits",
                "--cpus : CPU制限 → deploy.resources.limits",
                "--privileged : 特権モード → privileged",
                "--read-only : 読み取り専用 → read_only",
                "--cap-add / --cap-drop : ケーパビリティ → cap_add / cap_drop",
              ],
            },
            {
              title: "注意点",
              items: [
                "--env-file は docker-compose の env_file フィールドへの手動変換が必要です",
                "--link は非推奨です。docker-compose のネットワーク機能を使用してください",
                "--rm はdocker-composeでは通常使用しません",
                "ネットワークを指定した場合、外部ネットワークとして networks セクションが追加されます",
                "memory / cpus は Swarm モードの deploy.resources 形式で出力されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
