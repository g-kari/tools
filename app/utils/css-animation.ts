/**
 * CSSアニメーション生成ユーティリティ
 */

/** アニメーション種類 */
export type AnimationType =
  | "fade"
  | "slide"
  | "bounce"
  | "rotate"
  | "scale"
  | "shake"
  | "pulse"
  | "flip";

/** スライド方向 */
export type SlideDirection = "up" | "down" | "left" | "right";

/** タイミング関数 */
export type TimingFunction = "ease" | "linear" | "ease-in" | "ease-out" | "ease-in-out";

/** アニメーション方向 */
export type AnimationDirection = "normal" | "reverse" | "alternate" | "alternate-reverse";

/** フィルモード */
export type FillMode = "none" | "forwards" | "backwards" | "both";

/** アニメーション設定 */
export interface AnimationConfig {
  type: AnimationType;
  slideDirection: SlideDirection;
  duration: number;
  delay: number;
  iterationCount: number | "infinite";
  timingFunction: TimingFunction;
  direction: AnimationDirection;
  fillMode: FillMode;
}

const VALID_ANIMATION_TYPES: readonly AnimationType[] = [
  "fade",
  "slide",
  "bounce",
  "rotate",
  "scale",
  "shake",
  "pulse",
  "flip",
];
const VALID_SLIDE_DIRECTIONS: readonly SlideDirection[] = ["up", "down", "left", "right"];
const VALID_TIMING_FUNCTIONS: readonly TimingFunction[] = [
  "ease",
  "linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
];
const VALID_DIRECTIONS: readonly AnimationDirection[] = [
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
];
const VALID_FILL_MODES: readonly FillMode[] = ["none", "forwards", "backwards", "both"];

/**
 * アニメーション設定を許可リストで検証する
 * @param config - 検証するアニメーション設定
 * @throws 無効な値が含まれている場合
 */
function validateConfig(config: AnimationConfig): void {
  if (!VALID_ANIMATION_TYPES.includes(config.type)) {
    throw new Error(`Invalid animation type: ${config.type}`);
  }
  if (!VALID_SLIDE_DIRECTIONS.includes(config.slideDirection)) {
    throw new Error(`Invalid slide direction: ${config.slideDirection}`);
  }
  if (!VALID_TIMING_FUNCTIONS.includes(config.timingFunction)) {
    throw new Error(`Invalid timing function: ${config.timingFunction}`);
  }
  if (!VALID_DIRECTIONS.includes(config.direction)) {
    throw new Error(`Invalid direction: ${config.direction}`);
  }
  if (!VALID_FILL_MODES.includes(config.fillMode)) {
    throw new Error(`Invalid fill mode: ${config.fillMode}`);
  }
  if (typeof config.duration !== "number" || config.duration < 0.1 || config.duration > 10) {
    throw new Error(`Invalid duration: ${config.duration}`);
  }
  if (typeof config.delay !== "number" || config.delay < 0 || config.delay > 5) {
    throw new Error(`Invalid delay: ${config.delay}`);
  }
}

/**
 * keyframe名を取得する
 * @param config - アニメーション設定
 * @returns keyframe名
 */
function getKeyframeName(config: AnimationConfig): string {
  if (config.type === "slide") {
    return `ca-slide-${config.slideDirection}`;
  }
  return `ca-${config.type}`;
}

/**
 * @keyframes ブロックを生成する
 * @param config - アニメーション設定
 * @returns @keyframes CSS文字列
 */
export function generateKeyframes(config: AnimationConfig): string {
  const name = getKeyframeName(config);

  switch (config.type) {
    case "fade":
      return `@keyframes ${name} {
  from { opacity: 0; }
  to { opacity: 1; }
}`;

    case "slide":
      switch (config.slideDirection) {
        case "up":
          return `@keyframes ${name} {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}`;
        case "down":
          return `@keyframes ${name} {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}`;
        case "left":
          return `@keyframes ${name} {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}`;
        case "right":
          return `@keyframes ${name} {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}`;
      }
      break;

    case "bounce":
      return `@keyframes ${name} {
  0%, 100% { transform: translateY(0); animation-timing-function: ease-in; }
  50% { transform: translateY(-20px); animation-timing-function: ease-out; }
}`;

    case "rotate":
      return `@keyframes ${name} {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;

    case "scale":
      return `@keyframes ${name} {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}`;

    case "shake":
      return `@keyframes ${name} {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}`;

    case "pulse":
      return `@keyframes ${name} {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}`;

    case "flip":
      return `@keyframes ${name} {
  from { transform: perspective(400px) rotateY(0deg); }
  to { transform: perspective(400px) rotateY(360deg); }
}`;
  }

  return `@keyframes ${name} {
  from { opacity: 0; }
  to { opacity: 1; }
}`;
}

/**
 * animation プロパティの値を生成する
 * @param config - アニメーション設定
 * @returns animation プロパティ値文字列
 */
export function generateAnimationProperty(config: AnimationConfig): string {
  const name = getKeyframeName(config);
  const duration = `${config.duration}s`;
  const timing = config.timingFunction;
  const delay = config.delay > 0 ? ` ${config.delay}s` : "";
  const iteration =
    config.iterationCount === "infinite"
      ? " infinite"
      : config.iterationCount > 1
        ? ` ${config.iterationCount}`
        : "";
  const direction = config.direction !== "normal" ? ` ${config.direction}` : "";
  const fillMode = config.fillMode !== "none" ? ` ${config.fillMode}` : "";

  return `${name} ${duration} ${timing}${delay}${iteration}${direction}${fillMode}`;
}

/**
 * アニメーション設定から @keyframes と animation プロパティを含む CSS を生成する
 * @param config - アニメーション設定
 * @returns 完全なCSS文字列
 */
export function generateAnimationCSS(config: AnimationConfig): string {
  validateConfig(config);
  const keyframes = generateKeyframes(config);
  const animProp = generateAnimationProperty(config);

  return `${keyframes}

.my-element {
  animation: ${animProp};
}`;
}

/**
 * デフォルトのアニメーション設定を返す
 * @returns デフォルトのAnimationConfig
 */
export function getDefaultConfig(): AnimationConfig {
  return {
    type: "fade",
    slideDirection: "up",
    duration: 0.5,
    delay: 0,
    iterationCount: 1,
    timingFunction: "ease",
    direction: "normal",
    fillMode: "forwards",
  };
}
