import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  analyzeTokens,
  formatCost,
  getContextUsageClass,
  LLM_MODELS,
} from '../../app/utils/token-estimator';

describe('estimateTokens', () => {
  it('空文字列は0を返す', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('英語テキストのトークン数を推定する（約4文字/トークン）', () => {
    const text = 'Hello world'; // 11文字
    const tokens = estimateTokens(text);
    // 11 / 4 ≈ 2.75 → ceil → 3
    expect(tokens).toBeGreaterThanOrEqual(2);
    expect(tokens).toBeLessThanOrEqual(4);
  });

  it('日本語テキストは英語より多くのトークンを消費する', () => {
    const english = 'The quick brown fox';
    const japanese = '素早い茶色のキツネ'; // 同程度の意味
    const enTokens = estimateTokens(english);
    const jaTokens = estimateTokens(japanese);
    // 日本語は約1.5文字/トークン → 英語より多い
    expect(jaTokens).toBeGreaterThan(enTokens);
  });

  it('CJKテキストのトークン数を推定する（約1.5文字/トークン）', () => {
    const text = '日本語テスト'; // 6文字
    const tokens = estimateTokens(text);
    // 6 / 1.5 = 4 トークン
    expect(tokens).toBe(4);
  });

  it('コード/記号を含むテキストを正しく処理する', () => {
    const text = 'if (x === 1) { return true; }';
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
  });

  it('混在テキスト（英語+日本語）を処理する', () => {
    const text = 'Hello 世界'; // 英語+CJK混在
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
  });

  it('長いテキストはトークン数が多い', () => {
    const short = 'Hello';
    const long = 'Hello world this is a longer text that should have more tokens';
    expect(estimateTokens(long)).toBeGreaterThan(estimateTokens(short));
  });
});

describe('analyzeTokens', () => {
  it('空文字列の分析', () => {
    const result = analyzeTokens('');
    expect(result.totalChars).toBe(0);
    expect(result.estimatedTokens).toBe(0);
    expect(result.wordCount).toBe(0);
  });

  it('正しい文字数をカウントする', () => {
    const text = 'Hello world'; // 11文字
    const result = analyzeTokens(text);
    expect(result.totalChars).toBe(11);
  });

  it('CJK文字を正しく分類する', () => {
    const text = '日本語テスト'; // 6文字すべてCJK
    const result = analyzeTokens(text);
    expect(result.cjkChars).toBe(6);
    expect(result.latinChars).toBe(0);
  });

  it('英語テキストのLatin文字を正しく分類する', () => {
    const text = 'Hello'; // 5文字すべてLatinに分類
    const result = analyzeTokens(text);
    expect(result.latinChars).toBe(5);
    expect(result.cjkChars).toBe(0);
  });

  it('単語数を正しくカウントする', () => {
    const text = 'Hello world foo';
    const result = analyzeTokens(text);
    expect(result.wordCount).toBe(3);
  });

  it('すべてのモデルの推定結果が含まれる', () => {
    const result = analyzeTokens('Test text');
    expect(result.modelEstimates.length).toBe(LLM_MODELS.length);
  });

  it('各モデルのコンテキスト使用率が0〜1の範囲内', () => {
    const result = analyzeTokens('Short text');
    for (const estimate of result.modelEstimates) {
      expect(estimate.contextUsage).toBeGreaterThanOrEqual(0);
      expect(estimate.contextUsage).toBeLessThanOrEqual(1);
    }
  });

  it('入力コストが非負である', () => {
    const result = analyzeTokens('Test');
    for (const estimate of result.modelEstimates) {
      expect(estimate.inputCost).toBeGreaterThanOrEqual(0);
    }
  });

  it('コンテキストウィンドウが小さいモデルほど使用率が高い', () => {
    const longText = 'a'.repeat(10000);
    const result = analyzeTokens(longText);
    const gpt35 = result.modelEstimates.find((e) => e.model.name === 'GPT-3.5 Turbo');
    const gemini = result.modelEstimates.find((e) => e.model.name === 'Gemini 1.5 Pro');
    // GPT-3.5のコンテキスト(16385) < Geminiのコンテキスト(2000000)
    expect(gpt35!.contextUsage).toBeGreaterThan(gemini!.contextUsage);
  });
});

describe('formatCost', () => {
  it('ゼロコストを表示する', () => {
    expect(formatCost(0)).toBe('$0.000000');
  });

  it('非常に小さいコストを表示する', () => {
    const result = formatCost(0.000000001);
    expect(result).toBe('< $0.000001');
  });

  it('小さいコスト（マイクロドル単位）を表示する', () => {
    const result = formatCost(0.000005);
    expect(result).toContain('$');
    expect(result).not.toContain('< ');
  });

  it('セントコストを表示する', () => {
    const result = formatCost(0.05);
    expect(result).toContain('$0.05');
  });

  it('ドル単位のコストを表示する', () => {
    const result = formatCost(1.5);
    expect(result).toBe('$1.500');
  });
});

describe('getContextUsageClass', () => {
  it('低使用率はOKクラスを返す', () => {
    expect(getContextUsageClass(0.1)).toBe('te-ctx-ok');
    expect(getContextUsageClass(0.5)).toBe('te-ctx-ok');
    expect(getContextUsageClass(0.69)).toBe('te-ctx-ok');
  });

  it('中使用率はwarningクラスを返す', () => {
    expect(getContextUsageClass(0.7)).toBe('te-ctx-warning');
    expect(getContextUsageClass(0.8)).toBe('te-ctx-warning');
    expect(getContextUsageClass(0.89)).toBe('te-ctx-warning');
  });

  it('高使用率はdangerクラスを返す', () => {
    expect(getContextUsageClass(0.9)).toBe('te-ctx-danger');
    expect(getContextUsageClass(1.0)).toBe('te-ctx-danger');
  });
});

describe('LLM_MODELS', () => {
  it('主要なプロバイダーが含まれる', () => {
    const providers = LLM_MODELS.map((m) => m.provider);
    expect(providers).toContain('OpenAI');
    expect(providers).toContain('Anthropic');
    expect(providers).toContain('Google');
  });

  it('全モデルがコンテキストウィンドウを持つ', () => {
    for (const model of LLM_MODELS) {
      expect(model.contextWindow).toBeGreaterThan(0);
    }
  });

  it('全モデルが価格情報を持つ', () => {
    for (const model of LLM_MODELS) {
      expect(model.inputPricePer1M).toBeGreaterThan(0);
      expect(model.outputPricePer1M).toBeGreaterThan(0);
    }
  });

  it('出力コストは入力コスト以上', () => {
    for (const model of LLM_MODELS) {
      expect(model.outputPricePer1M).toBeGreaterThanOrEqual(model.inputPricePer1M);
    }
  });
});
