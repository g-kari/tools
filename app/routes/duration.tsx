import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  parseDuration,
  secondsToHms,
  secondsToHuman,
  secondsToComponents,
  secondsToFrames,
  framesToSeconds,
  framesToTimecode,
  secondsToUnit,
  addDurations,
  subtractDurations,
  FRAME_RATES,
  UNIT_FACTORS,
  type DurationUnit,
} from "~/utils/duration";
import "../styles/tools/duration.css";

export const Route = createFileRoute("/duration")({
  head: () => ({
    meta: [
      { title: "時間計算・変換ツール | Web ツール集" },
      {
        name: "description",
        content:
          "秒・HH:MM:SS・人間が読めるフォーマット間を相互変換。2つの時間の加算・減算、フレームレート変換（24fps/30fps/60fps）、各単位（日・時・分・秒・ミリ秒）への変換に対応。",
      },
      { property: "og:title", content: "時間計算・変換ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "秒・HH:MM:SS・人間が読めるフォーマット間を相互変換。時間の加算・減算・フレーム変換対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/duration` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "時間計算・変換ツール | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "秒・HH:MM:SS・人間が読めるフォーマット間を相互変換。時間の加算・減算・フレーム変換対応。",
      },
    ],
  }),
  component: DurationPage,
});

type Tab = "convert" | "calc" | "frames";

const UNIT_LABELS: Record<DurationUnit, string> = {
  milliseconds: "ミリ秒",
  seconds: "秒",
  minutes: "分",
  hours: "時間",
  days: "日",
  weeks: "週",
};

function DurationPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [tab, setTab] = useState<Tab>("convert");

  // --- 変換タブ ---
  const [convertInput, setConvertInput] = useState("");
  const [showMs, _setShowMs] = useState(false);
  const [selectedFps, setSelectedFps] = useState<number>(30);

  // --- 計算タブ ---
  const [calcA, setCalcA] = useState("");
  const [calcB, setCalcB] = useState("");
  const [calcOp, setCalcOp] = useState<"+" | "-">("+");

  // --- フレームタブ ---
  const [frameInput, setFrameInput] = useState("");
  const [frameMode, setFrameMode] = useState<"toFrames" | "fromFrames">("toFrames");
  const [frameFps, setFrameFps] = useState<number>(30);

  // 変換タブ: 結果
  const convertResult = useMemo(() => {
    if (!convertInput.trim()) return null;
    const secs = parseDuration(convertInput);
    if (secs === null)
      return { error: "入力形式が正しくありません。秒数または HH:MM:SS 形式で入力してください。" };

    const c = secondsToComponents(secs);
    return {
      secs,
      hms: secondsToHms(secs, showMs),
      hmsMs: secondsToHms(secs, true),
      human: secondsToHuman(secs),
      components: c,
      units: (Object.keys(UNIT_FACTORS) as DurationUnit[]).map((unit) => ({
        unit,
        label: UNIT_LABELS[unit],
        value: secondsToUnit(secs, unit),
      })),
      frames: secondsToFrames(secs, selectedFps),
      timecode: framesToTimecode(secondsToFrames(secs, selectedFps), selectedFps),
    };
  }, [convertInput, showMs, selectedFps]);

  // 計算タブ: 結果
  const calcResult = useMemo(() => {
    const a = parseDuration(calcA);
    const b = parseDuration(calcB);
    if (a === null || b === null) return null;
    const result = calcOp === "+" ? addDurations(a, b) : subtractDurations(a, b);
    return {
      secs: result,
      hms: secondsToHms(result, true),
      human: secondsToHuman(result),
    };
  }, [calcA, calcB, calcOp]);

  // フレームタブ: 結果
  const frameResult = useMemo(() => {
    if (!frameInput.trim()) return null;
    if (frameMode === "toFrames") {
      const secs = parseDuration(frameInput);
      if (secs === null) return { error: "無効な入力です" };
      const frames = secondsToFrames(secs, frameFps);
      const timecode = framesToTimecode(frames, frameFps);
      return { frames, timecode, hms: secondsToHms(secs, true) };
    } else {
      const frames = parseInt(frameInput.trim(), 10);
      if (isNaN(frames) || frames < 0)
        return { error: "フレーム数は0以上の整数を入力してください" };
      const secs = framesToSeconds(frames, frameFps);
      return {
        frames,
        timecode: framesToTimecode(frames, frameFps),
        hms: secondsToHms(secs, true),
        human: secondsToHuman(secs),
        secs,
      };
    }
  }, [frameInput, frameMode, frameFps]);

  const handleCopy = useCallback(
    async (text: string, label = "結果") => {
      const ok = await copy(text);
      if (ok) {
        showToast("コピーしました", "success");
        announceStatus(`${label}をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus],
  );

  const handleTabChange = useCallback(
    (newTab: Tab) => {
      setTab(newTab);
      announceStatus(
        newTab === "convert"
          ? "変換タブに切り替えました"
          : newTab === "calc"
            ? "計算タブに切り替えました"
            : "フレーム変換タブに切り替えました",
      );
    },
    [announceStatus],
  );

  const convertError = convertResult && "error" in convertResult ? convertResult.error : null;
  const hasConvertResult = convertResult && !("error" in convertResult);

  return (
    <>
      <div className="tool-container">
        {/* タブ切替 */}
        <div className="dur-tabs" role="tablist" aria-label="機能選択">
          <button
            role="tab"
            aria-selected={tab === "convert"}
            className={`dur-tab-btn${tab === "convert" ? " active" : ""}`}
            onClick={() => handleTabChange("convert")}
          >
            変換
          </button>
          <button
            role="tab"
            aria-selected={tab === "calc"}
            className={`dur-tab-btn${tab === "calc" ? " active" : ""}`}
            onClick={() => handleTabChange("calc")}
          >
            加算 / 減算
          </button>
          <button
            role="tab"
            aria-selected={tab === "frames"}
            className={`dur-tab-btn${tab === "frames" ? " active" : ""}`}
            onClick={() => handleTabChange("frames")}
          >
            フレーム変換
          </button>
        </div>

        {/* ===== 変換タブ ===== */}
        {tab === "convert" && (
          <>
            <div className="dur-input-group">
              <label htmlFor="dur-convert-input" className="dur-label">
                時間を入力
              </label>
              <input
                id="dur-convert-input"
                type="text"
                className={`dur-input${convertError ? " error" : ""}`}
                value={convertInput}
                onChange={(e) => setConvertInput(e.target.value)}
                placeholder="例: 3661  または  01:01:01  または  1:30:00.500"
                aria-label="変換する時間（秒数またはHH:MM:SS形式）"
                spellCheck={false}
              />
            </div>

            {convertError && convertInput.trim() && (
              <div className="dur-error" role="alert">
                ⚠ {convertError}
              </div>
            )}

            {hasConvertResult && (
              <>
                {/* コンポーネント表示 */}
                <p className="dur-section-title">コンポーネント</p>
                <div className="dur-components" aria-label="時間の各コンポーネント">
                  <div className="dur-comp-item">
                    <span className="dur-comp-value">{convertResult.components.days}</span>
                    <span className="dur-comp-label">日</span>
                  </div>
                  <div className="dur-comp-item">
                    <span className="dur-comp-value">{convertResult.components.hours}</span>
                    <span className="dur-comp-label">時間</span>
                  </div>
                  <div className="dur-comp-item">
                    <span className="dur-comp-value">{convertResult.components.minutes}</span>
                    <span className="dur-comp-label">分</span>
                  </div>
                  <div className="dur-comp-item">
                    <span className="dur-comp-value">{convertResult.components.seconds}</span>
                    <span className="dur-comp-label">秒</span>
                  </div>
                  <div className="dur-comp-item">
                    <span className="dur-comp-value">{convertResult.components.milliseconds}</span>
                    <span className="dur-comp-label">ミリ秒</span>
                  </div>
                </div>

                <hr className="dur-divider" />

                {/* フォーマット結果 */}
                <p className="dur-section-title">変換結果</p>
                <div className="dur-result-grid" aria-label="変換結果一覧">
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">HH:MM:SS</span>
                    <span className="dur-result-card-value">{convertResult.hms}</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleCopy(convertResult.hms, "HH:MM:SS")}
                      aria-label="HH:MM:SSをコピー"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">HH:MM:SS.mmm</span>
                    <span className="dur-result-card-value">{convertResult.hmsMs}</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleCopy(convertResult.hmsMs, "HH:MM:SS.mmm")}
                      aria-label="HH:MM:SS.mmmをコピー"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">合計秒数</span>
                    <span className="dur-result-card-value">
                      {convertResult.components.totalSeconds.toLocaleString()}
                    </span>
                    <span className="dur-result-card-sub">秒</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        handleCopy(convertResult.components.totalSeconds.toString(), "合計秒数")
                      }
                      aria-label="合計秒数をコピー"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">ミリ秒</span>
                    <span className="dur-result-card-value">
                      {convertResult.components.totalMilliseconds.toLocaleString()}
                    </span>
                    <span className="dur-result-card-sub">ms</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        handleCopy(convertResult.components.totalMilliseconds.toString(), "ミリ秒")
                      }
                      aria-label="ミリ秒をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>

                {/* 人間が読めるフォーマット */}
                <div className="dur-result-card dur-result-card--mb">
                  <span className="dur-result-card-label">読みやすい表示</span>
                  <span className="dur-result-card-value dur-result-card-value--text">
                    {convertResult.human}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary dur-copy-btn-start"
                    onClick={() => handleCopy(convertResult.human, "読みやすい表示")}
                    aria-label="読みやすい表示をコピー"
                  >
                    コピー
                  </button>
                </div>

                <hr className="dur-divider" />

                {/* 単位変換テーブル */}
                <p className="dur-section-title">各単位での値</p>
                <table className="dur-unit-table" aria-label="各単位での時間値">
                  <thead>
                    <tr>
                      <th>単位</th>
                      <th>値</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convertResult.units.map(({ unit, label, value }) => (
                      <tr key={unit}>
                        <td>{label}</td>
                        <td>
                          {value % 1 === 0
                            ? value.toLocaleString()
                            : parseFloat(value.toPrecision(10)).toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                              })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <hr className="dur-divider" />

                {/* フレーム変換プレビュー */}
                <p className="dur-section-title">フレーム変換プレビュー</p>
                <div className="dur-fps-row" role="group" aria-label="フレームレート選択">
                  <span className="dur-fps-label">fps:</span>
                  {FRAME_RATES.map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      className={`dur-fps-btn${selectedFps === fps ? " active" : ""}`}
                      onClick={() => setSelectedFps(fps)}
                      aria-pressed={selectedFps === fps}
                    >
                      {fps}
                    </button>
                  ))}
                </div>
                <div className="dur-result-grid">
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">フレーム数</span>
                    <span className="dur-result-card-value">
                      {convertResult.frames.toLocaleString()}
                    </span>
                    <span className="dur-result-card-sub">@ {selectedFps} fps</span>
                  </div>
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">タイムコード</span>
                    <span className="dur-result-card-value dur-result-card-value--text">
                      {convertResult.timecode}
                    </span>
                    <span className="dur-result-card-sub">HH:MM:SS:FF</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== 計算タブ ===== */}
        {tab === "calc" && (
          <>
            <div className="dur-calc-row">
              <div className="dur-calc-input-wrap">
                <div className="dur-input-group dur-input-group--no-mb">
                  <label htmlFor="dur-calc-a" className="dur-label">
                    時間 A
                  </label>
                  <input
                    id="dur-calc-a"
                    type="text"
                    className="dur-input"
                    value={calcA}
                    onChange={(e) => setCalcA(e.target.value)}
                    placeholder="例: 3600  または  01:00:00"
                    aria-label="時間A（秒数またはHH:MM:SS形式）"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="dur-calc-op-section">
                <span className="dur-fps-label">演算</span>
                <div className="dur-calc-op" role="group" aria-label="演算子選択">
                  <button
                    type="button"
                    className={`dur-op-btn${calcOp === "+" ? " active" : ""}`}
                    onClick={() => setCalcOp("+")}
                    aria-pressed={calcOp === "+"}
                    aria-label="加算"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={`dur-op-btn${calcOp === "-" ? " active" : ""}`}
                    onClick={() => setCalcOp("-")}
                    aria-pressed={calcOp === "-"}
                    aria-label="減算"
                  >
                    −
                  </button>
                </div>
              </div>

              <div className="dur-calc-input-wrap">
                <div className="dur-input-group dur-input-group--no-mb">
                  <label htmlFor="dur-calc-b" className="dur-label">
                    時間 B
                  </label>
                  <input
                    id="dur-calc-b"
                    type="text"
                    className="dur-input"
                    value={calcB}
                    onChange={(e) => setCalcB(e.target.value)}
                    placeholder="例: 1800  または  00:30:00"
                    aria-label="時間B（秒数またはHH:MM:SS形式）"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {calcResult && (
              <>
                <p className="dur-section-title">結果</p>
                <div className="dur-result-grid" aria-label="計算結果">
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">HH:MM:SS.mmm</span>
                    <span className="dur-result-card-value">{calcResult.hms}</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleCopy(calcResult.hms, "計算結果")}
                      aria-label="計算結果をコピー"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">合計秒数</span>
                    <span className="dur-result-card-value">
                      {calcResult.secs.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                    </span>
                    <span className="dur-result-card-sub">秒</span>
                  </div>
                  <div className="dur-result-card">
                    <span className="dur-result-card-label">読みやすい表示</span>
                    <span className="dur-result-card-value dur-result-card-value--sm">
                      {calcResult.human}
                    </span>
                  </div>
                </div>
              </>
            )}

            {!calcResult && (calcA || calcB) && (
              <div className="dur-error" role="alert">
                ⚠ 両方の時間を入力してください。秒数または HH:MM:SS 形式で入力できます。
              </div>
            )}
          </>
        )}

        {/* ===== フレーム変換タブ ===== */}
        {tab === "frames" && (
          <>
            {/* 変換方向 */}
            <div className="dur-calc-op dur-calc-op--direction" role="group" aria-label="変換方向">
              <button
                type="button"
                className={`dur-fps-btn${frameMode === "toFrames" ? " active" : ""}`}
                onClick={() => {
                  setFrameMode("toFrames");
                  setFrameInput("");
                }}
                aria-pressed={frameMode === "toFrames"}
              >
                時間 → フレーム数
              </button>
              <button
                type="button"
                className={`dur-fps-btn${frameMode === "fromFrames" ? " active" : ""}`}
                onClick={() => {
                  setFrameMode("fromFrames");
                  setFrameInput("");
                }}
                aria-pressed={frameMode === "fromFrames"}
              >
                フレーム数 → 時間
              </button>
            </div>

            {/* フレームレート選択 */}
            <div className="dur-fps-row" role="group" aria-label="フレームレート選択">
              <span className="dur-fps-label">fps:</span>
              {FRAME_RATES.map((fps) => (
                <button
                  key={fps}
                  type="button"
                  className={`dur-fps-btn${frameFps === fps ? " active" : ""}`}
                  onClick={() => setFrameFps(fps)}
                  aria-pressed={frameFps === fps}
                >
                  {fps}
                </button>
              ))}
            </div>

            <div className="dur-input-group">
              <label htmlFor="dur-frame-input" className="dur-label">
                {frameMode === "toFrames" ? "時間を入力" : "フレーム数を入力"}
              </label>
              <input
                id="dur-frame-input"
                type="text"
                className={`dur-input${frameResult && "error" in frameResult ? " error" : ""}`}
                value={frameInput}
                onChange={(e) => setFrameInput(e.target.value)}
                placeholder={frameMode === "toFrames" ? "例: 00:01:30  または  90" : "例: 2700"}
                aria-label={
                  frameMode === "toFrames"
                    ? "変換する時間（秒数またはHH:MM:SS形式）"
                    : "フレーム数（整数）"
                }
                spellCheck={false}
              />
            </div>

            {frameResult && "error" in frameResult && frameInput.trim() && (
              <div className="dur-error" role="alert">
                ⚠ {frameResult.error}
              </div>
            )}

            {frameResult && !("error" in frameResult) && (
              <>
                <p className="dur-section-title">変換結果</p>
                <div className="dur-result-grid" aria-label="フレーム変換結果">
                  {frameMode === "toFrames" ? (
                    <>
                      <div className="dur-result-card">
                        <span className="dur-result-card-label">フレーム数</span>
                        <span className="dur-result-card-value">
                          {frameResult.frames.toLocaleString()}
                        </span>
                        <span className="dur-result-card-sub">@ {frameFps} fps</span>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleCopy(frameResult.frames.toString(), "フレーム数")}
                          aria-label="フレーム数をコピー"
                        >
                          コピー
                        </button>
                      </div>
                      <div className="dur-result-card">
                        <span className="dur-result-card-label">タイムコード</span>
                        <span className="dur-result-card-value dur-result-card-value--text">
                          {frameResult.timecode}
                        </span>
                        <span className="dur-result-card-sub">HH:MM:SS:FF</span>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleCopy(frameResult.timecode, "タイムコード")}
                          aria-label="タイムコードをコピー"
                        >
                          コピー
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="dur-result-card">
                        <span className="dur-result-card-label">HH:MM:SS.mmm</span>
                        <span className="dur-result-card-value">{frameResult.hms}</span>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleCopy(frameResult.hms, "HH:MM:SS")}
                          aria-label="HH:MM:SSをコピー"
                        >
                          コピー
                        </button>
                      </div>
                      <div className="dur-result-card">
                        <span className="dur-result-card-label">タイムコード</span>
                        <span className="dur-result-card-value dur-result-card-value--text">
                          {frameResult.timecode}
                        </span>
                        <span className="dur-result-card-sub">HH:MM:SS:FF</span>
                      </div>
                      {"secs" in frameResult && (
                        <div className="dur-result-card">
                          <span className="dur-result-card-label">合計秒数</span>
                          <span className="dur-result-card-value">
                            {(frameResult.secs as number).toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })}
                          </span>
                          <span className="dur-result-card-sub">秒</span>
                        </div>
                      )}
                      {"human" in frameResult && (
                        <div className="dur-result-card">
                          <span className="dur-result-card-label">読みやすい表示</span>
                          <span className="dur-result-card-value dur-result-card-value--xs">
                            {frameResult.human as string}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "入力形式",
              items: [
                "秒数: 整数または小数（例: 3661, 90.5）",
                "HH:MM:SS形式: 01:01:01（時:分:秒）",
                "MM:SS形式: 01:30（分:秒）",
                "ミリ秒付き: 01:30:00.500 または 01:30:00,500",
                "負の値: -3600 または -01:00:00",
              ],
            },
            {
              title: "フレームレートの目安",
              items: [
                "23.976 fps: 映画・ブルーレイ（NTSC準拠）",
                "24 fps: デジタル映画標準",
                "25 fps: PAL/SECAM放送（欧州・日本向け）",
                "29.97 fps: NTSC放送（北米・日本アナログ）",
                "30 fps: HD動画の一般的な設定",
                "60 fps: ゲーム動画・スポーツ中継",
              ],
            },
            {
              title: "タイムコード（HH:MM:SS:FF）について",
              items: [
                "映像編集で使われる標準的な時間表現",
                "FF はフレーム番号を表す（0からfps-1まで）",
                "29.97/30 fps では 00:01:30:00 = 90秒 = 2700フレーム",
                "Drop Frame（DF）タイムコードはこのツールでは非対応",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
