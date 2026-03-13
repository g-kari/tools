import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  TIMEZONES,
  DEFAULT_SELECTED_TIMEZONES,
  convertToTimezones,
  parseDateTimeWithTimezone,
  getCurrentDatetimeLocal,
  type ConversionResult,
} from "../utils/timezone";

export const Route = createFileRoute("/timezone")({
  head: () => ({
    meta: [
      { title: "タイムゾーン変換 | Web ツール集" },
      {
        name: "description",
        content:
          "世界各地のタイムゾーン間で日時を変換するツール。UTC、JST、EST、CETなど主要25タイムゾーンに対応",
      },
      {
        property: "og:title",
        content: "タイムゾーン変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "世界各地のタイムゾーン間で日時を変換するツール。UTC、JST、EST、CETなど主要25タイムゾーンに対応",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/timezone` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TimezoneConverter,
});

/**
 * タイムゾーン変換コンポーネント
 * 指定した日時を複数のタイムゾーンに一括変換する
 */
function TimezoneConverter() {
  const [datetimeLocal, setDatetimeLocal] = useState<string>(
    getCurrentDatetimeLocal
  );
  const [sourceTimezone, setSourceTimezone] = useState<string>("Asia/Tokyo");
  const [selectedTimezones, setSelectedTimezones] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_TIMEZONES)
  );

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** ソース日時をDateオブジェクトに変換 */
  const sourceDate = useMemo<Date | null>(() => {
    if (!datetimeLocal) return null;
    return parseDateTimeWithTimezone(datetimeLocal, sourceTimezone);
  }, [datetimeLocal, sourceTimezone]);

  /** 選択済みタイムゾーン一覧（TIMEZONES順を維持） */
  const targetTimezones = useMemo(
    () => TIMEZONES.filter((tz) => selectedTimezones.has(tz.id)),
    [selectedTimezones]
  );

  /** 変換結果 */
  const results = useMemo<ConversionResult[]>(() => {
    if (!sourceDate) return [];
    return convertToTimezones(sourceDate, targetTimezones);
  }, [sourceDate, targetTimezones]);

  /** 現在時刻をセットする */
  const handleSetNow = useCallback(() => {
    setDatetimeLocal(getCurrentDatetimeLocal());
    announceStatus("現在時刻をセットしました");
  }, [announceStatus]);

  /** タイムゾーンの選択トグル */
  const handleToggleTimezone = useCallback((tzId: string) => {
    setSelectedTimezones((prev) => {
      const next = new Set(prev);
      if (next.has(tzId)) {
        next.delete(tzId);
      } else {
        next.add(tzId);
      }
      return next;
    });
  }, []);

  /** 全タイムゾーンを選択 */
  const handleSelectAll = useCallback(() => {
    setSelectedTimezones(new Set(TIMEZONES.map((tz) => tz.id)));
    announceStatus("すべてのタイムゾーンを選択しました");
  }, [announceStatus]);

  /** 全タイムゾーンの選択を解除 */
  const handleClearAll = useCallback(() => {
    setSelectedTimezones(new Set());
    announceStatus("すべての選択を解除しました");
  }, [announceStatus]);

  /** 変換結果をテキストとしてコピー */
  const handleCopyAll = useCallback(async () => {
    if (results.length === 0) return;
    const text = results
      .map(
        (r) =>
          `${r.timezone.city} (${r.timezone.label})\t${r.datetime}\t${r.offset}`
      )
      .join("\n");
    const success = await copy(text);
    if (success) {
      showToast("変換結果をコピーしました", "success");
      announceStatus("変換結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [results, copy, showToast, announceStatus]);

  /** 入力をリセット */
  const handleClear = useCallback(() => {
    setDatetimeLocal(getCurrentDatetimeLocal());
    setSourceTimezone("Asia/Tokyo");
    setSelectedTimezones(new Set(DEFAULT_SELECTED_TIMEZONES));
    announceStatus("入力をリセットしました");
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">タイムゾーン変換</h2>

        {/* 日時入力セクション */}
        <section
          className="timezone-input-section"
          aria-label="変換元の日時入力"
        >
          <div className="timezone-input-row">
            <div className="timezone-field">
              <label htmlFor="timezone-datetime" className="timezone-label">
                日時
              </label>
              <input
                id="timezone-datetime"
                type="datetime-local"
                className="timezone-datetime-input"
                value={datetimeLocal}
                onChange={(e) => setDatetimeLocal(e.target.value)}
                aria-describedby="timezone-datetime-hint"
              />
            </div>
            <div className="timezone-field">
              <label htmlFor="timezone-source" className="timezone-label">
                タイムゾーン
              </label>
              <select
                id="timezone-source"
                className="timezone-select"
                value={sourceTimezone}
                onChange={(e) => setSourceTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.city} ({tz.label})
                  </option>
                ))}
              </select>
            </div>
            <div className="timezone-field timezone-field--button">
              <Button
                variant="outline"
                onClick={handleSetNow}
                aria-label="現在時刻をセット"
              >
                現在時刻
              </Button>
            </div>
          </div>
          <p id="timezone-datetime-hint" className="timezone-hint">
            変換元の日時とタイムゾーンを選択してください
          </p>
        </section>

        {/* タイムゾーン選択セクション */}
        <section
          className="timezone-select-section"
          aria-label="変換先タイムゾーン選択"
        >
          <div className="timezone-select-header">
            <span className="section-title">変換先タイムゾーン</span>
            <div className="timezone-select-actions">
              <button
                type="button"
                className="timezone-text-btn"
                onClick={handleSelectAll}
                aria-label="すべてのタイムゾーンを選択"
              >
                すべて選択
              </button>
              <span className="timezone-separator" aria-hidden="true">
                |
              </span>
              <button
                type="button"
                className="timezone-text-btn"
                onClick={handleClearAll}
                aria-label="すべての選択を解除"
              >
                すべて解除
              </button>
            </div>
          </div>
          <div
            className="timezone-checkbox-grid"
            role="group"
            aria-label="変換先タイムゾーンのチェックボックス一覧"
          >
            {TIMEZONES.map((tz) => (
              <label key={tz.id} className="timezone-checkbox-label">
                <input
                  type="checkbox"
                  className="timezone-checkbox"
                  checked={selectedTimezones.has(tz.id)}
                  onChange={() => handleToggleTimezone(tz.id)}
                />
                <span className="timezone-checkbox-city">{tz.city}</span>
                <span className="timezone-checkbox-label-text">
                  {tz.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* 変換結果テーブル */}
        <section className="timezone-results" aria-label="変換結果">
          <div className="timezone-results-header">
            <span className="section-title">変換結果</span>
            <span className="timezone-results-count" aria-live="polite">
              {results.length}件
            </span>
          </div>
          {results.length > 0 ? (
            <div
              className="timezone-table-wrapper"
              role="region"
              aria-label="タイムゾーン変換結果テーブル"
              tabIndex={0}
            >
              <table className="timezone-table">
                <thead>
                  <tr>
                    <th scope="col" className="timezone-th">
                      都市
                    </th>
                    <th scope="col" className="timezone-th">
                      タイムゾーン
                    </th>
                    <th scope="col" className="timezone-th">
                      日付
                    </th>
                    <th scope="col" className="timezone-th">
                      時刻
                    </th>
                    <th scope="col" className="timezone-th">
                      UTCオフセット
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr
                      key={result.timezone.id}
                      className="timezone-result-row"
                    >
                      <td className="timezone-td timezone-td--city">
                        {result.timezone.city}
                      </td>
                      <td className="timezone-td timezone-td--label">
                        {result.timezone.label}
                      </td>
                      <td className="timezone-td timezone-td--date">
                        {result.date}
                      </td>
                      <td className="timezone-td timezone-td--time">
                        {result.time}
                      </td>
                      <td className="timezone-td timezone-td--offset">
                        {result.offset}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="timezone-empty" aria-live="polite">
              {selectedTimezones.size === 0
                ? "変換先タイムゾーンを1つ以上選択してください"
                : "日時を入力してください"}
            </p>
          )}
        </section>

        {/* アクションボタン */}
        <div className="timezone-actions">
          <Button
            variant="default"
            onClick={handleCopyAll}
            disabled={results.length === 0}
            aria-label="変換結果をすべてクリップボードにコピー"
          >
            全結果コピー
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            aria-label="入力をリセット"
          >
            リセット
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "日時入力欄に変換したい日時を入力します",
                "「タイムゾーン」ドロップダウンで入力した日時のタイムゾーンを選択します",
                "「現在時刻」ボタンで現在の日時を自動入力できます",
                "チェックボックスで変換先タイムゾーンを選択すると、結果テーブルに表示されます",
              ],
            },
            {
              title: "タイムゾーンについて",
              items: [
                "UTC（協定世界時）: 世界標準時の基準となる時刻",
                "JST（日本標準時）: UTC+9、日本・韓国で使用",
                "EST/EDT: UTC-5/-4、ニューヨーク（アメリカ東部）",
                "CET/CEST: UTC+1/+2、パリ・ベルリンなどヨーロッパ中部",
                "夏時間（DST）により季節によってオフセットが変化するタイムゾーンがあります",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
