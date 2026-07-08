# ROADMAP.md

## Phase 0: プロジェクト初期化

目的:

- リポジトリ構成を作る
- NestJS / Prisma / PostgreSQL の基本構成を作る
- ドキュメントを配置する

成果物:

- PROJECT_CONTEXT.md
- AGENTS.md
- ARCHITECTURE.md
- DATA_MODEL.md
- COLLECTOR_GUIDE.md
- ROADMAP.md
- NestJS project
- Prisma schema
- Docker Compose

## Phase 1: 犬種・団体マスター整備

目的:

- Breed / BreedAlias / Country / KennelClub の基本マスターを作る

タスク:

- Prisma schema作成
- 初期seed作成
- JKC / AKC / The Royal Kennel Club / FCI のKennelClub登録
- 日本・アメリカ・イギリスなどCountry登録
- Flat-Coated Retrieverなどサンプル犬種登録
- FCI番号を保持できる構成にする

成果物:

- Breed master API
- KennelClub API
- seed data

## Phase 2: Collector Framework

目的:

- 団体別Collectorを追加しやすい共通基盤を作る

タスク:

- Collector interface作成
- Downloader共通処理作成
- Raw file storage作成
- Checksum service作成
- ImportJob管理作成

成果物:

- SourceCollector interface
- HttpDownloader
- RawFileStorageService
- ImportJob repository

## Phase 3: JKC Adapter

目的:

- JKCのHTML形式の犬種別登録数を取り込む

成果物:

- JkcCollector
- JkcParser
- JKC parser test
- RegistrationStatistic records

## Phase 4: The Royal Kennel Club Adapter

目的:

- 英国の犬種別登録統計を取り込む

成果物:

- RoyalKennelClubCollector
- RoyalKennelClubParser
- BreedStatus import
- UK registration statistics records

## Phase 5: AKC PDF Parser

目的:

- AKCの1885〜2008年の登録統計PDFを取り込む

成果物:

- AkcCollector
- AkcPdfParser
- AKC mapping rules
- PopularityRanking importer

## Phase 6: 登録統計API

API案:

```text
GET /api/v1/registration-statistics
GET /api/v1/registration-statistics/trends
GET /api/v1/registration-statistics/compare
GET /api/v1/breeds/:id/statistics
```

## Phase 7: 犬種ステータスAPI

API案:

```text
GET /api/v1/breed-statuses
GET /api/v1/breed-statuses/vulnerable
GET /api/v1/breeds/:id/statuses
```

## Phase 8: 犬種名マッピング管理

目的:

- 自動照合できない犬種名を確認・修正できる仕組みを作る

成果物:

- unresolved alias list
- alias resolve command
- mapping workflow

## Phase 9: FCI統合

目的:

- 犬種マスターの正規化基盤を強化する

成果物:

- FciCollector
- FCI breed master
- FCI alias mapping

## Phase 10: 簡易ダッシュボード

機能:

- 犬種検索
- 国別比較
- 年別推移グラフ
- ランキング表示
- 希少犬種表示

## Phase 11: 拡張

候補:

- Canadian Kennel Club追加
- Dogs Australia追加
- NZKC追加
- GraphQL API
- Public API key
- CSV export
- Data quality dashboard
- 世界犬種登録数ランキング
- 犬種クラブ向けレポート

## 最初の実装優先順位

1. Docker ComposeでPostgreSQL起動
2. NestJS初期化
3. Prisma schema作成
4. Master seed作成
5. Breed API作成
6. Collector Framework作成
7. JKCのサンプル1年分を取り込み
8. The Royal Kennel Clubのサンプル1年分を取り込み
9. Registration statistics API作成
10. Trend API作成

## MVP完了条件

- JKCの少なくとも1年分の登録統計をDBに保存できる
- The Royal Kennel Clubの少なくとも1年分の登録統計をDBに保存できる
- 犬種マスターと登録統計が紐づいている
- 犬種別・年度別・国別の登録数をAPIで取得できる
- 出典資料を追跡できる
- 未解決犬種名を検出できる
- Collectorを追加しやすい構造になっている
