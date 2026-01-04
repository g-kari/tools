import * as React from "react";
import { Card } from "~/components/ui/card";

interface TipsSection {
  title: string;
  items: string[];
}

interface TipsCardProps {
  sections: TipsSection[];
}

/**
 * Tips/使い方カードコンポーネント
 *
 * 各ツールページで使用するTips/使い方セクションを表示するためのカードコンポーネント。
 * 複数のセクション（例：「〇〇とは」「使い方」）をサポートします。
 *
 * Note: 各セクションを個別のCardとして描画することでE2Eテストとの互換性を維持しています。
 * これにより .info-box.nth(0), .info-box.nth(1) などのセレクターが正しく動作します。
 *
 * @param sections - 表示するセクションの配列
 * @returns TipsCardのReactコンポーネント
 *
 * @example
 * <TipsCard
 *   sections={[
 *     {
 *       title: "使い方",
 *       items: [
 *         "テキストを入力します",
 *         "変換ボタンを押します",
 *       ],
 *     },
 *   ]}
 * />
 */
export function TipsCard({ sections }: TipsCardProps) {
  return (
    <>
      {sections.map((section, index) => (
        <Card
          key={section.title}
          className={`tips-card info-box p-6 ${index > 0 ? "mt-4" : ""}`}
          role="complementary"
          aria-labelledby={index === 0 ? "usage-title" : index === 1 ? "about-tool-title" : undefined}
        >
          <h3
            id={index === 0 ? "usage-title" : index === 1 ? "about-tool-title" : undefined}
            className="font-semibold leading-none tracking-tight text-base"
          >
            {section.title}
          </h3>
          <ul className="tips-list">
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}
