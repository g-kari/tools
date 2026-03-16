import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import "../styles/tools/date-calc.css";
import {
  calculateDateDiff,
  addDuration,
  getDateInfo,
  formatDateJa,
  toDatetimeLocalString,
  type DurationUnit,
  type DateOperation,
} from "~/utils/date-calc";

export const Route = createFileRoute("/date-calc")({
  head: () => ({
    meta: [
      { title: "日付計算ツール | Web ツール集" },
      {
        name: "description",
        content:
          "2つの日付の差を計算・日付の加算/減算・日付情報の確認ができる日付計算ツール。ISO週番号・曜日・年の何日目かなどを表示。",
      },
      { property: "og:title", content: "日付計算ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "2つの日付の差を計算・日付の加算/減算・日付情報の確認ができる日付計算ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/date-calc` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "日付計算ツール | Web ツール集" },
      {
        name: "twitter:description",
        content: "2つの日付の差を計算・日付の加算/減算ができる日付計算ツール。",
      },
    ],
  }),
  component: DateCalcPage,
});

function getNow(): string {
  return toDatetimeLocalString(new Date());
}

function DateCalcPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();

  // ── セクション1: 日付差計算 ──
  const [diffDate1, setDiffDate1] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toDatetimeLocalString(d);
  });
  const [diffDate2, setDiffDate2] = useState<string>(getNow);

  const diffResult = useMemo(() => {
    if (!diffDate1 || !diffDate2) return null;
    const d1 = new Date(diffDate1);
    const d2 = new Date(diffDate2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    return calculateDateDiff(d1, d2);
  }, [diffDate1, diffDate2]);

  const handleSwapDates = useCallback(() => {
    setDiffDate1(diffDate2);
    setDiffDate2(diffDate1);
    announceStatus("日付を入れ替えました");
  }, [diffDate1, diffDate2, announceStatus]);

  // ── セクション2: 日付加算/減算 ──
  const [arithDate, setArithDate] = useState<string>(getNow);
  const [arithAmount, setArithAmount] = useState<string>("7");
  const [arithUnit, setArithUnit] = useState<DurationUnit>("days");
  const [arithOp, setArithOp] = useState<DateOperation>("add");

  const arithResult = useMemo(() => {
    if (!arithDate) return null;
    const d = new Date(arithDate);
    if (isNaN(d.getTime())) return null;
    const amount = parseInt(arithAmount, 10);
    if (isNaN(amount) || amount < 0) return null;
    return addDuration(d, amount, arithUnit, arithOp);
  }, [arithDate, arithAmount, arithUnit, arithOp]);

  const handleCopyArithResult = useCallback(async () => {
    if (!arithResult) return;
    const text = formatDateJa(arithResult);
    const success = await copy(text);
    if (success) {
      showToast("計算結果をコピーしました", "success");
      announceStatus("計算結果をクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [arithResult, copy, showToast, announceStatus]);

  // ── セクション3: 日付情報 ──
  const [infoDate, setInfoDate] = useState<string>(getNow);

  const dateInfo = useMemo(() => {
    if (!infoDate) return null;
    const d = new Date(infoDate);
    if (isNaN(d.getTime())) return null;
    return getDateInfo(d);
  }, [infoDate]);

  return (
    <>
      <div className="date-calc-container">
        {/* ── 日付差計算 ── */}
        <section
          className="date-calc-section"
          aria-labelledby="diff-section-title"
        >
          <h2 className="date-calc-section-title" id="diff-section-title">
            日付差計算
          </h2>

          <div className="date-calc-input-row">
            <span className="date-calc-input-label">開始</span>
            <input
              type="datetime-local"
              className="date-calc-datetime-input"
              value={diffDate1}
              onChange={(e) => setDiffDate1(e.target.value)}
              aria-label="開始日時"
            />
            <button
              type="button"
              className="date-calc-now-btn"
              onClick={() => setDiffDate1(getNow())}
              aria-label="開始日時を現在時刻に設定"
            >
              今
            </button>
          </div>

          <div className="date-calc-input-row">
            <span className="date-calc-input-label">終了</span>
            <input
              type="datetime-local"
              className="date-calc-datetime-input"
              value={diffDate2}
              onChange={(e) => setDiffDate2(e.target.value)}
              aria-label="終了日時"
            />
            <button
              type="button"
              className="date-calc-now-btn"
              onClick={() => setDiffDate2(getNow())}
              aria-label="終了日時を現在時刻に設定"
            >
              今
            </button>
          </div>

          <div>
            <button
              type="button"
              className="date-calc-swap-btn"
              onClick={handleSwapDates}
              aria-label="開始日時と終了日時を入れ替える"
            >
              ⇅ 入れ替え
            </button>
          </div>

          {diffResult !== null && (
            <div
              className="date-calc-result"
              role="region"
              aria-label="日付差の計算結果"
              aria-live="polite"
            >
              <div className="date-calc-result-header">
                {diffResult.isNegative ? "（終了 < 開始 → 逆順）" : "日付の差"}
              </div>

              {/* 年・月・日・時・分・秒 内訳 */}
              <div className="date-calc-result-grid">
                <div className="date-calc-result-item">
                  <span className="date-calc-result-label">年</span>
                  <span
                    className={`date-calc-result-value${diffResult.isNegative ? " date-calc-sign-negative" : ""}`}
                  >
                    {diffResult.years}
                  </span>
                </div>
                <div className="date-calc-result-item">
                  <span className="date-calc-result-label">ヶ月</span>
                  <span className="date-calc-result-value">
                    {diffResult.months}
                  </span>
                </div>
                <div className="date-calc-result-item">
                  <span className="date-calc-result-label">日</span>
                  <span className="date-calc-result-value">
                    {diffResult.days}
                  </span>
                </div>
                <div className="date-calc-result-item">
                  <span className="date-calc-result-label">時</span>
                  <span className="date-calc-result-value">
                    {diffResult.hours}
                  </span>
                </div>
                <div className="date-calc-result-item">
                  <span className="date-calc-result-label">分</span>
                  <span className="date-calc-result-value">
                    {diffResult.minutes}
                  </span>
                </div>
                <div className="date-calc-result-item">
                  <span className="date-calc-result-label">秒</span>
                  <span className="date-calc-result-value">
                    {diffResult.seconds}
                  </span>
                </div>
              </div>

              {/* 合計 */}
              <div className="date-calc-result-divider">
                <div className="date-calc-total-row">
                  <span className="date-calc-total-label">合計日数</span>
                  <span className="date-calc-total-value">
                    {diffResult.totalDays.toLocaleString()} 日
                  </span>
                </div>
                <div className="date-calc-total-row">
                  <span className="date-calc-total-label">合計時間</span>
                  <span className="date-calc-total-value">
                    {diffResult.totalHours.toLocaleString()} 時間
                  </span>
                </div>
                <div className="date-calc-total-row">
                  <span className="date-calc-total-label">合計分</span>
                  <span className="date-calc-total-value">
                    {diffResult.totalMinutes.toLocaleString()} 分
                  </span>
                </div>
                <div className="date-calc-total-row">
                  <span className="date-calc-total-label">合計秒</span>
                  <span className="date-calc-total-value">
                    {diffResult.totalSeconds.toLocaleString()} 秒
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── 日付加算/減算 ── */}
        <section
          className="date-calc-section"
          aria-labelledby="arith-section-title"
        >
          <h2 className="date-calc-section-title" id="arith-section-title">
            日付の加算 / 減算
          </h2>

          <div className="date-calc-input-row">
            <span className="date-calc-input-label">基準日</span>
            <input
              type="datetime-local"
              className="date-calc-datetime-input"
              value={arithDate}
              onChange={(e) => setArithDate(e.target.value)}
              aria-label="基準日時"
            />
            <button
              type="button"
              className="date-calc-now-btn"
              onClick={() => setArithDate(getNow())}
              aria-label="基準日時を現在時刻に設定"
            >
              今
            </button>
          </div>

          <div className="date-calc-arith-row">
            <select
              className="date-calc-select"
              value={arithOp}
              onChange={(e) => setArithOp(e.target.value as DateOperation)}
              aria-label="加算または減算"
            >
              <option value="add">＋ 加算</option>
              <option value="subtract">－ 減算</option>
            </select>

            <input
              type="number"
              className="date-calc-amount-input"
              value={arithAmount}
              onChange={(e) => setArithAmount(e.target.value)}
              min={0}
              max={9999}
              aria-label="加算/減算する量"
              placeholder="7"
            />

            <select
              className="date-calc-select"
              value={arithUnit}
              onChange={(e) => setArithUnit(e.target.value as DurationUnit)}
              aria-label="単位"
            >
              <option value="minutes">分</option>
              <option value="hours">時間</option>
              <option value="days">日</option>
              <option value="weeks">週</option>
              <option value="months">ヶ月</option>
              <option value="years">年</option>
            </select>
          </div>

          {arithResult !== null && (
            <div
              className="date-calc-result"
              role="region"
              aria-label="日付計算の結果"
              aria-live="polite"
            >
              <div className="date-calc-result-header">計算結果</div>
              <div className="date-calc-total-row">
                <span className="date-calc-total-label">結果</span>
                <span className="date-calc-total-value">
                  {formatDateJa(arithResult)}
                </span>
                <button
                  type="button"
                  className="date-calc-now-btn"
                  onClick={handleCopyArithResult}
                  aria-label="計算結果をコピー"
                >
                  コピー
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── 日付情報 ── */}
        <section
          className="date-calc-section"
          aria-labelledby="info-section-title"
        >
          <h2 className="date-calc-section-title" id="info-section-title">
            日付情報
          </h2>

          <div className="date-calc-input-row">
            <span className="date-calc-input-label">日付</span>
            <input
              type="datetime-local"
              className="date-calc-datetime-input"
              value={infoDate}
              onChange={(e) => setInfoDate(e.target.value)}
              aria-label="情報を確認する日時"
            />
            <button
              type="button"
              className="date-calc-now-btn"
              onClick={() => setInfoDate(getNow())}
              aria-label="現在時刻に設定"
            >
              今
            </button>
          </div>

          {dateInfo !== null && (
            <div
              className="date-info-grid"
              role="region"
              aria-label="日付詳細情報"
              aria-live="polite"
            >
              <div className="date-info-item">
                <span className="date-info-label">曜日</span>
                <span className="date-info-value">{dateInfo.dayOfWeek}</span>
                <span className="date-info-sub">{dateInfo.dayOfWeekEn}</span>
              </div>
              <div className="date-info-item">
                <span className="date-info-label">ISO 週番号</span>
                <span className="date-info-value">
                  第 {dateInfo.weekNumber} 週
                </span>
              </div>
              <div className="date-info-item">
                <span className="date-info-label">年の何日目</span>
                <span className="date-info-value">
                  {dateInfo.dayOfYear} 日目
                </span>
              </div>
              <div className="date-info-item">
                <span className="date-info-label">四半期</span>
                <span className="date-info-value">Q{dateInfo.quarter}</span>
              </div>
              <div className="date-info-item">
                <span className="date-info-label">月の日数</span>
                <span className="date-info-value">{dateInfo.daysInMonth} 日</span>
              </div>
              <div className="date-info-item">
                <span className="date-info-label">閏年</span>
                <span className="date-info-value">
                  {dateInfo.isLeapYear ? "✓ 閏年" : "平年"}
                </span>
              </div>
              <div className="date-info-item">
                <span className="date-info-label">Unix タイムスタンプ</span>
                <span className="date-info-value date-calc-total-value--sm">
                  {dateInfo.unixTimestamp.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "【日付差計算】開始・終了日時を入力すると自動的に差を計算します",
                "「入れ替え」ボタンで開始/終了を逆にできます",
                "「今」ボタンで現在時刻を素早く入力できます",
                "【日付加算/減算】基準日に分・時間・日・週・月・年を加算/減算します",
                "【日付情報】選択した日付の曜日・週番号・四半期などを確認できます",
              ],
            },
            {
              title: "補足",
              items: [
                "日付差の内訳は「○年○ヶ月○日○時○分○秒」の形で表示します",
                "ISO週番号は月曜始まりの国際規格（ISO 8601）に基づきます",
                "月の加算は月末が存在しない場合、自動的に調整されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
