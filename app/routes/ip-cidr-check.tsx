/**
 * @fileoverview IPアドレスのCIDR範囲チェックツール
 * 複数のIPアドレスが指定したCIDRブロックのどれに含まれるかを一括チェックする
 */

import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  isIPInCIDR,
  isValidIPv4,
  isValidCIDR,
  calculateNetworkAddress,
  calculateBroadcastAddress,
} from "../utils/cidr";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/ip-cidr-check")({
  head: () => ({
    meta: [
      { title: "IP/CIDRチェック | Web ツール集" },
      {
        name: "description",
        content: "IPアドレスが指定したCIDRブロックの範囲内かどうかを確認するツール。",
      },
      { property: "og:title", content: "IP/CIDRチェック | Web ツール集" },
      {
        property: "og:description",
        content: "IPアドレスが指定したCIDRブロックの範囲内かどうかを確認するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ip-cidr-check` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "IP/CIDRチェック | Web ツール集" },
      {
        name: "twitter:description",
        content: "IPアドレスが指定したCIDRブロックの範囲内かどうかを確認するツール。",
      },
    ],
  }),
  component: IPCIDRCheck,
});

/**
 * 各IPアドレスのチェック結果を表すインターフェース
 */
interface IPCheckResult {
  /** チェック対象のIPアドレス */
  ip: string;
  /** IPアドレスが有効かどうか */
  isValid: boolean;
  /** マッチしたCIDRブロックのリスト */
  matchedCIDRs: MatchedCIDR[];
}

/**
 * マッチしたCIDRブロックの情報
 */
interface MatchedCIDR {
  /** CIDRブロック文字列 */
  cidr: string;
  /** ネットワークアドレス */
  networkAddress: string;
  /** ブロードキャストアドレス */
  broadcastAddress: string;
}

/**
 * チェック実行結果のサマリー情報
 */
interface CheckSummary {
  /** チェック対象の総IP数 */
  total: number;
  /** 少なくとも1つのCIDRにマッチしたIP数 */
  matched: number;
  /** どのCIDRにもマッチしなかったIP数 */
  unmatched: number;
}

/**
 * IPアドレス入力テキストから有効・無効のIPリストを解析する
 * @param text - 改行区切りのIPアドレステキスト
 * @returns IPアドレス文字列の配列（空行・重複除去済み）
 */
function parseIPList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * CIDRリスト入力テキストから有効なCIDRブロックのリストを解析する
 * @param text - 改行区切りのCIDR表記テキスト
 * @returns CIDRブロック文字列の配列（空行除去済み）
 */
function parseCIDRList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * IPアドレスのCIDR範囲チェックコンポーネント
 * 複数のIPアドレスと複数のCIDRブロックを入力し、
 * 各IPがどのCIDRに含まれるかをチェックする
 */
