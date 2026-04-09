import { useEffect } from "react";
import { ADSENSE_PUBLISHER_ID } from "../constants/site";

/**
 * Google AdSense のコマンド引数型
 * push({}) で初期化する際に使用する
 */
type AdSenseCommand = Record<string, unknown>;

/**
 * window.adsbygoogle の型定義
 */
declare global {
  interface Window {
    adsbygoogle: AdSenseCommand[];
  }
}

/**
 * AdBannerコンポーネントのプロパティ定義
 */
interface AdBannerProps {
  /** Google AdSenseのスロットID */
  adSlot: string;
  /** 広告タイプ。デフォルト: 'responsive' */
  adType?: "horizontal" | "rectangle" | "responsive";
  /** アクセシビリティラベル。デフォルト: '広告' */
  ariaLabel?: string;
  /** 追加CSSクラス */
  className?: string;
}

/**
 * `adType` に対応するCSSクラス名を返す
 * @param adType - 広告タイプ
 * @returns CSSクラス名
 */
function getAdTypeClass(adType: NonNullable<AdBannerProps["adType"]>): string {
  switch (adType) {
    case "horizontal":
      return "ad-banner-horizontal";
    case "rectangle":
      return "ad-banner-rectangle";
    case "responsive":
    default:
      return "ad-banner-responsive";
  }
}

/**
 * `adType` に対応する `data-ad-format` 値を返す
 * @param adType - 広告タイプ
 * @returns data-ad-format の値
 */
function getAdFormat(adType: NonNullable<AdBannerProps["adType"]>): string {
  switch (adType) {
    case "horizontal":
      return "horizontal";
    case "rectangle":
      return "rectangle";
    case "responsive":
    default:
      return "auto";
  }
}

/**
 * Google AdSense 広告バナーコンポーネント
 *
 * WCAG 2.1 AA準拠の広告表示コンポーネント。
 * SSR環境でも安全に動作するよう、adsbygoogleの初期化は
 * クライアントサイドのuseEffect内でのみ実行されます。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.adSlot - Google AdSenseのスロットID
 * @param props.adType - 広告タイプ（デフォルト: 'responsive'）
 * @param props.ariaLabel - アクセシビリティラベル（デフォルト: '広告'）
 * @param props.className - 追加CSSクラス
 * @returns 広告バナーのJSX要素、またはadSlotが空の場合はnull
 */
export function AdBanner({
  adSlot,
  adType = "responsive",
  ariaLabel = "広告",
  className,
}: AdBannerProps): JSX.Element | null {
  useEffect(() => {
    if (!adSlot) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense初期化エラーは静かに無視する
    }
  }, [adSlot]);

  // adSlotが空文字列の場合は表示しない
  if (!adSlot) {
    return null;
  }

  const typeClass = getAdTypeClass(adType);
  const adFormat = getAdFormat(adType);
  const wrapperClass = ["ad-banner-wrapper", className].filter(Boolean).join(" ");

  return (
    <div aria-label={ariaLabel} className={wrapperClass}>
      <p className="ad-banner-label">広告</p>
      <div className={`ad-banner-content ${typeClass}`}>
        <ins
          className="adsbygoogle"
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={adType === "responsive" ? "true" : undefined}
        />
      </div>
    </div>
  );
}
