# ARCHITECTURE.md

## アーキテクチャ概要

World Dog Statistics Platform は、各国ケネルクラブの公開統計情報を収集し、犬種単位で正規化したうえでAPI・分析データ・ダッシュボードとして提供するデータ基盤です。

```text
External Sources
  |
  |-- JKC HTML
  |-- The Royal Kennel Club HTML
  |-- AKC PDF / Web pages
  |-- FCI Breed Standards
  |-- Future kennel club sources
  |
Collector Layer
  |
Downloader Layer
  |
Raw File Storage
  |
Parser Layer
  |
Normalizer Layer
  |
Validator Layer
  |
Importer Layer
  |
Database Layer
  |
API Layer
  |
Client Applications / Dashboard
```

## レイヤー構成

### Collector Layer

団体別の収集フローを管理します。

例:

- JkcCollector
- RoyalKennelClubCollector
- AkcCollector
- FciCollector

### Downloader Layer

Webページ取得、PDFダウンロード、HTML保存、取得メタデータ保存、チェックサム作成を担当します。

### Raw File Storage

元PDF・元HTML・CSV・JSONを保存し、再解析可能な状態を維持します。

```text
storage/
  raw/
    jkc/
      2024/
    royal-kennel-club/
      2024/
    akc/
      2008/
    fci/
  parsed/
  logs/
```

### Parser Layer

PDF / HTML / CSV から表形式データを抽出し、DTO化します。

```ts
type ParsedRegistrationRow = {
  sourceClubCode: string;
  year: number;
  breedName: string;
  registrationCount: number;
  rank?: number;
  previousYearDifference?: number;
  rawText?: string;
};
```

### Normalizer Layer

犬種名を内部犬種IDへ紐づけます。未解決マッピングを検出し、`UnresolvedBreedAlias` として保存します。

### Validator Layer

年度、登録頭数、前年比、犬種名、出典ドキュメントの妥当性を検証します。

### Importer Layer

正規化済みDTOをDBに保存し、ImportJobを更新します。

## Source Adapter設計

```text
collectors/
  jkc/
    jkc.collector.ts
    jkc.downloader.ts
    jkc.parser.ts

  royal-kennel-club/
    royal-kennel-club.collector.ts
    royal-kennel-club.downloader.ts
    royal-kennel-club.parser.ts

  akc/
    akc.collector.ts
    akc.downloader.ts
    akc-pdf.parser.ts

  fci/
    fci.collector.ts
    fci.parser.ts
```

共通インターフェース例:

```ts
interface SourceCollector {
  collect(options: CollectOptions): Promise<CollectResult>;
}
```

## 推奨バックエンド構成

```text
src/
  main.ts
  app.module.ts

  api/
    breeds/
    kennel-clubs/
    registration-statistics/
    rankings/
    breed-statuses/

  collectors/
    jkc/
    royal-kennel-club/
    akc/
    fci/
    common/

  downloaders/
    http-downloader.ts
    file-downloader.ts

  parsers/
    html-table.parser.ts
    pdf-table.parser.ts

  normalizers/
    breed-normalizer.ts
    alias-matcher.ts

  validators/
    registration-statistic.validator.ts

  importers/
    registration-statistic.importer.ts
    ranking.importer.ts
    breed-status.importer.ts

  database/
    prisma.service.ts
    repositories/

  jobs/
    import-jobs/

  storage/
    raw-file.service.ts
    checksum.service.ts

  shared/
    types/
    errors/
    utils/
```

## データ処理フロー

### JKC取り込み

```text
1. JKC統計ページを取得
2. 対象年度のHTMLを保存
3. チェックサムを計算
4. Parserで犬種別登録数を抽出
5. 犬種名を正規化
6. Breedに紐づけ
7. RegistrationStatisticに保存
8. ImportLogを保存
9. 未解決犬種名を確認
```

### The Royal Kennel Club取り込み

```text
1. Breed registration statisticsページを取得
2. 対象年度のHTMLを保存
3. 犬種名・登録数・前年比を抽出
4. 犬種名を正規化
5. RegistrationStatisticに保存
6. Vulnerable Native Breeds情報があればBreedStatusに保存
7. ImportLogを保存
```

### AKC取り込み

```text
1. AKCアーカイブまたはPDFを取得
2. 元ファイルを保存
3. PDFから表を抽出
4. 犬種名・年度・登録数を抽出
5. AKC独自犬種名をBreedAliasに照合
6. 登録統計として保存
7. 近年ランキングはPopularityRankingとして保存
```

### FCI取り込み

```text
1. FCI犬種リストを取得
2. FCI番号・犬種名・グループ・原産国を抽出
3. Breed masterを更新
4. BreedAliasを追加
5. 犬種標準PDFの出典をSourceDocumentとして保存
```

## API構成案

```text
GET /api/v1/breeds
GET /api/v1/breeds/:id
GET /api/v1/breeds/:id/aliases
GET /api/v1/breeds/:id/statistics
GET /api/v1/breeds/:id/statuses
GET /api/v1/kennel-clubs
GET /api/v1/registration-statistics
GET /api/v1/registration-statistics/trends
GET /api/v1/registration-statistics/compare
GET /api/v1/rankings
GET /api/v1/breed-statuses
GET /api/v1/breed-statuses/vulnerable
```

## 初期MVP

1. Breed master
2. KennelClub master
3. SourceDocument
4. JKC registration import
5. The Royal Kennel Club registration import
6. Registration statistics API
7. Breed alias mapping
8. Simple trend endpoint
