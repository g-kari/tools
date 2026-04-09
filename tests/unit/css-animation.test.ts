import { describe, it, expect } from "vite-plus/test";
import {
  generateAnimationCSS,
  generateKeyframes,
  generateAnimationProperty,
  getDefaultConfig,
  type AnimationConfig,
} from "../../app/utils/css-animation";

describe("css-animation ユーティリティ", () => {
  describe("getDefaultConfig", () => {
    it("AnimationConfigオブジェクトを返す", () => {
      const config = getDefaultConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe("object");
    });

    it("デフォルトのtypeはfadeである", () => {
      const config = getDefaultConfig();
      expect(config.type).toBe("fade");
    });

    it("デフォルトのdurationは0.5である", () => {
      const config = getDefaultConfig();
      expect(config.duration).toBe(0.5);
    });

    it("デフォルトのtimingFunctionはeaseである", () => {
      const config = getDefaultConfig();
      expect(config.timingFunction).toBe("ease");
    });

    it("デフォルトのfillModeはforwardsである", () => {
      const config = getDefaultConfig();
      expect(config.fillMode).toBe("forwards");
    });
  });

  describe("generateKeyframes", () => {
    it("fadeのkeyframesにopacityが含まれる", () => {
      const config = getDefaultConfig();
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("opacity");
    });

    it("fadeのkeyframe名はca-fadeである", () => {
      const config = getDefaultConfig();
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("@keyframes ca-fade");
    });

    it("slide-upのkeyframesにtranslateYが含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        type: "slide",
        slideDirection: "up",
      };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("translateY");
    });

    it("slide-downのkeyframesにtranslateYが含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        type: "slide",
        slideDirection: "down",
      };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("translateY(-30px)");
    });

    it("slide-leftのkeyframesにtranslateXが含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        type: "slide",
        slideDirection: "left",
      };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("translateX");
    });

    it("slide-rightのkeyframesにtranslateXが含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        type: "slide",
        slideDirection: "right",
      };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("translateX(-30px)");
    });

    it("bounceのkeyframesが含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), type: "bounce" };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("@keyframes ca-bounce");
    });

    it("rotateのkeyframesに360degが含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), type: "rotate" };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("360deg");
    });

    it("scaleのkeyframesにscale(0)が含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), type: "scale" };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("scale(0)");
    });

    it("shakeのkeyframesにtranslateXが含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), type: "shake" };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("translateX");
    });

    it("pulseのkeyframesにscaleが含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), type: "pulse" };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("scale");
    });

    it("flipのkeyframesにrotateYが含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), type: "flip" };
      const keyframes = generateKeyframes(config);
      expect(keyframes).toContain("rotateY");
    });
  });

  describe("generateAnimationProperty", () => {
    it("durationが正しく含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), duration: 1.5 };
      const prop = generateAnimationProperty(config);
      expect(prop).toContain("1.5s");
    });

    it("timingFunctionが含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        timingFunction: "ease-in-out",
      };
      const prop = generateAnimationProperty(config);
      expect(prop).toContain("ease-in-out");
    });

    it("iterationCountがinfiniteの場合infiniteが含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        iterationCount: "infinite",
      };
      const prop = generateAnimationProperty(config);
      expect(prop).toContain("infinite");
    });

    it("delayが含まれる", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), delay: 0.5 };
      const prop = generateAnimationProperty(config);
      expect(prop).toContain("0.5s");
    });

    it("fillModeがforwardsの場合含まれる", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        fillMode: "forwards",
      };
      const prop = generateAnimationProperty(config);
      expect(prop).toContain("forwards");
    });
  });

  describe("generateAnimationCSS", () => {
    it("@keyframesブロックを含む", () => {
      const config = getDefaultConfig();
      const css = generateAnimationCSS(config);
      expect(css).toContain("@keyframes");
    });

    it("animationプロパティを含む", () => {
      const config = getDefaultConfig();
      const css = generateAnimationCSS(config);
      expect(css).toContain("animation:");
    });

    it(".my-elementセレクターを含む", () => {
      const config = getDefaultConfig();
      const css = generateAnimationCSS(config);
      expect(css).toContain(".my-element");
    });

    it("2秒のdurationが正しく反映される", () => {
      const config: AnimationConfig = { ...getDefaultConfig(), duration: 2 };
      const css = generateAnimationCSS(config);
      expect(css).toContain("2s");
    });

    it("ease-in-outのtimingFunctionが反映される", () => {
      const config: AnimationConfig = {
        ...getDefaultConfig(),
        timingFunction: "ease-in-out",
      };
      const css = generateAnimationCSS(config);
      expect(css).toContain("ease-in-out");
    });
  });
});
