import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  analyzeReadability,
  type ReadabilityResult,
  type EnglishReadabilityScores,
  type JapaneseReadabilityScores,
} from '../utils/readability';

export const Route = createFileRoute('/readability')({
  head: () => ({
    meta: [
      { title: '可読性スコア分析 | Web ツール集' },
      {
        name: 'description',
        content:
          'テキストの可読性をスコア化するツール。Flesch Reading Ease・Flesch-Kincaid Grade Level・Gunning Fog・SMOG Indexを計算。日本語の漢字密度・平均文長にも対応。',
      },
      { property: 'og:title', content: '可読性スコア分析 | Web ツール集' },
      {
        property: 'og:description',
        content:
          'テキストの可読性をスコア化するツール。Flesch Reading Ease・Flesch-Kincaid Grade Level・Gunning Fog・SMOG Indexを計算。日本語の漢字密度・平均文長にも対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/readability` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: '可読性スコア分析 | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'テキストの可読性をスコア化するツール。Flesch Reading Ease・Flesch-Kincaid Grade Level・Gunning Fog・SMOG Indexを計算。日本語の漢字密度・平均文長にも対応。',
      },
    ],
  }),
  component: ReadabilityPage,
});

/** Flesch Reading Ease ゲージの色を返す */
function getFleschColor(score: number): string {
  if (score >= 70) return 'var(--md-sys-color-primary)';
  if (score >= 50) return '#f57c00';
  return '#c62828';
}

/** グレードレベルバッジの色クラスを返す */
function getGradeBadgeClass(grade: number): string {
  if (grade <= 6) return 'rl-score-badge--green';
  if (grade <= 10) return 'rl-score-badge--blue';
  if (grade <= 14) return 'rl-score-badge--orange';
  return 'rl-score-badge--red';
}

/** Gunning Fog バッジの色クラスを返す */
function getFogBadgeClass(fog: number): string {
  if (fog <= 8) return 'rl-score-badge--green';
  if (fog <= 12) return 'rl-score-badge--blue';
  if (fog <= 16) return 'rl-score-badge--orange';
  return 'rl-score-badge--red';
}