function IPCIDRCheck() {
  const [ipInput, setIpInput] = useState("");
  const [cidrInput, setCidrInput] = useState("");
  const [results, setResults] = useState<IPCheckResult[] | null>(null);
  const [summary, setSummary] = useState<CheckSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ipTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  /**
   * チェックを実行してIPアドレスの結果を算出する
   */
  const handleCheck = useCallback(() => {
    const ipLines = parseIPList(ipInput);
    const cidrLines = parseCIDRList(cidrInput);

    if (ipLines.length === 0) {
      setError("IPアドレスを1つ以上入力してください");
      announceStatus("エラー: IPアドレスを1つ以上入力してください");
      setResults(null);
      setSummary(null);
      ipTextareaRef.current?.focus();
      return;
    }

    if (cidrLines.length === 0) {
      setError("CIDRブロックを1つ以上入力してください");
      announceStatus("エラー: CIDRブロックを1つ以上入力してください");
      setResults(null);
      setSummary(null);
      return;
    }

    // 無効なCIDRブロックを検出
    const invalidCIDRs = cidrLines.filter((cidr) => !isValidCIDR(cidr));
    if (invalidCIDRs.length > 0) {
      setError(
        `無効なCIDR表記があります: ${invalidCIDRs.slice(0, 3).join(", ")}${invalidCIDRs.length > 3 ? " ..." : ""}`,
      );
      announceStatus("エラー: 無効なCIDR表記があります");
      setResults(null);
      setSummary(null);
      return;
    }

    // 各IPアドレスについてチェックを実行
    const checkResults: IPCheckResult[] = ipLines.map((ip) => {
      if (!isValidIPv4(ip)) {
        return {
          ip,
          isValid: false,
          matchedCIDRs: [],
        };
      }

      const matchedCIDRs: MatchedCIDR[] = cidrLines
        .filter((cidr) => isIPInCIDR(ip, cidr))
        .map((cidr) => {
          const [cidrIp, prefixStr] = cidr.split("/");
          const prefix = parseInt(prefixStr, 10);
          const networkAddress = calculateNetworkAddress(cidrIp, prefix);
          const broadcastAddress = calculateBroadcastAddress(networkAddress, prefix);
          return { cidr, networkAddress, broadcastAddress };
        });

      return {
        ip,
        isValid: true,
        matchedCIDRs,
      };
    });

    const validResults = checkResults.filter((r) => r.isValid);
    const matchedCount = validResults.filter((r) => r.matchedCIDRs.length > 0).length;

    setResults(checkResults);
    setSummary({
      total: checkResults.length,
      matched: matchedCount,
      unmatched: checkResults.length - matchedCount,
    });
    setError(null);
    announceStatus(
      `チェック完了: ${checkResults.length}件中${matchedCount}件がCIDRにマッチしました`,
    );
  }, [ipInput, cidrInput, announceStatus]);

  /**
   * 入力フォームと結果をすべてクリアする
   */
  const handleClear = useCallback(() => {
    setIpInput("");
    setCidrInput("");
    setResults(null);
    setSummary(null);
    setError(null);
    announceStatus("入力をクリアしました");
    ipTextareaRef.current?.focus();
  }, [announceStatus]);

  // Ctrl+Enterでチェック実行
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleCheck();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCheck]);

  // 初期フォーカス
  useEffect(() => {
    ipTextareaRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="CIDR範囲チェックフォーム">
          <div className="cidr-check-inputs">
            <div className="converter-section">
              <label htmlFor="ipListInput">IPアドレス（1行に1つ）</label>
              <textarea
                id="ipListInput"
                ref={ipTextareaRef}
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder={"192.168.1.1\n10.0.0.5\n172.16.0.100"}
                aria-label="チェック対象のIPアドレスを1行に1つ入力"
                aria-describedby="ip-list-help"
                autoComplete="off"
                spellCheck="false"
                className="textarea-field"
              />
              <span id="ip-list-help" className="sr-only">
                チェックしたいIPアドレスを1行に1つずつ入力してください
              </span>
            </div>

            <div className="converter-section">
              <label htmlFor="cidrListInput">CIDRブロック（1行に1つ）</label>
              <textarea
                id="cidrListInput"
                value={cidrInput}
                onChange={(e) => setCidrInput(e.target.value)}
                placeholder={"192.168.0.0/24\n10.0.0.0/8\n172.16.0.0/12"}
                aria-label="チェック対象のCIDRブロックを1行に1つ入力"
                aria-describedby="cidr-list-help"
                autoComplete="off"
                spellCheck="false"
                className="textarea-field"
              />
              <span id="cidr-list-help" className="sr-only">
                CIDR表記のネットワークブロックを1行に1つずつ入力してください（例: 192.168.0.0/24）
              </span>
            </div>
          </div>

          <div className="button-row">
            <Button
              type="submit"
              className="btn-primary"
              onClick={handleCheck}
              aria-label="CIDR範囲チェックを実行"
            >
              チェック
            </Button>
            <Button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
              aria-label="入力内容をクリア"
            >
              クリア
            </Button>
          </div>
          <p className="keyboard-hint">Ctrl+Enter でチェック実行</p>
        </form>

        <ErrorMessage message={error} id="cidr-check-error" />

        {summary && results && !error && (
          <>
            <section aria-labelledby="cidr-summary-title">
              <h2 id="cidr-summary-title" className="section-title">
                チェック結果サマリー
              </h2>
              <div className="cidr-check-summary" role="status" aria-live="polite">
                <div className="cidr-summary-stat">
                  <span className="cidr-summary-stat-value">{summary.total}</span>
                  <span className="cidr-summary-stat-label">総IP数</span>
                </div>
                <div className="cidr-summary-stat matched">
                  <span className="cidr-summary-stat-value">{summary.matched}</span>
                  <span className="cidr-summary-stat-label">マッチ</span>
                </div>
                <div className="cidr-summary-stat unmatched">
                  <span className="cidr-summary-stat-value">{summary.unmatched}</span>
                  <span className="cidr-summary-stat-label">非マッチ</span>
                </div>
              </div>
            </section>

            <section aria-labelledby="cidr-results-title">
              <h2 id="cidr-results-title" className="section-title">
                詳細結果
              </h2>
              <ul className="cidr-check-results" aria-label="IPアドレスのCIDRチェック結果一覧">
                {results.map((result, index) => (
                  <li
                    key={`${result.ip}-${index}`}
                    className={`cidr-check-item ${
                      !result.isValid
                        ? "unmatched"
                        : result.matchedCIDRs.length > 0
                          ? "matched"
                          : "unmatched"
                    }`}
                    aria-label={
                      !result.isValid
                        ? `${result.ip}: 無効なIPアドレス`
                        : result.matchedCIDRs.length > 0
                          ? `${result.ip}: ${result.matchedCIDRs.length}件のCIDRにマッチ`
                          : `${result.ip}: どのCIDRにもマッチしない`
                    }
                  >
                    <div className="cidr-check-item-header">
                      <span className="cidr-check-ip">{result.ip}</span>
                      {!result.isValid ? (
                        <span className="cidr-check-badge unmatched">無効なIP</span>
                      ) : result.matchedCIDRs.length > 0 ? (
                        <span className="cidr-check-badge matched">
                          {result.matchedCIDRs.length}件マッチ
                        </span>
                      ) : (
                        <span className="cidr-check-badge unmatched">非マッチ</span>
                      )}
                    </div>

                    {result.isValid && (
                      <div className="cidr-check-detail">
                        {result.matchedCIDRs.length > 0 ? (
                          result.matchedCIDRs.map((matched) => (
                            <div key={matched.cidr} className="cidr-match-entry">
                              <span className="cidr-match-block">{matched.cidr}</span>
                              <span className="cidr-match-range">
                                {matched.networkAddress} 〜 {matched.broadcastAddress}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="cidr-no-match-message">
                            入力されたCIDRブロックのいずれにも含まれていません
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左のテキストエリアにチェックしたいIPアドレスを1行に1つ入力",
                "右のテキストエリアにCIDRブロックを1行に1つ入力（例: 192.168.0.0/24）",
                "「チェック」ボタンをクリック、またはCtrl+Enterで実行",
                "各IPアドレスがどのCIDRブロックに含まれるかを確認",
                "サマリーでマッチ数/非マッチ数を一覧確認",
              ],
            },
            {
              title: "CIDRについて",
              items: [
                "CIDR（Classless Inter-Domain Routing）は、IPアドレス範囲を表す方式です",
                "「ネットワークアドレス/プレフィックス長」の形式で記述します（例: 10.0.0.0/8）",
                "/24 = 256個のIPアドレス（192.168.1.0 〜 192.168.1.255）",
                "/16 = 65,536個のIPアドレス、/8 = 16,777,216個のIPアドレス",
                "複数のCIDRブロックを指定すると、各IPについて全CIDRへの所属を確認します",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
