# DATA_MODEL.md

## データモデル概要

このプロジェクトでは、犬種・団体・国・登録統計・ランキング・犬種ステータス・出典資料を明確に分離します。

中心となるテーブル:

- Breed
- BreedAlias
- Country
- KennelClub
- SourceDocument
- ImportJob
- RegistrationStatistic
- PopularityRanking
- BreedStatus
- UnresolvedBreedAlias

## ERイメージ

```text
Country 1 - n KennelClub
KennelClub 1 - n SourceDocument
SourceDocument 1 - n RegistrationStatistic
RegistrationStatistic n - 1 Breed
Breed 1 - n BreedAlias
Breed 1 - n BreedStatus
ImportJob 1 - n SourceDocument
```

## Breed

```prisma
model Breed {
  id          String   @id @default(cuid())
  fciNumber  Int?
  nameEn      String
  nameJa      String?
  groupName   String?
  fciGroup    String?
  origin      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  aliases     BreedAlias[]
  statistics  RegistrationStatistic[]
  rankings    PopularityRanking[]
  statuses    BreedStatus[]
}
```

## BreedAlias

```prisma
model BreedAlias {
  id            String   @id @default(cuid())
  breedId       String
  kennelClubId  String?
  aliasName     String
  languageCode  String?
  sourceType    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  breed         Breed @relation(fields: [breedId], references: [id])
  kennelClub    KennelClub? @relation(fields: [kennelClubId], references: [id])

  @@unique([kennelClubId, aliasName])
}
```

## Country

```prisma
model Country {
  id          String   @id @default(cuid())
  code        String   @unique
  nameEn      String
  nameJa      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  kennelClubs KennelClub[]
}
```

## KennelClub

```prisma
model KennelClub {
  id                       String   @id @default(cuid())
  code                     String   @unique
  name                     String
  countryId                String
  websiteUrl               String?
  supportsRegistration     Boolean  @default(false)
  supportsRanking          Boolean  @default(false)
  supportsBreedStandard    Boolean  @default(false)
  supportsBreedStatus      Boolean  @default(false)
  supportsApi              Boolean  @default(false)
  supportsHtml             Boolean  @default(false)
  supportsPdf              Boolean  @default(false)
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  country                  Country @relation(fields: [countryId], references: [id])
  aliases                  BreedAlias[]
  documents                SourceDocument[]
  statistics               RegistrationStatistic[]
  rankings                 PopularityRanking[]
  statuses                 BreedStatus[]
}
```

コード例:

```text
JKC: Japan Kennel Club
AKC: American Kennel Club
RKC: The Royal Kennel Club
FCI: Fédération Cynologique Internationale
```

## SourceDocument

```prisma
model SourceDocument {
  id             String   @id @default(cuid())
  kennelClubId   String
  importJobId    String?
  sourceUrl      String?
  filePath       String?
  fileName       String?
  fileType       String?
  sourceFormat   String?
  checksum       String?
  year           Int?
  title          String?
  parserVersion  String?
  retrievedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  kennelClub     KennelClub @relation(fields: [kennelClubId], references: [id])
  importJob      ImportJob? @relation(fields: [importJobId], references: [id])
  statistics     RegistrationStatistic[]
  rankings       PopularityRanking[]
  statuses       BreedStatus[]
}
```

sourceFormat例:

```text
HTML
PDF
CSV
JSON
XML
API
```

## ImportJob

```prisma
model ImportJob {
  id             String   @id @default(cuid())
  kennelClubCode String
  targetYear     Int?
  status         String
  startedAt      DateTime @default(now())
  finishedAt     DateTime?
  rowsParsed     Int      @default(0)
  rowsImported   Int      @default(0)
  warnings       Json?
  errors         Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  documents      SourceDocument[]
}
```

status例:

```text
pending
running
success
partial_success
failed
```

## RegistrationStatistic

```prisma
model RegistrationStatistic {
  id                      String   @id @default(cuid())
  breedId                 String
  kennelClubId            String
  sourceDocumentId        String?
  countryCode             String
  year                    Int
  registrationCount       Int
  rank                    Int?
  previousYearDifference  Int?
  rawBreedName            String?
  note                    String?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  breed                   Breed @relation(fields: [breedId], references: [id])
  kennelClub              KennelClub @relation(fields: [kennelClubId], references: [id])
  sourceDocument          SourceDocument? @relation(fields: [sourceDocumentId], references: [id])

  @@index([year])
  @@index([countryCode])
  @@index([kennelClubId])
  @@index([breedId])
}
```

## PopularityRanking

```prisma
model PopularityRanking {
  id                String   @id @default(cuid())
  breedId           String
  kennelClubId      String
  sourceDocumentId  String?
  countryCode       String
  year              Int
  rank              Int
  rawBreedName      String?
  note              String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  breed             Breed @relation(fields: [breedId], references: [id])
  kennelClub        KennelClub @relation(fields: [kennelClubId], references: [id])
  sourceDocument    SourceDocument? @relation(fields: [sourceDocumentId], references: [id])

  @@index([year])
  @@index([countryCode])
  @@index([kennelClubId])
  @@index([breedId])
}
```

## BreedStatus

The Royal Kennel Club の Vulnerable Native Breeds などを保存するために使います。

```prisma
model BreedStatus {
  id                String   @id @default(cuid())
  breedId           String
  kennelClubId      String
  sourceDocumentId  String?
  countryCode       String
  year              Int?
  status            String
  registrationCount Int?
  rawBreedName      String?
  note              String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  breed             Breed @relation(fields: [breedId], references: [id])
  kennelClub        KennelClub @relation(fields: [kennelClubId], references: [id])
  sourceDocument    SourceDocument? @relation(fields: [sourceDocumentId], references: [id])

  @@index([status])
  @@index([year])
  @@index([countryCode])
  @@index([kennelClubId])
  @@index([breedId])
}
```

status例:

```text
ACTIVE
VULNERABLE
ENDANGERED
RARE
NATIVE_BREED
EXTINCT
UNKNOWN
```

## UnresolvedBreedAlias

```prisma
model UnresolvedBreedAlias {
  id               String   @id @default(cuid())
  kennelClubCode   String
  rawBreedName     String
  year             Int?
  sourceDocumentId String?
  status           String   @default("unresolved")
  note             String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([kennelClubCode])
  @@index([rawBreedName])
}
```

## 設計上の注意

- 犬種名は団体や言語によって揺れる
- AKCとFCIで犬種分類が異なる場合がある
- The Royal Kennel Clubには英国固有の希少犬種分類がある
- 登録頭数と人気ランキングは分けて管理する
- 出典資料は必ず保存する
- 後から再解析できるようにする
- 自動マッピングできない犬種名は無理に紐づけない
