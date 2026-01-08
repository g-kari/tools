/**
 * GSAP-based animation engine for emoji converter
 * Provides professional easing functions and timeline sampling for Canvas/GIF output
 */

import gsap from 'gsap';

export type GSAPEasingType = 'bounce' | 'elastic' | 'back' | 'expo' | 'circ' | 'sine' | 'power2';
export type EasingDirection = 'in' | 'out' | 'inOut';
export type AnimationEffectType = 'bounce' | 'shake' | 'rotate' | 'pulse' | 'fade' | 'slide' | 'wobble' | 'pop';

/**
 * Configuration for GSAP animation
 */
export interface GSAPAnimationConfig {
  effect: AnimationEffectType;
  easing: GSAPEasingType;
  easingDirection: EasingDirection;
  fps: number;           // 6-30
  duration: number;      // 0.3-3.0秒
  loop: number;          // 0=無限
}

/**
 * Animation proxy object that GSAP will animate
 * Values are then applied to canvas transformations
 */
export interface AnimationProxy {
  x: number;           // X translation (percentage of canvas width)
  y: number;           // Y translation (percentage of canvas height)
  rotation: number;    // Rotation in degrees
  scaleX: number;      // X scale factor
  scaleY: number;      // Y scale factor
  opacity: number;     // Opacity 0-1
}

/**
 * Get GSAP easing string from type and direction
 * @param easing - Easing type
 * @param direction - Easing direction
 * @returns GSAP easing string
 */
function getGSAPEase(easing: GSAPEasingType, direction: EasingDirection): string {
  return `${easing}.${direction}`;
}

/**
 * Create initial proxy state
 * @returns Default proxy state
 */
function createInitialProxy(): AnimationProxy {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
  };
}

/**
 * Create GSAP timeline for a specific effect
 * @param config - Animation configuration
 * @returns GSAP timeline (paused)
 */
export function createEffectTimeline(config: GSAPAnimationConfig): gsap.core.Timeline {
  const proxy = createInitialProxy();
  const ease = getGSAPEase(config.easing, config.easingDirection);
  const timeline = gsap.timeline({ paused: true });

  // Store proxy reference in timeline data
  timeline.data = { proxy };

  switch (config.effect) {
    case 'bounce':
      // Bounce up and down
      timeline.to(proxy, {
        y: -20,
        ease: 'power2.out',
        duration: config.duration * 0.5,
      }).to(proxy, {
        y: 0,
        ease: ease,
        duration: config.duration * 0.5,
      });
      break;

    case 'shake':
      // Shake horizontally with multiple oscillations
      timeline.to(proxy, {
        x: 5,
        ease: ease,
        duration: config.duration * 0.25,
      }).to(proxy, {
        x: -5,
        ease: ease,
        duration: config.duration * 0.25,
      }).to(proxy, {
        x: 3,
        ease: ease,
        duration: config.duration * 0.25,
      }).to(proxy, {
        x: 0,
        ease: ease,
        duration: config.duration * 0.25,
      });
      break;

    case 'rotate':
      // 360 degree rotation
      timeline.to(proxy, {
        rotation: 360,
        ease: ease,
        duration: config.duration,
      });
      break;

    case 'pulse':
      // Scale in and out
      timeline.to(proxy, {
        scaleX: 1.2,
        scaleY: 1.2,
        ease: ease,
        duration: config.duration * 0.5,
      }).to(proxy, {
        scaleX: 1,
        scaleY: 1,
        ease: ease,
        duration: config.duration * 0.5,
      });
      break;

    case 'fade':
      // Fade out and in
      timeline.to(proxy, {
        opacity: 0.3,
        ease: ease,
        duration: config.duration * 0.5,
      }).to(proxy, {
        opacity: 1,
        ease: ease,
        duration: config.duration * 0.5,
      });
      break;

    case 'slide':
      // Slide from left to right
      timeline.to(proxy, {
        x: 50,
        ease: ease,
        duration: config.duration * 0.5,
      }).to(proxy, {
        x: 0,
        ease: ease,
        duration: config.duration * 0.5,
      });
      break;

    case 'wobble':
      // Wobble rotation
      timeline.to(proxy, {
        rotation: 15,
        ease: ease,
        duration: config.duration * 0.25,
      }).to(proxy, {
        rotation: -15,
        ease: ease,
        duration: config.duration * 0.25,
      }).to(proxy, {
        rotation: 10,
        ease: ease,
        duration: config.duration * 0.25,
      }).to(proxy, {
        rotation: 0,
        ease: ease,
        duration: config.duration * 0.25,
      });
      break;

    case 'pop':
      // Pop in from 0 to overshoot
      timeline.fromTo(proxy, {
        scaleX: 0,
        scaleY: 0,
      }, {
        scaleX: 1,
        scaleY: 1,
        ease: ease,
        duration: config.duration,
      });
      break;
  }

  return timeline;
}

