import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  parseSemver,
  compareSemver,
  satisfiesRange,
  incrementPatch,
  incrementMinor,
  incrementMajor,
  formatSemver,
  type SemverParsed,
} from "~/utils/semver";

export const Route = createFileRoute("/semver")({
  head: () => ({
    meta: [
      { title: "Semver チェッカー | Web ツール集" },
      {
        name: "description",
        content:
          "セマンティックバージョン (Semver) のパース・比較・範囲チェックツール。バージョン文字列の解析、2つのバージョンの大小比較、>=/<=/^/~ などの範囲演算子チェックに対応。",
      },
      { property: "og:title", content: "Semver チェッカー | Web ツール集" },
      {
        property: "og:description",
        content:
          "セマンティックバージョン (Semver) のパース・比較・範囲チェックツール。バージョン文字列の解析、2つのバージョンの大小比較、>=/<=/^/~ などの範囲演算子チェックに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/semver` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Semver チェッカー | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "セマンティックバージョン (Semver) のパース・比較・範囲チェックツール。",
      },
    ],
  }),
  component: SemverChecker,
});

/** バッジコンポーネント */
function SemverBadge({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number | null;
  variant?: "default" | "prerelease" | "build";
}) {
  const isEmpty = value === null;
  return (
    <div
      className={`semver-component-badge semver-component-badge-${variant}`}
      aria-label={`${label}: ${isEmpty ? "なし" : String(value)}`}
    >
      <span className="semver-component-name">{label}</span>
      <span
        className={`semver-component-value ${isEmpty ? "semver-component-value-null" : ""}`}
      >
        {isEmpty ? "なし" : String(value)}
      </span>
    </div>
  );
}

/** パース結果セクション */
function ParseSection({
  parsed,
  label,
}: {
  parsed: SemverParsed | null;
  label: string;
}) {
  if (!parsed) {
    return (
      <div className="semver-empty" aria-live="polite">
        バージョン文字列を入力してください
      </div>
    );
  }

  return (
    <div>
      <div className="semver-normalized" role="status" aria-live="polite">
        <span className="semver-normalized-label">{label}</span>
        {parsed.valid ? (
          <>
            <span className="semver-normalized-value">{formatSemver(parsed)}</span>
            <span className="semver-valid-badge semver-valid-badge-ok" aria-label="有効なバージョン">
              ✓ 有効
            </span>
          </>
        ) : (
          <>
            <span className="semver-normalized-value semver-invalid-value">
              {parsed.raw || "—"}
            </span>
            <span className="semver-valid-badge semver-valid-badge-ng" aria-label="無効なバージョン">
              ✕ 無効
            </span>
          </>
        )}
      </div>
      {parsed.valid && (
        <div className="semver-components" role="list" aria-label="バージョン構成要素">
          <SemverBadge label="Major" value={parsed.major} />
          <SemverBadge label="Minor" value={parsed.minor} />
          <SemverBadge label="Patch" value={parsed.patch} />
          <SemverBadge
            label="Pre-release"
            value={parsed.prerelease}
            variant="prerelease"
          />
          <SemverBadge
            label="Build"
            value={parsed.buildMetadata}
            variant="build"
          />
        </div>
      )}
    </div>
  );
}

