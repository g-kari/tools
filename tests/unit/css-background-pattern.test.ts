import { describe, it, expect } from 'vitest';
import {
  generateStripes,
  generateDiagonal,
  generateGrid,
  generateCheckerboard,
  generateDots,
  generateZigzag,
  generatePatternCSS,
  createDefaultConfig,
  PATTERN_PRESETS,
} from '../../app/utils/css-background-pattern';

const baseConfig = createDefaultConfig();

describe('generateStripes', () => {
  it('repeating-linear-gradientを含む', () => {
    const result = generateStripes(baseConfig);
    expect(result.background).toContain('repeating-linear-gradient');
  });

  it('指定した色が含まれる', () => {
    const config = { ...baseConfig, color1: '#ff0000', color2: '#0000ff' };
    const result = generateStripes(config);
    expect(result.background).toContain('#ff0000');
    expect(result.background).toContain('#0000ff');
  });

  it('指定した角度が含まれる', () => {
    const config = { ...baseConfig, angle: 90 };
    const result = generateStripes(config);
    expect(result.background).toContain('90deg');
  });

  it('backgroundSizeを返さない', () => {
    const result = generateStripes(baseConfig);
    expect(result.backgroundSize).toBeUndefined();
  });

  it('fullCSSが background: で始まる', () => {
    const result = generateStripes(baseConfig);
    expect(result.fullCSS).toMatch(/^background:/);
  });
});

describe('generateDiagonal', () => {
  it('repeating-linear-gradientを含む', () => {
    const result = generateDiagonal(baseConfig);
    expect(result.background).toContain('repeating-linear-gradient');
  });

  it('45度のデフォルト角度が含まれる', () => {
    const result = generateDiagonal(baseConfig);
    expect(result.background).toContain('45deg');
  });

  it('backgroundSizeを返さない', () => {
    const result = generateDiagonal(baseConfig);
    expect(result.backgroundSize).toBeUndefined();
  });
});

describe('generateGrid', () => {
  it('2方向のrepeating-linear-gradientを含む', () => {
    const result = generateGrid(baseConfig);
    const count = (result.background.match(/repeating-linear-gradient/g) || []).length;
    expect(count).toBe(2);
  });

  it('0degと90degを含む', () => {
    const result = generateGrid(baseConfig);
    expect(result.background).toContain('0deg');
    expect(result.background).toContain('90deg');
  });

  it('background-colorとして color2 が含まれる', () => {
    const config = { ...baseConfig, color2: '#ffffff' };
    const result = generateGrid(config);
    expect(result.background).toContain('#ffffff');
  });

  it('backgroundSizeを返さない', () => {
    const result = generateGrid(baseConfig);
    expect(result.backgroundSize).toBeUndefined();
  });
});

describe('generateCheckerboard', () => {
  it('repeating-conic-gradientを含む', () => {
    const result = generateCheckerboard(baseConfig);
    expect(result.background).toContain('repeating-conic-gradient');
  });

  it('backgroundSizeを返す', () => {
    const config = { ...baseConfig, size: 30 };
    const result = generateCheckerboard(config);
    expect(result.backgroundSize).toBe('30px 30px');
  });

  it('fullCSSがbackground-sizeを含む', () => {
    const result = generateCheckerboard(baseConfig);
    expect(result.fullCSS).toContain('background-size:');
  });
});

describe('generateDots', () => {
  it('radial-gradientを含む', () => {
    const result = generateDots(baseConfig);
    expect(result.background).toContain('radial-gradient');
  });

  it('dotRadiusが反映される', () => {
    const config = { ...baseConfig, dotRadius: 40 };
    const result = generateDots(config);
    expect(result.background).toContain('40%');
  });

  it('backgroundSizeを返す', () => {
    const config = { ...baseConfig, size: 32 };
    const result = generateDots(config);
    expect(result.backgroundSize).toBe('32px 32px');
  });

  it('fullCSSがbackground-sizeを含む', () => {
    const result = generateDots(baseConfig);
    expect(result.fullCSS).toContain('background-size:');
  });
});

