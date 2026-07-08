# World Dog Statistics Platform

世界各国のケネルクラブが公開している犬種別登録頭数・ランキング・希少犬種情報を収集し、出典付きで検索・比較できるようにするデータプラットフォームです。

## 初期実装

このリポジトリには、Phase 0〜2 に向けた最小バックエンド骨格を配置しています。

- NestJS API skeleton
- Prisma schema
- PostgreSQL Docker Compose
- Breed / KennelClub / RegistrationStatistic API
- Collector / Downloader / Parser / Normalizer / Validator / Importer の初期分離
- JKC / The Royal Kennel Club / AKC / FCI Adapter の配置

## セットアップ

Node.js 20 以上を利用してください。

```bash
nvm use
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run import:fixture:jkc
npm run import:fixture:rkc
npm run start:dev
```

API は `/api/v1` から開始します。

```text
GET /api/v1/breeds
GET /api/v1/breeds/:id
GET /api/v1/breeds/:id/aliases
GET /api/v1/dashboard
GET /api/v1/kennel-clubs
GET /api/v1/registration-statistics
GET /api/v1/registration-statistics/trends
GET /api/v1/import-jobs
GET /api/v1/source-documents
GET /api/v1/unresolved-breed-aliases
POST /api/v1/unresolved-breed-aliases/:id/resolve
```

再取り込み履歴を残したまま、最新 SourceDocument に属する統計だけを見る例:

```text
GET /api/v1/registration-statistics?kennelClubCode=JKC&year=2024&latestOnly=true
GET /api/v1/registration-statistics/trends?kennelClubCode=JKC&latestOnly=true
```

未解決犬種名を既存 Breed に紐づける例:

```bash
curl -X POST http://localhost:3000/api/v1/unresolved-breed-aliases/{id}/resolve \
  -H 'Content-Type: application/json' \
  -d '{"breedId":"seed-flat-coated-retriever","languageCode":"ja"}'
```

## 含まれるファイル

```text
world-dog-statistics-platform-docs/
├── README.md
├── AGENTS.md
└── docs/
    ├── PROJECT_CONTEXT.md
    ├── AGENTS.md
    ├── ARCHITECTURE.md
    ├── DATA_MODEL.md
    ├── COLLECTOR_GUIDE.md
    └── ROADMAP.md
```

## 使い方

リポジトリ直下に `AGENTS.md` を配置してください。

`docs/` 配下の設計書は、Codexに以下のように指示して利用できます。

```text
docs/PROJECT_CONTEXT.md、docs/ARCHITECTURE.md、docs/DATA_MODEL.md、docs/COLLECTOR_GUIDE.md、docs/ROADMAP.md を読んで、この方針に従って初期実装を進めてください。
```

## 方針

- ドキュメントは日本語
- コード上の命名は英語
- 初期対象は JKC / The Royal Kennel Club / AKC
- FCIは犬種マスターの基準として利用
