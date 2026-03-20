import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/bpm")({
  head: () => ({
    meta: [
      { title: "BPM / タップテンポ | Web ツール集" },
      {
        name: "description",
        content:
          "タップしてBPM（テンポ）を計測するツール。音楽のテンポ確認・メトロノームのリファレンスに便利。",
      },
      { property: "og:title", content: "BPM / タップテンポ | Web ツール集" },
      {
        property: "og:description",
        content:
          "タップしてBPM（テンポ）を計測するツール。音楽のテンポ確認・メトロノームのリファレンスに便利。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/bpm` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "BPM / タップテンポ | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "タップしてBPM（テンポ）を計測するツール。音楽のテンポ確認・メトロノームのリファレンスに便利。",
      },
    ],
  }),
  component: BpmTapper,
});

/** タップの有効期限（ms）: この時間を超えたら計測をリセット */
const TAP_TIMEOUT_MS = 3000;

/** BPM計算に使用する最大タップ数 */
const MAX_TAPS = 64;

/**
 * タップ間隔の配列からBPMを計算する
 * @param timestamps - タップした時刻のミリ秒タイムスタンプ配列（2件以上必要）
 * @returns BPM（小数点以下1桁）、タップが2件未満の場合は0
 * @example
 * calculateBpm([0, 500, 1000]) // 120（500ms間隔 = 120BPM）
 */
export function calculateBpm(timestamps: number[]): number {
  if (timestamps.length < 2) return 0;
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const avgInterval =
    intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
  if (avgInterval <= 0) return 0;
  return Math.round((60000 / avgInterval) * 10) / 10;
}

/**
 * BPMに対応するテンポ記号（イタリア語）を返す
 * @param bpm - BPM値
 * @returns テンポ記号文字列
 * @example
 * getTempoLabel(72)  // "Adagio"
 * getTempoLabel(120) // "Allegro"
 */
export function getTempoLabel(bpm: number): string {
  if (bpm <= 0) return "—";
  if (bpm < 40) return "Larghissimo";
  if (bpm < 60) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}

/**
 * BPMから拍子の時間間隔（ms）を計算する
 * @param bpm - BPM値（1以上）
 * @returns 1拍あたりのミリ秒、bpmが0以下の場合は0
 */
export function bpmToIntervalMs(bpm: number): number {
  if (bpm <= 0) return 0;
  return Math.round(60000 / bpm);
}

/**
 * BPMタップテンポコンポーネント
 * タップによってBPMをリアルタイム計測するツール
 */
function BpmTapper() {
  const [taps, setTaps] = useState<number[]>([]);
  const [flash, setFlash] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bpm = calculateBpm(taps);
  const tempoLabel = getTempoLabel(bpm);
  const intervalMs = bpmToIntervalMs(bpm);

  const handleTap = useCallback(() => {
    const now = Date.now();

    setTaps((prev) => {
      // 前回タップから一定時間経過していたらリセット
      if (prev.length > 0 && now - prev[prev.length - 1] > TAP_TIMEOUT_MS) {
        return [now];
      }
      const next = [...prev, now];
      // 最大タップ数を超えたら古いものを削除
      return next.length > MAX_TAPS ? next.slice(-MAX_TAPS) : next;
    });

    // タップフラッシュ演出
    setFlash(true);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setFlash(false), 120);

    // タイムアウトタイマーをリセット
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTaps([]);
    }, TAP_TIMEOUT_MS);
  }, []);

  const handleReset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (flashRef.current) clearTimeout(flashRef.current);
    setTaps([]);
    setFlash(false);
  }, []);

  // キーボードショートカット（スペースキーでタップ）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTap]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
    };
  }, []);

  const tapCount = taps.length;
  const isActive = tapCount >= 2;

  return (
    <main className="tool-layout">
      <h1 className="tool-title">BPM / タップテンポ</h1>
      <p className="tool-description">
        ボタンを叩いてBPM（テンポ）を計測します。スペースキーでも操作できます。
      </p>

      {/* BPM表示 */}
      <section className="bpm-display-section" aria-label="BPM表示">
        <div
          className={`bpm-display${flash ? " bpm-display--flash" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="bpm-value" aria-label={`BPM ${isActive ? bpm : "—"}`}>
            {isActive ? bpm.toFixed(1) : "—"}
          </span>
          <span className="bpm-unit">BPM</span>
        </div>

        {/* テンポラベルと間隔表示 */}
        <div className="bpm-tempo-row" aria-label="テンポ情報">
          <span className="bpm-tempo-label">{tempoLabel}</span>
          {isActive && (
            <span className="bpm-interval" aria-label={`拍間隔 ${intervalMs}ミリ秒`}>
              {intervalMs} ms / 拍
            </span>
          )}
        </div>
      </section>

      {/* タップボタン */}
      <section className="bpm-tap-section" aria-label="タップ操作">
        <button
          className={`bpm-tap-btn${flash ? " bpm-tap-btn--active" : ""}`}
          onClick={handleTap}
          aria-label="タップ（スペースキーでも操作可）"
        >
          <span className="bpm-tap-icon" aria-hidden="true">🥁</span>
          <span className="bpm-tap-text">
            {tapCount === 0 ? "タップしてスタート" : "タップ"}
          </span>
        </button>
      </section>

      {/* タップ回数とリセット */}
      <section className="bpm-controls" aria-label="計測情報と操作">
        <div className="bpm-tap-count" aria-label={`タップ回数 ${tapCount}回`}>
          <span className="bpm-tap-count-num">{tapCount}</span>
          <span className="bpm-tap-count-label">タップ</span>
        </div>

        <Button
          className="bpm-reset-btn"
          onClick={handleReset}
          disabled={tapCount === 0}
          aria-label="計測リセット"
        >
          リセット
        </Button>
      </section>

      {/* テンポ早見表 */}
      <TipsCard title="テンポ記号の目安">
        <div className="bpm-tips-table" role="table" aria-label="テンポ記号早見表">
          <div className="bpm-tips-row bpm-tips-header" role="row">
            <span role="columnheader">テンポ記号</span>
            <span role="columnheader">BPM目安</span>
            <span role="columnheader">意味</span>
          </div>
          {[
            { label: "Larghissimo", range: "〜39", meaning: "非常に遅く" },
            { label: "Largo", range: "40〜59", meaning: "広く、遅く" },
            { label: "Adagio", range: "66〜75", meaning: "ゆっくり" },
            { label: "Andante", range: "76〜107", meaning: "歩く速さで" },
            { label: "Moderato", range: "108〜119", meaning: "中くらいの速さ" },
            { label: "Allegro", range: "120〜155", meaning: "速く、快活に" },
            { label: "Vivace", range: "156〜175", meaning: "生き生きと" },
            { label: "Presto", range: "176〜199", meaning: "非常に速く" },
            { label: "Prestissimo", range: "200〜", meaning: "できる限り速く" },
          ].map(({ label, range, meaning }) => (
            <div
              key={label}
              className={`bpm-tips-row${isActive && tempoLabel === label ? " bpm-tips-row--active" : ""}`}
              role="row"
            >
              <span role="cell" className="bpm-tips-name">{label}</span>
              <span role="cell" className="bpm-tips-range">{range}</span>
              <span role="cell" className="bpm-tips-meaning">{meaning}</span>
            </div>
          ))}
        </div>
      </TipsCard>
    </main>
  );
}
