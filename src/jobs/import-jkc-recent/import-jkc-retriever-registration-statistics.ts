import { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ImportJobStatus, SourceFormat } from "@prisma/client";
import * as cheerio from "cheerio";
import { AppModule } from "../../app.module";
import { JkcRegistrationStatisticsParser } from "../../collectors/jkc/jkc-registration-statistics.parser";
import { ImportJobRepository } from "../../database/repositories/import-job.repository";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { SourceDocumentRepository } from "../../database/repositories/source-document.repository";
import { HttpDownloader } from "../../downloaders/http-downloader";
import { RegistrationStatisticImporter } from "../../importers/registration-statistic.importer";
import { BreedNormalizer } from "../../normalizers/breed-normalizer";
import { ParsedRegistrationRow } from "../../parsers/parsed-registration-row.type";
import { ChecksumService } from "../../storage/checksum.service";
import { RawFileStorageService } from "../../storage/raw-file-storage.service";
import { RegistrationStatisticValidator } from "../../validators/registration-statistic.validator";

const JKC_REGISTRATION_STATISTICS_URL =
  "https://www.jkc.or.jp/registr-statistics/";
const PARSER_VERSION = "jkc-target-breed-official-import@0.2.0";

const TARGET_BREED_NAMES = [
  "チェサピーク・ベイ・レトリーバー",
  "チェサピークベイレトリーバー",
  "カーリーコーテッド・レトリーバー",
  "カーリーコーテッドレトリーバー",
  "フラットコーテッド・レトリーバー",
  "フラットコーテッドレトリーバー",
  "ゴールデン・レトリーバー",
  "ゴールデンレトリーバー",
  "ラブラドール・レトリーバー",
  "ラブラドールレトリーバー",
  "ノヴァ・スコシア・ダック・トーリング・レトリーバー",
  "ノヴァスコシアダックトーリングレトリーバー",
  "シベリアン・ハスキー",
  "シベリアンハスキー",
  "サモエド",
];

const TARGET_BREED_NAME_KEYS = new Set(
  TARGET_BREED_NAMES.map((breedName) => toBreedNameKey(breedName)),
);

type ImportArgs = {
  limit: number;
};

type JkcStatisticsPage = {
  year: number;
  url: string;
};

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
  sourceIndexUrl: string;
  yearsRequested: number[];
  yearsImported: YearImportResult[];
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const result = await importRecentJkcTargetBreedStatistics(args, app);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

async function importRecentJkcTargetBreedStatistics(
  args: ImportArgs,
  app: INestApplicationContext,
): Promise<ImportResult> {
  const downloader = app.get(HttpDownloader, { strict: false });
  const indexFile = await downloader.download(JKC_REGISTRATION_STATISTICS_URL);
  const pages = discoverJkcStatisticsPages(
    indexFile.content.toString("utf8"),
    JKC_REGISTRATION_STATISTICS_URL,
  ).slice(0, args.limit);
  const yearsImported: YearImportResult[] = [];

  for (const page of pages) {
    yearsImported.push(await importJkcStatisticsPage(page, app));
  }

  return {
    sourceIndexUrl: JKC_REGISTRATION_STATISTICS_URL,
    yearsRequested: pages.map((page) => page.year),
    yearsImported,
  };
}

