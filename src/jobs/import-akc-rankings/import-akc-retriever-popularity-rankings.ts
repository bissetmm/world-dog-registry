import { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ImportJobStatus, SourceFormat } from "@prisma/client";
import { AppModule } from "../../app.module";
import {
  AkcPopularityRankingParser,
  ParsedPopularityRankingRow,
} from "../../collectors/akc/akc-popularity-ranking.parser";
import { ImportJobRepository } from "../../database/repositories/import-job.repository";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { SourceDocumentRepository } from "../../database/repositories/source-document.repository";
import { HttpDownloader } from "../../downloaders/http-downloader";
import { PopularityRankingImporter } from "../../importers/popularity-ranking.importer";
import { PopularityRankingNormalizer } from "../../normalizers/popularity-ranking-normalizer";
import { ChecksumService } from "../../storage/checksum.service";
import { RawFileStorageService } from "../../storage/raw-file-storage.service";

const PARSER_VERSION = "akc-retriever-popularity-ranking-import@0.1.0";
const AKC_RANKING_PAGES = [
  {
    year: 2025,
    url: "https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-2025/",
  },
  {
    year: 2024,
    url: "https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-2024/",
  },
  {
    year: 2023,
    url: "https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-2023/",
  },
  {
    year: 2022,
    url: "https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-2022/",
  },
  {
    year: 2021,
    url: "https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-of-2021/",
  },
  {
    year: 2020,
    url: "https://www.akc.org/expert-advice/dog-breeds/the-most-popular-dog-breeds-of-2020/",
  },
];

const RETRIEVER_BREED_NAME_KEYS = new Set([
  "chesapeakebayretriever",
  "chesapeakebayretrievers",
  "retrieverschesapeakebay",
  "curlycoatedretriever",
  "curlycoatedretrievers",
  "retrieverscurlycoated",
  "flatcoatedretriever",
  "flatcoatedretrievers",
  "retrieversflatcoated",
  "goldenretriever",
  "goldenretrievers",
  "retrieversgolden",
  "labradorretriever",
  "labradorretrievers",
  "retrieverslabrador",
  "novascotiaducktollingretriever",
  "novascotiaducktollingretrievers",
  "retrieversnovascotiaducktolling",
]);

type YearImportResult = {
  year: number;
  sourceUrl: string;
  importJobId: string;
  sourceDocumentId?: string;
  rowsParsed: number;
  rowsMatched: number;
  rowsImported: number;
  unresolvedBreedAliases: number;
  warnings: string[];
  errors: string[];
};

type ImportResult = {
  yearsRequested: number[];
  yearsImported: YearImportResult[];
};

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const result = await importAkcRetrieverPopularityRankings(app);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

async function importAkcRetrieverPopularityRankings(
  app: INestApplicationContext,
): Promise<ImportResult> {
  const yearsImported: YearImportResult[] = [];

  for (const page of AKC_RANKING_PAGES) {
    yearsImported.push(await importAkcRankingPage(page, app));
  }

  return {
    yearsRequested: AKC_RANKING_PAGES.map((page) => page.year),
    yearsImported,
  };
}

async function importAkcRankingPage(
  page: { year: number; url: string },
  app: INestApplicationContext,
): Promise<YearImportResult> {
  const importJobRepository = app.get(ImportJobRepository, { strict: false });
  const kennelClubRepository = app.get(KennelClubRepository, { strict: false });
  const sourceDocumentRepository = app.get(SourceDocumentRepository, {
    strict: false,
  });
  const downloader = app.get(HttpDownloader, { strict: false });
  const checksumService = app.get(ChecksumService, { strict: false });
  const rawFileStorageService = app.get(RawFileStorageService, {
    strict: false,
  });
  const parser = app.get(AkcPopularityRankingParser, { strict: false });
  const normalizer = app.get(PopularityRankingNormalizer, { strict: false });
  const importer = app.get(PopularityRankingImporter, { strict: false });
  const importJob = await importJobRepository.create({
    kennelClubCode: "AKC",
    targetYear: page.year,
    status: ImportJobStatus.running,
  });

  try {
    const downloadedFile = await downloader.download(page.url);
    const checksum = checksumService.sha256(downloadedFile.content);
    const fileName = `akc-popularity-rankings-${page.year}.html`;
    const savedFilePath = await rawFileStorageService.save({
      sourceClubCode: "AKC",
      year: page.year,
      fileName,
      content: downloadedFile.content,
    });
    const kennelClub = await kennelClubRepository.findByCode("AKC");

    if (!kennelClub) {
      throw new Error("KennelClub not found: AKC");
    }

    const sourceDocument = await sourceDocumentRepository.create({
      kennelClub: { connect: { id: kennelClub.id } },
      importJob: { connect: { id: importJob.id } },
      sourceUrl: page.url,
      filePath: savedFilePath,
      fileName,
      fileType: downloadedFile.contentType ?? "text/html",
      sourceFormat: SourceFormat.HTML,
      checksum,
      year: page.year,
      title: `AKC ${page.year} popularity rankings`,
      parserVersion: PARSER_VERSION,
      retrievedAt: downloadedFile.retrievedAt,
    });
    const parsedRows = parser.parse(
      downloadedFile.content.toString("utf8"),
      page.year,
    );
    const retrieverRows = parsedRows.filter(isRetrieverRow);
    const normalizedRows = await normalizer.normalizeRows(retrieverRows);
    const unresolvedRows = normalizedRows.filter((row) => row.breedId === null);
    const warnings = unresolvedRows.map(
      (row) =>
        `Unresolved AKC ranking breed alias: ${row.breedName} (${page.year})`,
    );
    const rowsImported = await importer.importRows({
      sourceClubCode: "AKC",
      sourceDocumentId: sourceDocument.id,
      rows: normalizedRows,
    });
    const status =
      warnings.length > 0
        ? ImportJobStatus.partial_success
        : ImportJobStatus.success;

    await importJobRepository.updateStatus(importJob.id, status, {
      rowsParsed: parsedRows.length,
      rowsImported,
      warnings,
      errors: [],
      finishedAt: new Date(),
    });

    return {
      year: page.year,
      sourceUrl: page.url,
      importJobId: importJob.id,
      sourceDocumentId: sourceDocument.id,
      rowsParsed: parsedRows.length,
      rowsMatched: retrieverRows.length,
      rowsImported,
      unresolvedBreedAliases: unresolvedRows.length,
      warnings,
      errors: [],
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown AKC import error";

    await importJobRepository.updateStatus(
      importJob.id,
      ImportJobStatus.failed,
      {
        errors: [message],
        finishedAt: new Date(),
      },
    );

    return {
      year: page.year,
      sourceUrl: page.url,
      importJobId: importJob.id,
      rowsParsed: 0,
      rowsMatched: 0,
      rowsImported: 0,
      unresolvedBreedAliases: 0,
      warnings: [],
      errors: [message],
    };
  }
}

function isRetrieverRow(row: ParsedPopularityRankingRow): boolean {
  return RETRIEVER_BREED_NAME_KEYS.has(toBreedNameKey(row.breedName));
}

function toBreedNameKey(breedName: string): string {
  return breedName.toLowerCase().replace(/[^a-z]/g, "");
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown AKC import error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
