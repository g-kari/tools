import { describe, it, expect } from 'vitest';
import {
  createDefaultState,
  generateTransformValue,
  generateFullCSS,
  isDefaultState,
  TRANSFORM_PRESETS,
} from '../../app/utils/css-transform';

describe('CSS Transform Generator', () => {
  describe('createDefaultState', () => {
    it('デフォルト状態を返す', () => {
      const state = createDefaultState();
      expect(state.translateX).toBe(0);
      expect(state.translateY).toBe(0);
      expect(state.translateZ).toBe(0);
      expect(state.rotateX).toBe(0);
      expect(state.rotateY).toBe(0);
      expect(state.rotateZ).toBe(0);
      expect(state.scaleX).toBe(1);
      expect(state.scaleY).toBe(1);
      expect(state.skewX).toBe(0);
      expect(state.skewY).toBe(0);
      expect(state.perspective).toBe(0);
    });
  });

  describe('generateTransformValue', () => {
    it('デフォルト状態では "none" を返す', () => {
      const state = createDefaultState();
      expect(generateTransformValue(state)).toBe('none');
    });

    it('translateX が設定された場合', () => {
      const state = { ...createDefaultState(), translateX: 100 };
      expect(generateTransformValue(state)).toBe('translateX(100px)');
    });

    it('translateY が設定された場合', () => {
      const state = { ...createDefaultState(), translateY: -50 };
      expect(generateTransformValue(state)).toBe('translateY(-50px)');
    });

    it('translateZ が設定された場合', () => {
      const state = { ...createDefaultState(), translateZ: 30 };
      expect(generateTransformValue(state)).toBe('translateZ(30px)');
    });

    it('rotateZ が設定された場合', () => {
      const state = { ...createDefaultState(), rotateZ: 45 };
      expect(generateTransformValue(state)).toBe('rotateZ(45deg)');
    });

    it('rotateX と rotateY が設定された場合', () => {
      const state = { ...createDefaultState(), rotateX: 30, rotateY: 60 };
      expect(generateTransformValue(state)).toBe('rotateX(30deg) rotateY(60deg)');
    });

    it('scaleX と scaleY が等しい場合は scale() を使用', () => {
      const state = { ...createDefaultState(), scaleX: 1.5, scaleY: 1.5 };
      expect(generateTransformValue(state)).toBe('scale(1.5)');
    });

    it('scaleX のみ設定された場合', () => {
      const state = { ...createDefaultState(), scaleX: 2 };
      expect(generateTransformValue(state)).toBe('scaleX(2)');
    });

    it('scaleY のみ設定された場合', () => {
      const state = { ...createDefaultState(), scaleY: 0.5 };
      expect(generateTransformValue(state)).toBe('scaleY(0.5)');
    });

    it('skewX が設定された場合', () => {
      const state = { ...createDefaultState(), skewX: 20 };
      expect(generateTransformValue(state)).toBe('skewX(20deg)');
    });

    it('skewY が設定された場合', () => {
      const state = { ...createDefaultState(), skewY: -15 };
      expect(generateTransformValue(state)).toBe('skewY(-15deg)');
    });

    it('複数の変形が設定された場合', () => {
      const state = { ...createDefaultState(), translateX: 50, rotateZ: 45, scaleX: 1.2, scaleY: 1.2 };
      expect(generateTransformValue(state)).toBe('translateX(50px) rotateZ(45deg) scale(1.2)');
    });
  });

  describe('generateFullCSS', () => {
    it('デフォルト状態では transform: none を含む', () => {
      const state = createDefaultState();
      const css = generateFullCSS(state);
      expect(css).toContain('transform: none;');
      expect(css).not.toContain('perspective');
    });

    it('perspective が設定された場合は perspective プロパティを含む', () => {
      const state = { ...createDefaultState(), perspective: 600 };
      const css = generateFullCSS(state);
      expect(css).toContain('perspective: 600px;');
    });

    it('perspective が 0 の場合は perspective プロパティを含まない', () => {
      const state = { ...createDefaultState(), rotateX: 45 };
      const css = generateFullCSS(state);
      expect(css).not.toContain('perspective:');
    });

    it('.element クラスが含まれる', () => {
      const state = createDefaultState();
      const css = generateFullCSS(state);
      expect(css).toContain('.element {');
    });
  });

  describe('isDefaultState', () => {
    it('デフォルト状態は true を返す', () => {
      const state = createDefaultState();
      expect(isDefaultState(state)).toBe(true);
    });

    it('変形が設定された場合は false を返す', () => {
      const state = { ...createDefaultState(), translateX: 50 };
      expect(isDefaultState(state)).toBe(false);
    });

    it('scaleX が 0.5 の場合は false を返す', () => {
      const state = { ...createDefaultState(), scaleX: 0.5 };
      expect(isDefaultState(state)).toBe(false);
    });
  });

  describe('TRANSFORM_PRESETS', () => {
    it('プリセットが存在する', () => {
      expect(TRANSFORM_PRESETS.length).toBeGreaterThan(0);
    });

    it('各プリセットに label と state がある', () => {
      TRANSFORM_PRESETS.forEach((preset) => {
        expect(preset.label).toBeTruthy();
        expect(preset.state).toBeDefined();
      });
    });

    it('各プリセットの state はデフォルトではない', () => {
      TRANSFORM_PRESETS.forEach((preset) => {
        expect(isDefaultState(preset.state)).toBe(false);
      });
    });
  });
});
