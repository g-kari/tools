import { describe, it, expect } from 'vitest';
import {
  generateContainerCSS,
  generateItemCSS,
  generateFullCSS,
  getContainerStyles,
  getItemStyles,
  createDefaultItem,
  createDefaultItems,
  defaultContainerConfig,
} from '../../app/utils/css-flexbox';

describe('css-flexbox ユーティリティ', () => {
  describe('generateContainerCSS', () => {
    it('デフォルト設定で最小限のCSSを生成する', () => {
      const css = generateContainerCSS(defaultContainerConfig);
      expect(css).toContain('display: flex;');
      expect(css).toContain('.container {');
    });

    it('flex-direction が row 以外の場合にプロパティを出力する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        flexDirection: 'column',
      });
      expect(css).toContain('flex-direction: column;');
    });

    it('flex-direction が row の場合はプロパティを省略する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        flexDirection: 'row',
      });
      expect(css).not.toContain('flex-direction');
    });

    it('justify-content が flex-start 以外の場合にプロパティを出力する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        justifyContent: 'center',
      });
      expect(css).toContain('justify-content: center;');
    });

    it('align-items が stretch 以外の場合にプロパティを出力する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        alignItems: 'center',
      });
      expect(css).toContain('align-items: center;');
    });

    it('flex-wrap が nowrap 以外の場合にプロパティを出力する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        flexWrap: 'wrap',
      });
      expect(css).toContain('flex-wrap: wrap;');
    });

    it('align-content は flex-wrap が nowrap の場合は出力しない', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        flexWrap: 'nowrap',
        alignContent: 'center',
      });
      expect(css).not.toContain('align-content');
    });

    it('align-content は flex-wrap が wrap で normal 以外の場合に出力する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        flexWrap: 'wrap',
        alignContent: 'center',
      });
      expect(css).toContain('align-content: center;');
    });

    it('gap を出力する', () => {
      const css = generateContainerCSS({
        ...defaultContainerConfig,
        gap: '16px',
      });
      expect(css).toContain('gap: 16px;');
    });

    it('カスタムセレクターを使用できる', () => {
      const css = generateContainerCSS(defaultContainerConfig, '.my-flex');
      expect(css).toContain('.my-flex {');
    });
  });

  describe('generateItemCSS', () => {
    it('デフォルトアイテムではCSSを生成しない', () => {
      const item = createDefaultItem(0);
      const css = generateItemCSS(item, '.item');
      expect(css).toBe('');
    });

    it('flex-grow が非ゼロの場合に flex プロパティを出力する', () => {
      const item = { ...createDefaultItem(0), flexGrow: 1 };
      const css = generateItemCSS(item, '.item');
      expect(css).toContain('flex: 1 1 auto;');
    });

    it('flex-shrink が1以外の場合に flex プロパティを出力する', () => {
      const item = { ...createDefaultItem(0), flexShrink: 0 };
      const css = generateItemCSS(item, '.item');
      expect(css).toContain('flex: 0 0 auto;');
    });

    it('flex-basis が auto 以外の場合に flex プロパティを出力する', () => {
      const item = { ...createDefaultItem(0), flexBasis: '200px' };
      const css = generateItemCSS(item, '.item');
      expect(css).toContain('flex: 0 1 200px;');
    });

    it('align-self が auto 以外の場合にプロパティを出力する', () => {
      const item = { ...createDefaultItem(0), alignSelf: 'center' as const };
      const css = generateItemCSS(item, '.item');
      expect(css).toContain('align-self: center;');
    });

    it('order が0以外の場合にプロパティを出力する', () => {
      const item = { ...createDefaultItem(0), order: 2 };
      const css = generateItemCSS(item, '.item');
      expect(css).toContain('order: 2;');
    });
  });

  describe('generateFullCSS', () => {
    it('コンテナのCSSを含む', () => {
      const items = createDefaultItems();
      const css = generateFullCSS(defaultContainerConfig, items);
      expect(css).toContain('.container {');
      expect(css).toContain('display: flex;');
    });

    it('カスタムプロパティを持つアイテムのCSSを含む', () => {
      const items = [
        { ...createDefaultItem(0), flexGrow: 1 },
        createDefaultItem(1),
      ];
      const css = generateFullCSS(defaultContainerConfig, items);
      expect(css).toContain('.item:nth-child(1) {');
      expect(css).toContain('flex: 1 1 auto;');
    });

    it('デフォルトアイテムのみの場合はアイテムCSSを含まない', () => {
      const items = createDefaultItems();
      const css = generateFullCSS(defaultContainerConfig, items);
      expect(css).not.toContain('.item:nth-child');
    });
  });

  describe('getContainerStyles', () => {
    it('display: flex を含む', () => {
      const styles = getContainerStyles(defaultContainerConfig);
      expect(styles.display).toBe('flex');
    });

    it('すべてのプロパティが含まれる', () => {
      const styles = getContainerStyles({
        ...defaultContainerConfig,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        alignContent: 'center',
        gap: '10px',
      });
      expect(styles.flexDirection).toBe('column');
      expect(styles.justifyContent).toBe('center');
      expect(styles.alignItems).toBe('center');
      expect(styles.flexWrap).toBe('wrap');
      expect(styles.alignContent).toBe('center');
      expect(styles.gap).toBe('10px');
    });

    it('flexWrap が nowrap の場合は alignContent を含まない', () => {
      const styles = getContainerStyles({
        ...defaultContainerConfig,
        flexWrap: 'nowrap',
        alignContent: 'center',
      });
      expect(styles.alignContent).toBeUndefined();
    });
  });

  describe('getItemStyles', () => {
    it('デフォルトアイテムは空のスタイルを返す', () => {
      const item = createDefaultItem(0);
      const styles = getItemStyles(item);
      expect(Object.keys(styles)).toHaveLength(0);
    });

    it('flex-grow が設定されている場合に flex プロパティを返す', () => {
      const item = { ...createDefaultItem(0), flexGrow: 2 };
      const styles = getItemStyles(item);
      expect(styles.flex).toBe('2 1 auto');
    });

    it('align-self が設定されている場合にプロパティを返す', () => {
      const item = { ...createDefaultItem(0), alignSelf: 'flex-end' as const };
      const styles = getItemStyles(item);
      expect(styles.alignSelf).toBe('flex-end');
    });

    it('order が0以外の場合にプロパティを返す', () => {
      const item = { ...createDefaultItem(0), order: -1 };
      const styles = getItemStyles(item);
      expect(styles.order).toBe('-1');
    });
  });

  describe('createDefaultItem', () => {
    it('正しいデフォルト値を持つ', () => {
      const item = createDefaultItem(0);
      expect(item.label).toBe('Item 1');
      expect(item.flexGrow).toBe(0);
      expect(item.flexShrink).toBe(1);
      expect(item.flexBasis).toBe('auto');
      expect(item.alignSelf).toBe('auto');
      expect(item.order).toBe(0);
    });

    it('インデックスに応じたラベルを持つ', () => {
      const item2 = createDefaultItem(2);
      expect(item2.label).toBe('Item 3');
    });
  });

  describe('createDefaultItems', () => {
    it('3つのアイテムを返す', () => {
      const items = createDefaultItems();
      expect(items).toHaveLength(3);
    });

    it('各アイテムが異なるIDを持つ', () => {
      const items = createDefaultItems();
      const ids = items.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
