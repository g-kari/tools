import { describe, it, expect, vi, beforeEach } from "vite-plus/test";

// mermaidはブラウザAPIに依存するためモックする
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg></svg>" }),
  },
}));

// TanStack Routerをモックする
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: vi.fn(() => vi.fn()),
}));

// アプリ内コンポーネント・フックをモックする
vi.mock("../app/components/Toast", () => ({
  useToast: vi.fn(() => ({ showToast: vi.fn() })),
}));

vi.mock("~/components/ui/button", () => ({
  Button: vi.fn(),
}));

vi.mock("~/components/ui/textarea", () => ({
  Textarea: vi.fn(),
}));

vi.mock("~/components/TipsCard", () => ({
  TipsCard: vi.fn(),
}));

vi.mock("~/hooks/useStatusAnnouncement", () => ({
  useStatusAnnouncement: vi.fn(() => ({
    statusRef: { current: null },
    announceStatus: vi.fn(),
  })),
  StatusAnnouncer: vi.fn(),
}));

vi.mock("~/hooks/useKeyboardShortcut", () => ({
  useKeyboardShortcut: vi.fn(),
}));

vi.mock("../app/constants/site", () => ({
  SITE_BASE_URL: "https://example.com",
  SITE_OGP_IMAGE: "https://example.com/ogp.png",
}));

import {
  SAMPLE_DIAGRAMS,
  RENDER_ID_PREFIX,
  detectDiagramType,
  isMermaidCodeNonEmpty,
} from "../../app/routes/mermaid";

describe("SAMPLE_DIAGRAMS", () => {
  it("6種類のサンプルダイアグラムが定義されている", () => {
    expect(SAMPLE_DIAGRAMS).toHaveLength(6);
  });

  it("各サンプルにlabelとcodeプロパティがある", () => {
    for (const sample of SAMPLE_DIAGRAMS) {
      expect(sample).toHaveProperty("label");
      expect(sample).toHaveProperty("code");
      expect(typeof sample.label).toBe("string");
      expect(typeof sample.code).toBe("string");
    }
  });

  it("各サンプルのlabelとcodeが空でない", () => {
    for (const sample of SAMPLE_DIAGRAMS) {
      expect(sample.label.trim().length).toBeGreaterThan(0);
      expect(sample.code.trim().length).toBeGreaterThan(0);
    }
  });

  it("フローチャートのサンプルが含まれている", () => {
    const flowchart = SAMPLE_DIAGRAMS.find((s) => s.label === "フローチャート");
    expect(flowchart).toBeDefined();
    expect(flowchart?.code).toContain("flowchart");
  });

  it("シーケンス図のサンプルが含まれている", () => {
    const seq = SAMPLE_DIAGRAMS.find((s) => s.label === "シーケンス図");
    expect(seq).toBeDefined();
    expect(seq?.code).toContain("sequenceDiagram");
  });

  it("クラス図のサンプルが含まれている", () => {
    const cls = SAMPLE_DIAGRAMS.find((s) => s.label === "クラス図");
    expect(cls).toBeDefined();
    expect(cls?.code).toContain("classDiagram");
  });

  it("ガントチャートのサンプルが含まれている", () => {
    const gantt = SAMPLE_DIAGRAMS.find((s) => s.label === "ガントチャート");
    expect(gantt).toBeDefined();
    expect(gantt?.code).toContain("gantt");
  });

  it("状態図のサンプルが含まれている", () => {
    const state = SAMPLE_DIAGRAMS.find((s) => s.label === "状態図");
    expect(state).toBeDefined();
    expect(state?.code).toContain("stateDiagram");
  });

  it("ER図のサンプルが含まれている", () => {
    const er = SAMPLE_DIAGRAMS.find((s) => s.label === "ER図");
    expect(er).toBeDefined();
    expect(er?.code).toContain("erDiagram");
  });

  it("ラベルが一意である", () => {
    const labels = SAMPLE_DIAGRAMS.map((s) => s.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });
});

describe("RENDER_ID_PREFIX", () => {
  it("文字列型である", () => {
    expect(typeof RENDER_ID_PREFIX).toBe("string");
  });

  it('値が "mermaid-diagram" である', () => {
    expect(RENDER_ID_PREFIX).toBe("mermaid-diagram");
  });

  it("空文字列でない", () => {
    expect(RENDER_ID_PREFIX.length).toBeGreaterThan(0);
  });
});

describe("detectDiagramType", () => {
  it('flowchart から始まるコードは "flowchart" を返す', () => {
    expect(detectDiagramType("flowchart TD\n  A --> B")).toBe("flowchart");
  });

  it('graph から始まるコードは "flowchart" を返す', () => {
    expect(detectDiagramType("graph LR\n  A --> B")).toBe("flowchart");
  });

  it('sequenceDiagram から始まるコードは "sequenceDiagram" を返す', () => {
    expect(detectDiagramType("sequenceDiagram\n  A ->> B: message")).toBe("sequenceDiagram");
  });

  it('classDiagram から始まるコードは "classDiagram" を返す', () => {
    expect(detectDiagramType("classDiagram\n  class Foo {}")).toBe("classDiagram");
  });

  it('gantt から始まるコードは "gantt" を返す', () => {
    expect(detectDiagramType("gantt\n  title プロジェクト")).toBe("gantt");
  });

  it('stateDiagram から始まるコードは "stateDiagram" を返す', () => {
    expect(detectDiagramType("stateDiagram-v2\n  [*] --> A")).toBe("stateDiagram");
  });

  it('erDiagram から始まるコードは "erDiagram" を返す', () => {
    expect(detectDiagramType("erDiagram\n  USER { int id }")).toBe("erDiagram");
  });

  it('不明な記法は "unknown" を返す', () => {
    expect(detectDiagramType("unknownDiagram\n  ...")).toBe("unknown");
  });

  it("空文字列の場合は unknown を返す", () => {
    expect(detectDiagramType("")).toBe("unknown");
  });

  it("前後の空白を無視して判定する", () => {
    expect(detectDiagramType("  flowchart TD\n  A --> B")).toBe("flowchart");
  });

  it("各SAMPLEのcodeが正しいタイプに判定される", () => {
    const expectedTypes: Record<string, string> = {
      フローチャート: "flowchart",
      シーケンス図: "sequenceDiagram",
      クラス図: "classDiagram",
      ガントチャート: "gantt",
      状態図: "stateDiagram",
      ER図: "erDiagram",
    };

    for (const sample of SAMPLE_DIAGRAMS) {
      const expected = expectedTypes[sample.label];
      if (expected) {
        expect(detectDiagramType(sample.code)).toBe(expected);
      }
    }
  });
});

describe("isMermaidCodeNonEmpty", () => {
  it("空文字列は false を返す", () => {
    expect(isMermaidCodeNonEmpty("")).toBe(false);
  });

  it("空白のみの文字列は false を返す", () => {
    expect(isMermaidCodeNonEmpty("   ")).toBe(false);
    expect(isMermaidCodeNonEmpty("\n\t")).toBe(false);
  });

  it("内容がある文字列は true を返す", () => {
    expect(isMermaidCodeNonEmpty("flowchart TD")).toBe(true);
  });

  it("前後に空白があっても内容があれば true を返す", () => {
    expect(isMermaidCodeNonEmpty("  flowchart TD  ")).toBe(true);
  });

  it("SAMPLE_DIAGRAMSの全コードが非空である", () => {
    for (const sample of SAMPLE_DIAGRAMS) {
      expect(isMermaidCodeNonEmpty(sample.code)).toBe(true);
    }
  });
});
