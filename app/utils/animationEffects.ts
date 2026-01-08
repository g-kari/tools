/**
 * Animation effects for emoji converter
 * Generates frame transformations for various animation effects
 */

import {
  generateGSAPAnimationFrames,
  type GSAPAnimationConfig,
  type GSAPEasingType,
  type EasingDirection,
} from './gsapAnimationEngine';

// Re-export GSAP types for convenience
export type { GSAPEasingType, EasingDirection };

export type AnimationEffectType = 'bounce' | 'shake' | 'rotate' | 'pulse' | 'fade' | 'slide' | 'wobble' | 'pop';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface AnimationConfig {
  effect: AnimationEffectType;
  speed: AnimationSpeed;
  loop: number; // 0 = infinite
  // GSAP options
  useGSAP?: boolean;
  gsapEasing?: GSAPEasingType;
  easingDirection?: EasingDirection;
  duration?: number; // Animation duration in seconds (for GSAP)
}

const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  slow: 0.5,
  normal: 1.0,
  fast: 2.0,
};

/**
 * Generate animation frames by applying transformations to a base canvas
 * @param baseCanvas - The source canvas to animate
 * @param config - Animation configuration
 * @param fps - Frames per second
 * @returns Array of canvas elements representing animation frames
 */
export function generateAnimationFrames(
  baseCanvas: HTMLCanvasElement,
  config: AnimationConfig,
  fps: number = 12
): HTMLCanvasElement[] {
  // Use GSAP engine if enabled
  if (config.useGSAP) {
    const gsapConfig: GSAPAnimationConfig = {
      effect: config.effect,
      easing: config.gsapEasing || 'bounce',
      easingDirection: config.easingDirection || 'out',
      fps: fps,
      duration: config.duration || 1.0,
      loop: config.loop,
    };
    return generateGSAPAnimationFrames(baseCanvas, gsapConfig);
  }

  // Legacy sine-based implementation
  return generateLegacyFrames(baseCanvas, config, fps);
}

/**
 * Generate animation frames using legacy sine-based method
 * @param baseCanvas - The source canvas to animate
 * @param config - Animation configuration
 * @param fps - Frames per second
 * @returns Array of canvas elements representing animation frames
 */
function generateLegacyFrames(
  baseCanvas: HTMLCanvasElement,
  config: AnimationConfig,
  fps: number
): HTMLCanvasElement[] {
  const speedMultiplier = SPEED_MULTIPLIERS[config.speed];
  const duration = 1.0 / speedMultiplier; // Duration in seconds
  const frameCount = Math.max(Math.round(fps * duration), 2);
  const frames: HTMLCanvasElement[] = [];

  for (let i = 0; i < frameCount; i++) {
    const progress = i / (frameCount - 1); // 0 to 1
    const frame = createAnimationFrame(baseCanvas, config.effect, progress);
    frames.push(frame);
  }

  return frames;
}

/**
 * Create a single animation frame with the specified effect
 * @param baseCanvas - Source canvas
 * @param effect - Animation effect type
 * @param progress - Animation progress (0 to 1)
 * @returns Canvas with the effect applied
 */
function createAnimationFrame(
  baseCanvas: HTMLCanvasElement,
  effect: AnimationEffectType,
  progress: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = baseCanvas.width;
  canvas.height = baseCanvas.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return canvas;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply effect based on type
  ctx.save();

  switch (effect) {
    case 'bounce':
      applyBounceEffect(ctx, canvas, baseCanvas, progress);
      break;
    case 'shake':
      applyShakeEffect(ctx, canvas, baseCanvas, progress);
      break;
    case 'rotate':
      applyRotateEffect(ctx, canvas, baseCanvas, progress);
      break;
    case 'pulse':
      applyPulseEffect(ctx, canvas, baseCanvas, progress);
      break;
    case 'fade':
      applyFadeEffect(ctx, canvas, baseCanvas, progress);
      break;
    case 'slide':
      applySlideEffect(ctx, canvas, baseCanvas, progress);
      break;
  }

  ctx.restore();

  return canvas;
}

/**
 * Bounce effect - bounces up and down
 */
function applyBounceEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseCanvas: HTMLCanvasElement,
  progress: number
): void {
  // Easing function for bounce
  const bounce = Math.abs(Math.sin(progress * Math.PI * 2));
  const maxBounce = canvas.height * 0.15; // Bounce up to 15% of height
  const offsetY = -bounce * maxBounce;

  ctx.drawImage(baseCanvas, 0, offsetY);
}

/**
 * Shake effect - shakes horizontally
 */
function applyShakeEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseCanvas: HTMLCanvasElement,
  progress: number
): void {
  const shakeAmount = canvas.width * 0.05; // Shake 5% of width
  const offsetX = Math.sin(progress * Math.PI * 8) * shakeAmount;

  ctx.drawImage(baseCanvas, offsetX, 0);
}

/**
 * Rotate effect - 360 degree rotation
 */
function applyRotateEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseCanvas: HTMLCanvasElement,
  progress: number
): void {
  const angle = progress * Math.PI * 2; // 0 to 2π

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(angle);
  ctx.drawImage(baseCanvas, -canvas.width / 2, -canvas.height / 2);
}

/**
 * Pulse effect - scales in and out
 */
function applyPulseEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseCanvas: HTMLCanvasElement,
  progress: number
): void {
  // Scale from 0.8 to 1.2
  const scale = 0.8 + Math.abs(Math.sin(progress * Math.PI * 2)) * 0.4;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.drawImage(baseCanvas, -canvas.width / 2, -canvas.height / 2);
}

/**
 * Fade effect - fades in and out
 */
function applyFadeEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseCanvas: HTMLCanvasElement,
  progress: number
): void {
  // Opacity from 0.3 to 1.0
  const opacity = 0.3 + Math.abs(Math.sin(progress * Math.PI * 2)) * 0.7;

  ctx.globalAlpha = opacity;
  ctx.drawImage(baseCanvas, 0, 0);
}

/**
 * Slide effect - slides left to right
 */
function applySlideEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseCanvas: HTMLCanvasElement,
  progress: number
): void {
  // Slide from -100% to +100%
  const offsetX = (progress - 0.5) * canvas.width * 1.5;

  ctx.drawImage(baseCanvas, offsetX, 0);
}

/**
 * Get animation effect label
 */
export function getAnimationEffectLabel(effect: AnimationEffectType): string {
  const labels: Record<AnimationEffectType, string> = {
    bounce: 'バウンス',
    shake: 'シェイク',
    rotate: '回転',
    pulse: 'パルス',
    fade: 'フェード',
    slide: 'スライド',
    wobble: 'ウォブル',
    pop: 'ポップ',
  };
  return labels[effect];
}

/**
 * Get animation speed label
 */
export function getAnimationSpeedLabel(speed: AnimationSpeed): string {
  const labels: Record<AnimationSpeed, string> = {
    slow: '遅い (0.5x)',
    normal: '普通 (1x)',
    fast: '速い (2x)',
  };
  return labels[speed];
}
