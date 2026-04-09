import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { TipsCard } from "~/components/TipsCard";
import {
  type SortAlgorithm,
  type SortStep,
  ALGORITHM_LABELS,
  ALGORITHM_COMPLEXITY,
  generateArray,
  getSortSteps,
} from "~/utils/sort-visualizer";
import "../styles/tools/sort-visualizer.css";

export const Route = createFileRoute("/sort-visualizer")({
  head: () => ({
    meta: [
      { title: "ソートアルゴリズム可視化 | Web ツール集" },
      {
        name: "description",
        content:
          "バブルソート・選択ソート・挿入ソート・マージソート・クイックソートをアニメーションで可視化するツール。比較・交換の過程をリアルタイム表示。",
      },
      {
        property: "og:title",
        content: "ソートアルゴリズム可視化 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "バブルソート・選択ソート・挿入ソート・マージソート・クイックソートをアニメーションで可視化するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sort-visualizer` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ソートアルゴリズム可視化 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "バブルソート・選択ソート・挿入ソート・マージソート・クイックソートをアニメーションで可視化。",
      },
    ],
  }),
  component: SortVisualizerPage,
});

const ALGORITHMS: SortAlgorithm[] = ["bubble", "selection", "insertion", "merge", "quick"];

const SPEED_LABELS: Record<number, string> = {
  1: "超遅",
  2: "遅い",
  3: "普通",
  4: "速い",
  5: "超速",
};

/** スピード値からアニメーション間隔(ms)を計算 */
function speedToDelay(speed: number): number {
  return Math.round(600 / Math.pow(3, speed - 1));
}

/** SortStep からバーの状態を返す */
function getBarState(step: SortStep, idx: number): "comparing" | "swapping" | "sorted" | "normal" {
  if (step.swapping.includes(idx)) return "swapping";
  if (step.comparing.includes(idx)) return "comparing";
  if (step.sorted.includes(idx)) return "sorted";
  return "normal";
}

function SortVisualizerPage(): React.JSX.Element {
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>("bubble");
  const [arraySize, setArraySize] = useState(40);
  const [speed, setSpeed] = useState(3);
  const [array, setArray] = useState<number[]>(() => generateArray(40));
  const [currentStep, setCurrentStep] = useState<SortStep | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "done">("idle");
  const [stepCount, setStepCount] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const stepsRef = useRef<SortStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const shuffle = useCallback(() => {
    stopTimer();
    const newArr = generateArray(arraySize);
    setArray(newArr);
    setCurrentStep(null);
    setStatus("idle");
    setStepCount(0);
    setTotalSteps(0);
    stepsRef.current = [];
    stepIdxRef.current = 0;
  }, [arraySize, stopTimer]);

  // 配列サイズ変更時にリシャッフル
  useEffect(() => {
    shuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arraySize]);

  const runNextStep = useCallback(() => {
    const steps = stepsRef.current;
    const idx = stepIdxRef.current;
    if (idx >= steps.length) {
      setStatus("done");
      return;
    }
    setCurrentStep(steps[idx]);
    setStepCount(idx + 1);
    stepIdxRef.current = idx + 1;

    timerRef.current = setTimeout(runNextStep, speedToDelay(speedRef.current));
  }, []);

  const start = useCallback(() => {
    const steps = getSortSteps(algorithm, array);
    stepsRef.current = steps;
    stepIdxRef.current = 0;
    setTotalSteps(steps.length);
    setStatus("running");
    runNextStep();
  }, [algorithm, array, runNextStep]);

  const pause = useCallback(() => {
    stopTimer();
    setStatus("paused");
  }, [stopTimer]);

  const resume = useCallback(() => {
    setStatus("running");
    runNextStep();
  }, [runNextStep]);

  const reset = useCallback(() => {
    stopTimer();
    setCurrentStep(null);
    setStatus("idle");
    setStepCount(0);
    setTotalSteps(0);
    stepsRef.current = [];
    stepIdxRef.current = 0;
  }, [stopTimer]);

  // クリーンアップ
  useEffect(() => () => stopTimer(), [stopTimer]);

  const displayArray = currentStep?.array ?? array;
  const maxVal = Math.max(...displayArray);
  const complexity = ALGORITHM_COMPLEXITY[algorithm];

  return (
    <div className="sort-visualizer">
      <h1 className="sort-visualizer__title">ソートアルゴリズム可視化</h1>
      <p className="sort-visualizer__description">
        各ソートアルゴリズムの比較・交換の過程をアニメーションで確認できます。
      </p>

      {/* アルゴリズム選択 */}
      <div className="sort-visualizer__tabs" role="tablist">
        {ALGORITHMS.map((alg) => (
          <button
            key={alg}
            role="tab"
            aria-selected={algorithm === alg}
            className={`sort-visualizer__tab${algorithm === alg ? " sort-visualizer__tab--active" : ""}`}
            onClick={() => {
              setAlgorithm(alg);
              reset();
            }}
            disabled={status === "running"}
          >
            {ALGORITHM_LABELS[alg]}
          </button>
        ))}
      </div>

      {/* コントロールパネル */}
      <div className="sort-visualizer__controls">
        <div className="sort-visualizer__control-group">
          <span className="sort-visualizer__control-label">
            配列サイズ <span className="sort-visualizer__control-value">{arraySize}</span>
          </span>
          <input
            type="range"
            className="sort-visualizer__slider"
            min={10}
            max={80}
            value={arraySize}
            onChange={(e) => setArraySize(Number(e.target.value))}
            disabled={status === "running" || status === "paused"}
            aria-label="配列サイズ"
          />
        </div>
        <div className="sort-visualizer__control-group">
          <span className="sort-visualizer__control-label">
            速度 <span className="sort-visualizer__control-value">{SPEED_LABELS[speed]}</span>
          </span>
          <input
            type="range"
            className="sort-visualizer__slider"
            min={1}
            max={5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label="アニメーション速度"
          />
        </div>
        <div className="sort-visualizer__buttons">
          {status === "idle" && (
            <button className="sort-visualizer__btn sort-visualizer__btn--primary" onClick={start}>
              ▶ 開始
            </button>
          )}
          {status === "running" && (
            <button
              className="sort-visualizer__btn sort-visualizer__btn--secondary"
              onClick={pause}
            >
              ⏸ 一時停止
            </button>
          )}
          {status === "paused" && (
            <button className="sort-visualizer__btn sort-visualizer__btn--primary" onClick={resume}>
              ▶ 再開
            </button>
          )}
          {status === "done" && (
            <button
              className="sort-visualizer__btn sort-visualizer__btn--primary"
              onClick={shuffle}
            >
              🔀 新しい配列
            </button>
          )}
          <button
            className="sort-visualizer__btn sort-visualizer__btn--secondary"
            onClick={shuffle}
            disabled={status === "running"}
          >
            🔀 シャッフル
          </button>
          {(status === "paused" || status === "running") && (
            <button
              className="sort-visualizer__btn sort-visualizer__btn--secondary"
              onClick={reset}
            >
              ↺ リセット
            </button>
          )}
        </div>
      </div>

      {/* 統計 */}
      <div className="sort-visualizer__stats" aria-live="polite">
        <div className="sort-visualizer__stat">
          <span className="sort-visualizer__stat-label">ステップ</span>
          <span className="sort-visualizer__stat-value">{stepCount}</span>
        </div>
        {totalSteps > 0 && (
          <div className="sort-visualizer__stat">
            <span className="sort-visualizer__stat-label">合計</span>
            <span className="sort-visualizer__stat-value">{totalSteps}</span>
          </div>
        )}
        <div className="sort-visualizer__stat">
          <span className="sort-visualizer__stat-label">配列サイズ</span>
          <span className="sort-visualizer__stat-value">{arraySize}</span>
        </div>
      </div>

      {/* 棒グラフ */}
      <div className="sort-visualizer__canvas" role="img" aria-label="ソートアルゴリズムの可視化">
        {displayArray.map((val, idx) => {
          const state = currentStep ? getBarState(currentStep, idx) : "normal";
          return (
            <div
              key={idx}
              className={`sort-visualizer__bar sort-visualizer__bar--${state}`}
              style={{ height: `${(val / maxVal) * 100}%` }}
              title={String(val)}
            />
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="sort-visualizer__legend">
        <div className="sort-visualizer__legend-item">
          <div className="sort-visualizer__legend-dot sort-visualizer__legend-dot--normal" />
          通常
        </div>
        <div className="sort-visualizer__legend-item">
          <div className="sort-visualizer__legend-dot sort-visualizer__legend-dot--comparing" />
          比較中
        </div>
        <div className="sort-visualizer__legend-item">
          <div className="sort-visualizer__legend-dot sort-visualizer__legend-dot--swapping" />
          交換中
        </div>
        <div className="sort-visualizer__legend-item">
          <div className="sort-visualizer__legend-dot sort-visualizer__legend-dot--sorted" />
          確定済み
        </div>
      </div>

      {/* 完了メッセージ */}
      {status === "done" && (
        <p className="sort-visualizer__done">
          ✅ ソート完了！ {stepCount} ステップで整列しました。
        </p>
      )}

      {/* 計算量情報 */}
      <div className="sort-visualizer__complexity">
        <div className="sort-visualizer__complexity-title">
          {ALGORITHM_LABELS[algorithm]} の計算量
        </div>
        <div className="sort-visualizer__complexity-grid">
          <div className="sort-visualizer__complexity-header">最良</div>
          <div className="sort-visualizer__complexity-header">平均</div>
          <div className="sort-visualizer__complexity-header">最悪</div>
          <div className="sort-visualizer__complexity-header">空間</div>
          <div className="sort-visualizer__complexity-cell">{complexity.best}</div>
          <div className="sort-visualizer__complexity-cell">{complexity.average}</div>
          <div className="sort-visualizer__complexity-cell">{complexity.worst}</div>
          <div className="sort-visualizer__complexity-cell">{complexity.space}</div>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "Tips",
            items: [
              "「開始」ボタンでアニメーションを開始し、「一時停止」でいつでも停止できます",
              "速度スライダーで「超遅」に設定すると比較・交換の各ステップをじっくり観察できます",
              "バブルソートと選択ソートは O(n²) のため配列サイズが大きいほど遅くなります",
              "マージソートとクイックソートは O(n log n) で効率的ですが、クイックソートは最悪 O(n²) になる場合があります",
              "挿入ソートはほぼ整列済みの配列に対して最良 O(n) と高速です",
            ],
          },
        ]}
      />
    </div>
  );
}
