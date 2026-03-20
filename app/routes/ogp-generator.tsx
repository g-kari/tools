import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  OGP_TYPES,
  TWITTER_CARD_TYPES,
  OGP_INPUT_DEFAULTS,
  generateOgpTags,
  validateOgpInput,
  type OgpInput,
  type OgpType,
  type TwitterCardType,
} from "../utils/ogp-generator";
import "../styles/tools/ogp-generator.css";

export const Route = createFileRoute("/ogp-generator")({
  head: () => ({
    meta: [
      { title: "OGPメタタグジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "Open Graph Protocol（OGP）のメタタグを簡単に生成するツール。Facebook・Twitter・LINEなどのSNSシェア用メタタグをコピーするだけで使用できます。",
      },
      {
        property: "og:title",
        content: "OGPメタタグジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "OGP メタタグを簡単生成。SNS シェア用の og:title / og:description / og:image / twitter:card などをまとめて出力。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ogp-generator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "OGPメタタグジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "OGP メタタグを簡単生成。SNS シェア用メタタグをコピーするだけで使用できます。",
      },
    ],
  }),
  component: OgpGenerator,
});

/**
 * OGP メタタグジェネレーターコンポーネント
 * OGP および Twitter Card メタタグの生成・プレビューを提供する
 */
function OgpGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState<OgpInput>(OGP_INPUT_DEFAULTS);

  const output = useMemo(() => generateOgpTags(input), [input]);
  const validation = useMemo(() => validateOgpInput(input), [input]);

  const isEmpty = output.trim().length === 0;

  const handleChange = useCallback(
    <K extends keyof OgpInput>(key: K, value: OgpInput[K]) => {
      setInput((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copy(output);
    if (ok) {
      showToast("OGP タグをコピーしました", "success");
      announceStatus("OGP タグをクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInput(OGP_INPUT_DEFAULTS);
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const hasInput =
    input.title ||
    input.description ||
    input.url ||
    input.imageUrl ||
    input.siteName;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="ogp-basic-heading">
          <h2 id="ogp-basic-heading" className="section-title">
            基本情報
          </h2>
          <div className="ogp-field-group">
            <label className="ogp-field-label" htmlFor="ogp-title">
              タイトル <span aria-hidden="true">（og:title）</span>
            </label>
            <Input
              id="ogp-title"
              value={input.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="ページのタイトルを入力"
              aria-describedby="ogp-title-hint"
            />
            {input.title && validation.isTitleTooLong && (
              <p id="ogp-title-hint" className="ogp-field-warning" role="alert">
                タイトルが100文字を超えています。SNS での表示が途切れる場合があります。
              </p>
            )}
            {!validation.isTitleTooLong && (
              <p id="ogp-title-hint" className="ogp-field-hint">
                SNS シェア時に表示されるタイトル（推奨: 70文字以内）
              </p>
            )}
          </div>

          <div className="ogp-field-group">
            <label className="ogp-field-label" htmlFor="ogp-description">
              説明文 <span aria-hidden="true">（og:description）</span>
            </label>
            <Textarea
              id="ogp-description"
              value={input.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="ページの説明を入力"
              rows={3}
              aria-describedby="ogp-description-hint"
            />
            {input.description && validation.isDescriptionTooLong && (
              <p id="ogp-description-hint" className="ogp-field-warning" role="alert">
                説明文が300文字を超えています。SNS での表示が途切れる場合があります。
              </p>
            )}
            {!validation.isDescriptionTooLong && (
              <p id="ogp-description-hint" className="ogp-field-hint">
                SNS シェア時に表示される説明文（推奨: 100〜200文字）
              </p>
            )}
          </div>

          <div className="ogp-generator-grid">
            <div className="ogp-field-group">
              <label className="ogp-field-label" htmlFor="ogp-url">
                ページ URL <span aria-hidden="true">（og:url）</span>
              </label>
              <Input
                id="ogp-url"
                type="url"
                value={input.url}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://example.com/page"
                aria-describedby="ogp-url-hint"
              />
              {input.url && !validation.isUrlValid && (
                <p id="ogp-url-hint" className="ogp-field-error" role="alert">
                  有効な URL を入力してください（https:// または http:// で始まる必要があります）
                </p>
              )}
              {(!input.url || validation.isUrlValid) && (
                <p id="ogp-url-hint" className="ogp-field-hint">
                  ページの正規 URL
                </p>
              )}
            </div>

            <div className="ogp-field-group">
              <label className="ogp-field-label" htmlFor="ogp-image">
                画像 URL <span aria-hidden="true">（og:image）</span>
              </label>
              <Input
                id="ogp-image"
                type="url"
                value={input.imageUrl}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                placeholder="https://example.com/ogp.png"
                aria-describedby="ogp-image-hint"
              />
              {input.imageUrl && !validation.isImageUrlValid && (
                <p id="ogp-image-hint" className="ogp-field-error" role="alert">
                  有効な画像 URL を入力してください
                </p>
              )}
              {(!input.imageUrl || validation.isImageUrlValid) && (
                <p id="ogp-image-hint" className="ogp-field-hint">
                  OGP 画像 URL（推奨: 1200×630px）
                </p>
              )}
            </div>
          </div>

          <div className="ogp-generator-grid">
            <div className="ogp-field-group">
              <label className="ogp-field-label" htmlFor="ogp-type">
                コンテンツタイプ <span aria-hidden="true">（og:type）</span>
              </label>
              <select
                id="ogp-type"
                className="ogp-select"
                value={input.type}
                onChange={(e) => handleChange("type", e.target.value as OgpType)}
                aria-label="OGP コンテンツタイプを選択"
              >
                {OGP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="ogp-field-group">
              <label className="ogp-field-label" htmlFor="ogp-locale">
                ロケール <span aria-hidden="true">（og:locale）</span>
              </label>
              <Input
                id="ogp-locale"
                value={input.locale}
                onChange={(e) => handleChange("locale", e.target.value)}
                placeholder="ja_JP"
                aria-describedby="ogp-locale-hint"
              />
              <p id="ogp-locale-hint" className="ogp-field-hint">
                例: ja_JP / en_US / zh_CN
              </p>
            </div>
          </div>

          <div className="ogp-field-group">
            <label className="ogp-field-label" htmlFor="ogp-site-name">
              サイト名 <span aria-hidden="true">（og:site_name）</span>
            </label>
            <Input
              id="ogp-site-name"
              value={input.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
              placeholder="サイト名を入力"
              aria-describedby="ogp-site-name-hint"
            />
            <p id="ogp-site-name-hint" className="ogp-field-hint">
              サイト全体の名称（例: Web ツール集）
            </p>
          </div>
        </section>

        <section aria-labelledby="ogp-twitter-heading">
          <h2 id="ogp-twitter-heading" className="section-title">
            Twitter Card
          </h2>
          <div className="ogp-checkbox-row">
            <input
              id="ogp-twitter-enable"
              type="checkbox"
              checked={input.enableTwitterCard}
              onChange={(e) => handleChange("enableTwitterCard", e.target.checked)}
              aria-describedby="ogp-twitter-enable-hint"
            />
            <label htmlFor="ogp-twitter-enable">Twitter Card タグを含める</label>
          </div>
          <p id="ogp-twitter-enable-hint" className="ogp-field-hint ogp-field-hint--spaced">
            X（旧 Twitter）でのシェア表示を最適化します
          </p>

          {input.enableTwitterCard && (
            <>
              <div className="ogp-generator-grid">
                <div className="ogp-field-group">
                  <label className="ogp-field-label" htmlFor="ogp-twitter-card">
                    カードタイプ <span aria-hidden="true">（twitter:card）</span>
                  </label>
                  <select
                    id="ogp-twitter-card"
                    className="ogp-select"
                    value={input.twitterCard}
                    onChange={(e) =>
                      handleChange("twitterCard", e.target.value as TwitterCardType)
                    }
                    aria-label="Twitter Card タイプを選択"
                  >
                    {TWITTER_CARD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ogp-field-group">
                  <label className="ogp-field-label" htmlFor="ogp-twitter-site">
                    サイトアカウント <span aria-hidden="true">（twitter:site）</span>
                  </label>
                  <Input
                    id="ogp-twitter-site"
                    value={input.twitterSite}
                    onChange={(e) => handleChange("twitterSite", e.target.value)}
                    placeholder="@example または example"
                    aria-describedby="ogp-twitter-site-hint"
                  />
                  <p id="ogp-twitter-site-hint" className="ogp-field-hint">
                    サイト運営者の Twitter アカウント
                  </p>
                </div>
              </div>

              <div className="ogp-field-group">
                <label className="ogp-field-label" htmlFor="ogp-twitter-creator">
                  クリエイター <span aria-hidden="true">（twitter:creator）</span>
                </label>
                <Input
                  id="ogp-twitter-creator"
                  value={input.twitterCreator}
                  onChange={(e) => handleChange("twitterCreator", e.target.value)}
                  placeholder="@author または author"
                  aria-describedby="ogp-twitter-creator-hint"
                />
                <p id="ogp-twitter-creator-hint" className="ogp-field-hint">
                  コンテンツ作成者の Twitter アカウント
                </p>
              </div>
            </>
          )}
        </section>

        {input.imageUrl && validation.isImageUrlValid && (
          <section aria-labelledby="ogp-preview-heading">
            <h2 id="ogp-preview-heading" className="section-title">
              プレビュー
            </h2>
            <div className="ogp-preview" role="region" aria-label="OGP カードプレビュー">
              <div className="ogp-preview-card">
                <div className="ogp-preview-image">
                  <img
                    src={input.imageUrl}
                    alt="OGP プレビュー画像"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="ogp-preview-body">
                  {(input.siteName || input.url) && (
                    <p className="ogp-preview-site">
                      {input.siteName || input.url}
                    </p>
                  )}
                  {input.title && (
                    <p className="ogp-preview-title">{input.title}</p>
                  )}
                  {input.description && (
                    <p className="ogp-preview-description">{input.description}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="ogp-output-heading">
          <h2 id="ogp-output-heading" className="section-title">
            生成されたメタタグ
          </h2>
          <pre
            id="ogp-output"
            className={`ogp-output${isEmpty ? " ogp-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`OGP メタタグ出力: ${isEmpty ? "（出力なし）" : output}`}
            role="region"
          >
            {isEmpty
              ? "上のフォームに情報を入力すると、OGP メタタグが生成されます"
              : output}
          </pre>
        </section>

        <div className="ogp-actions" role="group" aria-label="操作">
          <Button
            type="button"
            variant="default"
            onClick={handleCopy}
            disabled={isEmpty}
            aria-label="OGP タグをクリップボードにコピー"
          >
            コピー
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={!hasInput}
            aria-label="入力をクリア"
          >
            クリア
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "フォームに情報を入力すると、リアルタイムで OGP メタタグが生成されます",
                "「コピー」ボタンで生成されたタグをコピーし、HTML の <head> 内に貼り付けてください",
                "Twitter Card を有効にすると、X（旧 Twitter）でのシェア表示も最適化されます",
              ],
            },
            {
              title: "OGP 画像のガイドライン",
              items: [
                "推奨サイズ: 1200×630px（アスペクト比 1.91:1）",
                "最小サイズ: 600×315px",
                "ファイル形式: JPEG または PNG 推奨（最大 8MB）",
                "テキストはなるべく避け、中央寄りの構図が望ましい",
              ],
            },
            {
              title: "OGP について",
              items: [
                "OGP（Open Graph Protocol）は Facebook が提唱したメタデータ仕様です",
                "SNS でリンクをシェアすると、OGP 情報がカード形式で表示されます",
                "LINE・Slack・Discord など多くのサービスが OGP に対応しています",
                "og:title・og:description・og:image・og:url の4つが最重要タグです",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
