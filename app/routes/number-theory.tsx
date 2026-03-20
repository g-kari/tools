import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import {
  gcdMultiple,
  lcmMultiple,
  isPrime,
  primeFactorization,
  factorizationToString,
  eulerTotient,
  modPow,
  modInverse,
  parseBigInt,
} from "../utils/number-theory";

export const Route = createFileRoute("/number-theory")({
  head: () => ({
    meta: [
      { title: "数論ツール | Web ツール集" },
      {
        name: "description",
        content:
          "GCD/LCM計算・素因数分解・素数判定・冪乗mod・モジュラー逆数・オイラーのトーシェント関数を計算する数論ツール。",
      },
      { property: "og:title", content: "数論ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "GCD/LCM計算・素因数分解・素数判定・冪乗mod・モジュラー逆数・オイラーのトーシェント関数を計算する数論ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/number-theory` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "数論ツール | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "GCD/LCM計算・素因数分解・素数判定・冪乗mod・モジュラー逆数・オイラーのトーシェント関数を計算する数論ツール。",
      },
    ],
  }),
  component: NumberTheoryTool,
});

/** タブの種類 */
type TabId = "gcd-lcm" | "factorize" | "mod-pow" | "totient";

/** タブの定義 */
const TABS: { id: TabId; label: string }[] = [
  { id: "gcd-lcm", label: "GCD / LCM" },
  { id: "factorize", label: "素因数分解" },
  { id: "mod-pow", label: "冪乗 mod" },
  { id: "totient", label: "φ / 逆数" },
];

/**
 * 数論ツールのメインコンポーネント
 */
function NumberTheoryTool() {
  const [activeTab, setActiveTab] = useState<TabId>("gcd-lcm");

  return (
    <div className="tool-container">
      <h2 className="section-title">数論ツール</h2>

      {/* タブ切り替え */}
      <div
        className="number-theory-tabs"
        role="tablist"
        aria-label="数論ツールのタブ"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className="number-theory-tab-btn"
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === "gcd-lcm" && <GcdLcmPanel />}
      {activeTab === "factorize" && <FactorizePanel />}
      {activeTab === "mod-pow" && <ModPowPanel />}
      {activeTab === "totient" && <TotientPanel />}

      <TipsCard
        sections={[
          {
            title: "GCD / LCM",
            items: [
              "GCD（最大公約数）: 2つ以上の整数の共通の約数のうち最大のもの",
              "LCM（最小公倍数）: 2つ以上の整数の共通の倍数のうち最小の正のもの",
              "GCD × LCM = a × b（2数の場合）",
              "複数の数値をカンマ区切りで入力できます",
            ],
          },
          {
            title: "素因数分解",
            items: [
              "任意の合成数を素数の積として表します",
              "例: 360 = 2³ × 3² × 5",
              "素数判定: 2以上の整数について判定します",
              "オイラー関数 φ(n) は n 以下で n と互いに素な正の整数の個数です",
            ],
          },
          {
            title: "冪乗 mod (modPow)",
            items: [
              "base^exp mod m を高速バイナリ法で計算します",
              "RSA暗号・Diffie-Hellman鍵交換などに使われる基本演算です",
              "大きな数値も正確に計算できます（BigInt使用）",
            ],
          },
          {
            title: "モジュラー逆数",
            items: [
              "a × x ≡ 1 (mod m) となる x を求めます",
              "gcd(a, m) = 1 のときのみ存在します（拡張ユークリッド法）",
              "RSA鍵生成などの暗号理論で重要な演算です",
            ],
          },
        ]}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   GCD / LCM パネル
───────────────────────────────────────────── */

/**
 * GCD / LCM 計算パネル
 * 複数の整数を入力して GCD と LCM を計算する
 */
function GcdLcmPanel() {
  const [inputValue, setInputValue] = useState("");
  const [numbers, setNumbers] = useState<bigint[]>([]);
  const [error, setError] = useState("");
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const addNumber = useCallback(() => {
    const n = parseBigInt(inputValue);
    if (n === null) {
      setError("整数を入力してください");
      return;
    }
    if (n <= 0n) {
      setError("正の整数を入力してください");
      return;
    }
    setError("");
    setNumbers((prev) => [...prev, n]);
    setInputValue("");
  }, [inputValue]);

  const removeNumber = useCallback((index: number) => {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") addNumber();
    },
    [addNumber]
  );

  const result = useMemo(() => {
    if (numbers.length < 2) return null;
    return {
      gcd: gcdMultiple(numbers),
      lcm: lcmMultiple(numbers),
    };
  }, [numbers]);

  const handleCopyGcd = useCallback(async () => {
    if (!result) return;
    const ok = await copy(result.gcd.toString());
    showToast(ok ? "GCDをコピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [result, copy, showToast]);

  const handleCopyLcm = useCallback(async () => {
    if (!result) return;
    const ok = await copy(result.lcm.toString());
    showToast(ok ? "LCMをコピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [result, copy, showToast]);

  return (
    <div role="tabpanel" aria-label="GCD / LCM 計算">
      <p className="number-theory-desc">
        正の整数を入力して追加し、2つ以上揃えると GCD・LCM を計算します
      </p>

      {/* 数値入力 */}
      <div className="number-theory-input-row">
        <div className="number-theory-input-group">
          <label htmlFor="gcd-lcm-input" className="number-theory-label">
            整数を入力
          </label>
          <input
            id="gcd-lcm-input"
            type="text"
            inputMode="numeric"
            className={`number-theory-input${error ? " error" : ""}`}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="例: 12"
            aria-describedby="gcd-lcm-hint"
          />
        </div>
        <Button type="button" className="btn-primary" onClick={addNumber}>
          追加
        </Button>
        {numbers.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="btn-clear"
            onClick={() => setNumbers([])}
          >
            クリア
          </Button>
        )}
      </div>
      <p id="gcd-lcm-hint" className="number-theory-desc">
        Enter キーでも追加できます
      </p>

      {error && (
        <p className="number-theory-error" role="alert">
          {error}
        </p>
      )}

      {/* 追加済み数値チップ */}
      {numbers.length > 0 && (
        <div className="number-theory-numbers-list" aria-label="入力済みの数値">
          {numbers.map((n, i) => (
            <span key={i} className="number-theory-number-chip">
              {n.toString()}
              <button
                type="button"
                className="number-theory-chip-remove"
                onClick={() => removeNumber(i)}
                aria-label={`${n.toString()} を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <>
          <div className="number-theory-result-grid">
            <div className="number-theory-result-card">
              <p className="number-theory-result-title">GCD（最大公約数）</p>
              <p className="number-theory-result-value" aria-label={`GCD: ${result.gcd.toString()}`}>
                {result.gcd.toString()}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary number-theory-copy-btn"
                onClick={handleCopyGcd}
              >
                コピー
              </Button>
            </div>
            <div className="number-theory-result-card">
              <p className="number-theory-result-title">LCM（最小公倍数）</p>
              <p className="number-theory-result-value" aria-label={`LCM: ${result.lcm.toString()}`}>
                {result.lcm.toString()}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary number-theory-copy-btn"
                onClick={handleCopyLcm}
              >
                コピー
              </Button>
            </div>
          </div>
          <p className="number-theory-result-sub">
            入力: {numbers.map((n) => n.toString()).join(", ")}
          </p>
        </>
      )}

      {numbers.length === 1 && (
        <p className="number-theory-label">あと1つ以上の整数を追加してください</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   素因数分解パネル
───────────────────────────────────────────── */

/**
 * 素因数分解 / 素数判定パネル
 */
function FactorizePanel() {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const result = useMemo(() => {
    const n = parseBigInt(inputValue);
    if (n === null || inputValue.trim() === "") return null;
    if (n <= 0n) return { error: "1以上の正の整数を入力してください" };
    const prime = isPrime(n);
    const factorizationMap = n > 1n ? primeFactorization(n) : null;
    const factorizationStr = n > 1n ? factorizationToString(n) : null;
    const phi = eulerTotient(n);
    return { n, prime, factorizationMap, factorizationStr, phi };
  }, [inputValue]);

  const handleCopyFactorization = useCallback(async () => {
    if (!result || "error" in result || !result.factorizationStr) return;
    const ok = await copy(result.factorizationStr);
    showToast(ok ? "コピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [result, copy, showToast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !error) {
        // フォームのデフォルト動作のみ（計算はリアルタイム）
      }
    },
    [error]
  );

  return (
    <div role="tabpanel" aria-label="素因数分解 / 素数判定">
      <div className="number-theory-input-row">
        <div className="number-theory-input-group">
          <label htmlFor="factorize-input" className="number-theory-label">
            正の整数
          </label>
          <input
            id="factorize-input"
            type="text"
            inputMode="numeric"
            className={`number-theory-input${error ? " error" : ""}`}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="例: 360"
            aria-describedby="factorize-hint"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="btn-clear"
          onClick={() => setInputValue("")}
          disabled={!inputValue}
        >
          クリア
        </Button>
      </div>
      <p id="factorize-hint" className="number-theory-desc">
        入力するとリアルタイムで結果が表示されます
      </p>

      {result && "error" in result && (
        <p className="number-theory-error" role="alert">
          {result.error}
        </p>
      )}

      {result && !("error" in result) && (
        <div className="number-theory-result-grid">
          {/* 素数判定 */}
          <div className="number-theory-result-card">
            <p className="number-theory-result-title">素数判定</p>
            <p
              className="number-theory-result-value"
              aria-label={`${result.n.toString()} は${result.prime ? "素数" : "合成数"}`}
            >
              {result.prime ? "素数 ✓" : "合成数"}
            </p>
            {result.n === 1n && (
              <p className="number-theory-result-sub">1 は素数でも合成数でもありません</p>
            )}
          </div>

          {/* 素因数分解 */}
          {result.factorizationStr && (
            <div className="number-theory-result-card">
              <p className="number-theory-result-title">素因数分解</p>
              <p
                className="number-theory-result-value"
                aria-label={`素因数分解: ${result.factorizationStr}`}
              >
                {result.factorizationStr}
              </p>
              <div className="number-theory-factor-list">
                {result.factorizationMap &&
                  [...result.factorizationMap.entries()].map(([p, e]) => (
                    <span key={p.toString()} className="number-theory-factor-badge">
                      {p.toString()}
                      {e > 1 && <sup>{e}</sup>}
                    </span>
                  ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary number-theory-copy-btn"
                onClick={handleCopyFactorization}
              >
                コピー
              </Button>
            </div>
          )}

          {/* オイラー関数 */}
          <div className="number-theory-result-card">
            <p className="number-theory-result-title">φ(n) — オイラー関数</p>
            <p
              className="number-theory-result-value"
              aria-label={`φ(${result.n.toString()}) = ${result.phi.toString()}`}
            >
              {result.phi.toString()}
            </p>
            <p className="number-theory-result-sub">
              {result.n.toString()} 以下で {result.n.toString()} と互いに素な整数の個数
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   冪乗 mod パネル
───────────────────────────────────────────── */

/**
 * 冪乗モジュロ計算パネル: base^exp mod m
 */
function ModPowPanel() {
  const [baseStr, setBaseStr] = useState("");
  const [expStr, setExpStr] = useState("");
  const [modStr, setModStr] = useState("");
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const result = useMemo(() => {
    const base = parseBigInt(baseStr);
    const exp = parseBigInt(expStr);
    const mod = parseBigInt(modStr);
    if (base === null || exp === null || mod === null) return null;
    if (
      baseStr.trim() === "" ||
      expStr.trim() === "" ||
      modStr.trim() === ""
    )
      return null;
    if (exp < 0n) return { error: "指数は0以上の整数を入力してください" };
    if (mod <= 0n) return { error: "法(mod)は正の整数を入力してください" };
    const value = modPow(base, exp, mod);
    return { base, exp, mod, value };
  }, [baseStr, expStr, modStr]);

  const handleCopy = useCallback(async () => {
    if (!result || "error" in result) return;
    const ok = await copy(result.value.toString());
    showToast(ok ? "コピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [result, copy, showToast]);

  return (
    <div role="tabpanel" aria-label="冪乗 mod 計算">
      <p className="number-theory-desc">
        base^exp mod m を計算します（大きな数にも対応）
      </p>

      <div className="number-theory-input-row">
        <div className="number-theory-input-group">
          <label htmlFor="modpow-base" className="number-theory-label">
            base（底）
          </label>
          <input
            id="modpow-base"
            type="text"
            inputMode="numeric"
            className="number-theory-input"
            value={baseStr}
            onChange={(e) => setBaseStr(e.target.value)}
            placeholder="例: 2"
          />
        </div>
        <div className="number-theory-input-group">
          <label htmlFor="modpow-exp" className="number-theory-label">
            exp（指数 ≥ 0）
          </label>
          <input
            id="modpow-exp"
            type="text"
            inputMode="numeric"
            className="number-theory-input"
            value={expStr}
            onChange={(e) => setExpStr(e.target.value)}
            placeholder="例: 10"
          />
        </div>
        <div className="number-theory-input-group">
          <label htmlFor="modpow-mod" className="number-theory-label">
            m（法）
          </label>
          <input
            id="modpow-mod"
            type="text"
            inputMode="numeric"
            className="number-theory-input"
            value={modStr}
            onChange={(e) => setModStr(e.target.value)}
            placeholder="例: 1000"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="btn-clear"
          onClick={() => {
            setBaseStr("");
            setExpStr("");
            setModStr("");
          }}
          disabled={!baseStr && !expStr && !modStr}
        >
          クリア
        </Button>
      </div>

      {result && "error" in result && (
        <p className="number-theory-error" role="alert">
          {result.error}
        </p>
      )}

      {result && !("error" in result) && (
        <div className="number-theory-result-card">
          <p className="number-theory-result-title">計算結果</p>
          <p
            className="number-theory-result-value"
            aria-label={`${result.base.toString()}の${result.exp.toString()}乗 mod ${result.mod.toString()} = ${result.value.toString()}`}
          >
            {result.value.toString()}
          </p>
          <p className="number-theory-result-sub">
            {result.base.toString()}^{result.exp.toString()} mod{" "}
            {result.mod.toString()} = {result.value.toString()}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="btn-secondary number-theory-copy-btn"
            onClick={handleCopy}
          >
            コピー
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   オイラー関数 / モジュラー逆数パネル
───────────────────────────────────────────── */

/**
 * モジュラー逆数 計算パネル: a^{-1} mod m
 */
function TotientPanel() {
  const [aStr, setAStr] = useState("");
  const [mStr, setMStr] = useState("");
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const result = useMemo(() => {
    const a = parseBigInt(aStr);
    const m = parseBigInt(mStr);
    if (a === null || m === null) return null;
    if (aStr.trim() === "" || mStr.trim() === "") return null;
    if (m <= 0n) return { error: "法(m)は正の整数を入力してください" };

    const inv = modInverse(a, m);
    const normalizedA = ((a % m) + m) % m;

    return { a, m, normalizedA, inv };
  }, [aStr, mStr]);

  const handleCopyInv = useCallback(async () => {
    if (!result || "error" in result || result.inv === null) return;
    const ok = await copy(result.inv.toString());
    showToast(ok ? "コピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [result, copy, showToast]);

  return (
    <div role="tabpanel" aria-label="モジュラー逆数計算">
      <p className="number-theory-desc">
        a × x ≡ 1 (mod m) となる x（モジュラー逆数）を計算します
      </p>

      <div className="number-theory-input-row">
        <div className="number-theory-input-group">
          <label htmlFor="modinv-a" className="number-theory-label">
            a（整数）
          </label>
          <input
            id="modinv-a"
            type="text"
            inputMode="numeric"
            className="number-theory-input"
            value={aStr}
            onChange={(e) => setAStr(e.target.value)}
            placeholder="例: 3"
          />
        </div>
        <div className="number-theory-input-group">
          <label htmlFor="modinv-m" className="number-theory-label">
            m（法）
          </label>
          <input
            id="modinv-m"
            type="text"
            inputMode="numeric"
            className="number-theory-input"
            value={mStr}
            onChange={(e) => setMStr(e.target.value)}
            placeholder="例: 11"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="btn-clear"
          onClick={() => {
            setAStr("");
            setMStr("");
          }}
          disabled={!aStr && !mStr}
        >
          クリア
        </Button>
      </div>

      {result && "error" in result && (
        <p className="number-theory-error" role="alert">
          {result.error}
        </p>
      )}

      {result && !("error" in result) && (
        <div className="number-theory-result-grid">
          <div className="number-theory-result-card">
            <p className="number-theory-result-title">モジュラー逆数</p>
            {result.inv !== null ? (
              <>
                <p
                  className="number-theory-result-value"
                  aria-label={`${result.a.toString()} の mod ${result.m.toString()} における逆数は ${result.inv.toString()}`}
                >
                  {result.inv.toString()}
                </p>
                <p className="number-theory-result-sub">
                  {result.normalizedA.toString()} × {result.inv.toString()} ≡ 1
                  (mod {result.m.toString()})
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary number-theory-copy-btn"
                  onClick={handleCopyInv}
                >
                  コピー
                </Button>
              </>
            ) : (
              <>
                <p className="number-theory-result-value">存在しない</p>
                <p className="number-theory-result-sub">
                  gcd({result.normalizedA.toString()}, {result.m.toString()}) ≠
                  1 のため逆数が存在しません
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