/** Semver チェッカーメインコンポーネント */
function SemverChecker() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  // § 1. バージョン解析
  const [parseInput, setParseInput] = useState("");

  // § 2. バージョン比較
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  // § 3. 範囲チェック
  const [rangeVersion, setRangeVersion] = useState("");
  const [rangeExpr, setRangeExpr] = useState("");

  const parsedForParse = parseInput.trim() ? parseSemver(parseInput) : null;

  const parsedA = compareA.trim() ? parseSemver(compareA) : null;
  const parsedB = compareB.trim() ? parseSemver(compareB) : null;

  const parsedRange = rangeVersion.trim() ? parseSemver(rangeVersion) : null;

  // 比較結果
  const compareResult =
    parsedA?.valid && parsedB?.valid ? compareSemver(parsedA, parsedB) : null;

  // 範囲チェック結果
  const rangeResult =
    parsedRange && rangeExpr.trim()
      ? satisfiesRange(parsedRange, rangeExpr)
      : null;

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      const success = await copy(value);
      if (success) {
        showToast(`${label} をコピーしました`, "success");
        announceStatus(`${label} をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus]
  );

  const applyRangeOperator = useCallback((op: string) => {
    const v = rangeVersion.trim() || "1.0.0";
    setRangeExpr(`${op}${v}`);
  }, [rangeVersion]);

  return (
    <>
      <div className="tool-container">

        {/* ── §1. バージョン解析 ── */}
        <div className="semver-section">
          <p className="semver-section-title">バージョン解析</p>
          <div className="converter-section">
            <label htmlFor="semver-parse-input" className="section-title">
              バージョン文字列
            </label>
            <input
              id="semver-parse-input"
              type="text"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="例: 1.2.3-alpha.1+build.20240101"
              aria-describedby="semver-parse-hint"
              autoComplete="off"
              spellCheck={false}
            />
            <p id="semver-parse-hint" className="text-case-hint">
              先頭の <code>v</code> は自動的に除去されます（例: v1.2.3 → 1.2.3）
            </p>
          </div>
          <ParseSection parsed={parsedForParse} label="正規化:" />
          {parsedForParse?.valid && (
            <div className="semver-section semver-increment-section">
              <p className="semver-section-title">次バージョン</p>
              <div
                className="semver-increment-grid"
                role="list"
                aria-label="次バージョン候補"
              >
                {(
                  [
                    { type: "patch", fn: incrementPatch, desc: "バグ修正" },
                    { type: "minor", fn: incrementMinor, desc: "後方互換機能追加" },
                    { type: "major", fn: incrementMajor, desc: "破壊的変更" },
                  ] as const
                ).map(({ type, fn, desc }) => {
                  const next = fn(parsedForParse);
                  return (
                    <button
                      key={type}
                      className="semver-increment-item"
                      role="listitem"
                      onClick={() => handleCopy(next, `次バージョン (${type})`)}
                      aria-label={`次の ${type} バージョン: ${next}。クリックでコピー`}
                      title={desc}
                    >
                      <span className="semver-increment-type">{type}</span>
                      <span className="semver-increment-value">{next}</span>
                      <span className="semver-increment-copy-hint">クリックでコピー</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── §2. バージョン比較 ── */}
        <div className="semver-section">
          <p className="semver-section-title">バージョン比較</p>
          <div className="converter-section">
            <div className="semver-input-wrapper">
              <div className="semver-input-row">
                <span className="semver-input-label" aria-hidden="true">A</span>
                <input
                  id="semver-compare-a"
                  type="text"
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  placeholder="例: 2.0.0"
                  aria-label="比較バージョン A"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="semver-input-row">
                <span className="semver-input-label" aria-hidden="true">B</span>
                <input
                  id="semver-compare-b"
                  type="text"
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  placeholder="例: 1.9.9"
                  aria-label="比較バージョン B"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {parsedA && parsedB && (
            <div
              className="semver-compare-result"
              role="status"
              aria-live="polite"
              aria-label={`比較結果: A ${compareResult === -1 ? "< (小さい)" : compareResult === 0 ? "= (等しい)" : "> (大きい)"} B`}
            >
              <span className="semver-compare-version">{parsedA.valid ? formatSemver(parsedA) : (compareA || "—")}</span>
              <span
                className={`semver-compare-operator ${
                  !parsedA.valid || !parsedB.valid
                    ? ""
                    : compareResult === -1
                      ? "semver-compare-operator-lt"
                      : compareResult === 0
                        ? "semver-compare-operator-eq"
                        : "semver-compare-operator-gt"
                }`}
              >
                {!parsedA.valid || !parsedB.valid
                  ? "?"
                  : compareResult === -1
                    ? "<"
                    : compareResult === 0
                      ? "="
                      : ">"}
              </span>
              <span className="semver-compare-version">{parsedB.valid ? formatSemver(parsedB) : (compareB || "—")}</span>
            </div>
          )}
          {!parsedA && !parsedB && (
            <div className="semver-empty">
              バージョン A・B を入力すると比較結果が表示されます
            </div>
          )}
        </div>

        {/* ── §3. 範囲チェック ── */}
        <div className="semver-section">
          <p className="semver-section-title">バージョン範囲チェック</p>
          <div className="converter-section">
            <label htmlFor="semver-range-version" className="section-title">
              チェックするバージョン
            </label>
            <input
              id="semver-range-version"
              type="text"
              value={rangeVersion}
              onChange={(e) => setRangeVersion(e.target.value)}
              placeholder="例: 1.5.0"
              aria-describedby="semver-range-version-hint"
              autoComplete="off"
              spellCheck={false}
            />
            <p id="semver-range-version-hint" className="text-case-hint">
              範囲を満たすかチェックするバージョンを入力してください
            </p>
          </div>
          <div className="converter-section">
            <label htmlFor="semver-range-expr" className="section-title">
              範囲式
            </label>
            <input
              id="semver-range-expr"
              type="text"
              value={rangeExpr}
              onChange={(e) => setRangeExpr(e.target.value)}
              placeholder="例: >=1.0.0  ^1.2.0  ~1.5.0  <2.0.0"
              aria-describedby="semver-range-hint"
              autoComplete="off"
              spellCheck={false}
            />
            <p id="semver-range-hint" className="text-case-hint">
              演算子: <code>&gt;=</code> <code>&gt;</code> <code>&lt;=</code>{" "}
              <code>&lt;</code> <code>=</code> <code>^</code> <code>~</code>（演算子なしは完全一致）
            </p>
            <div className="semver-range-operators" aria-label="演算子クイック入力">
              {[
                { op: "^", label: "^ (互換)" },
                { op: "~", label: "~ (パッチ互換)" },
                { op: ">=", label: ">=（以上）" },
                { op: ">", label: ">（より大きい）" },
                { op: "<=", label: "<=（以下）" },
                { op: "<", label: "<（より小さい）" },
                { op: "=", label: "=（完全一致）" },
              ].map(({ op, label }) => (
                <button
                  key={op}
                  className="semver-range-op-chip"
                  onClick={() => applyRangeOperator(op)}
                  title={label}
                  aria-label={`${label} を入力`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {rangeResult ? (
            <div
              className={`semver-range-result ${
                rangeResult.error
                  ? "semver-range-result-error"
                  : rangeResult.satisfied
                    ? "semver-range-result-satisfied"
                    : "semver-range-result-unsatisfied"
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="semver-range-result-icon" aria-hidden="true">
                {rangeResult.error ? "⚠️" : rangeResult.satisfied ? "✅" : "❌"}
              </span>
              <span>
                {rangeResult.error
                  ? rangeResult.error
                  : rangeResult.satisfied
                    ? `"${rangeVersion}" は "${rangeExpr}" を満たします`
                    : `"${rangeVersion}" は "${rangeExpr}" を満たしません`}
              </span>
            </div>
          ) : (
            <div className="semver-empty">
              バージョンと範囲式を入力すると結果が表示されます
            </div>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "Semver とは",
              items: [
                "Semantic Versioning（semver.org v2.0.0）は MAJOR.MINOR.PATCH の 3 つの数値でバージョンを表す規則",
                "MAJOR: 後方互換性のない変更（破壊的変更）",
                "MINOR: 後方互換性のある新機能追加",
                "PATCH: 後方互換性のあるバグ修正",
                "プレリリース: 1.0.0-alpha.1  ビルドメタデータ: 1.0.0+build.20240101",
              ],
            },
            {
              title: "範囲演算子の説明",
              items: [
                "^1.2.3 → >=1.2.3 <2.0.0（最上位の非ゼロを固定）",
                "~1.2.3 → >=1.2.3 <1.3.0（MINOR を固定してパッチのみ更新）",
                ">=1.0.0 → 1.0.0 以上すべて",
                ">1.0.0 → 1.0.0 より大きい",
                "<=2.0.0 → 2.0.0 以下すべて",
                "<2.0.0 → 2.0.0 より小さい",
                "=1.0.0 または 1.0.0 → 完全一致のみ",
              ],
            },
            {
              title: "注意事項",
              items: [
                "先頭の 'v' は自動除去されます（例: v1.2.3 → 1.2.3）",
                "ビルドメタデータ (+build) はバージョン優先度の比較では無視されます（semver spec §10）",
                "プレリリース版はリリース版より低い優先度です（1.0.0-alpha < 1.0.0）",
                "計算はすべてブラウザ内で行われます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
