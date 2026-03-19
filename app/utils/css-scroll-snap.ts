/**
 * CSS Scroll Snap Generator - ユーティリティ関数群
 *
 * scroll-snap-type / scroll-snap-align / scroll-snap-stop など
 * CSS Scroll Snap 関連プロパティの CSS 生成関数群を提供します。
 */

/** スクロール方向 */
export type ScrollDirection = 'x' | 'y' | 'both' | 'block' | 'inline';

/** スナップの厳密さ */
export type ScrollSnapStrictness = 'mandatory' | 'proximity';

/** アイテムのアライン */
export type ScrollSnapAlign = 'none' | 'start' | 'center' | 'end';

/** スナップストップ */
export type ScrollSnapStop = 'normal' | 'always';

/** overflow の値 */
export type ScrollOverflow = 'auto' | 'scroll';

/** Scroll Snap コンテナ設定 */
export interface ScrollSnapContainerConfig {
  /** スクロール方向 */
  direction: ScrollDirection;
  /** スナップの厳密さ */
  strictness: ScrollSnapStrictness;
  /** overflow の値 */
  overflow: ScrollOverflow;
  /** scroll-padding (px) */
  scrollPadding: number;
}

/** Scroll Snap アイテム設定 */
export interface ScrollSnapItemConfig {
  /** scroll-snap-align の値 */
  align: ScrollSnapAlign;
  /** scroll-snap-stop の値 */
  stop: ScrollSnapStop;
  /** scroll-margin (px) */
  scrollMargin: number;
}

/** Scroll Snap 全体設定 */
export interface ScrollSnapConfig {
  /** コンテナ設定 */
  container: ScrollSnapContainerConfig;
  /** アイテム設定 */
  item: ScrollSnapItemConfig;
}

/** プリセット定義 */
export interface ScrollSnapPreset {
  /** プリセット名 */
  name: string;
  /** 設定 */
  config: ScrollSnapConfig;
}

/**
 * コンテナの CSS プロパティ群を生成する
 *
 * @param config - コンテナ設定
 * @returns CSS プロパティ文字列の配列
 */
export function generateContainerProperties(
  config: ScrollSnapContainerConfig
): string[] {
  const props: string[] = [];

  const overflowProp =
    config.direction === 'x' || config.direction === 'inline'
      ? `overflow-x: ${config.overflow};`
      : config.direction === 'y' || config.direction === 'block'
        ? `overflow-y: ${config.overflow};`
        : `overflow: ${config.overflow};`;
  props.push(overflowProp);

  props.push(`scroll-snap-type: ${config.direction} ${config.strictness};`);

  if (config.scrollPadding > 0) {
    props.push(`scroll-padding: ${config.scrollPadding}px;`);
  }

  return props;
}

/**
 * アイテムの CSS プロパティ群を生成する
 *
 * @param config - アイテム設定
 * @returns CSS プロパティ文字列の配列
 */
export function generateItemProperties(
  config: ScrollSnapItemConfig
): string[] {
  const props: string[] = [];

  if (config.align !== 'none') {
    props.push(`scroll-snap-align: ${config.align};`);
  }

  if (config.stop === 'always') {
    props.push(`scroll-snap-stop: always;`);
  }

  if (config.scrollMargin > 0) {
    props.push(`scroll-margin: ${config.scrollMargin}px;`);
  }

  return props;
}

/**
 * コンテナ CSS ブロックを生成する
 *
 * @param config - コンテナ設定
 * @returns CSS コード文字列
 */
export function generateContainerCSS(
  config: ScrollSnapContainerConfig
): string {
  const props = generateContainerProperties(config);
  return `.scroll-container {\n${props.map((p) => `  ${p}`).join('\n')}\n}`;
}

/**
 * アイテム CSS ブロックを生成する
 *
 * @param config - アイテム設定
 * @returns CSS コード文字列
 */
export function generateItemCSS(config: ScrollSnapItemConfig): string {
  const props = generateItemProperties(config);
  if (props.length === 0) {
    return `.scroll-item {\n  /* スナップ設定なし */\n}`;
  }
  return `.scroll-item {\n${props.map((p) => `  ${p}`).join('\n')}\n}`;
}

/**
 * 全体の CSS コードを生成する
 *
 * @param config - 全体設定
 * @returns CSS コード文字列
 */
export function generateFullCSS(config: ScrollSnapConfig): string {
  return `${generateContainerCSS(config.container)}\n\n${generateItemCSS(config.item)}`;
}

/**
 * デフォルト設定を生成する
 *
 * @returns デフォルトの ScrollSnapConfig
 */
export function createDefaultConfig(): ScrollSnapConfig {
  return {
    container: {
      direction: 'x',
      strictness: 'mandatory',
      overflow: 'scroll',
      scrollPadding: 0,
    },
    item: {
      align: 'start',
      stop: 'normal',
      scrollMargin: 0,
    },
  };
}

/** プリセット一覧 */
export const SCROLL_SNAP_PRESETS: ScrollSnapPreset[] = [
  {
    name: '横スライダー',
    config: {
      container: {
        direction: 'x',
        strictness: 'mandatory',
        overflow: 'scroll',
        scrollPadding: 0,
      },
      item: { align: 'start', stop: 'normal', scrollMargin: 0 },
    },
  },
  {
    name: '縦スクロール',
    config: {
      container: {
        direction: 'y',
        strictness: 'mandatory',
        overflow: 'scroll',
        scrollPadding: 0,
      },
      item: { align: 'start', stop: 'normal', scrollMargin: 0 },
    },
  },
  {
    name: 'センタースナップ',
    config: {
      container: {
        direction: 'x',
        strictness: 'mandatory',
        overflow: 'scroll',
        scrollPadding: 16,
      },
      item: { align: 'center', stop: 'normal', scrollMargin: 0 },
    },
  },
  {
    name: '必ず止まる',
    config: {
      container: {
        direction: 'x',
        strictness: 'mandatory',
        overflow: 'scroll',
        scrollPadding: 0,
      },
      item: { align: 'start', stop: 'always', scrollMargin: 0 },
    },
  },
  {
    name: 'ソフトスナップ',
    config: {
      container: {
        direction: 'x',
        strictness: 'proximity',
        overflow: 'scroll',
        scrollPadding: 0,
      },
      item: { align: 'start', stop: 'normal', scrollMargin: 0 },
    },
  },
  {
    name: '余白付きスナップ',
    config: {
      container: {
        direction: 'x',
        strictness: 'mandatory',
        overflow: 'scroll',
        scrollPadding: 24,
      },
      item: { align: 'start', stop: 'normal', scrollMargin: 8 },
    },
  },
];
