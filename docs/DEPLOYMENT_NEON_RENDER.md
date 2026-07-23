# Neon + Render 公開手順

このプロジェクトを低コストで外部公開するための最小構成です。

```text
Neon Postgres
↓
Render Web Service
↓
NestJS API / Dashboard
```

## 1. Neon プロジェクトを作成

1. Neon で新規 Project を作成します。
2. Connection Details から以下の2種類の接続文字列を控えます。

```text
DATABASE_URL = pooled connection
DIRECT_URL   = direct connection
```

Neon の pooled connection はホスト名に `-pooler` が含まれます。Prisma CLI の migration には direct connection を使うため、`DIRECT_URL` も必ず設定します。

例:

```env
DATABASE_URL="postgresql://user:password@ep-example-pooler.ap-northeast-1.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-example.ap-northeast-1.aws.neon.tech/dbname?sslmode=require"
```

## 2. Render Web Service を作成

Render でこのリポジトリを Web Service として作成します。

```text
Runtime: Node
Build Command: npm install && npm run prisma:generate && npm run build
Start Command: npm run start:render
Health Check Path: /api/v1
```

Environment Variables:

```text
NODE_VERSION=20
DATABASE_URL=<Neon pooled connection>
DIRECT_URL=<Neon direct connection>
PORT=3000
ADMIN_API_KEY=<long random secret>
```

`render.yaml` も追加済みなので、Blueprint として読み込むこともできます。

## 3. 初回データ投入

Render へのデプロイ後、ローカル端末から Neon の接続文字列を `.env` に一時的に設定し、以下を実行します。

```bash
npm run prisma:seed
npm run import:jkc:retrievers:recent
npm run import:rkc:retrievers:ten-year
npm run import:akc:retriever-rankings
```

既存のローカルDB設定を残したい場合は、`.env.production.local` など別ファイルにNeonの接続文字列を控えて、実行時だけ `.env` に反映してください。

## 4. 公開確認

デプロイ後、以下を確認します。

```text
GET https://<render-service>.onrender.com/api/v1
GET https://<render-service>.onrender.com/api/v1/dashboard
GET https://<render-service>.onrender.com/api/v1/registration-statistics/trends?latestOnly=true
GET https://<render-service>.onrender.com/api/v1/popularity-trends?latestOnly=true
```

## 管理API

以下の管理系APIは `ADMIN_API_KEY` で保護します。

```text
GET /api/v1/import-jobs
GET /api/v1/source-documents
GET /api/v1/unresolved-breed-aliases
POST /api/v1/unresolved-breed-aliases/:id/resolve
```

呼び出し時は、どちらかのヘッダーを付けます。

```bash
curl https://<render-service>.onrender.com/api/v1/import-jobs \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

```bash
curl https://<render-service>.onrender.com/api/v1/import-jobs \
  -H "Authorization: Bearer <ADMIN_API_KEY>"
```

## 注意点

- Render Free は一定時間アクセスがないとスリープするため、初回アクセスに時間がかかることがあります。
- Neon Free は小規模公開には向きますが、データ量やアクセスが増えたら有料枠を検討してください。
- `storage/raw` のようなローカルファイル保存は、ホスティング環境では永続化されない前提で扱います。将来的には Cloudflare R2、Supabase Storage、S3 などに移します。
- AKC は登録頭数ではなく人気ランキングを取り込んでいます。JKC の登録頭数ランキングとは、順位指標として比較表示します。
