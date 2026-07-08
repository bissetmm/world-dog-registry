import { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ImportJobStatus, SourceFormat } from "@prisma/client";
import * as cheerio from "cheerio";
import { AppModule } from "../../app.module";
import { RoyalKennelClubTenYearRegistrationStatisticsParser } from "../../collectors/royal-kennel-club/royal-kennel-club-ten-year-registration-statistics.parser";
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

const RKC_BREED_STATISTICS_URL =
  "https://www.royalkennelclub.com/about-us/resources/breed-registration-statistics/";
const PARSER_VERSION = "rkc-retriever-ten-year-official-import@0.1.0";

const RETRIEVER_BREED_NAMES = [
  "Retriever (Chesapeake Bay)",
  "Retriever (Curly Coated)",
  "Retriever (Flat Coated)",
  "Retriever (Golden)",
  "Retriever (Labrador)",
  "Retriever (Nova Scotia Duck Tolling)",
];

type ImportResult = {
  sourceIndexUrl: string;
  sourcePdfUrl: string;
  importJobId: string;
  sourceDocumentId?: string;
  years: number[];
  rowsParsed: number;
  rowsMatched: number;
  rowsImported: number;
  unresolvedBreedAliases: number;
  warnings: string[];
  errors: string[];
};

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const result = await importRkcRetrieverStatistics(app);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

async function importRkcRetrieverStatistics(
  app: INestApplicationContext,
): Promise<ImportResult> {
  const downloader = app.get(HttpDownloader, { strict: false });
  const importJobRepository = app.get(ImportJobRepository, { strict: false });
  const kennelClubRepository = app.get(KennelClubRepository, { strict: false });
  const sourceDocumentRepository = app.get(SourceDocumentRepository, {
    strict: false,
  });
  const checksumService = app.get(ChecksumService, { strict: false });
  const rawFileStorageService = app.get(RawFileStorageService, {
    strict: false,
  });
  const parser = app.get(RoyalKennelClubTenYearRegistrationStatisticsParser, {
    strict: false,
  });
  const normalizer = app.get(BreedNormalizer, { strict: false });
  const validator = app.get(RegistrationStatisticValidator, { strict: false });
  const importer = app.get(RegistrationStatisticImporter, { strict: false });

  const importJob = await importJobRepository.create({
    kennelClubCode: "RKC",
    targetYear: null,
    status: ImportJobStatus.running,
  });

  try {
    const indexFile = await downloader.download(RKC_BREED_STATISTICS_URL);
    const sourcePdfUrl = discoverTenYearGundogPdfUrl(
      indexFile.content.toString("utf8"),
      RKC_BREED_STATISTICS_URL,
    );
    const downloadedPdf = await downloader.download(sourcePdfUrl);
    const checksum = checksumService.sha256(downloadedPdf.content);
    const fileName = "rkc-ten-year-breeds-stats-gundog.pdf";
    const savedFilePath = await rawFileStorageService.save({
      sourceClubCode: "RKC",
      fileName,
      content: downloadedPdf.content,
    });
    const kennelClub = await kennelClubRepository.findByCode("RKC");

    if (!kennelClub) {
      throw new Error("KennelClub not found: RKC");
    }

    const sourceDocument = await sourceDocumentRepository.create({
      kennelClub: { connect: { id: kennelClub.id } },
      importJob: { connect: { id: importJob.id } },
      sourceUrl: sourcePdfUrl,
      filePath: savedFilePath,
      fileName,
      fileType: downloadedPdf.contentType ?? "application/pdf",
      sourceFormat: SourceFormat.PDF,
      checksum,
      year: 2025,
      title: "RKC ten-year gundog breed registration statistics",
      parserVersion: PARSER_VERSION,
      retrievedAt: downloadedPdf.retrievedAt,
    });
    const parsedRows = await parser.parsePdf(downloadedPdf.content);
    const retrieverRows = parsedRows.filter(isRetrieverRow);
    const normalizedRows =
      await normalizer.normalizeRegistrationRows(retrieverRows);
    const validationResult = validator.validate(normalizedRows);
    const rowsImported = await importer.importRows({
      sourceClubCode: "RKC",
      sourceDocumentId: sourceDocument.id,
      rows: validationResult.validRows,
    });
    const unresolvedBreedAliases = await importer.saveUnresolvedAliases({
      sourceClubCode: "RKC",
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
      sourceIndexUrl: RKC_BREED_STATISTICS_URL,
      sourcePdfUrl,
      importJobId: importJob.id,
      sourceDocumentId: sourceDocument.id,
      years: [...new Set(retrieverRows.map((row) => row.year))].sort(
        (left, right) => left - right,
      ),
      rowsParsed: parsedRows.length,
      rowsMatched: retrieverRows.length,
      rowsImported,
      unresolvedBreedAliases,
      warnings: validationResult.warnings,
      errors: validationResult.errors,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown RKC import error";

    await importJobRepository.updateStatus(
      importJob.id,
      ImportJobStatus.failed,
      {
        errors: [message],
        finishedAt: new Date(),
      },
    );

    throw error;
  }
}

function discoverTenYearGundogPdfUrl(content: string, baseUrl: string): string {
  const $ = cheerio.load(content);
  const directLink = $("a")
    .toArray()
    .find((element) => {
      const href = $(element).attr("href")?.toLowerCase() ?? "";
      const title = $(element).attr("title")?.toLowerCase() ?? "";

      return (
        href.includes("10-yearly-breeds-stats-gundog") ||
        title.includes("10 yearly breeds stats gundog")
      );
    });
  const directHref = directLink ? $(directLink).attr("href") : undefined;

  if (directHref) {
    return new URL(directHref, baseUrl).toString();
  }

  const tenYearHeading = $("h2")
    .toArray()
    .find((element) =>
      $(element).text().toLowerCase().includes("10-yearly breed statistics"),
    );

  if (!tenYearHeading) {
    throw new Error("RKC ten-year breed statistics heading was not found");
  }

  let current = $(tenYearHeading).parent().next();

  while (current.length > 0 && current[0].tagName !== "h2") {
    const gundogLink = current
      .find("a")
      .toArray()
      .find((element) => $(element).text().trim().toLowerCase() === "gundog");
    const href = gundogLink ? $(gundogLink).attr("href") : undefined;

    if (href) {
      return new URL(href, baseUrl).toString();
    }

    current = current.next();
  }

  throw new Error("RKC ten-year gundog PDF link was not found");
}

function isRetrieverRow(row: ParsedRegistrationRow): boolean {
  return RETRIEVER_BREED_NAMES.includes(row.breedName);
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown RKC import error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
