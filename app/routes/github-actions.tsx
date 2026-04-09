import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateWorkflow,
  defaultWorkflowConfig,
  GITHUB_ACTIONS_TEMPLATES,
  type WorkflowConfig,
  type JobConfig,
  type StepConfig,
  type RunnerOS,
} from "../utils/github-actions";
import "../styles/tools/github-actions.css";

export const Route = createFileRoute("/github-actions")({
  head: () => ({
    meta: [
      { title: "GitHub Actions ワークフロービルダー | Web ツール集" },
      {
        name: "description",
        content:
          "GUIでGitHub Actions ワークフローYAMLを生成するツール。トリガー・ジョブ・ステップをフォームで設定するだけでworkflow.ymlを自動生成。Node.js・Python・Docker・Cloudflare Workersのテンプレートを用意。ブラウザ内完結。",
      },
      {
        property: "og:title",
        content: "GitHub Actions ワークフロービルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "GUIでGitHub Actions ワークフローYAMLを生成。Node.js・Python・Docker・Cloudflare Workersのテンプレートを用意。ブラウザ内完結。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/github-actions` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "GitHub Actions ワークフロービルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "GUIでGitHub Actions ワークフローYAMLを生成するツール。ブラウザ内完結。",
      },
    ],
  }),
  component: GithubActionsPage,
});

/** runner OS の選択肢 */
const RUNNER_OPTIONS: { value: RunnerOS; label: string }[] = [
  { value: "ubuntu-latest", label: "ubuntu-latest" },
  { value: "ubuntu-22.04", label: "ubuntu-22.04" },
  { value: "ubuntu-20.04", label: "ubuntu-20.04" },
  { value: "macos-latest", label: "macos-latest" },
  { value: "windows-latest", label: "windows-latest" },
];

/**
 * GitHub Actions ワークフロービルダーページ
 */
function GithubActionsPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<WorkflowConfig>(defaultWorkflowConfig());

  const result = useMemo(() => generateWorkflow(config), [config]);

  const update = useCallback(<K extends keyof WorkflowConfig>(key: K, value: WorkflowConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTemplate = (template: (typeof GITHUB_ACTIONS_TEMPLATES)[number]) => {
    setConfig(template.config);
    announceStatus(`${template.label}テンプレートを読み込みました`);
  };

  const handleCopy = async () => {
    if (!result) return;
    const success = await copy(result);
    if (success) {
      showToast("ワークフローをコピーしました", "success");
      announceStatus("ワークフローをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleReset = () => {
    setConfig(defaultWorkflowConfig());
    announceStatus("設定をリセットしました");
  };

  // --- トリガー操作 ---
  const setPushBranches = (val: string) => {
    const branches = val
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    update("triggers", {
      ...config.triggers,
      push: branches.length > 0 ? { branches } : { branches: [val] },
    });
  };

  const setPullRequestBranches = (val: string) => {
    const branches = val
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    update("triggers", {
      ...config.triggers,
      pull_request: branches.length > 0 ? { branches } : { branches: [val] },
    });
  };

  const togglePush = (checked: boolean) => {
    update("triggers", {
      ...config.triggers,
      push: checked ? { branches: ["main"] } : null,
    });
  };

  const togglePullRequest = (checked: boolean) => {
    update("triggers", {
      ...config.triggers,
      pull_request: checked ? { branches: ["main"] } : null,
    });
  };

  const toggleWorkflowDispatch = (checked: boolean) => {
    update("triggers", {
      ...config.triggers,
      workflow_dispatch: checked,
    });
  };

  const toggleSchedule = (checked: boolean) => {
    update("triggers", {
      ...config.triggers,
      schedule: checked ? { cron: "0 0 * * *" } : null,
    });
  };

  const setScheduleCron = (cron: string) => {
    update("triggers", {
      ...config.triggers,
      schedule: { cron },
    });
  };

  const toggleRelease = (checked: boolean) => {
    update("triggers", {
      ...config.triggers,
      release: checked,
    });
  };

  // --- ジョブ操作（メイン1ジョブ） ---
  const mainJob: JobConfig = config.jobs[0] ?? {
    id: "build",
    name: "Build",
    runsOn: "ubuntu-latest",
    steps: [{ type: "checkout", enabled: true }],
    env: [],
  };

  const updateJob = (patch: Partial<JobConfig>) => {
    const updated = { ...mainJob, ...patch };
    update("jobs", [updated]);
  };

  // --- 環境変数操作 ---
  const addJobEnv = () => {
    updateJob({ env: [...(mainJob.env ?? []), { key: "", value: "" }] });
  };

  const removeJobEnv = (i: number) => {
    updateJob({
      env: (mainJob.env ?? []).filter((_, idx) => idx !== i),
    });
  };

  const updateJobEnv = (i: number, patch: Partial<{ key: string; value: string }>) => {
    updateJob({
      env: (mainJob.env ?? []).map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  };

  // --- グローバル環境変数操作 ---
  const addGlobalEnv = () => {
    update("globalEnv", [...config.globalEnv, { key: "", value: "" }]);
  };

  const removeGlobalEnv = (i: number) => {
    update(
      "globalEnv",
      config.globalEnv.filter((_, idx) => idx !== i),
    );
  };

  const updateGlobalEnv = (i: number, patch: Partial<{ key: string; value: string }>) => {
    update(
      "globalEnv",
      config.globalEnv.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );
  };

  // --- ステップ操作 ---
  const updateStep = (i: number, patch: Partial<StepConfig>) => {
    const newSteps = mainJob.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    updateJob({ steps: newSteps });
  };

  const toggleStep = (i: number, enabled: boolean) => {
    updateStep(i, { enabled });
  };

  const addRunStep = () => {
    const runSteps = mainJob.steps.filter((s) => s.type === "run");
    if (runSteps.length >= 5) {
      showToast("runステップは最大5つまでです", "error");
      return;
    }
    updateJob({
      steps: [...mainJob.steps, { type: "run", enabled: true, command: "" }],
    });
  };

  const removeRunStep = (i: number) => {
    const step = mainJob.steps[i];
    if (!step || step.type !== "run") return;
    updateJob({ steps: mainJob.steps.filter((_, idx) => idx !== i) });
  };

  // 固定ステップとrunステップを分けて扱う
  const getStepByType = (type: StepConfig["type"]) => mainJob.steps.find((s) => s.type === type);

  const getStepIndexByType = (type: StepConfig["type"]) =>
    mainJob.steps.findIndex((s) => s.type === type);

  const toggleFixedStep = (type: StepConfig["type"], checked: boolean) => {
    const idx = getStepIndexByType(type);
    if (idx >= 0) {
      updateStep(idx, { enabled: checked });
    } else if (checked) {
      updateJob({
        steps: [...mainJob.steps, { type, enabled: true }],
      });
    }
  };

  const updateFixedStep = (type: StepConfig["type"], patch: Partial<StepConfig>) => {
    const idx = getStepIndexByType(type);
    if (idx >= 0) {
      updateStep(idx, patch);
    }
  };

  const runSteps = mainJob.steps
    .map((s, i) => ({ step: s, idx: i }))
    .filter(({ step }) => step.type === "run");

  return (
    <>
      <div className="ga-container">
        {/* テンプレート選択 */}
        <div className="ga-templates" role="group" aria-label="テンプレートを読み込む">
          <span className="ga-templates-label">テンプレート：</span>
          {GITHUB_ACTIONS_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              className="ga-template-btn"
              onClick={() => handleTemplate(t)}
              aria-label={`${t.label}テンプレートを読み込む`}
              title={t.description}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* メインレイアウト */}
        <div className="ga-layout">
          {/* 左: フォーム */}
          <section className="ga-section" aria-label="GitHub Actions ワークフロー設定フォーム">
            {/* ワークフロー名 */}
            <div className="ga-field">
              <label className="ga-label" htmlFor="ga-name">
                ワークフロー名
              </label>
              <input
                id="ga-name"
                type="text"
                className="ga-input"
                value={config.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="CI"
                aria-label="ワークフロー名"
                spellCheck={false}
              />
            </div>

            {/* トリガー設定 */}
            <div className="ga-field">
              <span className="ga-label">トリガー（on）</span>
              <div className="ga-trigger-list" role="group" aria-label="トリガー設定">
                {/* push */}
                <div className="ga-trigger-item">
                  <div className="ga-trigger-row">
                    <input
                      type="checkbox"
                      id="ga-trigger-push"
                      className="ga-checkbox"
                      checked={config.triggers.push !== null}
                      onChange={(e) => togglePush(e.target.checked)}
                      aria-label="pushトリガーを有効にする"
                    />
                    <label htmlFor="ga-trigger-push" className="ga-checkbox-label">
                      push
                    </label>
                  </div>
                  {config.triggers.push !== null && (
                    <div className="ga-trigger-sub">
                      <span className="ga-sublabel">対象ブランチ（カンマ区切り）</span>
                      <input
                        type="text"
                        className="ga-input"
                        value={config.triggers.push.branches.join(", ")}
                        onChange={(e) => setPushBranches(e.target.value)}
                        placeholder="main, develop"
                        aria-label="pushトリガー対象ブランチ"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>

                {/* pull_request */}
                <div className="ga-trigger-item">
                  <div className="ga-trigger-row">
                    <input
                      type="checkbox"
                      id="ga-trigger-pr"
                      className="ga-checkbox"
                      checked={config.triggers.pull_request !== null}
                      onChange={(e) => togglePullRequest(e.target.checked)}
                      aria-label="pull_requestトリガーを有効にする"
                    />
                    <label htmlFor="ga-trigger-pr" className="ga-checkbox-label">
                      pull_request
                    </label>
                  </div>
                  {config.triggers.pull_request !== null && (
                    <div className="ga-trigger-sub">
                      <span className="ga-sublabel">対象ブランチ（カンマ区切り）</span>
                      <input
                        type="text"
                        className="ga-input"
                        value={config.triggers.pull_request.branches.join(", ")}
                        onChange={(e) => setPullRequestBranches(e.target.value)}
                        placeholder="main"
                        aria-label="pull_requestトリガー対象ブランチ"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>

                {/* workflow_dispatch */}
                <div className="ga-trigger-row">
                  <input
                    type="checkbox"
                    id="ga-trigger-dispatch"
                    className="ga-checkbox"
                    checked={config.triggers.workflow_dispatch}
                    onChange={(e) => toggleWorkflowDispatch(e.target.checked)}
                    aria-label="workflow_dispatchトリガーを有効にする"
                  />
                  <label htmlFor="ga-trigger-dispatch" className="ga-checkbox-label">
                    workflow_dispatch（手動実行）
                  </label>
                </div>

                {/* schedule */}
                <div className="ga-trigger-item">
                  <div className="ga-trigger-row">
                    <input
                      type="checkbox"
                      id="ga-trigger-schedule"
                      className="ga-checkbox"
                      checked={config.triggers.schedule !== null}
                      onChange={(e) => toggleSchedule(e.target.checked)}
                      aria-label="scheduleトリガーを有効にする"
                    />
                    <label htmlFor="ga-trigger-schedule" className="ga-checkbox-label">
                      schedule（定期実行）
                    </label>
                  </div>
                  {config.triggers.schedule !== null && (
                    <div className="ga-trigger-sub">
                      <span className="ga-sublabel">cron式</span>
                      <input
                        type="text"
                        className="ga-input"
                        value={config.triggers.schedule.cron}
                        onChange={(e) => setScheduleCron(e.target.value)}
                        placeholder="0 0 * * *"
                        aria-label="schedule cron式"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>

                {/* release */}
                <div className="ga-trigger-row">
                  <input
                    type="checkbox"
                    id="ga-trigger-release"
                    className="ga-checkbox"
                    checked={config.triggers.release}
                    onChange={(e) => toggleRelease(e.target.checked)}
                    aria-label="releaseトリガーを有効にする"
                  />
                  <label htmlFor="ga-trigger-release" className="ga-checkbox-label">
                    release（リリース時）
                  </label>
                </div>
              </div>
            </div>

            {/* グローバル環境変数 */}
            <div className="ga-field">
              <span className="ga-label">グローバル環境変数（env）</span>
              <div className="ga-list" aria-label="グローバル環境変数一覧">
                {config.globalEnv.map((e, i) => (
                  <div key={i} className="ga-list-item">
                    <input
                      type="text"
                      className="ga-input"
                      value={e.key}
                      onChange={(ev) => updateGlobalEnv(i, { key: ev.target.value })}
                      placeholder="変数名"
                      aria-label={`グローバル環境変数 ${i + 1} の変数名`}
                      spellCheck={false}
                    />
                    <span className="ga-list-sep">=</span>
                    <input
                      type="text"
                      className="ga-input"
                      value={e.value}
                      onChange={(ev) => updateGlobalEnv(i, { value: ev.target.value })}
                      placeholder="値"
                      aria-label={`グローバル環境変数 ${i + 1} の値`}
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="ga-remove-btn"
                      onClick={() => removeGlobalEnv(i)}
                      aria-label={`グローバル環境変数 ${i + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="ga-add-btn"
                onClick={addGlobalEnv}
                aria-label="グローバル環境変数を追加"
              >
                + 環境変数を追加
              </button>
            </div>

            {/* ジョブ設定 */}
            <div className="ga-field">
              <span className="ga-label">ジョブ設定</span>

              <div className="ga-form-group">
                <div className="ga-field">
                  <label className="ga-sublabel" htmlFor="ga-job-name">
                    ジョブ名
                  </label>
                  <input
                    id="ga-job-name"
                    type="text"
                    className="ga-input"
                    value={mainJob.name}
                    onChange={(e) => updateJob({ name: e.target.value })}
                    placeholder="Build"
                    aria-label="ジョブ名"
                    spellCheck={false}
                  />
                </div>

                <div className="ga-field">
                  <label className="ga-sublabel" htmlFor="ga-job-runner">
                    Runner OS
                  </label>
                  <select
                    id="ga-job-runner"
                    className="ga-select"
                    value={mainJob.runsOn}
                    onChange={(e) => updateJob({ runsOn: e.target.value as RunnerOS })}
                    aria-label="Runner OS の選択"
                  >
                    {RUNNER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ジョブ環境変数 */}
                <div className="ga-field">
                  <span className="ga-sublabel">ジョブ環境変数</span>
                  <div className="ga-list" aria-label="ジョブ環境変数一覧">
                    {(mainJob.env ?? []).map((e, i) => (
                      <div key={i} className="ga-list-item">
                        <input
                          type="text"
                          className="ga-input"
                          value={e.key}
                          onChange={(ev) => updateJobEnv(i, { key: ev.target.value })}
                          placeholder="変数名"
                          aria-label={`ジョブ環境変数 ${i + 1} の変数名`}
                          spellCheck={false}
                        />
                        <span className="ga-list-sep">=</span>
                        <input
                          type="text"
                          className="ga-input"
                          value={e.value}
                          onChange={(ev) => updateJobEnv(i, { value: ev.target.value })}
                          placeholder="値"
                          aria-label={`ジョブ環境変数 ${i + 1} の値`}
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          className="ga-remove-btn"
                          onClick={() => removeJobEnv(i)}
                          aria-label={`ジョブ環境変数 ${i + 1} を削除`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ga-add-btn"
                    onClick={addJobEnv}
                    aria-label="ジョブ環境変数を追加"
                  >
                    + 環境変数を追加
                  </button>
                </div>
              </div>
            </div>

            {/* ステップ設定 */}
            <div className="ga-field">
              <span className="ga-label">ステップ設定</span>

              {/* checkout（常時有効） */}
              <div className="ga-step-group">
                <div className="ga-step-header">
                  <input
                    type="checkbox"
                    className="ga-checkbox"
                    checked
                    disabled
                    aria-label="checkout（常時有効）"
                    readOnly
                  />
                  <span className="ga-checkbox-label ga-checkbox-label--disabled">
                    actions/checkout（常時有効）
                  </span>
                </div>
              </div>

              {/* setup-node */}
              {(() => {
                const step = getStepByType("setup-node");
                const idx = getStepIndexByType("setup-node");
                const enabled = step?.enabled ?? false;
                return (
                  <div className="ga-step-group">
                    <div className="ga-step-header">
                      <input
                        type="checkbox"
                        id="ga-step-node"
                        className="ga-checkbox"
                        checked={enabled}
                        onChange={(e) => toggleFixedStep("setup-node", e.target.checked)}
                        aria-label="setup-node ステップを有効にする"
                      />
                      <label htmlFor="ga-step-node" className="ga-checkbox-label">
                        actions/setup-node
                      </label>
                    </div>
                    {enabled && idx >= 0 && (
                      <div className="ga-step-detail">
                        <span className="ga-sublabel">Node.js バージョン</span>
                        <input
                          type="text"
                          className="ga-input"
                          value={step?.nodeVersion ?? "20"}
                          onChange={(e) =>
                            updateFixedStep("setup-node", {
                              nodeVersion: e.target.value,
                            })
                          }
                          placeholder="20"
                          aria-label="Node.js バージョン"
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* setup-python */}
              {(() => {
                const step = getStepByType("setup-python");
                const idx = getStepIndexByType("setup-python");
                const enabled = step?.enabled ?? false;
                return (
                  <div className="ga-step-group">
                    <div className="ga-step-header">
                      <input
                        type="checkbox"
                        id="ga-step-python"
                        className="ga-checkbox"
                        checked={enabled}
                        onChange={(e) => toggleFixedStep("setup-python", e.target.checked)}
                        aria-label="setup-python ステップを有効にする"
                      />
                      <label htmlFor="ga-step-python" className="ga-checkbox-label">
                        actions/setup-python
                      </label>
                    </div>
                    {enabled && idx >= 0 && (
                      <div className="ga-step-detail">
                        <span className="ga-sublabel">Python バージョン</span>
                        <input
                          type="text"
                          className="ga-input"
                          value={step?.pythonVersion ?? "3.11"}
                          onChange={(e) =>
                            updateFixedStep("setup-python", {
                              pythonVersion: e.target.value,
                            })
                          }
                          placeholder="3.11"
                          aria-label="Python バージョン"
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* cache */}
              {(() => {
                const step = getStepByType("cache");
                const idx = getStepIndexByType("cache");
                const enabled = step?.enabled ?? false;
                return (
                  <div className="ga-step-group">
                    <div className="ga-step-header">
                      <input
                        type="checkbox"
                        id="ga-step-cache"
                        className="ga-checkbox"
                        checked={enabled}
                        onChange={(e) => toggleFixedStep("cache", e.target.checked)}
                        aria-label="cache ステップを有効にする"
                      />
                      <label htmlFor="ga-step-cache" className="ga-checkbox-label">
                        actions/cache
                      </label>
                    </div>
                    {enabled && idx >= 0 && (
                      <div className="ga-step-detail">
                        <span className="ga-sublabel">キャッシュキー</span>
                        <input
                          type="text"
                          className="ga-input"
                          value={
                            step?.cacheKey ??
                            "node-modules-${{ hashFiles('**/package-lock.json') }}"
                          }
                          onChange={(e) =>
                            updateFixedStep("cache", {
                              cacheKey: e.target.value,
                            })
                          }
                          placeholder="node-modules-${{ hashFiles('**/package-lock.json') }}"
                          aria-label="キャッシュキー"
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* upload-artifact */}
              {(() => {
                const step = getStepByType("upload-artifact");
                const idx = getStepIndexByType("upload-artifact");
                const enabled = step?.enabled ?? false;
                return (
                  <div className="ga-step-group">
                    <div className="ga-step-header">
                      <input
                        type="checkbox"
                        id="ga-step-artifact"
                        className="ga-checkbox"
                        checked={enabled}
                        onChange={(e) => toggleFixedStep("upload-artifact", e.target.checked)}
                        aria-label="upload-artifact ステップを有効にする"
                      />
                      <label htmlFor="ga-step-artifact" className="ga-checkbox-label">
                        actions/upload-artifact
                      </label>
                    </div>
                    {enabled && idx >= 0 && (
                      <div className="ga-step-detail">
                        <span className="ga-sublabel">アーティファクト名</span>
                        <input
                          type="text"
                          className="ga-input"
                          value={step?.artifactName ?? "artifact"}
                          onChange={(e) =>
                            updateFixedStep("upload-artifact", {
                              artifactName: e.target.value,
                            })
                          }
                          placeholder="artifact"
                          aria-label="アーティファクト名"
                          spellCheck={false}
                        />
                        <span className="ga-sublabel">アーティファクトパス</span>
                        <input
                          type="text"
                          className="ga-input"
                          value={step?.artifactPath ?? "dist/"}
                          onChange={(e) =>
                            updateFixedStep("upload-artifact", {
                              artifactPath: e.target.value,
                            })
                          }
                          placeholder="dist/"
                          aria-label="アーティファクトパス"
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* run ステップ */}
              <div className="ga-field">
                <span className="ga-sublabel">run コマンド（最大5つ）</span>
                <div className="ga-list" aria-label="runコマンド一覧">
                  {runSteps.map(({ step, idx }) => (
                    <div key={idx} className="ga-list-item">
                      <input
                        type="text"
                        className="ga-input"
                        value={step.command ?? ""}
                        onChange={(e) => updateStep(idx, { command: e.target.value })}
                        placeholder="npm run build"
                        aria-label={`runコマンド ${idx + 1}`}
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        className="ga-remove-btn"
                        onClick={() => removeRunStep(idx)}
                        aria-label={`runコマンド ${idx + 1} を削除`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {runSteps.length < 5 && (
                  <button
                    type="button"
                    className="ga-add-btn"
                    onClick={addRunStep}
                    aria-label="runコマンドを追加"
                  >
                    + runを追加
                  </button>
                )}
              </div>
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
          <div className="ga-preview-panel">
            <div className="ga-preview-header">
              <span className="section-title">ワークフロー プレビュー</span>
              {result && (
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
                  onClick={handleCopy}
                  aria-label="ワークフローをコピー"
                >
                  コピー
                </Button>
              )}
            </div>
            <div className="ga-output-wrapper">
              <pre
                className="ga-code-block"
                aria-label="生成された GitHub Actions ワークフロー"
                aria-live="polite"
              >
                {result ? (
                  <code>{result}</code>
                ) : (
                  <span className="ga-placeholder">設定を入力するとワークフローが生成されます</span>
                )}
              </pre>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "テンプレートボタンで代表的な設定を素早く読み込めます",
                "トリガー・ジョブ・ステップを設定すると右のプレビューにYAMLがリアルタイム生成されます",
                "「コピー」ボタンで生成されたワークフローをクリップボードにコピーできます",
                "生成されたYAMLを .github/workflows/ci.yml として保存してください",
              ],
            },
            {
              title: "トリガーの説明",
              items: [
                "push: 指定ブランチへのpush時に実行",
                "pull_request: 指定ブランチへのPR時に実行",
                "workflow_dispatch: GitHubのUIから手動実行",
                "schedule: cron式で定期実行（UTC時刻）",
                "release: リリース公開時に実行",
              ],
            },
            {
              title: "テンプレート一覧",
              items: [
                "Node.js CI: lint・test・buildを実行するCI",
                "Python CI: pytestでテストを実行するCI",
                "Docker Build & Push: GHCRへDockerイメージをプッシュ",
                "Cloudflare Workers Deploy: wranglerでデプロイ",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
