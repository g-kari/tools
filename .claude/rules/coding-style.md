---
description: コーディング規約・UIガイドライン
paths: "app/**/*.tsx,app/**/*.ts,app/**/*.css"
---

# コーディング規約

## UIデザイン

- Material Design 3のカラーシステムを使用
- アクセシビリティを考慮（ARIAラベル、キーボードナビゲーション対応）
- レスポンシブデザイン対応
- 日本語UIをメインにサポート
- TanStack Startのサーバーファンクションを使用してAPI実装

## 禁止事項

- **インラインスタイル原則禁止**: `style` 属性を使用せず、`app/styles.css` または専用CSSファイルで定義すること
- **`alert()` 使用禁止**: 代わりに `app/components/Toast.tsx` のトースト通知を使用すること

## デザインスキル参照

- [Material Design Styling](.claude/skills/material-design-styling.md)
- [WCAG Accessibility](.claude/skills/wcag-accessibility.md)
- [UX Psychology](.claude/skills/ux-psychology.md)
- [Frontend Design](.claude/skills/frontend-design.md)
