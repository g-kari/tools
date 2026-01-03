import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

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
      className="tips-card info-box"
      role="complementary"
      aria-labelledby="usage-title"
    >
      {sections.map((section, index) => (
        <React.Fragment key={section.title}>
          <CardHeader className={index > 0 ? "pt-2" : ""}>
            <CardTitle
              id={index === 0 ? "usage-title" : undefined}
              className="text-base"
            >
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="tips-list">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </React.Fragment>
      ))}
    </Card>
  );
}
