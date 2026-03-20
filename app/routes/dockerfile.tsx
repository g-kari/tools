import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import {
  generateDockerfile,
  defaultDockerfileConfig,
  DOCKERFILE_TEMPLATES,
  type DockerfileConfig,
  type DockerfileArg,
  type DockerfileEnv,
  type DockerfileCopy,
} from '../utils/dockerfile';
import '../styles/tools/dockerfile.css';

export const Route = createFileRoute('/dockerfile')({
  head: () => ({
    meta: [
      { title: 'Dockerfile ジェネレーター | Web ツール集' },
      {
        name: 'description',
        content:
          'GUIでDockerfileを生成するツール。ベースイメージ・WORKDIR・ENV・COPY・RUN・EXPOSE・ENTRYPOINTなどの設定をフォームで入力するだけでDockerfileを自動生成。ブラウザ内完結。',
      },
      {
        property: 'og:title',
        content: 'Dockerfile ジェネレーター | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'GUIでDockerfileを生成。Node.js・Python・Go・Nginxのテンプレートを用意。ブラウザ内完結。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/dockerfile` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'Dockerfile ジェネレーター | Web ツール集',
      },
      {
        name: 'twitter:description',
        content: 'GUIでDockerfileを生成するツール。ブラウザ内完結。',
      },
    ],
  }),
  component: DockerfilePage,
});

/**
 * Dockerfile ジェネレーターページ
 */
function DockerfilePage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<DockerfileConfig>(
    defaultDockerfileConfig()
  );

  const result = useMemo(() => generateDockerfile(config), [config]);

  const update = useCallback(
    <K extends keyof DockerfileConfig>(key: K, value: DockerfileConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleTemplate = (template: (typeof DOCKERFILE_TEMPLATES)[number]) => {
    setConfig(template.config);
    announceStatus(`${template.label}テンプレートを読み込みました`);
  };

  const handleCopy = async () => {
    if (!result) return;
    const success = await copy(result);
    if (success) {
      showToast('Dockerfileをコピーしました', 'success');
      announceStatus('Dockerfileをコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  };

  const handleReset = () => {
    setConfig(defaultDockerfileConfig());
    announceStatus('設定をリセットしました');
  };

  // ARG操作
  const addArg = () =>
    update('args', [...config.args, { key: '', defaultValue: '' }]);
  const removeArg = (i: number) =>
    update(
      'args',
      config.args.filter((_, idx) => idx !== i)
    );
  const updateArg = (i: number, patch: Partial<DockerfileArg>) =>
    update(
      'args',
      config.args.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    );

  // ENV操作
  const addEnv = () =>
    update('envs', [...config.envs, { key: '', value: '' }]);
  const removeEnv = (i: number) =>
    update(
      'envs',
      config.envs.filter((_, idx) => idx !== i)
    );
  const updateEnv = (i: number, patch: Partial<DockerfileEnv>) =>
    update(
      'envs',
      config.envs.map((e, idx) => (idx === i ? { ...e, ...patch } : e))
    );

  // COPY操作
  const addCopy = () =>
    update('copies', [...config.copies, { src: '', dest: '' }]);
  const removeCopy = (i: number) =>
    update(
      'copies',
      config.copies.filter((_, idx) => idx !== i)
    );
  const updateCopy = (i: number, patch: Partial<DockerfileCopy>) =>
    update(
      'copies',
      config.copies.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    );

  // RUN操作
  const addRun = () => update('runs', [...config.runs, '']);
  const removeRun = (i: number) =>
    update(
      'runs',
      config.runs.filter((_, idx) => idx !== i)
    );
  const updateRun = (i: number, val: string) =>
    update(
      'runs',
      config.runs.map((r, idx) => (idx === i ? val : r))
    );

  // EXPOSE操作
  const addPort = () => update('ports', [...config.ports, '']);
  const removePort = (i: number) =>
    update(
      'ports',
      config.ports.filter((_, idx) => idx !== i)
    );
  const updatePort = (i: number, val: string) =>
    update(
      'ports',
      config.ports.map((p, idx) => (idx === i ? val : p))
    );

  return (
    <>
      <div className="df-container">
        {/* テンプレート選択 */}
        <div
          className="df-templates"
          role="group"
          aria-label="テンプレートを読み込む"
        >
          <span className="df-templates-label">テンプレート：</span>
          {DOCKERFILE_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              className="df-template-btn"
              onClick={() => handleTemplate(t)}
              aria-label={`${t.label}テンプレートを読み込む`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* メインレイアウト */}
        <div className="df-layout">
          {/* 左: フォーム */}
          <section className="df-section" aria-label="Dockerfile設定フォーム">
            {/* FROM */}
            <div className="df-form-group">
              <div className="df-field">
                <label className="df-label" htmlFor="df-from">
                  FROM（ベースイメージ）
                </label>
                <input
                  id="df-from"
                  type="text"
                  className="df-input"
                  value={config.from}
                  onChange={(e) => update('from', e.target.value)}
                  placeholder="node:20-alpine"
                  aria-label="ベースイメージ"
                  spellCheck={false}
                />
              </div>
              <div className="df-field">
                <label className="df-label" htmlFor="df-from-alias">
                  AS（エイリアス・省略可）
                </label>
                <input
                  id="df-from-alias"
                  type="text"
                  className="df-input"
                  value={config.fromAlias}
                  onChange={(e) => update('fromAlias', e.target.value)}
                  placeholder="builder"
                  aria-label="マルチステージビルドのエイリアス（省略可）"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* WORKDIR */}
            <div className="df-field">
              <label className="df-label" htmlFor="df-workdir">
                WORKDIR（作業ディレクトリ）
              </label>
              <input
                id="df-workdir"
                type="text"
                className="df-input"
                value={config.workdir}
                onChange={(e) => update('workdir', e.target.value)}
                placeholder="/app"
                aria-label="作業ディレクトリ"
                spellCheck={false}
              />
            </div>

            {/* ARG */}
            <div className="df-field">
              <span className="df-label">ARG（ビルド引数）</span>
              <div className="df-list" aria-label="ARG一覧">
                {config.args.map((arg, i) => (
                  <div key={i} className="df-list-item">
                    <input
                      type="text"
                      className="df-input"
                      value={arg.key}
                      onChange={(e) => updateArg(i, { key: e.target.value })}
                      placeholder="変数名"
                      aria-label={`ARG ${i + 1} の変数名`}
                      spellCheck={false}
                    />
                    <span className="df-list-sep">=</span>
                    <input
                      type="text"
                      className="df-input"
                      value={arg.defaultValue}
                      onChange={(e) =>
                        updateArg(i, { defaultValue: e.target.value })
                      }
                      placeholder="デフォルト値（省略可）"
                      aria-label={`ARG ${i + 1} のデフォルト値`}
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="df-remove-btn"
                      onClick={() => removeArg(i)}
                      aria-label={`ARG ${i + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="df-add-btn"
                onClick={addArg}
                aria-label="ARGを追加"
              >
                + ARGを追加
              </button>
            </div>

            {/* ENV */}
            <div className="df-field">
              <span className="df-label">ENV（環境変数）</span>
              <div className="df-list" aria-label="ENV一覧">
                {config.envs.map((env, i) => (
                  <div key={i} className="df-list-item">
                    <input
                      type="text"
                      className="df-input"
                      value={env.key}
                      onChange={(e) => updateEnv(i, { key: e.target.value })}
                      placeholder="変数名"
                      aria-label={`ENV ${i + 1} の変数名`}
                      spellCheck={false}
                    />
                    <span className="df-list-sep">=</span>
                    <input
                      type="text"
                      className="df-input"
                      value={env.value}
                      onChange={(e) => updateEnv(i, { value: e.target.value })}
                      placeholder="値"
                      aria-label={`ENV ${i + 1} の値`}
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="df-remove-btn"
                      onClick={() => removeEnv(i)}
                      aria-label={`ENV ${i + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="df-add-btn"
                onClick={addEnv}
                aria-label="ENVを追加"
              >
                + ENVを追加
              </button>
            </div>

            {/* COPY */}
            <div className="df-field">
              <span className="df-label">COPY</span>
              <div className="df-list" aria-label="COPY一覧">
                {config.copies.map((copy, i) => (
                  <div key={i} className="df-list-item">
                    <input
                      type="text"
                      className="df-input"
                      value={copy.src}
                      onChange={(e) => updateCopy(i, { src: e.target.value })}
                      placeholder="コピー元"
                      aria-label={`COPY ${i + 1} のコピー元`}
                      spellCheck={false}
                    />
                    <span className="df-list-sep">→</span>
                    <input
                      type="text"
                      className="df-input"
                      value={copy.dest}
                      onChange={(e) => updateCopy(i, { dest: e.target.value })}
                      placeholder="コピー先"
                      aria-label={`COPY ${i + 1} のコピー先`}
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="df-remove-btn"
                      onClick={() => removeCopy(i)}
                      aria-label={`COPY ${i + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="df-add-btn"
                onClick={addCopy}
                aria-label="COPYを追加"
              >
                + COPYを追加
              </button>
            </div>

            {/* RUN */}
            <div className="df-field">
              <span className="df-label">RUN（複数はANDで結合）</span>
              <div className="df-list" aria-label="RUNコマンド一覧">
                {config.runs.map((run, i) => (
                  <div key={i} className="df-list-item">
                    <input
                      type="text"
                      className="df-input"
                      value={run}
                      onChange={(e) => updateRun(i, e.target.value)}
                      placeholder="npm install"
                      aria-label={`RUN ${i + 1} のコマンド`}
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="df-remove-btn"
                      onClick={() => removeRun(i)}
                      aria-label={`RUN ${i + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="df-add-btn"
                onClick={addRun}
                aria-label="RUNコマンドを追加"
              >
                + RUNを追加
              </button>
            </div>

            {/* EXPOSE */}
            <div className="df-field">
              <span className="df-label">EXPOSE（公開ポート）</span>
              <div className="df-list" aria-label="EXPOSEポート一覧">
                {config.ports.map((port, i) => (
                  <div key={i} className="df-list-item">
                    <input
                      type="text"
                      className="df-input"
                      value={port}
                      onChange={(e) => updatePort(i, e.target.value)}
                      placeholder="3000"
                      aria-label={`EXPOSE ${i + 1} のポート番号`}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      className="df-remove-btn"
                      onClick={() => removePort(i)}
                      aria-label={`EXPOSE ${i + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="df-add-btn"
                onClick={addPort}
                aria-label="EXPOSEポートを追加"
              >
                + EXPOSEを追加
              </button>
            </div>

            {/* USER */}
            <div className="df-field">
              <label className="df-label" htmlFor="df-user">
                USER（実行ユーザー・省略可）
              </label>
              <input
                id="df-user"
                type="text"
                className="df-input"
                value={config.user}
                onChange={(e) => update('user', e.target.value)}
                placeholder="node"
                aria-label="実行ユーザー（省略可）"
                spellCheck={false}
              />
            </div>

            {/* ENTRYPOINT */}
            <div className="df-field">
              <label className="df-label" htmlFor="df-entrypoint">
                ENTRYPOINT（省略可）
              </label>
              <input
                id="df-entrypoint"
                type="text"
                className="df-input"
                value={config.entrypoint}
                onChange={(e) => update('entrypoint', e.target.value)}
                placeholder='["/bin/app"] または /bin/sh -c'
                aria-label="ENTRYPOINT（省略可）"
                spellCheck={false}
              />
            </div>

            {/* CMD */}
            <div className="df-field">
              <label className="df-label" htmlFor="df-cmd">
                CMD（省略可）
              </label>
              <input
                id="df-cmd"
                type="text"
                className="df-input"
                value={config.cmd}
                onChange={(e) => update('cmd', e.target.value)}
                placeholder='["node", "server.js"] または node server.js'
                aria-label="CMD（省略可）"
                spellCheck={false}
              />
            </div>

            {/* リセット */}
            <div>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleReset}
                aria-label="設定をリセット"
              >
                リセット
              </Button>
            </div>
          </section>

          {/* 右: プレビュー */}
          <div className="df-preview-panel">
            <div className="df-preview-header">
              <span className="section-title">Dockerfile プレビュー</span>
              {result && (
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
                  onClick={handleCopy}
                  aria-label="Dockerfileをコピー"
                >
                  コピー
                </Button>
              )}
            </div>
            <div className="df-output-wrapper">
              <pre
                className="df-code-block"
                aria-label="生成されたDockerfile"
                aria-live="polite"
              >
                {result ? (
                  <code>{result}</code>
                ) : (
                  <span className="df-placeholder">
                    ベースイメージを入力するとDockerfileが生成されます
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'テンプレートボタンで代表的な設定を素早く読み込めます',
                '各フィールドを入力すると右のプレビューにDockerfileがリアルタイム生成されます',
                '「+追加」ボタンでARG・ENV・COPY・RUN・EXPOSEを複数設定できます',
                '「コピー」ボタンで生成されたDockerfileをクリップボードにコピーできます',
              ],
            },
            {
              title: '各命令の説明',
              items: [
                'FROM: ベースイメージを指定。AS でマルチステージビルドのエイリアスを設定可',
                'ARG: ビルド時に --build-arg で渡せる変数。デフォルト値の設定も可能',
                'WORKDIR: コンテナ内の作業ディレクトリ。以降の命令はここを基点に実行される',
                'ENV: コンテナ内の環境変数を設定。実行時にも引き継がれる',
                'COPY: ホストのファイル・ディレクトリをコンテナにコピー',
                'RUN: ビルド時に実行するコマンド。複数指定した場合は && で結合しレイヤーを節約',
                'EXPOSE: コンテナが公開するポートを宣言（実際の公開は -p オプションで行う）',
                'USER: コンテナ内でのプロセス実行ユーザーを指定（セキュリティのため非root推奨）',
                'ENTRYPOINT: コンテナ起動時の固定コマンド。JSON配列形式推奨',
                'CMD: ENTRYPOINTへのデフォルト引数、またはデフォルト実行コマンド',
              ],
            },
            {
              title: 'ベストプラクティス',
              items: [
                'Alpine系イメージはサイズが小さく本番環境に適しています（例: node:20-alpine）',
                'RUNコマンドは&&で繋げて1レイヤーにまとめるとイメージサイズを削減できます',
                'USER命令でroot以外のユーザーを指定するとセキュリティが向上します',
                'package*.json など変更頻度の低いファイルを先にCOPYするとビルドキャッシュが効きます',
                'マルチステージビルド（FROM ... AS builder）でビルド成果物のみを最終イメージに含められます',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
