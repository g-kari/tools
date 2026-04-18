import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { encode as msgpackEncode, decode as msgpackDecode } from "@msgpack/msgpack";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import "../styles/tools/websocket.css";

export const Route = createFileRoute("/websocket")({
  head: () => ({
    meta: [
      { title: "WebSocket テスター | Web ツール集" },
      {
        name: "description",
        content:
          "WebSocketエンドポイントへの接続・メッセージ送受信テストツール。テキスト・JSON・MessagePack・バイナリ送受信に対応。ブラウザ内完結。",
      },
      { property: "og:title", content: "WebSocket テスター | Web ツール集" },
      {
        property: "og:description",
        content:
          "WebSocketエンドポイントへの接続・メッセージ送受信テストツール。テキスト・JSON・MessagePack・バイナリ送受信に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/websocket` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "WebSocket テスター | Web ツール集" },
      {
        name: "twitter:description",
        content: "WebSocketエンドポイントへの接続・メッセージ送受信テストツール。",
      },
    ],
  }),
  component: WebSocketTool,
});

/** WebSocketの接続状態 */
type ConnectionStatus = "disconnected" | "connecting" | "connected";

/** メッセージの種別 */
type MessageType = "sent" | "received" | "system";

/** メッセージタイプセレクターの種別 */
type InputMessageType = "text" | "json" | "msgpack" | "binary";

/** ログエントリの型 */
interface LogEntry {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  encoding?: "text" | "msgpack" | "binary";
}

/** ログエントリの最大件数 */
const MAX_LOG_ENTRIES = 500;

/**
 * タイムスタンプを HH:MM:SS.mmm 形式にフォーマットする
 */
export function formatTimestamp(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * JSON文字列のパースを試みる
 */
export function parseJsonSafe(str: string): string {
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

/**
 * WebSocket URLの形式を検証する
 */
export function isValidWsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "ws:" || u.protocol === "wss:";
  } catch {
    return false;
  }
}

/**
 * ArrayBufferを16進数文字列に変換する
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

/**
 * 16進数文字列をArrayBufferに変換する
 * @returns ArrayBuffer、パース失敗時はnull
 */
export function hexToArrayBuffer(hex: string): ArrayBuffer | null {
  const cleaned = hex.replace(/\s+/g, "");
  if (!cleaned || !/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

/**
 * ArrayBufferをMessagePackとしてデコードし、JSON文字列を返す
 * @returns デコード成功時はJSON文字列、失敗時はnull
 */
export function decodeMsgpack(buffer: ArrayBuffer): string | null {
  try {
    const decoded = msgpackDecode(new Uint8Array(buffer));
    return JSON.stringify(decoded, null, 2);
  } catch {
    return null;
  }
}

/** 方向インジケーター */
function directionLabel(type: MessageType): string {
  if (type === "sent") return "↑";
  if (type === "received") return "↓";
  return "●";
}

/** エンコーディングバッジ */
function EncodingBadge({ encoding }: { encoding?: LogEntry["encoding"] }) {
  if (!encoding || encoding === "text") return null;
  return (
    <span className={`websocket-encoding-badge websocket-encoding-badge--${encoding}`}>
      {encoding === "msgpack" ? "MsgPack" : "binary"}
    </span>
  );
}

/** WebSocketテストツールのメインコンポーネント */
function WebSocketTool() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [url, setUrl] = useState("wss://echo.websocket.org");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [inputType, setInputType] = useState<InputMessageType>("text");
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  /** ログにエントリを追加する */
  const addLog = useCallback(
    (type: MessageType, content: string, encoding?: LogEntry["encoding"]) => {
      idCounterRef.current += 1;
      const entry: LogEntry = {
        id: String(idCounterRef.current),
        type,
        content,
        timestamp: new Date(),
        encoding,
      };
      setLog((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next;
      });
      if (type === "sent") setSentCount((c) => c + 1);
      if (type === "received") setReceivedCount((c) => c + 1);
    },
    [],
  );

  /** 自動スクロール処理 */
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log, autoScroll]);

  /** アンマウント時にWebSocket接続をクリーンアップ */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  /** WebSocketに接続する */
  const handleConnect = useCallback(() => {
    if (!isValidWsUrl(url)) {
      showToast("有効なWebSocket URL（ws:// または wss://）を入力してください", "error");
      return;
    }

    setStatus("connecting");
    addLog("system", `接続中: ${url}`);
    announceStatus("WebSocket接続中...");

    try {
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        addLog("system", `接続しました: ${url}`);
        announceStatus("WebSocket接続完了");
      };

      ws.onclose = (event) => {
        setStatus("disconnected");
        wsRef.current = null;
        const reason = event.reason ? ` (${event.reason})` : "";
        addLog("system", `切断しました (code: ${event.code})${reason}`);
        announceStatus("WebSocket切断");
      };

      ws.onerror = () => {
        addLog("system", "エラーが発生しました");
        showToast("WebSocket接続でエラーが発生しました", "error");
        announceStatus("WebSocketエラー");
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const decoded = decodeMsgpack(event.data);
          if (decoded !== null) {
            addLog("received", decoded, "msgpack");
          } else {
            addLog("received", arrayBufferToHex(event.data), "binary");
          }
        } else {
          const content =
            typeof event.data === "string" ? parseJsonSafe(event.data) : String(event.data);
          addLog("received", content, "text");
        }
      };
    } catch (e) {
      setStatus("disconnected");
      const msg = e instanceof Error ? e.message : "接続に失敗しました";
      addLog("system", `エラー: ${msg}`);
      showToast(msg, "error");
    }
  }, [url, addLog, showToast, announceStatus]);

  /** WebSocket接続を切断する */
  const handleDisconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "ユーザーによる切断");
    }
  }, []);

  /** メッセージを送信する */
  const handleSend = useCallback(() => {
    if (!wsRef.current || status !== "connected") {
      showToast("WebSocketが接続されていません", "error");
      return;
    }
    if (!message.trim()) {
      showToast("メッセージを入力してください", "error");
      return;
    }

    if (inputType === "text") {
      wsRef.current.send(message);
      addLog("sent", message, "text");
      setMessage("");
    } else if (inputType === "json") {
      try {
        const compact = JSON.stringify(JSON.parse(message));
        wsRef.current.send(compact);
        addLog("sent", parseJsonSafe(compact), "text");
        setMessage("");
      } catch {
        showToast("無効なJSON形式です", "error");
      }
    } else if (inputType === "msgpack") {
      try {
        const parsed = JSON.parse(message);
        const encoded = msgpackEncode(parsed);
        wsRef.current.send(encoded);
        addLog("sent", parseJsonSafe(message), "msgpack");
        setMessage("");
      } catch {
        showToast("無効なJSON形式です（MessagePackはJSON入力からエンコードします）", "error");
      }
    } else if (inputType === "binary") {
      const buf = hexToArrayBuffer(message.trim());
      if (buf === null) {
        showToast("無効な16進数形式です（例: 01 02 03 または 010203）", "error");
        return;
      }
      wsRef.current.send(buf);
      addLog("sent", arrayBufferToHex(buf), "binary");
      setMessage("");
    }
  }, [wsRef, status, message, inputType, addLog, showToast]);

  /** キーボードショートカット: Ctrl+Enter で送信 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  /** ログをクリアする */
  const handleClearLog = useCallback(() => {
    setLog([]);
    setSentCount(0);
    setReceivedCount(0);
    announceStatus("ログをクリアしました");
  }, [announceStatus]);

  const statusLabel: Record<ConnectionStatus, string> = {
    disconnected: "切断",
    connecting: "接続中...",
    connected: "接続済み",
  };

  const placeholderMap: Record<InputMessageType, string> = {
    text: "メッセージを入力...",
    json: '{"key": "value"}',
    msgpack: '{"key": "value"}',
    binary: "01 02 03...",
  };

  return (
    <>
      <div className="tool-container">
        <h1 className="section-title">WebSocket テスター</h1>

        {/* URL入力と接続ボタン */}
        <div className="converter-section">
          <label htmlFor="ws-url-input" className="section-title">
            WebSocket URL
          </label>
          <div className="websocket-url-row">
            <input
              id="ws-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="wss://echo.websocket.org"
              aria-label="WebSocket接続先URL"
              disabled={status !== "disconnected"}
              spellCheck={false}
            />
            {status === "disconnected" ? (
              <Button
                onClick={handleConnect}
                disabled={!url.trim()}
                aria-label="WebSocketに接続する"
              >
                接続
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="secondary"
                aria-label="WebSocket接続を切断する"
              >
                切断
              </Button>
            )}
          </div>

          {/* 接続状態 */}
          <div className="websocket-status" aria-live="polite" aria-atomic="true">
            <span className={`websocket-status-dot ${status}`} aria-hidden="true" />
            <span>{statusLabel[status]}</span>
          </div>
        </div>

        {/* メッセージ送信 */}
        <div className="converter-section">
          <label className="section-title">メッセージ送信</label>

          {/* メッセージタイプ選択 */}
          <div
            className="websocket-message-type-selector"
            role="group"
            aria-label="メッセージタイプ"
          >
            {(["text", "json", "msgpack", "binary"] as InputMessageType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={`hash-input-tab${inputType === type ? " active" : ""}`}
                onClick={() => {
                  setInputType(type);
                  setMessage("");
                }}
                aria-pressed={inputType === type}
              >
                {type === "text" && "テキスト"}
                {type === "json" && "JSON"}
                {type === "msgpack" && "MessagePack"}
                {type === "binary" && "バイナリ"}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderMap[inputType]}
            rows={4}
            aria-label="送信するメッセージ"
            disabled={status !== "connected"}
          />

          <div className="button-group">
            <Button
              onClick={handleSend}
              disabled={status !== "connected" || !message.trim()}
              aria-label="メッセージを送信"
            >
              送信
            </Button>
          </div>
        </div>

        {/* メッセージログ */}
        <div className="converter-section">
          <div className="websocket-log-header">
            <span className="section-title">メッセージログ</span>
            <div className="websocket-log-controls">
              <label className="websocket-autoscroll-label">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  aria-label="自動スクロールを有効にする"
                />
                自動スクロール
              </label>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClearLog}
                disabled={log.length === 0}
                aria-label="ログをクリア"
              >
                クリア
              </button>
            </div>
          </div>

          <div
            className="websocket-log"
            ref={logRef}
            role="log"
            aria-label="WebSocketメッセージログ"
            aria-live="polite"
          >
            {log.length === 0 && (
              <div className="websocket-log-entry system" aria-hidden="true">
                ログはここに表示されます
              </div>
            )}
            {log.map((entry) => (
              <div key={entry.id} className={`websocket-log-entry ${entry.type}`}>
                <span className="websocket-log-timestamp">{formatTimestamp(entry.timestamp)}</span>
                <span className="websocket-log-direction" aria-hidden="true">
                  {directionLabel(entry.type)}
                </span>
                <EncodingBadge encoding={entry.encoding} />
                {entry.content}
              </div>
            ))}
          </div>

          {/* 統計 */}
          <div className="websocket-stats" aria-label="統計情報">
            <div className="websocket-stats-item">
              <span>送信: {sentCount}</span>
            </div>
            <div className="websocket-stats-item">
              <span>受信: {receivedCount}</span>
            </div>
            <div className="websocket-stats-item">
              <span>合計: {sentCount + receivedCount}</span>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "WebSocket URLを入力して「接続」ボタンをクリックします",
                "接続後、テキスト・JSON・MessagePack・バイナリメッセージを送信できます",
                "Ctrl+Enterでも送信できます",
                "受信したメッセージはログエリアにリアルタイム表示されます",
                "受信したバイナリはMessagePackとして自動デコードを試みます",
              ],
            },
            {
              title: "テスト用エコーサーバー",
              items: [
                "wss://echo.websocket.org - 送信したメッセージがそのまま返ってきます",
                "wss://ws.postman-echo.com/raw - Postman のエコーサーバー",
                "ローカルの開発サーバーには ws://localhost:PORT で接続できます",
              ],
            },
            {
              title: "メッセージタイプ",
              items: [
                "テキスト: 任意のテキストをそのまま送信します",
                "JSON: JSON形式の検証を行い、コンパクト化して送信します",
                "MessagePack: JSONをMessagePackにエンコードしてバイナリ送信します",
                "バイナリ: 16進数文字列（01 02 03 または 010203）を送信します",
                "受信バイナリ: MessagePackとして自動デコード、失敗時は16進数で表示します",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