async function importJkcStatisticsPage(
  page: JkcStatisticsPage,
  app: INestApplicationContext,
): Promise<YearImportResult> {
  const importJobRepository = app.get(ImportJobRepository, { strict: false });
  const kennelClubRepository = app.get(KennelClubRepository, { strict: false });
  const sourceDocumentRepository = app.get(SourceDocumentRepository, {
    strict: false,
  });
  const checksumService = app.get(ChecksumService, { strict: false });
  const rawFileStorageService = app.get(RawFileStorageService, {
    strict: false,
  });
  const downloader = app.get(HttpDownloader, { strict: false });
  const parser = app.get(JkcRegistrationStatisticsParser, { strict: false });
  const normalizer = app.get(BreedNormalizer, { strict: false });
  const validator = app.get(RegistrationStatisticValidator, { strict: false });
  const importer = app.get(RegistrationStatisticImporter, { strict: false });

  const importJob = await importJobRepository.create({
    kennelClubCode: "JKC",
    targetYear: page.year,
    status: ImportJobStatus.running,
  });

  try {
    const downloadedFile = await downloader.download(page.url);
    const checksum = checksumService.sha256(downloadedFile.content);
    const fileName = `jkc-registration-statistics-${page.year}.html`;
    const savedFilePath = await rawFileStorageService.save({
      sourceClubCode: "JKC",
      year: page.year,
      fileName,
      content: downloadedFile.content,
    });
    const kennelClub = await kennelClubRepository.findByCode("JKC");

    if (!kennelClub) {
      throw new Error("KennelClub not found: JKC");
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
      title: `JKC ${page.year} target breed registration statistics`,
      parserVersion: PARSER_VERSION,
      retrievedAt: downloadedFile.retrievedAt,
    });

    const parsedRows = parser.parse(
      downloadedFile.content.toString("utf8"),
      page.year,
    );
    const targetBreedRows = parsedRows.filter(isTargetBreedRow);
    const normalizedRows =
      await normalizer.normalizeRegistrationRows(targetBreedRows);
    const validationResult = validator.validate(normalizedRows);
    const rowsImported = await importer.importRows({
      sourceClubCode: "JKC",
      sourceDocumentId: sourceDocument.id,
      rows: validationResult.validRows,
    });
    const unresolvedBreedAliases = await importer.saveUnresolvedAliases({
      sourceClubCode: "JKC",
      sourceDocumentId: sourceDocument.id,
      rows: normalizedRows,
    });
    const status =
      validationResult.errors.length > 0 || unresolvedBreedAliases > 0
        ? ImportJobStatus.partial_success
        : ImportJobStatus.success;

    await importJobRepository.updateStatus(importJob.id, status, {
      rowsParsed: parsedRows.length,
      rowsImported,
      warnings: validationResult.warnings,
      errors: validationResult.errors,
      finishedAt: new Date(),
    });

    return {
      year: page.year,
      sourceUrl: page.url,
      importJobId: importJob.id,
      sourceDocumentId: sourceDocument.id,
      rowsParsed: parsedRows.length,
      rowsMatched: targetBreedRows.length,
      rowsImported,
      unresolvedBreedAliases,
      warnings: validationResult.warnings,
      errors: validationResult.errors,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown JKC import error";

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

function discoverJkcStatisticsPages(
  content: string,
  indexUrl: string,
): JkcStatisticsPage[] {
  const $ = cheerio.load(content);
  const pagesByYear = new Map<number, string>();
  const currentYearMatch = $.root()
    .text()
    .match(/(\d{4})年[^。\n]*犬種別犬籍登録頭数/);

  if (currentYearMatch) {
    pagesByYear.set(Number(currentYearMatch[1]), indexUrl);
  }

  $("a").each((_, element) => {
    const label = $(element).text().replace(/\s+/g, " ").trim();
    const href = $(element).attr("href");
    const yearMatch = label.match(/(\d{4})年[^。\n]*犬種別犬籍登録頭数/);

    if (!href || !yearMatch) {
      return;
    }

    pagesByYear.set(Number(yearMatch[1]), new URL(href, indexUrl).toString());
  });

  return [...pagesByYear.entries()]
    .map(([year, url]) => ({ year, url }))
    .filter((page) => Number.isInteger(page.year))
    .sort((left, right) => right.year - left.year);
}

function isTargetBreedRow(row: ParsedRegistrationRow): boolean {
  return TARGET_BREED_NAME_KEYS.has(toBreedNameKey(row.breedName));
}

function toBreedNameKey(breedName: string): string {
  return breedName.replace(/[・･\s]/g, "");
}

function parseArgs(args: string[]): ImportArgs {
  const limit = Number(readArg(args, "--limit") ?? "10");

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Invalid --limit value: ${limit}`);
  }

  return { limit };
}

function readArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown JKC import error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
