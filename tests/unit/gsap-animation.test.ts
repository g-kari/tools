/**
 * GSAP Animation Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createEffectTimeline,
  sampleTimeline,
  getGSAPEasingLabel,
  getEasingDirectionLabel,
  type GSAPAnimationConfig,
  type GSAPEasingType,
  type EasingDirection,
} from '~/utils/gsapAnimationEngine';

describe('gsapAnimationEngine', () => {

  describe('createEffectTimeline', () => {
    it('should create a timeline for bounce effect', () => {
      const config: GSAPAnimationConfig = {
        effect: 'bounce',
        easing: 'bounce',
        easingDirection: 'out',
        fps: 12,
        duration: 1.0,
        loop: 0,
      };

      const timeline = createEffectTimeline(config);
      expect(timeline).toBeDefined();
      expect(timeline.data).toBeDefined();
      expect(timeline.data.proxy).toBeDefined();
    });

    it('should create timelines for all effect types', () => {
      const effects: Array<GSAPAnimationConfig['effect']> = [
        'bounce', 'shake', 'rotate', 'pulse', 'fade', 'slide', 'wobble', 'pop'
      ];

      effects.forEach(effect => {
        const config: GSAPAnimationConfig = {
          effect,
          easing: 'bounce',
          easingDirection: 'out',
          fps: 12,
          duration: 1.0,
          loop: 0,
        };

        const timeline = createEffectTimeline(config);
        expect(timeline).toBeDefined();
        expect(timeline.duration()).toBeGreaterThan(0);
      });
    });
  });

  describe('sampleTimeline', () => {
    it('should sample correct number of frames', () => {
      const config: GSAPAnimationConfig = {
        effect: 'bounce',
        easing: 'bounce',
        easingDirection: 'out',
        fps: 12,
        duration: 1.0,
        loop: 0,
      };

      const timeline = createEffectTimeline(config);
      const frameCount = 12;
      const samples = sampleTimeline(timeline, frameCount);

      expect(samples).toHaveLength(frameCount);
    });

    it('should have correct start and end values for bounce', () => {
      const config: GSAPAnimationConfig = {
        effect: 'bounce',
        easing: 'bounce',
        easingDirection: 'out',
        fps: 12,
        duration: 1.0,
        loop: 0,
      };

      const timeline = createEffectTimeline(config);
      const samples = sampleTimeline(timeline, 12);

      // First frame should be near initial state
      expect(samples[0].x).toBe(0);
      expect(samples[0].y).toBeCloseTo(0, 1);
      expect(samples[0].scaleX).toBe(1);
      expect(samples[0].scaleY).toBe(1);
      expect(samples[0].opacity).toBe(1);

      // Last frame should be at final state (back to 0)
      expect(samples[samples.length - 1].y).toBeCloseTo(0, 1);
    });
  });


  describe('Label functions', () => {
    it('should return correct labels for easing types', () => {
      expect(getGSAPEasingLabel('bounce')).toBe('バウンス');
      expect(getGSAPEasingLabel('elastic')).toBe('エラスティック');
      expect(getGSAPEasingLabel('back')).toBe('バック');
      expect(getGSAPEasingLabel('expo')).toBe('エクスポ');
      expect(getGSAPEasingLabel('circ')).toBe('サーク');
      expect(getGSAPEasingLabel('sine')).toBe('サイン');
      expect(getGSAPEasingLabel('power2')).toBe('パワー2');
    });

    it('should return correct labels for easing directions', () => {
      expect(getEasingDirectionLabel('in')).toBe('イン');
      expect(getEasingDirectionLabel('out')).toBe('アウト');
      expect(getEasingDirectionLabel('inOut')).toBe('イン-アウト');
    });
  });
});
