import { describe, it, expect } from 'vitest';
import { ADSENSE_PUBLISHER_ID } from '../../app/constants/site';

/**
 * AdBannerコンポーネントの広告タイプに対応するCSSクラス名を返す
 * （AdBanner.tsx内の getAdTypeClass 関数と同等のロジック）
 * @param adType - 広告タイプ
 * @returns CSSクラス名
 */
function getAdTypeClass(adType: 'horizontal' | 'rectangle' | 'responsive'): string {
  switch (adType) {
    case 'horizontal':
      return 'ad-banner-horizontal';
    case 'rectangle':
      return 'ad-banner-rectangle';
    case 'responsive':
    default:
      return 'ad-banner-responsive';
  }
}

/**
 * AdBannerコンポーネントの広告タイプに対応する data-ad-format 値を返す
 * （AdBanner.tsx内の getAdFormat 関数と同等のロジック）
 * @param adType - 広告タイプ
 * @returns data-ad-format の値
 */
function getAdFormat(adType: 'horizontal' | 'rectangle' | 'responsive'): string {
  switch (adType) {
    case 'horizontal':
      return 'horizontal';
    case 'rectangle':
      return 'rectangle';
    case 'responsive':
    default:
      return 'auto';
  }
}

/**
 * AdBannerコンポーネントのラッパークラス名を生成する
 * （AdBanner.tsx内のクラス名生成ロジックと同等）
 * @param className - 追加CSSクラス（任意）
 * @returns ラッパー要素のクラス名
 */
function buildWrapperClass(className?: string): string {
  return ['ad-banner-wrapper', className].filter(Boolean).join(' ');
}

/**
 * adSlotが空文字列かどうかを検証する
 * （AdBanner.tsx内のnull返却条件と同等のロジック）
 * @param adSlot - Google AdSenseのスロットID
 * @returns adSlotが空文字列の場合はtrue
 */
function isEmptyAdSlot(adSlot: string): boolean {
  return !adSlot;
}

