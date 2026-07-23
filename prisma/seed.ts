import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const japan = await prisma.country.upsert({
    where: { code: "JP" },
    update: {},
    create: { code: "JP", nameEn: "Japan", nameJa: "日本" },
  });

  const unitedStates = await prisma.country.upsert({
    where: { code: "US" },
    update: {},
    create: { code: "US", nameEn: "United States", nameJa: "アメリカ" },
  });

  const unitedKingdom = await prisma.country.upsert({
    where: { code: "GB" },
    update: {},
    create: { code: "GB", nameEn: "United Kingdom", nameJa: "イギリス" },
  });

  const belgium = await prisma.country.upsert({
    where: { code: "BE" },
    update: {},
    create: { code: "BE", nameEn: "Belgium", nameJa: "ベルギー" },
  });

  const jkc = await prisma.kennelClub.upsert({
    where: { code: "JKC" },
    update: {},
    create: {
      code: "JKC",
      name: "Japan Kennel Club",
      countryId: japan.id,
      websiteUrl: "https://www.jkc.or.jp/",
      supportsRegistration: true,
      supportsHtml: true,
    },
  });

  const akc = await prisma.kennelClub.upsert({
    where: { code: "AKC" },
    update: {},
    create: {
      code: "AKC",
      name: "American Kennel Club",
      countryId: unitedStates.id,
      websiteUrl: "https://www.akc.org/",
      supportsRegistration: true,
      supportsRanking: true,
      supportsHtml: true,
      supportsPdf: true,
    },
  });

  const rkc = await prisma.kennelClub.upsert({
    where: { code: "RKC" },
    update: {},
    create: {
      code: "RKC",
      name: "The Royal Kennel Club",
      countryId: unitedKingdom.id,
      websiteUrl: "https://www.thekennelclub.org.uk/",
      supportsRegistration: true,
      supportsBreedStatus: true,
      supportsHtml: true,
      supportsPdf: true,
    },
  });

  const fci = await prisma.kennelClub.upsert({
    where: { code: "FCI" },
    update: {},
    create: {
      code: "FCI",
      name: "Federation Cynologique Internationale",
      countryId: belgium.id,
      websiteUrl: "https://www.fci.be/",
      supportsBreedStandard: true,
      supportsHtml: true,
      supportsPdf: true,
    },
  });

  void akc;
  void rkc;
  void fci;

  const seedBreeds: SeedBreed[] = [
    {
      id: "seed-chesapeake-bay-retriever",
      fciNumber: 263,
      nameEn: "Chesapeake Bay Retriever",
      nameJa: "チェサピーク・ベイ・レトリーバー",
      groupName: "Retrievers",
      fciGroup: "Group 8",
      origin: "United States",
      aliases: [
        { aliasName: "Chesapeake Bay Retriever", languageCode: "en" },
        { aliasName: "チェサピークベイレトリーバー", languageCode: "ja" },
      ],
      jkcAliases: [
        { aliasName: "チェサピーク・ベイ・レトリーバー", languageCode: "ja" },
      ],
      rkcAliases: [
        { aliasName: "Retriever (Chesapeake Bay)", languageCode: "en" },
      ],
      akcAliases: [
        { aliasName: "Chesapeake Bay Retriever", languageCode: "en" },
        { aliasName: "Chesapeake Bay Retrievers", languageCode: "en" },
        { aliasName: "Retrievers (Chesapeake Bay)", languageCode: "en" },
      ],
    },
    {
      id: "seed-curly-coated-retriever",
      fciNumber: 110,
      nameEn: "Curly-Coated Retriever",
      nameJa: "カーリーコーテッド・レトリーバー",
      groupName: "Retrievers",
      fciGroup: "Group 8",
      origin: "United Kingdom",
      aliases: [
        { aliasName: "Curly Coated Retriever", languageCode: "en" },
        { aliasName: "カーリーコーテッドレトリーバー", languageCode: "ja" },
      ],
      jkcAliases: [
        { aliasName: "カーリーコーテッド・レトリーバー", languageCode: "ja" },
      ],
      rkcAliases: [
        { aliasName: "Retriever (Curly Coated)", languageCode: "en" },
      ],
      akcAliases: [
        { aliasName: "Curly-Coated Retriever", languageCode: "en" },
        { aliasName: "Curly-Coated Retrievers", languageCode: "en" },
        { aliasName: "Retrievers (Curly-Coated)", languageCode: "en" },
      ],
    },
    {
      id: "seed-flat-coated-retriever",
      fciNumber: 121,
      nameEn: "Flat-Coated Retriever",
      nameJa: "フラットコーテッド・レトリーバー",
      groupName: "Retrievers",
      fciGroup: "Group 8",
      origin: "United Kingdom",
      aliases: [
        { aliasName: "Flat Coated Retriever", languageCode: "en" },
        { aliasName: "フラットコーテッドレトリーバー", languageCode: "ja" },
      ],
      jkcAliases: [
        { aliasName: "フラットコーテッド・レトリーバー", languageCode: "ja" },
      ],
      rkcAliases: [
        { aliasName: "Retriever (Flat Coated)", languageCode: "en" },
      ],
      akcAliases: [
        { aliasName: "Flat-Coated Retriever", languageCode: "en" },
        { aliasName: "Flat-Coated Retrievers", languageCode: "en" },
        { aliasName: "Retrievers (Flat-Coated)", languageCode: "en" },
      ],
    },
    {
      id: "seed-golden-retriever",
      fciNumber: 111,
      nameEn: "Golden Retriever",
      nameJa: "ゴールデン・レトリーバー",
      groupName: "Retrievers",
      fciGroup: "Group 8",
      origin: "United Kingdom",
      aliases: [
        { aliasName: "Golden Retriever", languageCode: "en" },
        { aliasName: "ゴールデンレトリーバー", languageCode: "ja" },
      ],
      jkcAliases: [
        { aliasName: "ゴールデン・レトリーバー", languageCode: "ja" },
      ],
      rkcAliases: [{ aliasName: "Retriever (Golden)", languageCode: "en" }],
      akcAliases: [
        { aliasName: "Golden Retriever", languageCode: "en" },
        { aliasName: "Golden Retrievers", languageCode: "en" },
        { aliasName: "Retrievers (Golden)", languageCode: "en" },
      ],
    },
    {
      id: "seed-labrador-retriever",
      fciNumber: 122,
      nameEn: "Labrador Retriever",
      nameJa: "ラブラドール・レトリーバー",
      groupName: "Retrievers",
      fciGroup: "Group 8",
      origin: "United Kingdom",
      aliases: [
        { aliasName: "Labrador Retriever", languageCode: "en" },
        { aliasName: "ラブラドールレトリーバー", languageCode: "ja" },
      ],
      jkcAliases: [
        { aliasName: "ラブラドール・レトリーバー", languageCode: "ja" },
      ],
      rkcAliases: [{ aliasName: "Retriever (Labrador)", languageCode: "en" }],
      akcAliases: [
        { aliasName: "Labrador Retriever", languageCode: "en" },
        { aliasName: "Labrador Retrievers", languageCode: "en" },
        { aliasName: "Retrievers (Labrador)", languageCode: "en" },
      ],
    },
    {
      id: "seed-nova-scotia-duck-tolling-retriever",
      fciNumber: 312,
      nameEn: "Nova Scotia Duck Tolling Retriever",
      nameJa: "ノヴァ・スコシア・ダック・トーリング・レトリーバー",
      groupName: "Retrievers",
      fciGroup: "Group 8",
      origin: "Canada",
      aliases: [
        {
          aliasName: "Nova Scotia Duck Tolling Retriever",
          languageCode: "en",
        },
        {
          aliasName: "ノヴァスコシアダックトーリングレトリーバー",
          languageCode: "ja",
        },
      ],
      jkcAliases: [
        {
          aliasName: "ノヴァ・スコシア・ダック・トーリング・レトリーバー",
          languageCode: "ja",
        },
      ],
      rkcAliases: [
        {
          aliasName: "Retriever (Nova Scotia Duck Tolling)",
          languageCode: "en",
        },
      ],
      akcAliases: [
        {
          aliasName: "Nova Scotia Duck Tolling Retriever",
          languageCode: "en",
        },
        {
          aliasName: "Nova Scotia Duck Tolling Retrievers",
          languageCode: "en",
        },
        {
          aliasName: "Retrievers (Nova Scotia Duck Tolling)",
          languageCode: "en",
        },
      ],
    },
    {
      id: "seed-siberian-husky",
      fciNumber: 270,
      nameEn: "Siberian Husky",
      nameJa: "シベリアン・ハスキー",
      groupName: "Spitz and Primitive types",
      fciGroup: "Group 5",
      origin: "United States",
      aliases: [
        { aliasName: "Siberian Husky", languageCode: "en" },
        { aliasName: "シベリアンハスキー", languageCode: "ja" },
      ],
      jkcAliases: [
        { aliasName: "シベリアン・ハスキー", languageCode: "ja" },
      ],
      rkcAliases: [{ aliasName: "Siberian Husky", languageCode: "en" }],
      akcAliases: [],
    },
    {
      id: "seed-samoyed",
      fciNumber: 212,
      nameEn: "Samoyed",
      nameJa: "サモエド",
      groupName: "Spitz and Primitive types",
      fciGroup: "Group 5",
      origin: "Russia",
      aliases: [
        { aliasName: "Samoyed", languageCode: "en" },
        { aliasName: "サモエド", languageCode: "ja" },
      ],
      jkcAliases: [{ aliasName: "サモエド", languageCode: "ja" }],
      rkcAliases: [{ aliasName: "Samoyed", languageCode: "en" }],
      akcAliases: [],
    },
  ];

  for (const breed of seedBreeds) {
    const savedBreed = await prisma.breed.upsert({
      where: { id: breed.id },
      update: {
        fciNumber: breed.fciNumber,
        nameEn: breed.nameEn,
        nameJa: breed.nameJa,
        groupName: breed.groupName,
        fciGroup: breed.fciGroup,
        origin: breed.origin,
      },
      create: {
        id: breed.id,
        fciNumber: breed.fciNumber,
        nameEn: breed.nameEn,
        nameJa: breed.nameJa,
        groupName: breed.groupName,
        fciGroup: breed.fciGroup,
        origin: breed.origin,
      },
    });

    for (const alias of breed.aliases) {
      await ensureBreedAlias({
        breedId: savedBreed.id,
        kennelClubId: null,
        aliasName: alias.aliasName,
        languageCode: alias.languageCode,
        sourceType: "seed",
      });
    }

    for (const alias of breed.jkcAliases) {
      await ensureBreedAlias({
        breedId: savedBreed.id,
        kennelClubId: jkc.id,
        aliasName: alias.aliasName,
        languageCode: alias.languageCode,
        sourceType: "jkc_seed",
      });
    }

    for (const alias of breed.rkcAliases) {
      await ensureBreedAlias({
        breedId: savedBreed.id,
        kennelClubId: rkc.id,
        aliasName: alias.aliasName,
        languageCode: alias.languageCode,
        sourceType: "rkc_seed",
      });
    }

    for (const alias of breed.akcAliases) {
      await ensureBreedAlias({
        breedId: savedBreed.id,
        kennelClubId: akc.id,
        aliasName: alias.aliasName,
        languageCode: alias.languageCode,
        sourceType: "akc_seed",
      });
    }
  }
}

type SeedBreed = {
  id: string;
  fciNumber: number;
  nameEn: string;
  nameJa: string;
  groupName: string;
  fciGroup: string;
  origin: string;
  aliases: SeedBreedAlias[];
  jkcAliases: SeedBreedAlias[];
  rkcAliases: SeedBreedAlias[];
  akcAliases: SeedBreedAlias[];
};

type SeedBreedAlias = {
  aliasName: string;
  languageCode: string;
};

async function ensureBreedAlias(input: {
  breedId: string;
  kennelClubId: string | null;
  aliasName: string;
  languageCode: string;
  sourceType: string;
}): Promise<void> {
  const existingAlias = await prisma.breedAlias.findFirst({
    where: {
      kennelClubId: input.kennelClubId,
      aliasName: input.aliasName,
    },
  });

  if (existingAlias) {
    await prisma.breedAlias.update({
      where: { id: existingAlias.id },
      data: {
        breedId: input.breedId,
        languageCode: input.languageCode,
        sourceType: input.sourceType,
      },
    });
    return;
  }

  await prisma.breedAlias.create({
    data: input,
  });
}

void main()
  .catch((error: unknown) => {
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
