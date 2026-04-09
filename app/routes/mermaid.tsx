import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/mermaid")({
  head: () => ({
    meta: [
      { title: "Mermaidプレビュー | Web ツール集" },
      {
        name: "description",
        content:
          "Mermaid記法のダイアグラムをリアルタイムでプレビューできるツール。フローチャート、シーケンス図、クラス図、ガントチャートなどに対応。",
      },
      {
        property: "og:title",
        content: "Mermaidプレビュー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Mermaid記法のダイアグラムをリアルタイムでプレビューできるツール。フローチャート、シーケンス図、クラス図、ガントチャートなどに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/mermaid` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Mermaidプレビュー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Mermaid記法のダイアグラムをリアルタイムでプレビューできるツール。フローチャート、シーケンス図、クラス図、ガントチャートなどに対応。",
      },
    ],
  }),
  component: MermaidPreview,
});

/** サンプルダイアグラムの定義 */
export const SAMPLE_DIAGRAMS: { label: string; code: string }[] = [
  {
    label: "フローチャート",
    code: `flowchart TD
    A[開始] --> B{条件分岐}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E`,
  },
  {
    label: "シーケンス図",
    code: `sequenceDiagram
    participant ブラウザ
    participant サーバー
    participant DB
    ブラウザ->>サーバー: HTTPリクエスト
    サーバー->>DB: クエリ実行
    DB-->>サーバー: 結果返却
    サーバー-->>ブラウザ: レスポンス`,
  },
  {
    label: "クラス図",
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    Animal <|-- Dog`,
  },
  {
    label: "ガントチャート",
    code: `gantt
    title プロジェクトスケジュール
    dateFormat  YYYY-MM-DD
    section 設計
    要件定義     :a1, 2024-01-01, 7d
    基本設計     :a2, after a1, 5d
    section 開発
    実装         :b1, after a2, 14d
    テスト       :b2, after b1, 7d`,
  },
  {
    label: "状態図",
    code: `stateDiagram-v2
    [*] --> 待機中
    待機中 --> 処理中: リクエスト受信
    処理中 --> 完了: 処理成功
    処理中 --> エラー: 処理失敗
    完了 --> [*]
    エラー --> 待機中: リトライ`,
  },
  {
    label: "ER図",
    code: `erDiagram
    USER {
        int id PK
        string name
        string email
    }
    POST {
        int id PK
        string title
        text content
        int user_id FK
    }
    USER ||--o{ POST : "投稿する"`,
  },
];

/** レンダリング結果の一意なIDプレフィックス */
export const RENDER_ID_PREFIX = "mermaid-diagram";

/**
 * Mermaid記法の種類を識別する関数
 * @param code - Mermaid記法の文字列
 * @returns ダイアグラム種類の文字列、識別不能な場合は "unknown"
 */
export function detectDiagramType(code: string): string {
  const trimmed = code.trim();
  if (trimmed.startsWith("flowchart") || trimmed.startsWith("graph")) {
    return "flowchart";
  }
  if (trimmed.startsWith("sequenceDiagram")) {
    return "sequenceDiagram";
  }
  if (trimmed.startsWith("classDiagram")) {
    return "classDiagram";
  }
  if (trimmed.startsWith("gantt")) {
    return "gantt";
  }
  if (trimmed.startsWith("stateDiagram")) {
    return "stateDiagram";
  }
  if (trimmed.startsWith("erDiagram")) {
    return "erDiagram";
  }
  return "unknown";
}

/**
 * Mermaid記法の文字列が空でないか検証する関数
 * @param code - 検証するMermaid記法の文字列
 * @returns 空でなければ true
 */
export function isMermaidCodeNonEmpty(code: string): boolean {
  return code.trim().length > 0;
}

/**
 * mermaidが生成するSVG文字列をDOMParserで解析してコンテナに安全に挿入するコンポーネント
 * DOMParserを使用することでinnerHTMLを避け、スクリプト実行のリスクを排除する
 */
function MermaidSvgOutput({ svg }: { svg: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svg) return;

    // 既存の子要素をクリア
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // DOMParserでSVGをパースして安全にDOMに挿入する
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.querySelector("svg");

    if (svgElement) {
      // importNodeでドキュメントにインポートしてから追加
      const importedNode = document.importNode(svgElement, true);
      container.appendChild(importedNode);
    }

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [svg]);

  return (
    <div
      ref={containerRef}
      className="mermaid-svg-wrapper"
      aria-label="生成されたMermaidダイアグラム"
    />
  );
}

/**
 * Mermaidプレビューコンポーネント
 * Mermaid記法のテキストをリアルタイムでSVGダイアグラムに変換して表示する
 */
function MermaidPreview() {
  const { showToast } = useToast();
  const [diagramCode, setDiagramCode] = useState("");
  const [svgContent, setSvgContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const renderCountRef = useRef(0);
  /** mermaidの初期化済みフラグ（複数回のinitialize呼び出しを防止） */
  const mermaidInitializedRef = useRef(false);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  // 入力変更時にリアルタイムでMermaidをレンダリング
  useEffect(() => {
    if (!diagramCode.trim()) {
      setSvgContent("");
      setErrorMessage("");
      return;
    }

    setIsRendering(true);
    // カウンターをインクリメントして現在のレンダリングを識別する
    renderCountRef.current += 1;
    const currentRender = renderCountRef.current;

    const renderDiagram = async (): Promise<void> => {
      try {
        // mermaidはブラウザのみで動作するため動的インポートを使用（SSR対応）
        const mermaid = (await import("mermaid")).default;
        // initialize()はコンポーネントのライフサイクルで一度だけ呼ぶ
        if (!mermaidInitializedRef.current) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "strict",
          });
          mermaidInitializedRef.current = true;
        }

        const renderId = `${RENDER_ID_PREFIX}-${currentRender}`;
        const { svg } = await mermaid.render(renderId, diagramCode);

        // 古いレンダリング結果は無視する
        if (currentRender !== renderCountRef.current) return;

        setSvgContent(svg);
        setErrorMessage("");
      } catch (err) {
        if (currentRender !== renderCountRef.current) return;
        const message = err instanceof Error ? err.message : "描画に失敗しました";
        setErrorMessage(message);
        setSvgContent("");
      } finally {
        if (currentRender === renderCountRef.current) {
          setIsRendering(false);
        }
      }
    };

    renderDiagram();
  }, [diagramCode]);

  // 初期フォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** サンプルダイアグラムを挿入する */
  const handleInsertSample = useCallback(
    (code: string, label: string) => {
      setDiagramCode(code);
      announceStatus(`${label}のサンプルを挿入しました`);
      inputRef.current?.focus();
    },
    [announceStatus],
  );

  /** SVGをファイルとしてエクスポートダウンロードする */
  const handleExportSvg = useCallback(() => {
    const outputEl = document.getElementById("mermaid-output");
    const svgElement = outputEl?.querySelector("svg");
    if (!svgElement) {
      announceStatus("エラー: エクスポートするSVGがありません");
      showToast("エクスポートするSVGがありません", "error");
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "diagram.svg";
    anchor.click();
    URL.revokeObjectURL(url);
    announceStatus("SVGをダウンロードしました");
    showToast("SVGをダウンロードしました", "success");
  }, [announceStatus, showToast]);

  /** 入力と出力をクリアする */
  const handleClear = useCallback(() => {
    setDiagramCode("");
    setSvgContent("");
    setErrorMessage("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  // Ctrl+Enter でSVGエクスポート
  useKeyboardShortcut("Enter", handleExportSvg, { ctrl: true });

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <div className="button-group" role="group" aria-label="ツール操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleExportSvg}
              aria-label="ダイアグラムをSVGとしてダウンロード"
              disabled={!svgContent}
            >
              SVGをエクスポート
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          <div
            className="mermaid-sample-buttons"
            role="group"
            aria-label="サンプルダイアグラムの挿入"
          >
            <span className="mermaid-sample-label">サンプル:</span>
            {SAMPLE_DIAGRAMS.map((sample) => (
              <Button
                key={sample.label}
                type="button"
                variant="secondary"
                className="btn-secondary mermaid-sample-btn"
                onClick={() => handleInsertSample(sample.code, sample.label)}
                aria-label={`${sample.label}のサンプルを挿入`}
              >
                {sample.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mermaid-layout">
          <div className="mermaid-input">
            <label htmlFor="mermaidInput" className="section-title">
              Mermaid入力
            </label>
            <Textarea
              id="mermaidInput"
              ref={inputRef}
              value={diagramCode}
              onChange={(e) => setDiagramCode(e.target.value)}
              placeholder={`ここにMermaid記法を入力してください...\n\nflowchart TD\n    A[開始] --> B[終了]`}
              aria-label="Mermaid記法入力エリア"
              aria-describedby="mermaid-input-help"
              className="mermaid-textarea"
            />
            <span id="mermaid-input-help" className="sr-only">
              Mermaid記法を入力すると右側にリアルタイムプレビューが表示されます
            </span>
          </div>

          <div className="mermaid-output">
            <p className="section-title" aria-hidden="true">
              プレビュー
            </p>
            <div
              id="mermaid-output"
              role="region"
              aria-label="Mermaidダイアグラムプレビュー表示エリア"
              aria-live="polite"
              aria-busy={isRendering}
              className="mermaid-preview-area"
            >
              {isRendering && <p className="mermaid-status-message">描画中...</p>}
              {!isRendering && errorMessage && (
                <div className="mermaid-error" role="alert" aria-label="Mermaid構文エラー">
                  <p className="mermaid-error-title">構文エラー</p>
                  <pre className="mermaid-error-body">{errorMessage}</pre>
                </div>
              )}
              {!isRendering && svgContent && !errorMessage && <MermaidSvgOutput svg={svgContent} />}
              {!isRendering && !svgContent && !errorMessage && (
                <p className="mermaid-placeholder">
                  左側のエリアにMermaid記法を入力するとプレビューが表示されます
                </p>
              )}
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左側のエリアにMermaid記法を入力すると、右側にリアルタイムプレビューが表示されます",
                "「サンプル」ボタンから各ダイアグラム種類のサンプルを挿入できます",
                "「SVGをエクスポート」ボタンでダイアグラムをSVGファイルとしてダウンロードできます",
                "キーボードショートカット: Ctrl+Enter でSVGをエクスポート",
              ],
            },
            {
              title: "対応ダイアグラム",
              items: [
                "フローチャート: flowchart TD / LR などで方向を指定",
                "シーケンス図: sequenceDiagram でアクター間のメッセージを表現",
                "クラス図: classDiagram でオブジェクト指向の構造を表現",
                "ガントチャート: gantt でプロジェクトスケジュールを表現",
                "状態図: stateDiagram-v2 で状態遷移を表現",
                "ER図: erDiagram でエンティティとリレーションを表現",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
