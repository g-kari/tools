import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import {
  generateManifestJson,
  generateLinkTag,
  createDefaultIcons,
  generateId,
  isValidColor,
  guessIconType,
  DEFAULT_MANIFEST_OPTIONS,
  DISPLAY_MODES,
  ORIENTATIONS,
  COMMON_CATEGORIES,
  type ManifestOptions,
  type ManifestIcon,
  type DisplayMode,
  type Orientation,
  type IconPurpose,
} from "~/utils/webManifest";

export const Route = createFileRoute("/web-manifest")({
  head: () => ({
    meta: [
      { title: "Web App Manifest ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "PWA (Progressive Web App) 用の manifest.json をGUIで作成するツール。アプリ名・アイコン・テーマカラー・ディスプレイモードなどを設定してコードを即座に生成。",
      },
      {
        property: "og:title",
        content: "Web App Manifest ジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "PWA用 manifest.json をGUIで作成するツール。アプリ名・アイコン・テーマカラー・ディスプレイモードを設定して即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/web-manifest` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Web App Manifest ジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "PWA用 manifest.json をGUIで作成するツール。",
      },
    ],
  }),
  component: WebManifestGenerator,
});

/** カラーフィールドコンポーネント */
function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isValid = isValidColor(value);
  return (
    <div className="tool-field">
      <label className="tool-label" htmlFor={id}>
        {label}
      </label>
      <div className="manifest-color-field">
        <button
          className="manifest-color-preview"
          aria-label={`${label}のカラーピッカー`}
          title={`${label}のカラーピッカー`}
          type="button"
          onClick={(e) => {
            const input = (e.currentTarget as HTMLButtonElement).querySelector(
              'input[type="color"]',
            ) as HTMLInputElement | null;
            input?.click();
          }}
        >
          <input
            type="color"
            value={isValid ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            style={{ background: value }}
          />
        </button>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          aria-invalid={!isValid}
          aria-describedby={!isValid ? `${id}-error` : undefined}
        />
        {!isValid && (
          <span id={`${id}-error`} className="tool-error-hint" role="alert">
            無効なカラー形式
          </span>
        )}
      </div>
    </div>
  );
}

/** アイコン行コンポーネント */
function IconRow({
  icon,
  onUpdate,
  onRemove,
}: {
  icon: ManifestIcon;
  onUpdate: (id: string, field: keyof ManifestIcon, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="manifest-icon-row" role="group" aria-label={`アイコン ${icon.sizes}`}>
      <Input
        value={icon.src}
        onChange={(e) => {
          onUpdate(icon.id, "src", e.target.value);
          onUpdate(icon.id, "type", guessIconType(e.target.value));
        }}
        placeholder="/icons/icon-192x192.png"
        aria-label="アイコンパス"
      />
      <select
        className="tool-select"
        value={icon.sizes}
        onChange={(e) => onUpdate(icon.id, "sizes", e.target.value)}
        aria-label="アイコンサイズ"
      >
        {[
          "16x16",
          "32x32",
          "48x48",
          "72x72",
          "96x96",
          "144x144",
          "152x152",
          "192x192",
          "384x384",
          "512x512",
        ].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Input
        value={icon.type}
        onChange={(e) => onUpdate(icon.id, "type", e.target.value)}
        placeholder="image/png"
        aria-label="MIMEタイプ"
      />
      <select
        className="tool-select"
        value={icon.purpose}
        onChange={(e) => onUpdate(icon.id, "purpose", e.target.value as IconPurpose)}
        aria-label="用途"
      >
        <option value="any">any</option>
        <option value="maskable">maskable</option>
        <option value="monochrome">monochrome</option>
      </select>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(icon.id)}
        aria-label={`アイコン ${icon.sizes} を削除`}
      >
        ✕
      </Button>
    </div>
  );
}

/** モバイルプレビューコンポーネント */
function DevicePreview({ options }: { options: ManifestOptions }) {
  const dummyApps = ["📷", "🎵", "📧", "🗺️", "🛒", "💬", "📅", "⚙️"];
  const firstLetter = (options.short_name || options.name || "A")[0]?.toUpperCase() ?? "A";

  return (
    <div className="manifest-device-preview">
      <div className="manifest-device-frame" aria-hidden="true">
        <div className="manifest-device-statusbar">9:41</div>
        <div className="manifest-device-screen">
          {dummyApps.slice(0, 3).map((emoji, i) => (
            <div key={i} className="manifest-app-icon">
              <div className="manifest-app-icon-box" style={{ background: "#3a3a5c" }}>
                {emoji}
              </div>
            </div>
          ))}
          {/* 対象アプリ（強調表示） */}
          <div className="manifest-app-icon manifest-app-icon--featured">
            <div
              className="manifest-app-icon-box"
              style={{ background: options.theme_color }}
              title={options.name}
            >
              {firstLetter}
            </div>
            <div className="manifest-app-icon-label">{options.short_name || options.name}</div>
          </div>
          {dummyApps.slice(3).map((emoji, i) => (
            <div key={i + 3} className="manifest-app-icon">
              <div className="manifest-app-icon-box" style={{ background: "#3a3a5c" }}>
                {emoji}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="manifest-preview-caption">ホーム画面イメージ</p>
    </div>
  );
}

/** メインコンポーネント */
function WebManifestGenerator() {
  const [options, setOptions] = useState<ManifestOptions>({
    ...DEFAULT_MANIFEST_OPTIONS,
    icons: createDefaultIcons(),
  });
  const [activeTab, setActiveTab] = useState<"json" | "html">("json");
  const [categoryInput, setCategoryInput] = useState("");
  const { showToast } = useToast();
  const { announceStatus, statusRef } = useStatusAnnouncement();

  /** フィールド更新ヘルパー */
  const update = useCallback(
    <K extends keyof ManifestOptions>(key: K, value: ManifestOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const manifestJson = useMemo(() => generateManifestJson(options), [options]);
  const linkTagHtml = useMemo(() => generateLinkTag(options), [options]);

  const outputText = activeTab === "json" ? manifestJson : linkTagHtml;

  /** クリップボードコピー */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      announceStatus("コピーしました");
      showToast("コピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, announceStatus, showToast]);

  /** ダウンロード */
  const handleDownload = useCallback(() => {
    const blob = new Blob([manifestJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifest.json";
    a.click();
    URL.revokeObjectURL(url);
    announceStatus("manifest.json をダウンロードしました");
    showToast("ダウンロードしました", "success");
  }, [manifestJson, announceStatus, showToast]);

  /** アイコン追加 */
  const addIcon = useCallback(() => {
    const newIcon: ManifestIcon = {
      id: generateId(),
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    };
    update("icons", [...options.icons, newIcon]);
  }, [options.icons, update]);

  /** アイコン更新 */
  const updateIcon = useCallback(
    (id: string, field: keyof ManifestIcon, value: string) => {
      update(
        "icons",
        options.icons.map((icon) => (icon.id === id ? { ...icon, [field]: value } : icon)),
      );
    },
    [options.icons, update],
  );

  /** アイコン削除 */
  const removeIcon = useCallback(
    (id: string) => {
      update(
        "icons",
        options.icons.filter((icon) => icon.id !== id),
      );
    },
    [options.icons, update],
  );

  /** カテゴリ追加 */
  const addCategory = useCallback(
    (cat: string) => {
      const trimmed = cat.trim().toLowerCase();
      if (!trimmed || options.categories.includes(trimmed)) return;
      update("categories", [...options.categories, trimmed]);
      setCategoryInput("");
    },
    [options.categories, update],
  );

  /** カテゴリ削除 */
  const removeCategory = useCallback(
    (cat: string) => {
      update(
        "categories",
        options.categories.filter((c) => c !== cat),
      );
    },
    [options.categories, update],
  );

  /** リセット */
  const handleReset = useCallback(() => {
    setOptions({ ...DEFAULT_MANIFEST_OPTIONS, icons: createDefaultIcons() });
    announceStatus("リセットしました");
  }, [announceStatus]);

  return (
    <div className="tool-container">
      <header className="tool-header" role="banner">
        <h1 className="tool-title">Web App Manifest ジェネレーター</h1>
        <p className="tool-description">
          PWA（Progressive Web App）用の <code>manifest.json</code> を視覚的に作成します。
          各項目を入力するとリアルタイムでコードが生成されます。
        </p>
      </header>

      <main id="main-content" role="main">
        <StatusAnnouncer statusRef={statusRef} />

        <div className="tool-layout-split">
          {/* 左：フォーム */}
          <div className="tool-panel">
            {/* 基本情報 */}
            <section className="tool-section" aria-labelledby="basic-info-heading">
              <h2 id="basic-info-heading" className="tool-section-title">
                基本情報
              </h2>
              <div className="manifest-form-grid">
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-name">
                    名前 (name)
                  </label>
                  <Input
                    id="manifest-name"
                    value={options.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="My Awesome App"
                  />
                </div>
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-short-name">
                    短い名前 (short_name)
                  </label>
                  <Input
                    id="manifest-short-name"
                    value={options.short_name}
                    onChange={(e) => update("short_name", e.target.value)}
                    placeholder="App"
                  />
                </div>
              </div>
              <div className="tool-field">
                <label className="tool-label" htmlFor="manifest-description">
                  説明 (description)
                </label>
                <Input
                  id="manifest-description"
                  value={options.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="アプリの説明を入力してください"
                />
              </div>
              <div className="manifest-form-grid">
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-start-url">
                    開始URL (start_url)
                  </label>
                  <Input
                    id="manifest-start-url"
                    value={options.start_url}
                    onChange={(e) => update("start_url", e.target.value)}
                    placeholder="/"
                  />
                </div>
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-scope">
                    スコープ (scope)
                  </label>
                  <Input
                    id="manifest-scope"
                    value={options.scope}
                    onChange={(e) => update("scope", e.target.value)}
                    placeholder="/"
                  />
                </div>
              </div>
            </section>

            {/* 表示設定 */}
            <section className="tool-section" aria-labelledby="display-settings-heading">
              <h2 id="display-settings-heading" className="tool-section-title">
                表示設定
              </h2>
              <div className="manifest-form-grid">
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-display">
                    ディスプレイモード (display)
                  </label>
                  <select
                    id="manifest-display"
                    className="tool-select"
                    value={options.display}
                    onChange={(e) => update("display", e.target.value as DisplayMode)}
                  >
                    {DISPLAY_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.value} — {m.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-orientation">
                    オリエンテーション (orientation)
                  </label>
                  <select
                    id="manifest-orientation"
                    className="tool-select"
                    value={options.orientation}
                    onChange={(e) => update("orientation", e.target.value as Orientation)}
                  >
                    {ORIENTATIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="manifest-form-grid">
                <ColorField
                  id="manifest-theme-color"
                  label="テーマカラー (theme_color)"
                  value={options.theme_color}
                  onChange={(v) => update("theme_color", v)}
                />
                <ColorField
                  id="manifest-bg-color"
                  label="背景色 (background_color)"
                  value={options.background_color}
                  onChange={(v) => update("background_color", v)}
                />
              </div>
            </section>

            {/* 言語設定 */}
            <section className="tool-section" aria-labelledby="lang-settings-heading">
              <h2 id="lang-settings-heading" className="tool-section-title">
                言語・文字方向
              </h2>
              <div className="manifest-form-grid">
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-lang">
                    言語 (lang)
                  </label>
                  <Input
                    id="manifest-lang"
                    value={options.lang}
                    onChange={(e) => update("lang", e.target.value)}
                    placeholder="ja"
                  />
                </div>
                <div className="tool-field">
                  <label className="tool-label" htmlFor="manifest-dir">
                    テキスト方向 (dir)
                  </label>
                  <select
                    id="manifest-dir"
                    className="tool-select"
                    value={options.dir}
                    onChange={(e) => update("dir", e.target.value as "auto" | "ltr" | "rtl")}
                  >
                    <option value="auto">auto（自動）</option>
                    <option value="ltr">ltr（左から右）</option>
                    <option value="rtl">rtl（右から左）</option>
                  </select>
                </div>
              </div>
            </section>

            {/* アイコン */}
            <section className="tool-section" aria-labelledby="icons-heading">
              <h2 id="icons-heading" className="tool-section-title">
                アイコン (icons)
                {options.icons.length > 0 && (
                  <span className="manifest-section-badge">{options.icons.length}</span>
                )}
              </h2>
              <p className="tool-hint">各アイコンのパス・サイズ・MIMEタイプ・用途を設定します。</p>
              {options.icons.length > 0 && (
                <div className="manifest-icons-list" role="list" aria-label="アイコンリスト">
                  {/* ヘッダー行 */}
                  <div className="manifest-icon-row" aria-hidden="true">
                    <span className="tool-hint">パス (src)</span>
                    <span className="tool-hint">サイズ</span>
                    <span className="tool-hint">type</span>
                    <span className="tool-hint">purpose</span>
                    <span />
                  </div>
                  {options.icons.map((icon) => (
                    <div key={icon.id} role="listitem">
                      <IconRow icon={icon} onUpdate={updateIcon} onRemove={removeIcon} />
                    </div>
                  ))}
                </div>
              )}
              <div className="manifest-add-row">
                <Button variant="outline" size="sm" onClick={addIcon}>
                  + アイコンを追加
                </Button>
              </div>
            </section>

            {/* カテゴリ */}
            <section className="tool-section" aria-labelledby="categories-heading">
              <h2 id="categories-heading" className="tool-section-title">
                カテゴリ (categories)
              </h2>
              <div className="tool-field">
                <label className="tool-label" htmlFor="manifest-category-input">
                  カテゴリを追加
                </label>
                <div className="tool-input-row">
                  <select
                    id="manifest-category-input"
                    className="tool-select"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    aria-label="カテゴリ選択"
                  >
                    <option value="">— カテゴリを選択 —</option>
                    {COMMON_CATEGORIES.filter((c) => !options.categories.includes(c)).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCategory(categoryInput)}
                    disabled={!categoryInput}
                  >
                    追加
                  </Button>
                </div>
              </div>
              {options.categories.length > 0 && (
                <div className="manifest-categories-list" role="list" aria-label="選択中のカテゴリ">
                  {options.categories.map((cat) => (
                    <div key={cat} className="manifest-category-chip" role="listitem">
                      {cat}
                      <button
                        className="manifest-category-chip-remove"
                        onClick={() => removeCategory(cat)}
                        aria-label={`カテゴリ "${cat}" を削除`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 右：プレビュー＋出力 */}
          <div className="tool-panel">
            {/* モバイルプレビュー */}
            <section className="tool-section" aria-labelledby="preview-heading">
              <h2 id="preview-heading" className="tool-section-title">
                プレビュー
              </h2>
              <DevicePreview options={options} />
            </section>

            {/* 出力 */}
            <section className="tool-section" aria-labelledby="output-heading">
              <h2 id="output-heading" className="tool-section-title">
                出力
              </h2>
              <div className="manifest-output-tabs" role="tablist" aria-label="出力形式">
                <button
                  role="tab"
                  aria-selected={activeTab === "json"}
                  className={`manifest-output-tab${activeTab === "json" ? " manifest-output-tab--active" : ""}`}
                  onClick={() => setActiveTab("json")}
                >
                  manifest.json
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "html"}
                  className={`manifest-output-tab${activeTab === "html" ? " manifest-output-tab--active" : ""}`}
                  onClick={() => setActiveTab("html")}
                >
                  HTML タグ
                </button>
              </div>
              <pre
                className="tool-output"
                role="region"
                aria-label={activeTab === "json" ? "manifest.json" : "HTMLタグ"}
              >
                <code>{outputText}</code>
              </pre>
              <div className="tool-actions">
                <Button onClick={handleCopy} aria-label="クリップボードにコピー">
                  コピー
                </Button>
                {activeTab === "json" && (
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    aria-label="manifest.json をダウンロード"
                  >
                    ダウンロード
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset} aria-label="設定をリセット">
                  リセット
                </Button>
              </div>
            </section>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "Tips",
              items: [
                "name はインストール確認ダイアログや、アプリ一覧に表示されます。",
                "short_name はホーム画面のアイコン下に表示される短い名前です（10文字程度推奨）。",
                "maskable アイコンは Android で円形・角丸にトリミングされます。セーフゾーン（中央80%）にコンテンツを収めてください。",
                "standalone モードではブラウザのアドレスバーが非表示になり、ネイティブアプリに近い外観になります。",
                '<link rel="manifest" href="/manifest.json"> を HTML の <head> 内に追加してください。',
              ],
            },
          ]}
        />
      </main>
    </div>
  );
}
