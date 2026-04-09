import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { TIMEZONES } from "../utils/timezone";
import { getClockData, getLocalTimezone } from "../utils/world-clock";
import { TipsCard } from "~/components/TipsCard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import "../styles/tools/world-clock.css";

export const Route = createFileRoute("/world-clock")({
  head: () => ({
    meta: [
      { title: "ワールドクロック | Web ツール集" },
      {
        name: "description",
        content:
          "世界の主要都市の現在時刻をリアルタイムで表示するワールドクロック。東京・ニューヨーク・ロンドン・パリなど25都市対応。12h/24h表示切替・都市のカスタマイズが可能。",
      },
      { property: "og:title", content: "ワールドクロック | Web ツール集" },
      {
        property: "og:description",
        content: "世界の主要都市の現在時刻をリアルタイム表示。25都市対応・12h/24h切替。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/world-clock` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ワールドクロック | Web ツール集" },
      {
        name: "twitter:description",
        content: "世界の主要都市の現在時刻をリアルタイム表示。25都市対応・12h/24h切替。",
      },
    ],
  }),
  component: WorldClockPage,
});

/** デフォルト表示する都市のタイムゾーンID */
const DEFAULT_CITIES = new Set([
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
]);

/**
 * ワールドクロックページコンポーネント
 */
