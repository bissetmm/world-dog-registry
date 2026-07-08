# AGENTS.md

このリポジトリは、Codex / Cursor / Claude Code などのAIコーディングエージェントが読みやすいように設計します。

## 基本方針

このプロジェクトでは、次の優先順位を守ってください。

1. 読みやすさ
2. 保守しやすさ
3. 型安全性
4. データの再現性
5. 小さく分割された実装
6. 将来拡張しやすい設計

過度な最適化や、不要に複雑な抽象化は避けてください。

## 言語ルール

ドキュメントは日本語で記述して構いません。ただし、コード上の命名は英語で統一してください。

Good:

- Breed
- KennelClub
- RegistrationStatistic
- SourceDocument
- BreedAlias
- BreedStatus
- Collector
- Parser
- Normalizer

Bad:

- InuShu
- Tourokusuu
- Dantai
- Toukei

## レイヤー分離ルール

以下の責務を混在させないでください。

- collection
- downloading
- scraping
- parsing
- normalization
- validation
- persistence
- API response
- UI rendering

基本的なデータ処理の流れは以下です。

```text
Collector
↓
Downloader
↓
Raw Storage
↓
Parser
↓
Normalizer
↓
Validator
↓
Importer
↓
Repository
↓
Service
↓
Controller / API
```

## Source Adapter方針

団体ごとに Source Adapter を作成してください。

例:

- JkcCollector
- RoyalKennelClubCollector
- AkcCollector
- FciCollector

団体固有のHTML構造・PDF構造・URLルールは、必ずAdapter内に閉じ込めてください。共通処理は `common` に切り出します。

## 推奨ディレクトリ構成

```text
src/
  api/
  collectors/
  downloaders/
  parsers/
  normalizers/
  validators/
  importers/
  database/
  shared/
  config/
  jobs/
  storage/
```

## コントローラーのルール

Controller にビジネスロジックを書かないでください。

Controller は以下だけを担当します。

- request parameterの受け取り
- DTO validation
- Service呼び出し
- response返却

## データベースルール

取り込んだデータは、原則として上書きしないでください。同じ年・同じ犬種・同じ団体のデータであっても、元資料が異なる場合は履歴として追跡できるようにしてください。

すべての取り込みレコードには、可能な限り以下を紐づけます。

- source document
- source URL
- import date
- checksum
- parser version
- warning / error log

## Collectorルール

Collector は、団体別のデータ取得・解析・取り込みの流れを組み立てます。Collector自体にHTML解析やDB保存の詳細を書かないでください。

Collectorは以下を呼び出します。

- Downloader
- Parser
- Normalizer
- Validator
- Importer

## Downloaderルール

Downloader は「取得」のみを担当してください。Downloader の中で、犬種名の正規化やDB保存を行わないでください。

## Parserルール

Parser は、HTML / PDF / CSV などの元データを構造化DTOに変換するだけにしてください。Parser はDBを直接更新してはいけません。

Parser の出力例:

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

## Normalizerルール

Normalizer は、団体別・言語別の犬種名を内部の `Breed` に紐づける責務を持ちます。自動判定できない場合は、無理にマッピングせず `UnresolvedBreedAlias` として保存してください。

## API設計ルール

APIは `/api/v1` から開始します。

```text
GET /api/v1/breeds
GET /api/v1/breeds/:id
GET /api/v1/registration-statistics
GET /api/v1/registration-statistics/trends
GET /api/v1/rankings
GET /api/v1/breed-statuses
GET /api/v1/kennel-clubs
```

DB Entity をそのまま返さず、必ず Response DTO を返してください。

## 型安全ルール

- `any` を避ける
- `unknown` を適切に使う
- DTOを明示する
- enum または union type を使う
- null許容を明確にする

## テスト方針

優先してテストすべき箇所:

1. Parser
2. Normalizer
3. Validator
4. Importer
5. Repository
6. API Service

特にHTMLやPDFのパーサーは、サンプルファイルを fixture として保持し、回帰テストを書いてください。

## ログ方針

取り込み処理では以下をログに残してください。

- import job id
- source club
- target year
- source URL
- source filename
- rows parsed
- rows imported
- unresolved breed aliases
- warnings
- errors

## 禁止事項

- API Controller にスクレイピング処理を書く
- Parser から直接DB保存する
- `any` の多用
- 元データを保存せずに解析結果だけ保存する
- 犬種名を曖昧なまま強制マッピングする
- 出典不明のデータを正式データとして保存する
- 1ファイルに巨大なクラスを作る
- 無関係な大規模リファクタリングを行う

## 最終目標

このプロジェクトの最終目標は、犬種別登録頭数・人気ランキング・希少犬種ステータスの世界的な推移を、信頼できる出典とともに検索・比較できるデータプラットフォームを作ることです。

短期的には JKC、The Royal Kennel Club、AKC を対象に、堅牢なデータ取り込み・正規化・API公開の流れを完成させてください。
