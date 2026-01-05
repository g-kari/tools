import { describe, it, expect } from 'vitest';
import {
  getAnimationEffectLabel,
  getAnimationSpeedLabel,
  type AnimationConfig,
  type AnimationEffectType,
  type AnimationSpeed,
} from '../../app/utils/animationEffects';

describe('animationEffects', () => {
  // Note: Canvas rendering tests are skipped in jsdom environment
  // These functions are tested via E2E tests instead

  describe('generateAnimationFrames', () => {
    it('should export generateAnimationFrames function', async () => {
      const module = await import('../../app/utils/animationEffects');
      expect(module.generateAnimationFrames).toBeDefined();
      expect(typeof module.generateAnimationFrames).toBe('function');
    });
  });

  describe('getAnimationEffectLabel', () => {
    it('should return correct labels for all effects', () => {
      const effects: AnimationEffectType[] = ['bounce', 'shake', 'rotate', 'pulse', 'fade', 'slide'];

      effects.forEach(effect => {
        const label = getAnimationEffectLabel(effect);
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      });
    });

    it('should return バウンス for bounce', () => {
      expect(getAnimationEffectLabel('bounce')).toBe('バウンス');
    });

    it('should return シェイク for shake', () => {
      expect(getAnimationEffectLabel('shake')).toBe('シェイク');
    });

    it('should return 回転 for rotate', () => {
      expect(getAnimationEffectLabel('rotate')).toBe('回転');
    });

    it('should return パルス for pulse', () => {
      expect(getAnimationEffectLabel('pulse')).toBe('パルス');
    });

    it('should return フェード for fade', () => {
      expect(getAnimationEffectLabel('fade')).toBe('フェード');
    });

    it('should return スライド for slide', () => {
      expect(getAnimationEffectLabel('slide')).toBe('スライド');
    });
  });

  describe('getAnimationSpeedLabel', () => {
    it('should return correct labels for all speeds', () => {
      const speeds: AnimationSpeed[] = ['slow', 'normal', 'fast'];

      speeds.forEach(speed => {
        const label = getAnimationSpeedLabel(speed);
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      });
    });

    it('should return 遅い (0.5x) for slow', () => {
      expect(getAnimationSpeedLabel('slow')).toBe('遅い (0.5x)');
    });

    it('should return 普通 (1x) for normal', () => {
      expect(getAnimationSpeedLabel('normal')).toBe('普通 (1x)');
    });

    it('should return 速い (2x) for fast', () => {
      expect(getAnimationSpeedLabel('fast')).toBe('速い (2x)');
    });
  });

  describe('AnimationConfig', () => {
    it('should allow all effect types', () => {
      const effects: AnimationEffectType[] = ['bounce', 'shake', 'rotate', 'pulse', 'fade', 'slide'];

      effects.forEach(effect => {
        const config: AnimationConfig = {
          effect,
          speed: 'normal',
          loop: 0,
        };
        expect(config.effect).toBe(effect);
      });
    });

    it('should allow all speed types', () => {
      const speeds: AnimationSpeed[] = ['slow', 'normal', 'fast'];

      speeds.forEach(speed => {
        const config: AnimationConfig = {
          effect: 'bounce',
          speed,
          loop: 0,
        };
        expect(config.speed).toBe(speed);
      });
    });

    it('should support infinite loop (0)', () => {
      const config: AnimationConfig = {
        effect: 'bounce',
        speed: 'normal',
        loop: 0,
      };
      expect(config.loop).toBe(0);
    });

    it('should support finite loops', () => {
      const config: AnimationConfig = {
        effect: 'bounce',
        speed: 'normal',
        loop: 3,
      };
      expect(config.loop).toBe(3);
    });
  });
});
