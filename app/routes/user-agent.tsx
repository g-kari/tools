import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { parseUserAgent, type UserAgentInfo } from "../utils/user-agent";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/user-agent")({
  head: () => ({
    meta: [
      { title: "User-Agentパーサー | Web ツール集" },
      { name: "description", content: "User-Agent文字列を解析してブラウザ・OS・デバイス情報を表示するオンラインツール。" },
      { property: "og:title", content: "User-Agentパーサー | Web ツール集" },
      { property: "og:description", content: "User-Agent文字列を解析してブラウザ・OS・デバイス情報を表示するオンラインツール。" },
      { property: "og:url", content: `${SITE_BASE_URL}/user-agent` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "User-Agentパーサー | Web ツール集" },
      { name: "twitter:description", content: "User-Agent文字列を解析してブラウザ・OS・デバイス情報を表示するオンラインツール。" },
    ],
  }),
  component: UserAgentParser,
});

/**
 * User-Agentパーサーコンポーネント
 *
 * User-Agent文字列を入力して解析し、
 * ブラウザ・OS・デバイス情報をカードグリッドで表示する。
 * ページロード時に現在のUA文字列を自動取得して解析する。
 */
function UserAgentParser() {
  const { showToast } = useToast();
  const [uaInput, setUaInput] = useState("");
  const [result, setResult] = useState<UserAgentInfo | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  /**
   * UA文字列を解析してresultを更新する
   */
  const handleParse = useCallback(() => {
    if (!uaInput.trim()) {
      showToast("User-Agent文字列を入力してください", "error");
      announceStatus("エラー: User-Agent文字列を入力してください");
      textareaRef.current?.focus();
      return;
    }
    const parsed = parseUserAgent(uaInput);
    setResult(parsed);
    announceStatus("User-Agentの解析が完了しました");
  }, [uaInput, showToast, announceStatus]);

  /**
   * 現在のブラウザのUA文字列を取得してテキストエリアにセットし解析する
   */
  const handleGetCurrentUA = useCallback(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      setUaInput(ua);
      const parsed = parseUserAgent(ua);
      setResult(parsed);
      announceStatus("現在のUser-Agentを取得して解析しました");
    }
  }, [announceStatus]);

  /**
   * UA文字列をクリップボードにコピーする
   */
  const handleCopy = useCallback(async () => {
    if (!uaInput.trim()) {
      showToast("コピーするUser-Agent文字列がありません", "error");
      return;
    }
    const success = await copy(uaInput);
    if (success) {
      showToast("User-Agent文字列をコピーしました", "success");
      announceStatus("User-Agent文字列をクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
      announceStatus("コピーに失敗しました");
    }
  }, [uaInput, copy, showToast, announceStatus]);

  /**
   * 入力とフォームをクリアする
   */
  const handleClear = useCallback(() => {
    setUaInput("");
    setResult(null);
    announceStatus("入力をクリアしました");
    textareaRef.current?.focus();
  }, [announceStatus]);

  // ページロード時に現在のUA文字列を自動取得
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      setUaInput(ua);
      setResult(parseUserAgent(ua));
    }
  }, []);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <div className="button-group" role="group" aria-label="UA取得操作">
            <Button
              type="button"
              variant="outline"
              className="btn-secondary"
              onClick={handleGetCurrentUA}
              aria-label="現在のブラウザのUser-Agent文字列を取得"
            >
              現在のUA文字列を取得
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} aria-label="User-Agentパーサーフォーム">
          <div className="converter-section">
            <label htmlFor="uaInput" className="section-title">
              User-Agent文字列
            </label>
            <Textarea
              id="uaInput"
              ref={textareaRef}
              value={uaInput}
              onChange={(e) => setUaInput(e.target.value)}
              placeholder="User-Agent文字列を入力してください..."
              aria-describedby="ua-input-help"
              aria-label="User-Agent文字列入力欄"
            />
            <span id="ua-input-help" className="sr-only">
              このフィールドにUser-Agent文字列を入力して解析できます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="解析操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleParse}
              aria-label="User-Agent文字列を解析"
            >
              解析
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-secondary"
              onClick={handleCopy}
              aria-label="User-Agent文字列をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と結果をクリア"
            >
              クリア
            </Button>
          </div>
        </form>

        {result && (
          <section aria-labelledby="ua-result-title">
            <h2 id="ua-result-title" className="section-title">
              解析結果
            </h2>
            <div className="ua-result-grid" aria-live="polite">
              {/* ブラウザカード */}
              <div className="ua-result-card" role="region" aria-label="ブラウザ情報">
                <h3 className="ua-result-card-title">ブラウザ</h3>
                <div className="ua-result-item">
                  <span className="ua-result-item-label">名前</span>
                  <span className="ua-result-item-value">{result.browserName}</span>
                </div>
                <div className="ua-result-item">
                  <span className="ua-result-item-label">バージョン</span>
                  <span className="ua-result-item-value">{result.browserVersion}</span>
                </div>
                <div className="ua-result-item">
                  <span className="ua-result-item-label">エンジン</span>
                  <span className="ua-result-item-value">{result.engineName}</span>
                </div>
              </div>

              {/* OSカード */}
              <div className="ua-result-card" role="region" aria-label="OS情報">
                <h3 className="ua-result-card-title">OS</h3>
                <div className="ua-result-item">
                  <span className="ua-result-item-label">名前</span>
                  <span className="ua-result-item-value">{result.osName}</span>
                </div>
                <div className="ua-result-item">
                  <span className="ua-result-item-label">バージョン</span>
                  <span className="ua-result-item-value">{result.osVersion}</span>
                </div>
              </div>

              {/* デバイスカード */}
              <div className="ua-result-card" role="region" aria-label="デバイス情報">
                <h3 className="ua-result-card-title">デバイス</h3>
                <div className="ua-result-item">
                  <span className="ua-result-item-label">タイプ</span>
                  <span className="ua-device-type-badge">{result.deviceType}</span>
                </div>
                <div className="ua-flag-row">
                  <span className="ua-flag-label">モバイル</span>
                  <span
                    className={`ua-flag-badge ${result.isMobile ? "ua-flag-badge-true" : "ua-flag-badge-false"}`}
                    aria-label={`モバイル: ${result.isMobile ? "はい" : "いいえ"}`}
                  >
                    {result.isMobile ? "YES" : "NO"}
                  </span>
                </div>
                <div className="ua-flag-row">
                  <span className="ua-flag-label">タブレット</span>
                  <span
                    className={`ua-flag-badge ${result.isTablet ? "ua-flag-badge-true" : "ua-flag-badge-false"}`}
                    aria-label={`タブレット: ${result.isTablet ? "はい" : "いいえ"}`}
                  >
                    {result.isTablet ? "YES" : "NO"}
                  </span>
                </div>
                <div className="ua-flag-row">
                  <span className="ua-flag-label">Bot</span>
                  <span
                    className={`ua-flag-badge ${result.isBot ? "ua-flag-badge-true" : "ua-flag-badge-false"}`}
                    aria-label={`Bot: ${result.isBot ? "はい" : "いいえ"}`}
                  >
                    {result.isBot ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「現在のUA文字列を取得」ボタンで現在のブラウザのUser-Agentを自動取得",
                "テキストエリアに任意のUser-Agent文字列を入力して「解析」ボタンを押す",
                "ブラウザ・OS・デバイスのカードで解析結果を確認",
                "「コピー」ボタンでUA文字列をクリップボードにコピー可能",
              ],
            },
            {
              title: "User-Agentについて",
              items: [
                "User-AgentはブラウザがWebサーバーに送信する識別文字列です",
                "ブラウザ名・バージョン・OS・デバイスタイプなどの情報が含まれます",
                "Webサービスはこの情報を元にコンテンツを最適化したり、アクセス統計を収集します",
                "Bot・クローラーもUser-Agentを送信しており、この情報でBotを識別できます",
                "iPadOS 13以降のSafariはデスクトップ版と同じUAを送出するため、Desktopと判定されることがあります",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