/**
 * Sample a GSAP timeline at discrete progress points
 * @param timeline - Configured GSAP timeline (paused)
 * @param frameCount - Number of frames to sample
 * @returns Array of proxy states at each frame
 */
export function sampleTimeline(
  timeline: gsap.core.Timeline,
  frameCount: number
): AnimationProxy[] {
  const samples: AnimationProxy[] = [];
  const proxy = timeline.data.proxy as AnimationProxy;

  for (let i = 0; i < frameCount; i++) {
    const progress = frameCount === 1 ? 0 : i / (frameCount - 1);
    timeline.progress(progress);

    // Clone current proxy state
    samples.push({
      x: proxy.x,
      y: proxy.y,
      rotation: proxy.rotation,
      scaleX: proxy.scaleX,
      scaleY: proxy.scaleY,
      opacity: proxy.opacity,
    });
  }

  return samples;
}

/**
 * Apply animation proxy values to canvas
 * @param baseCanvas - Source canvas to transform
 * @param proxy - Animation proxy state
 * @returns New canvas with transformations applied
 */
export function applyProxyToCanvas(
  baseCanvas: HTMLCanvasElement,
  proxy: AnimationProxy
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = baseCanvas.width;
  canvas.height = baseCanvas.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // Translate to center
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Apply transforms from proxy
  const translateX = (proxy.x / 100) * canvas.width;
  const translateY = (proxy.y / 100) * canvas.height;
  ctx.translate(translateX, translateY);

  // Rotation
  ctx.rotate((proxy.rotation * Math.PI) / 180);

  // Scale
  ctx.scale(proxy.scaleX, proxy.scaleY);

  // Opacity
  ctx.globalAlpha = proxy.opacity;

  // Draw image centered
  ctx.drawImage(
    baseCanvas,
    -canvas.width / 2,
    -canvas.height / 2,
    canvas.width,
    canvas.height
  );

  ctx.restore();

  return canvas;
}

/**
 * Generate animation frames using GSAP
 * @param baseCanvas - Source canvas
 * @param config - GSAP animation configuration
 * @returns Array of canvas frames
 */
export function generateGSAPAnimationFrames(
  baseCanvas: HTMLCanvasElement,
  config: GSAPAnimationConfig
): HTMLCanvasElement[] {
  const frameCount = Math.max(Math.round(config.fps * config.duration), 2);

  // Create timeline
  const timeline = createEffectTimeline(config);

  // Sample timeline at discrete points
  const samples = sampleTimeline(timeline, frameCount);

  // Apply each sample to canvas
  const frames = samples.map((proxy) => applyProxyToCanvas(baseCanvas, proxy));

  // Clean up timeline
  timeline.kill();

  return frames;
}

/**
 * Get label for GSAP easing type
 * @param easing - Easing type
 * @returns Japanese label
 */
export function getGSAPEasingLabel(easing: GSAPEasingType): string {
  const labels: Record<GSAPEasingType, string> = {
    bounce: 'バウンス',
    elastic: 'エラスティック',
    back: 'バック',
    expo: 'エクスポ',
    circ: 'サーク',
    sine: 'サイン',
    power2: 'パワー2',
  };
  return labels[easing];
}

/**
 * Get label for easing direction
 * @param direction - Easing direction
 * @returns Japanese label
 */
export function getEasingDirectionLabel(direction: EasingDirection): string {
  const labels: Record<EasingDirection, string> = {
    in: 'イン',
    out: 'アウト',
    inOut: 'イン-アウト',
  };
  return labels[direction];
}
