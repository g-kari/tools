# テストがない app/utils/ ファイルの分析

## 調査結果サマリー

- app/utils/ ファイル数: 237個
- tests/unit/ テストファイル数: 376個
- **テストがないファイル: 5個のみ**（非常に高いテストカバレッジ）

## テストがないファイル一覧（優先度順）

### 1. **app/utils/html.ts** （推奨度: 最高 ★★★★★）

- 行数: 89行
- 関数数: 1個（`decodeHtmlEntities`）
- 型定義: 3個
- **特徴**: シンプルで純粋な関数
  - HTML エンティティのデコード（名前付き、十進数、十六進数）
  - エッジケースが豊富
  - テストしやすい静的関数
- **推奨理由**: 最もテストしやすい。入出力が明確で、複雑な外部依存がない

### 2. **app/utils/image.ts** （推奨度: 高 ★★★★）

- 行数: 185行
- 関数数: 11個
  - `formatFileSize`: ファイルサイズのフォーマット
  - `downloadBlob`: Blobダウンロード（DOM操作）
  - `isImageFile`: MIMEタイプチェック
  - `getImageDimensions`: 画像サイズ取得（Promise）
  - `createImagePreviewUrl`: プレビューURL生成
  - `clampDimension`: 値のクランプ
  - `calculateAspectRatioSize`: アスペクト比計算
  - `getExtensionFromMimeType`: 拡張子推定
  - `getFilenameWithoutExtension`: 拡張子削除
  - `getExtension`: 拡張子取得
  - `calculateCompressionRatio`: 圧縮率計算
- **特徴**: 混合（純粋関数とDOM操作）
- **純粋関数の割合**: 約70%
- **推奨理由**: DOM操作が少ない。数学計算とファイル処理関数がテストしやすい

### 3. **app/utils/webManifest.ts** （推奨度: 中 ★★★）

- 行数: 394行
- 関数数: 8個
  - `generateId`: ID生成（副作用あり）
  - `createDefaultIcons`: デフォルトアイコン生成
  - `isValidColor`: 色文字列バリデーション
  - `isValidUrl`: URL文字列バリデーション
  - `guessIconType`: MIMEタイプ推定
  - `buildManifestObject`: マニフェストオブジェクト構築
  - `generateManifestJson`: JSON生成
  - `generateLinkTag`: HTMLタグ生成
- **特徴**: バリデーションと生成関数（副作用少ない）
- **推奨理由**: 正規表現バリデーションなど、テストケースが豊富

### 4. **app/utils/animationEffects.ts** （推奨度: 低 ★★）

- 行数: 284行
- 関数数: 11個
  - `generateAnimationFrames`: フレーム生成
  - `generateLegacyFrames`: レガシーフレーム生成
  - `createAnimationFrame`: フレーム作成
  - `applyBounceEffect`: バウンスエフェクト
  - `applyShakeEffect`: シェイクエフェクト
  - `applyRotateEffect`: 回転エフェクト
  - `applyPulseEffect`: パルスエフェクト
  - `applyFadeEffect`: フェードエフェクト
  - `applySlideEffect`: スライドエフェクト
  - `getAnimationEffectLabel`: ラベル取得
  - `getAnimationSpeedLabel`: 速度ラベル取得
- **特徴**: Canvas操作を含む複雑なアニメーション
- **推奨理由**: Canvas APIへの依存が大きく、モックが必要。テストが複雑

### 5. **app/utils/gsapAnimationEngine.ts** （推奨度: 最低 ★）

- 行数: 339行
- 関数数: 8個
  - `getGSAPEase`: GSAPイージング文字列生成
  - `createInitialProxy`: 初期プロキシ生成
  - `createEffectTimeline`: GSAP タイムライン生成
  - `applyProxyToCanvas`: プロキシをCanvasに適用
  - `generateGSAPAnimationFrames`: GSAP フレーム生成
  - `sampleTimeline`: タイムラインサンプリング
  - `getGSAPEasingLabel`: イージングラベル取得
  - `getEasingDirectionLabel`: 方向ラベル取得
- **特徴**: GSAP外部ライブラリ、Canvas操作が複雑
- **推奨理由**: 外部ライブラリとDOM操作が多く、テストが複雑

## テストカバレッジ評価

### 高テストカバレッジの理由

- プロジェクト全体で約94%の utils ファイルがテスト済み
- テスト文化が定着しているプロジェクト
- 自動テストが開発フローに組み込まれている

## 推奨テスト優先順位

| 優先度 | ファイル               | 難易度 | テストしやすさ | 推奨アクション           |
| ------ | ---------------------- | ------ | -------------- | ------------------------ |
| 1      | html.ts                | 低     | 高             | **すぐ実装**             |
| 2      | image.ts               | 中     | 中〜高         | **優先実装**             |
| 3      | webManifest.ts         | 中     | 中             | **実装推奨**             |
| 4      | animationEffects.ts    | 高     | 低〜中         | 後回し（モック複雑）     |
| 5      | gsapAnimationEngine.ts | 高     | 低             | 後回し（外部ライブラリ） |

## テスト実装時の注意点

### html.ts の場合

- エッジケース: 複数のエンティティ、大文字小文字混在、数値参照
- テストケース例:
  - 基本的なエンティティ: `&lt;`, `&gt;`, `&amp;`
  - 数値参照: `&#39;`, `&#x27;`, `&#x2F;`
  - 十進数数値参照: `&#123;`
  - 十六進数数値参照: `&#x1A;`
  - 複合: `&lt;tag&gt;`

### image.ts の場合

- 純粋関数のテスト:
  - `formatFileSize`: バイト値の変換
  - `calculateAspectRatioSize`: アスペクト比計算
  - `getExtension`: パターンマッチング
  - `calculateCompressionRatio`: 数学計算
- DOM操作関数は別途モック必要

### webManifest.ts の場合

- バリデーション関数:
  - `isValidColor`: HEX色コードの正規表現
  - `isValidUrl`: URLコンストラクタの例外処理
- 生成関数:
  - `buildManifestObject`: 条件付きフィールド生成
  - `generateManifestJson`: JSON形式確認