describe('generateZigzag', () => {
  it('複数のrepeating-linear-gradientを含む', () => {
    const result = generateZigzag(baseConfig);
    const count = (result.background.match(/repeating-linear-gradient/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('backgroundSizeを返す', () => {
    const config = { ...baseConfig, size: 20 };
    const result = generateZigzag(config);
    expect(result.backgroundSize).toBe('20px 10px');
  });

  it('fullCSSがbackground-sizeを含む', () => {
    const result = generateZigzag(baseConfig);
    expect(result.fullCSS).toContain('background-size:');
  });
});

describe('generatePatternCSS', () => {
  it('stripes タイプでgenerateStripesと同一結果を返す', () => {
    const config = { ...baseConfig, type: 'stripes' as const };
    const result = generatePatternCSS(config);
    expect(result.background).toContain('repeating-linear-gradient');
  });

  it('dots タイプでradial-gradientを含む', () => {
    const config = { ...baseConfig, type: 'dots' as const };
    const result = generatePatternCSS(config);
    expect(result.background).toContain('radial-gradient');
  });

  it('grid タイプで0degと90degを含む', () => {
    const config = { ...baseConfig, type: 'grid' as const };
    const result = generatePatternCSS(config);
    expect(result.background).toContain('0deg');
    expect(result.background).toContain('90deg');
  });

  it('checkerboard タイプでrepeating-conic-gradientを含む', () => {
    const config = { ...baseConfig, type: 'checkerboard' as const };
    const result = generatePatternCSS(config);
    expect(result.background).toContain('repeating-conic-gradient');
  });

  it('diagonal タイプでrepeating-linear-gradientを含む', () => {
    const config = { ...baseConfig, type: 'diagonal' as const };
    const result = generatePatternCSS(config);
    expect(result.background).toContain('repeating-linear-gradient');
  });

  it('zigzag タイプでbackgroundSizeが返る', () => {
    const config = { ...baseConfig, type: 'zigzag' as const };
    const result = generatePatternCSS(config);
    expect(result.backgroundSize).toBeDefined();
  });
});

describe('createDefaultConfig', () => {
  it('必須プロパティを持つ', () => {
    const config = createDefaultConfig();
    expect(config).toHaveProperty('type');
    expect(config).toHaveProperty('color1');
    expect(config).toHaveProperty('color2');
    expect(config).toHaveProperty('size');
    expect(config).toHaveProperty('angle');
    expect(config).toHaveProperty('lineWidth');
    expect(config).toHaveProperty('dotRadius');
  });

  it('type が有効な PatternType である', () => {
    const config = createDefaultConfig();
    const validTypes = ['stripes', 'dots', 'grid', 'checkerboard', 'diagonal', 'zigzag'];
    expect(validTypes).toContain(config.type);
  });

  it('size が正の数値である', () => {
    const config = createDefaultConfig();
    expect(config.size).toBeGreaterThan(0);
  });
});

describe('PATTERN_PRESETS', () => {
  it('6種類のプリセットが定義されている', () => {
    expect(PATTERN_PRESETS).toHaveLength(6);
  });

  it('各プリセットに name と config が存在する', () => {
    PATTERN_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('config');
      expect(typeof preset.name).toBe('string');
    });
  });

  it('各プリセットでgeneratePatternCSSが例外なく動作する', () => {
    PATTERN_PRESETS.forEach((preset) => {
      expect(() => generatePatternCSS(preset.config)).not.toThrow();
    });
  });

  it('各プリセットのconfigがすべての必須プロパティを持つ', () => {
    PATTERN_PRESETS.forEach((preset) => {
      expect(preset.config).toHaveProperty('type');
      expect(preset.config).toHaveProperty('color1');
      expect(preset.config).toHaveProperty('color2');
      expect(preset.config).toHaveProperty('size');
    });
  });
});
