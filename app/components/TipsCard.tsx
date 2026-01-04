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
 * Note: h3とulを兄弟要素として配置することでE2Eテストとの互換性を維持しています。
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
    <Card
      className="tips-card info-box p-6"
      role="complementary"
      aria-labelledby="usage-title"
    >
      {sections.map((section, index) => (
        <React.Fragment key={section.title}>
          <h3
            id={index === 0 ? "usage-title" : index === 1 ? "about-tool-title" : undefined}
            className={`font-semibold leading-none tracking-tight text-base ${index > 0 ? "mt-4" : ""}`}
          >
            {section.title}
          </h3>
          <ul className="tips-list">
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        </React.Fragment>
      ))}
    </Card>
  );
}