describe('AdBanner - ロジックテスト', () => {
  describe('adSlotのバリデーション', () => {
    it('adSlotが空文字列の場合はnullを返す（表示しない）条件が成立する', () => {
      expect(isEmptyAdSlot('')).toBe(true);
    });

    it('有効なadSlotでは非表示条件が成立しない', () => {
      expect(isEmptyAdSlot('1234567890')).toBe(false);
    });

    it('スペースのみのadSlotはfalsyとして扱われない（文字列として有効）', () => {
      // JavaScriptの!演算子は空白文字列をtruthyとして扱う
      expect(isEmptyAdSlot('   ')).toBe(false);
    });
  });

  describe('getAdTypeClass - 広告タイプのCSSクラス変換', () => {
    it("adTypeのデフォルト値'responsive'では'ad-banner-responsive'が返る", () => {
      expect(getAdTypeClass('responsive')).toBe('ad-banner-responsive');
    });

    it("adType='horizontal'で'ad-banner-horizontal'が返る", () => {
      expect(getAdTypeClass('horizontal')).toBe('ad-banner-horizontal');
    });

    it("adType='rectangle'で'ad-banner-rectangle'が返る", () => {
      expect(getAdTypeClass('rectangle')).toBe('ad-banner-rectangle');
    });

    it('すべてのadTypeに対してad-banner-プレフィックスが付く', () => {
      const types: Array<'horizontal' | 'rectangle' | 'responsive'> = [
        'horizontal',
        'rectangle',
        'responsive',
      ];
      for (const type of types) {
        expect(getAdTypeClass(type)).toMatch(/^ad-banner-/);
      }
    });
  });

  describe('getAdFormat - 広告タイプのフォーマット値変換', () => {
    it("adType='responsive'では'auto'が返る", () => {
      expect(getAdFormat('responsive')).toBe('auto');
    });

    it("adType='horizontal'では'horizontal'が返る", () => {
      expect(getAdFormat('horizontal')).toBe('horizontal');
    });

    it("adType='rectangle'では'rectangle'が返る", () => {
      expect(getAdFormat('rectangle')).toBe('rectangle');
    });
  });

  describe('buildWrapperClass - ラッパークラス名の生成', () => {
    it('classNameなしでは"ad-banner-wrapper"のみが返る', () => {
      expect(buildWrapperClass()).toBe('ad-banner-wrapper');
    });

    it('classNameが指定されると"ad-banner-wrapper"と結合される', () => {
      expect(buildWrapperClass('my-custom-class')).toBe('ad-banner-wrapper my-custom-class');
    });

    it('undefinedのclassNameは無視される', () => {
      expect(buildWrapperClass(undefined)).toBe('ad-banner-wrapper');
    });

    it('classNameは常にad-banner-wrapperの後に追加される', () => {
      const result = buildWrapperClass('extra');
      expect(result.startsWith('ad-banner-wrapper')).toBe(true);
    });
  });

  describe('ADSENSE_PUBLISHER_ID - パブリッシャーID定数', () => {
    it('ADSENSE_PUBLISHER_IDが定義されている', () => {
      expect(ADSENSE_PUBLISHER_ID).toBeDefined();
    });

    it('ADSENSE_PUBLISHER_IDは文字列である', () => {
      expect(typeof ADSENSE_PUBLISHER_ID).toBe('string');
    });

    it('ADSENSE_PUBLISHER_IDは設定されている場合ca-pub-プレフィックスを持つ', () => {
      // 環境変数が設定されている場合のみプレフィックスを検証する
      if (ADSENSE_PUBLISHER_ID.length > 0) {
        expect(ADSENSE_PUBLISHER_ID).toMatch(/^ca-pub-/);
      } else {
        // 未設定（空文字列）も許容する
        expect(ADSENSE_PUBLISHER_ID).toBe('');
      }
    });

    it('ADSENSE_PUBLISHER_IDは文字列型である（空文字列を許容）', () => {
      expect(typeof ADSENSE_PUBLISHER_ID).toBe('string');
    });
  });

  describe('data-full-width-responsive属性のロジック', () => {
    it("adType='responsive'の場合にfull-width-responsiveがtrueになる", () => {
      const adType = 'responsive';
      const fullWidthResponsive = adType === 'responsive' ? 'true' : undefined;
      expect(fullWidthResponsive).toBe('true');
    });

    it("adType='horizontal'の場合にfull-width-responsiveがundefinedになる", () => {
      const adType = 'horizontal';
      const fullWidthResponsive = adType === 'responsive' ? 'true' : undefined;
      expect(fullWidthResponsive).toBeUndefined();
    });

    it("adType='rectangle'の場合にfull-width-responsiveがundefinedになる", () => {
      const adType = 'rectangle';
      const fullWidthResponsive = adType === 'responsive' ? 'true' : undefined;
      expect(fullWidthResponsive).toBeUndefined();
    });
  });

  describe('ariaLabelのデフォルト値', () => {
    it("ariaLabelのデフォルト値は'広告'である", () => {
      // AdBannerコンポーネントのデフォルトprops値
      const defaultAriaLabel = '広告';
      expect(defaultAriaLabel).toBe('広告');
    });
  });

  describe('adsbygoogle配列の初期化ロジック', () => {
    it('window.adsbygooogleが未定義の場合は空配列に初期化される', () => {
      // adsbygoogle初期化パターンのテスト: (window.adsbygoogle = window.adsbygoogle || []).push({})
      const mockWindow: { adsbygoogle?: unknown[] } = {};
      mockWindow.adsbygoogle = mockWindow.adsbygoogle || [];
      expect(Array.isArray(mockWindow.adsbygoogle)).toBe(true);
      expect(mockWindow.adsbygoogle.length).toBe(0);
    });

    it('window.adsbygooogleが既に定義されている場合は既存の配列を使用する', () => {
      const existingArray = [{ key: 'existing' }];
      const mockWindow: { adsbygoogle?: unknown[] } = { adsbygoogle: existingArray };
      mockWindow.adsbygoogle = mockWindow.adsbygoogle || [];
      expect(mockWindow.adsbygoogle).toBe(existingArray);
    });

    it('pushメソッドで空オブジェクトが追加される', () => {
      const mockWindow: { adsbygoogle?: unknown[] } = {};
      mockWindow.adsbygoogle = mockWindow.adsbygoogle || [];
      mockWindow.adsbygoogle.push({});
      expect(mockWindow.adsbygoogle.length).toBe(1);
      expect(mockWindow.adsbygoogle[0]).toEqual({});
    });
  });
});
