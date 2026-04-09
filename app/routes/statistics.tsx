import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import type React from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  parseNumbers,
  calculateStatistics,
  calculateFrequencyDistribution,
  formatNum,
} from "../utils/statistics";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "統計計算ツール | Web ツール集" },
      {
        name: "description",
        content:
          "数値データの記述統計を計算するツール。平均・中央値・最頻値・分散・標準偏差・四分位数・歪度・尖度・度数分布などをブラウザ内で即座に算出。",
      },
      { property: "og:title", content: "統計計算ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "数値データの記述統計を計算するツール。平均・中央値・最頻値・分散・標準偏差・四分位数・歪度・尖度・度数分布などをブラウザ内で即座に算出。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/statistics` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "統計計算ツール | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "数値データの記述統計を計算するツール。平均・中央値・最頻値・分散・標準偏差・四分位数・歪度・尖度・度数分布などをブラウザ内で即座に算出。",
      },
    ],
  }),
  component: StatisticsPage,
});

/** サンプルデータ */
const SAMPLE_DATA: { label: string; data: string }[] = [
  {
    label: "身長データ",
    data: "158, 162, 165, 167, 170, 172, 173, 175, 178, 180, 183, 185",
  },
  {
    label: "テスト点数",
    data: "45, 52, 58, 60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88, 90, 92, 95",
  },
  {
    label: "正規分布風",
    data: "2, 4, 4, 4, 5, 5, 7, 9",
  },
  {
    label: "外れ値あり",
    data: "10, 11, 12, 12, 13, 13, 14, 14, 15, 100",
  },
];

/**
 * 歪度の解釈を返す
 */
function interpretSkewness(skewness: number): string {
  if (Math.abs(skewness) < 0.5) return "ほぼ対称";
  if (skewness > 1) return "強い右裾（正の歪み）";
  if (skewness > 0.5) return "やや右裾";
  if (skewness < -1) return "強い左裾（負の歪み）";
  return "やや左裾";
}

/**
 * 尖度の解釈を返す
 */
function interpretKurtosis(kurtosis: number): string {
  if (Math.abs(kurtosis) < 0.5) return "正規分布に近い（中尖）";
  if (kurtosis > 1) return "ピークが鋭い（尖尖）";
  if (kurtosis > 0.5) return "やや尖った分布";
  if (kurtosis < -1) return "平坦な分布（低尖）";
  return "やや平坦な分布";
}

/**
 * 統計計算ページ
 */
function StatisticsPage() {
  const [input, setInput] = useState("");

  const numbers = useMemo(() => parseNumbers(input), [input]);

  const stats = useMemo(() => calculateStatistics(numbers), [numbers]);

  const freqDist = useMemo(() => calculateFrequencyDistribution(numbers), [numbers]);

  const maxFreqCount = useMemo(
    () => (freqDist.length > 0 ? Math.max(...freqDist.map((b) => b.count)) : 1),
    [freqDist],
  );

  const handleSample = useCallback((data: string) => {
    setInput(data);
  }, []);

  return (
    <div className="tool-container">
      <h2 className="section-title">統計計算ツール</h2>

      <div className="statistics-layout">
        {/* 入力エリア */}
        <div className="statistics-input-section">
          <label htmlFor="stats-input" className="statistics-input-label">
            数値データを入力
          </label>
          <textarea
            id="stats-input"
            className="statistics-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1, 2, 3, 4, 5&#10;または改行区切りで入力"
            aria-label="統計計算する数値データを入力"
          />
          <p className="statistics-input-hint">
            カンマ・スペース・改行・タブ区切りで入力してください
          </p>
          <div className="statistics-samples">
            <span className="statistics-samples-label">サンプル:</span>
            {SAMPLE_DATA.map((s) => (
              <Button
                key={s.label}
                variant="outline"
                size="sm"
                onClick={() => handleSample(s.data)}
              >
                {s.label}
              </Button>
            ))}
          </div>
          {numbers.length > 0 && (
            <div className="statistics-count-badge">
              <span>📊</span>
              <span>{numbers.length} 件のデータを解析中</span>
            </div>
          )}
        </div>

        {/* 結果エリア */}
        {stats === null ? (
          <div className="statistics-empty">
            <span className="statistics-empty-icon">📈</span>
            <p>数値データを入力すると統計が表示されます</p>
          </div>
        ) : (
          <div className="statistics-results">
            {/* 基本統計 */}
            <div>
              <p className="statistics-section-title">基本統計量</p>
              <div className="statistics-cards">
                <div className="statistics-card highlight">
                  <p className="statistics-card-label">平均 (Mean)</p>
                  <p className="statistics-card-value">{formatNum(stats.mean)}</p>
                </div>
                <div className="statistics-card highlight">
                  <p className="statistics-card-label">中央値 (Median)</p>
                  <p className="statistics-card-value">{formatNum(stats.median)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">最頻値 (Mode)</p>
                  {stats.mode.length > 3 ? (
                    <p className="statistics-card-value">{stats.mode.length} 種類</p>
                  ) : (
                    <div className="statistics-mode-list">
                      {stats.mode.map((m) => (
                        <span key={m} className="statistics-mode-tag">
                          {formatNum(m)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">件数 (Count)</p>
                  <p className="statistics-card-value">{stats.count}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">合計 (Sum)</p>
                  <p className="statistics-card-value">{formatNum(stats.sum)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">最小値 (Min)</p>
                  <p className="statistics-card-value">{formatNum(stats.min)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">最大値 (Max)</p>
                  <p className="statistics-card-value">{formatNum(stats.max)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">範囲 (Range)</p>
                  <p className="statistics-card-value">{formatNum(stats.range)}</p>
                </div>
              </div>
            </div>

            {/* 散布度 */}
            <div>
              <p className="statistics-section-title">散布度</p>
              <div className="statistics-cards">
                <div className="statistics-card highlight">
                  <p className="statistics-card-label">標本標準偏差 (s)</p>
                  <p className="statistics-card-value">{formatNum(stats.stddevSample)}</p>
                  <p className="statistics-card-sub">÷(n−1)</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">母標準偏差 (σ)</p>
                  <p className="statistics-card-value">{formatNum(stats.stddevPopulation)}</p>
                  <p className="statistics-card-sub">÷n</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">標本分散 (s²)</p>
                  <p className="statistics-card-value">{formatNum(stats.varianceSample)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">母分散 (σ²)</p>
                  <p className="statistics-card-value">{formatNum(stats.variancePopulation)}</p>
                </div>
                {stats.cv !== null && (
                  <div className="statistics-card">
                    <p className="statistics-card-label">変動係数 (CV)</p>
                    <p className="statistics-card-value">{formatNum(stats.cv)}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* 四分位数 */}
            <div>
              <p className="statistics-section-title">四分位数</p>
              <div className="statistics-cards">
                <div className="statistics-card">
                  <p className="statistics-card-label">Q1 (25%ile)</p>
                  <p className="statistics-card-value">{formatNum(stats.q1)}</p>
                </div>
                <div className="statistics-card highlight">
                  <p className="statistics-card-label">Q2 / 中央値 (50%ile)</p>
                  <p className="statistics-card-value">{formatNum(stats.median)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">Q3 (75%ile)</p>
                  <p className="statistics-card-value">{formatNum(stats.q3)}</p>
                </div>
                <div className="statistics-card">
                  <p className="statistics-card-label">IQR (Q3−Q1)</p>
                  <p className="statistics-card-value">{formatNum(stats.iqr)}</p>
                </div>
              </div>
            </div>

            {/* 分布の形 */}
            {(stats.skewness !== null || stats.kurtosis !== null) && (
              <div>
                <p className="statistics-section-title">分布の形状</p>
                <div className="statistics-cards">
                  {stats.skewness !== null && (
                    <div className="statistics-card">
                      <p className="statistics-card-label">歪度 (Skewness)</p>
                      <p className="statistics-card-value">{formatNum(stats.skewness)}</p>
                      <p className="statistics-card-sub">{interpretSkewness(stats.skewness)}</p>
                    </div>
                  )}
                  {stats.kurtosis !== null && (
                    <div className="statistics-card">
                      <p className="statistics-card-label">尖度 (Kurtosis)</p>
                      <p className="statistics-card-value">{formatNum(stats.kurtosis)}</p>
                      <p className="statistics-card-sub">{interpretKurtosis(stats.kurtosis)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* その他の平均 */}
            {(stats.geometricMean !== null || stats.harmonicMean !== null) && (
              <div>
                <p className="statistics-section-title">その他の平均</p>
                <div className="statistics-cards">
                  {stats.geometricMean !== null && (
                    <div className="statistics-card">
                      <p className="statistics-card-label">幾何平均</p>
                      <p className="statistics-card-value">{formatNum(stats.geometricMean)}</p>
                      <p className="statistics-card-sub">n乗根(積)</p>
                    </div>
                  )}
                  {stats.harmonicMean !== null && (
                    <div className="statistics-card">
                      <p className="statistics-card-label">調和平均</p>
                      <p className="statistics-card-value">{formatNum(stats.harmonicMean)}</p>
                      <p className="statistics-card-sub">n÷(逆数の和)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 度数分布 */}
            {freqDist.length > 0 && (
              <div>
                <p className="statistics-section-title">度数分布</p>
                <table className="statistics-freq-table" aria-label="度数分布表">
                  <thead>
                    <tr>
                      <th>階級</th>
                      <th>度数</th>
                      <th>相対度数</th>
                      <th>累積度数</th>
                      <th>分布</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freqDist.map((bin, i) => (
                      <tr key={i}>
                        <td>{bin.label}</td>
                        <td>{bin.count}</td>
                        <td>{(bin.relative * 100).toFixed(1)}%</td>
                        <td>
                          {bin.cumulative} ({(bin.cumulativeRelative * 100).toFixed(1)}%)
                        </td>
                        <td>
                          <div className="statistics-freq-bar-cell">
                            <div
                              className="statistics-freq-bar"
                              style={
                                {
                                  "--bar-width": `${(bin.count / maxFreqCount) * 120}px`,
                                } as React.CSSProperties
                              }
                              role="img"
                              aria-label={`${(bin.relative * 100).toFixed(1)}%`}
                            />
                            <span className="statistics-freq-bar-pct">{bin.count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <TipsCard>
          <ul>
            <li>カンマ・スペース・改行・タブ区切りの数値を入力できます</li>
            <li>標本標準偏差は n-1 で割り算、母標準偏差は n で割り算します</li>
            <li>幾何平均はすべて正の値の場合のみ表示されます</li>
            <li>調和平均は 0 を含まない場合のみ表示されます</li>
            <li>度数分布のビン数はスタージェスの公式で自動計算されます</li>
          </ul>
        </TipsCard>
      </div>
    </div>
  );
}