function WorldClockPage() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [hour12, setHour12] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedCities, setSelectedCities] = useState<Set<string>>(() => new Set(DEFAULT_CITIES));
  const localTz = useRef(getLocalTimezone());

  const { statusRef, announceStatus } = useStatusAnnouncement();

  // 毎秒更新
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleToggleCity = useCallback((tzId: string) => {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      if (next.has(tzId)) {
        next.delete(tzId);
      } else {
        next.add(tzId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCities(new Set(TIMEZONES.map((tz) => tz.id)));
    announceStatus("すべての都市を選択しました");
  }, [announceStatus]);

  const handleClearAll = useCallback(() => {
    setSelectedCities(new Set());
    announceStatus("すべての選択を解除しました");
  }, [announceStatus]);

  const handleReset = useCallback(() => {
    setSelectedCities(new Set(DEFAULT_CITIES));
    announceStatus("デフォルトの都市に戻しました");
  }, [announceStatus]);

  const handleFormatChange = useCallback(
    (h12: boolean) => {
      setHour12(h12);
      announceStatus(h12 ? "12時間表示に切り替えました" : "24時間表示に切り替えました");
    },
    [announceStatus],
  );

  // 選択中の都市リスト（TIMEZONES の順序を維持）
  const activeCities = TIMEZONES.filter((tz) => selectedCities.has(tz.id));

  return (
    <>
      <div className="tool-container">
        {/* コントロールバー */}
        <div className="wc-controls">
          <div className="wc-controls-left">
            {/* 12h/24h 切替 */}
            <div className="wc-format-toggle" role="group" aria-label="時刻表示形式">
              <button
                type="button"
                className={`wc-format-btn${!hour12 ? " active" : ""}`}
                onClick={() => handleFormatChange(false)}
                aria-pressed={!hour12}
              >
                24h
              </button>
              <button
                type="button"
                className={`wc-format-btn${hour12 ? " active" : ""}`}
                onClick={() => handleFormatChange(true)}
                aria-pressed={hour12}
              >
                12h
              </button>
            </div>

            {/* 都市数 */}
            <span className="wc-city-count" aria-live="polite">
              {activeCities.length} 都市
            </span>
          </div>

          {/* 都市セレクター切替ボタン */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowSelector((s) => !s)}
            aria-expanded={showSelector}
            aria-controls="wc-selector"
          >
            {showSelector ? "都市を閉じる" : "都市を選択"}
          </button>
        </div>

        {/* 都市セレクターパネル */}
        {showSelector && (
          <div
            id="wc-selector"
            className="wc-selector-panel"
            role="region"
            aria-label="表示都市の選択"
          >
            <div className="wc-selector-header">
              <span className="wc-selector-title">表示する都市</span>
              <div className="wc-selector-actions">
                <button type="button" className="wc-text-btn" onClick={handleSelectAll}>
                  すべて選択
                </button>
                <span className="wc-text-sep" aria-hidden="true">
                  |
                </span>
                <button type="button" className="wc-text-btn" onClick={handleClearAll}>
                  すべて解除
                </button>
                <span className="wc-text-sep" aria-hidden="true">
                  |
                </span>
                <button type="button" className="wc-text-btn" onClick={handleReset}>
                  リセット
                </button>
              </div>
            </div>
            <div className="wc-city-checkboxes" role="group" aria-label="都市チェックボックス一覧">
              {TIMEZONES.map((tz) => (
                <label key={tz.id} className="wc-city-checkbox-label">
                  <input
                    type="checkbox"
                    className="wc-city-checkbox"
                    checked={selectedCities.has(tz.id)}
                    onChange={() => handleToggleCity(tz.id)}
                    aria-label={`${tz.city}（${tz.label}）`}
                  />
                  <span className="wc-city-name">{tz.city}</span>
                  <span className="wc-city-label-text">{tz.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* クロックグリッド */}
        {activeCities.length > 0 ? (
          <div className="wc-grid" role="list" aria-label="ワールドクロック一覧" aria-live="off">
            {activeCities.map((tz) => {
              const isLocal = tz.id === localTz.current;
              const data = getClockData(now, tz.id, hour12, localTz.current);
              return (
                <ClockCard
                  key={tz.id}
                  city={tz.city}
                  label={tz.label}
                  data={data}
                  isLocal={isLocal}
                />
              );
            })}
          </div>
        ) : (
          <div className="wc-empty" role="status">
            <p>都市が選択されていません。「都市を選択」から表示したい都市を選んでください。</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "世界の主要都市の現在時刻をリアルタイムで確認できます（1秒ごとに更新）",
                "「都市を選択」ボタンで表示したい都市を自由に選べます（最大25都市）",
                "「24h / 12h」ボタンで時刻の表示形式を切り替えられます",
                "「LOCAL」バッジ付きのカードがあなたのローカルタイムゾーンです",
              ],
            },
            {
              title: "日付バッジについて",
              items: [
                "「+1」: あなたの現地時刻より1日進んでいる（翌日）",
                "「-1」: あなたの現地時刻より1日遅れている（前日）",
                "バッジなし: あなたの現地と同じ日付",
                "タイムゾーンの差で日付が変わることがある点に注意",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

/**
 * 個別都市のクロックカードコンポーネント
 */
function ClockCard({
  city,
  label,
  data,
  isLocal,
}: {
  city: string;
  label: string;
  data: ReturnType<typeof getClockData>;
  isLocal: boolean;
}) {
  return (
    <div
      className={`wc-card${isLocal ? " wc-card--local" : ""}`}
      role="listitem"
      aria-label={`${city} ${data.time}`}
    >
      <div className="wc-card-header">
        <span className="wc-city-title">
          {city}
          {isLocal && (
            <span className="wc-local-badge" aria-label="ローカルタイムゾーン">
              LOCAL
            </span>
          )}
        </span>
        <span className="wc-offset">{data.offset}</span>
      </div>

      <div className="wc-time" aria-label={`現在時刻 ${data.time}`}>
        {data.time}
      </div>

      <div className="wc-date-row">
        <span className="wc-date">{data.date}</span>
        <span className="wc-weekday">（{data.weekday}）</span>
        {data.dayDiff !== 0 && (
          <span
            className={`wc-day-diff${data.dayDiff > 0 ? " wc-day-diff--next" : " wc-day-diff--prev"}`}
            aria-label={data.dayDiff > 0 ? "翌日" : "前日"}
          >
            {data.dayDiff > 0 ? "+1" : "-1"}
          </span>
        )}
      </div>
    </div>
  );
}