/** 英語スコアセクション */
function EnglishSection({ scores }: { scores: EnglishReadabilityScores }) {
  const fleschColor = getFleschColor(scores.fleschReadingEase);

  return (
    <>
      {/* Flesch Reading Ease ゲージ */}
      <div className="converter-section">
        <h2 className="section-title">Flesch Reading Ease</h2>
        <div className="rl-score-card rl-score-card--primary" style={{ marginBottom: '0.5rem' }}>
          <div className="rl-score-header">
            <span className="rl-score-name">スコア（0〜100）</span>
            <span className="rl-score-badge" data-testid="flesch-label">
              {scores.fleschLabel}
            </span>
          </div>
          <span className="rl-score-value" data-testid="flesch-score">
            {scores.fleschReadingEase}
          </span>
          <div className="rl-gauge-wrap">
            <div className="rl-gauge-bar" aria-hidden="true">
              <div
                className="rl-gauge-fill"
                style={{
                  width: `${scores.fleschReadingEase}%`,
                  backgroundColor: fleschColor,
                }}
              />
            </div>
            <div className="rl-gauge-labels" aria-hidden="true">
              <span>難しい (0)</span>
              <span>標準 (60)</span>
              <span>簡単 (100)</span>
            </div>
          </div>
          <p className="rl-score-desc">
            高いほど読みやすいことを示します。60以上が一般的な読者向けの目安です。
          </p>
        </div>
      </div>

      {/* グレードレベル・Fog・SMOG */}
      <div className="converter-section">
        <h2 className="section-title">グレード・難易度指標</h2>
        <div className="rl-score-grid">
          {/* Flesch-Kincaid Grade Level */}
          <div className="rl-score-card">
            <div className="rl-score-header">
              <span className="rl-score-name">Flesch-Kincaid Grade</span>
              <span className={`rl-score-badge ${getGradeBadgeClass(scores.fleschKincaidGrade)}`}>
                {scores.fleschKincaidGrade <= 6 ? '平易' :
                  scores.fleschKincaidGrade <= 10 ? '中級' :
                    scores.fleschKincaidGrade <= 14 ? '上級' : '専門'}
              </span>
            </div>
            <span className="rl-score-value" data-testid="fk-grade">
              {scores.fleschKincaidGrade}
            </span>
            <p className="rl-score-desc">米国の学年レベル（例: 8 = 中学2年相当）</p>
          </div>

          {/* Gunning Fog */}
          <div className="rl-score-card">
            <div className="rl-score-header">
              <span className="rl-score-name">Gunning Fog Index</span>
              <span className={`rl-score-badge ${getFogBadgeClass(scores.gunningFog)}`}>
                {scores.gunningFog <= 8 ? '平易' :
                  scores.gunningFog <= 12 ? '中級' :
                    scores.gunningFog <= 16 ? '上級' : '専門'}
              </span>
            </div>
            <span className="rl-score-value" data-testid="gunning-fog">
              {scores.gunningFog}
            </span>
            <p className="rl-score-desc">理解に必要な教育年数の目安</p>
          </div>

          {/* SMOG Index */}
          <div className="rl-score-card">
            <div className="rl-score-header">
              <span className="rl-score-name">SMOG Index</span>
              {scores.smogIndex !== null && (
                <span className={`rl-score-badge ${getGradeBadgeClass(scores.smogIndex)}`}>
                  {scores.smogIndex <= 6 ? '平易' :
                    scores.smogIndex <= 10 ? '中級' :
                      scores.smogIndex <= 14 ? '上級' : '専門'}
                </span>
              )}
            </div>
            <span className="rl-score-value" data-testid="smog-index">
              {scores.smogIndex !== null ? scores.smogIndex : '—'}
            </span>
            <p className="rl-score-desc">
              {scores.smogIndex !== null
                ? '理解に必要な教育年数（3文以上で計算）'
                : '3文以上のテキストが必要'}
            </p>
          </div>
        </div>
      </div>

      {/* テキスト構造統計 */}
      <div className="converter-section">
        <h2 className="section-title">テキスト構造</h2>
        <div className="rl-score-grid">
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">単語数</span>
            <span className="rl-score-value" data-testid="word-count">
              {scores.wordCount.toLocaleString()}
            </span>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">文章数</span>
            <span className="rl-score-value" data-testid="sentence-count">
              {scores.sentenceCount}
            </span>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">音節数</span>
            <span className="rl-score-value" data-testid="syllable-count">
              {scores.totalSyllables.toLocaleString()}
            </span>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">複雑な単語</span>
            <span className="rl-score-value" data-testid="complex-words">
              {scores.complexWordCount}
            </span>
            <p className="rl-score-desc">3音節以上の単語数</p>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">平均文長</span>
            <span className="rl-score-value" data-testid="avg-words-sentence">
              {scores.avgWordsPerSentence}
            </span>
            <p className="rl-score-desc">単語/文</p>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">平均音節/語</span>
            <span className="rl-score-value" data-testid="avg-syllables-word">
              {scores.avgSyllablesPerWord}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** 日本語スコアセクション */
function JapaneseSection({ scores }: { scores: JapaneseReadabilityScores }) {
  const diffColor =
    scores.difficultyScore >= 60
      ? '#c62828'
      : scores.difficultyScore >= 40
        ? '#f57c00'
        : 'var(--md-sys-color-primary)';

  return (
    <>
      {/* 難易度ゲージ */}
      <div className="converter-section">
        <h2 className="section-title">日本語難易度スコア</h2>
        <div className="rl-score-card rl-score-card--primary">
          <div className="rl-score-header">
            <span className="rl-score-name">難易度スコア（0〜100）</span>
            <span className="rl-score-badge" data-testid="jp-difficulty-label">
              {scores.difficultyLabel}
            </span>
          </div>
          <span className="rl-score-value" data-testid="jp-difficulty-score">
            {scores.difficultyScore}
          </span>
          <div className="rl-gauge-wrap">
            <div className="rl-gauge-bar" aria-hidden="true">
              <div
                className="rl-gauge-fill"
                style={{
                  width: `${scores.difficultyScore}%`,
                  backgroundColor: diffColor,
                }}
              />
            </div>
            <div className="rl-gauge-labels" aria-hidden="true">
              <span>簡単 (0)</span>
              <span>標準 (40)</span>
              <span>難しい (100)</span>
            </div>
          </div>
          <p className="rl-score-desc">
            漢字密度と平均文長を組み合わせた推定難易度です。
          </p>
        </div>
      </div>

      {/* 文字種密度 */}
      <div className="converter-section">
        <h2 className="section-title">文字種密度</h2>
        <div className="rl-score-card">
          <div
            className="rl-density-list"
            role="region"
            aria-label="文字種密度"
            aria-live="polite"
          >
            <div className="rl-density-row">
              <span className="rl-density-label">漢字</span>
              <div className="rl-density-bar-wrap" aria-hidden="true">
                <div
                  className="rl-density-bar rl-density-bar--kanji"
                  style={{ width: `${Math.min(100, scores.kanjiDensity * 2)}%` }}
                />
              </div>
              <span
                className="rl-density-value"
                data-testid="kanji-density"
              >
                {scores.kanjiDensity}%
              </span>
            </div>
            <div className="rl-density-row">
              <span className="rl-density-label">ひらがな</span>
              <div className="rl-density-bar-wrap" aria-hidden="true">
                <div
                  className="rl-density-bar rl-density-bar--hiragana"
                  style={{ width: `${Math.min(100, scores.hiraganaDensity * 1.5)}%` }}
                />
              </div>
              <span
                className="rl-density-value"
                data-testid="hiragana-density"
              >
                {scores.hiraganaDensity}%
              </span>
            </div>
            <div className="rl-density-row">
              <span className="rl-density-label">カタカナ</span>
              <div className="rl-density-bar-wrap" aria-hidden="true">
                <div
                  className="rl-density-bar rl-density-bar--katakana"
                  style={{ width: `${Math.min(100, scores.katakanaDensity * 2)}%` }}
                />
              </div>
              <span
                className="rl-density-value"
                data-testid="katakana-density"
              >
                {scores.katakanaDensity}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* テキスト構造 */}
      <div className="converter-section">
        <h2 className="section-title">テキスト構造</h2>
        <div className="rl-score-grid">
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">文章数</span>
            <span className="rl-score-value" data-testid="jp-sentence-count">
              {scores.sentenceCount}
            </span>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">文字数</span>
            <span className="rl-score-value" data-testid="jp-char-count">
              {scores.charCount.toLocaleString()}
            </span>
            <p className="rl-score-desc">空白除く</p>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">平均文長</span>
            <span className="rl-score-value" data-testid="jp-avg-chars">
              {scores.avgCharsPerSentence}
            </span>
            <p className="rl-score-desc">文字/文</p>
          </div>
          <div className="rl-score-card rl-score-card--secondary">
            <span className="rl-score-name">漢字数</span>
            <span className="rl-score-value" data-testid="jp-kanji-count">
              {scores.kanjiCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** 言語バッジ */
function LanguageBadge({ language }: { language: ReadabilityResult['language'] }) {
  const label =
    language === 'english' ? '🇬🇧 English' :
      language === 'japanese' ? '🇯🇵 日本語' : '🌐 混在';
  return (
    <span className="rl-lang-badge" data-testid="language-badge" aria-label={`検出言語: ${label}`}>
      {label}
    </span>
  );
}

function ReadabilityPage() {
  const [text, setText] = useState('');

  const result = useMemo(
    () => (text.trim().length > 0 ? analyzeReadability(text) : null),
    [text]
  );

  const handleClear = useCallback(() => setText(''), []);

  return (
    <>
      <div className="tool-container">
        {/* 入力 */}
        <div className="converter-section">
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}
          >
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              テキスト入力
            </h2>
            {result && <LanguageBadge language={result.language} />}
          </div>
          <Textarea
            className="input-area"
            placeholder={
              '英語テキスト例:\nThe quick brown fox jumps over the lazy dog.\n\n日本語テキスト例:\nこのツールは、テキストの可読性を分析します。'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="分析対象テキスト"
            rows={10}
          />
          <div className="button-group">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={text.length === 0}
            >
              クリア
            </Button>
          </div>
        </div>

        {/* 結果 */}
        {!result ? (
          <div className="rl-empty" aria-live="polite">
            テキストを入力すると可読性スコアが表示されます
          </div>
        ) : (
          <>
            {result.english && <EnglishSection scores={result.english} />}
            {result.japanese && <JapaneseSection scores={result.japanese} />}
            {result.language === 'mixed' && result.english === null && result.japanese === null && (
              <div className="rl-empty">
                スコアを計算するのに十分なテキストがありません
              </div>
            )}
          </>
        )}

        <TipsCard
          sections={[
            {
              title: '可読性スコアとは',
              items: [
                'テキストがどれだけ読みやすいかを数値化した指標です',
                '英語テキストに対して Flesch Reading Ease、Flesch-Kincaid Grade Level、Gunning Fog Index、SMOG Index を計算します',
                '日本語テキストに対して漢字密度・平均文長などから推定難易度を計算します',
                'テキストの言語は自動検出されます（英語・日本語・混在）',
              ],
            },
            {
              title: 'Flesch Reading Ease の目安',
              items: [
                '90〜100: 非常に簡単（小学生レベル）',
                '70〜90: 簡単（中学生レベル）',
                '60〜70: 標準（高校生レベル）',
                '30〜60: 難しい（大学受験〜大卒レベル）',
                '0〜30: 非常に難しい（専門家向け）',
              ],
            },
            {
              title: '活用例',
              items: [
                'ブログ記事・ドキュメントの読みやすさを確認する',
                '対象読者に合わせたライティングの調整に役立てる',
                '学術論文・技術文書の難易度把握に使用する',
                '日本語コンテンツの漢字使用率をチェックする',
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
