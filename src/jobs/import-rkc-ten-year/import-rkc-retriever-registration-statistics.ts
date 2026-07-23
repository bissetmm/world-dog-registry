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
const PARSER_VERSION = "rkc-target-breed-ten-year-official-import@0.2.0";

const RETRIEVER_BREED_NAMES = [
  "Retriever (Chesapeake Bay)",
  "Retriever (Curly Coated)",
  "Retriever (Flat Coated)",
  "Retriever (Golden)",
  "Retriever (Labrador)",
  "Retriever (Nova Scotia Duck Tolling)",
];

const RKC_TARGET_GROUPS: RkcTargetGroup[] = [
  {
    groupCode: "gundog",
    groupLabel: "Gundog",
    fileName: "rkc-ten-year-breeds-stats-gundog.pdf",
    targetBreedNames: RETRIEVER_BREED_NAMES,
  },
  {
    groupCode: "working",
    groupLabel: "Working",
    fileName: "rkc-ten-year-breeds-stats-working.pdf",
    targetBreedNames: ["Siberian Husky"],
  },
  {
    groupCode: "pastoral",
    groupLabel: "Pastoral",
    fileName: "rkc-ten-year-breeds-stats-pastoral.pdf",
    targetBreedNames: ["Samoyed"],
  },
];

type RkcTargetGroup = {
  groupCode: string;
  groupLabel: string;
  fileName: string;
  targetBreedNames: string[];
};

type SourceDocumentResult = {
  groupLabel: string;
  sourcePdfUrl: string;
  sourceDocumentId: string;
};

type ImportResult = {
  sourceIndexUrl: string;
  importJobId: string;
  sourceDocuments: SourceDocumentResult[];
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
    const result = await importRkcTargetBreedStatistics(app);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

async function importRkcTargetBreedStatistics(
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
    const indexContent = indexFile.content.toString("utf8");
    const kennelClub = await kennelClubRepository.findByCode("RKC");

    if (!kennelClub) {
      throw new Error("KennelClub not found: RKC");
    }

    const sourceDocuments: SourceDocumentResult[] = [];
    const years = new Set<number>();
    const warnings: string[] = [];
    const errors: string[] = [];
    let rowsParsed = 0;
    let rowsMatched = 0;
    let rowsImported = 0;
    let unresolvedBreedAliases = 0;

    for (const targetGroup of RKC_TARGET_GROUPS) {
      const sourcePdfUrl = discoverTenYearBreedPdfUrl(
        indexContent,
        RKC_BREED_STATISTICS_URL,
        targetGroup,
      );
      const downloadedPdf = await downloader.download(sourcePdfUrl);
      const checksum = checksumService.sha256(downloadedPdf.content);
      const savedFilePath = await rawFileStorageService.save({
        sourceClubCode: "RKC",
        fileName: targetGroup.fileName,
        content: downloadedPdf.content,
      });
      const sourceDocument = await sourceDocumentRepository.create({
        kennelClub: { connect: { id: kennelClub.id } },
        importJob: { connect: { id: importJob.id } },
        sourceUrl: sourcePdfUrl,
        filePath: savedFilePath,
        fileName: targetGroup.fileName,
        fileType: downloadedPdf.contentType ?? "application/pdf",
        sourceFormat: SourceFormat.PDF,
        checksum,
        year: 2025,
        title: `RKC ten-year ${targetGroup.groupCode} breed registration statistics`,
        parserVersion: PARSER_VERSION,
        retrievedAt: downloadedPdf.retrievedAt,
      });
      const parsedRows = await parser.parsePdf(downloadedPdf.content);
      const targetRows = parsedRows.filter((row) =>
        isTargetBreedRow(row, targetGroup.targetBreedNames),
      );
      const normalizedRows =
        await normalizer.normalizeRegistrationRows(targetRows);
      const validationResult = validator.validate(normalizedRows);
      const importedCount = await importer.importRows({
        sourceClubCode: "RKC",
        sourceDocumentId: sourceDocument.id,
        rows: validationResult.validRows,
      });
      const unresolvedCount = await importer.saveUnresolvedAliases({
        sourceClubCode: "RKC",
        sourceDocumentId: sourceDocument.id,
        rows: normalizedRows,
      });

      sourceDocuments.push({
        groupLabel: targetGroup.groupLabel,
        sourcePdfUrl,
        sourceDocumentId: sourceDocument.id,
      });
      targetRows.forEach((row) => years.add(row.year));
      rowsParsed += parsedRows.length;
      rowsMatched += targetRows.length;
      rowsImported += importedCount;
      unresolvedBreedAliases += unresolvedCount;
      warnings.push(...validationResult.warnings);
      errors.push(...validationResult.errors);
    }

    const status =
      errors.length > 0 || unresolvedBreedAliases > 0
        ? ImportJobStatus.partial_success
        : ImportJobStatus.success;

    await importJobRepository.updateStatus(importJob.id, status, {
      rowsParsed,
      rowsImported,
      warnings,
      errors,
      finishedAt: new Date(),
    });

    return {
      sourceIndexUrl: RKC_BREED_STATISTICS_URL,
      importJobId: importJob.id,
      sourceDocuments,
      years: [...years].sort((left, right) => left - right),
      rowsParsed,
      rowsMatched,
      rowsImported,
      unresolvedBreedAliases,
      warnings,
      errors,
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

function discoverTenYearBreedPdfUrl(
  content: string,
  baseUrl: string,
  targetGroup: RkcTargetGroup,
): string {
  const $ = cheerio.load(content);
  const groupCode = targetGroup.groupCode.toLowerCase();
  const directLink = $("a")
    .toArray()
    .find((element) => {
      const href = $(element).attr("href")?.toLowerCase() ?? "";
      const title = $(element).attr("title")?.toLowerCase() ?? "";

      return (
        href.includes(`10-yearly-breeds-stats-${groupCode}`) ||
        title.includes(`10 yearly breeds stats ${groupCode}`)
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
    const groupLink = current
      .find("a")
      .toArray()
      .find(
        (element) => $(element).text().trim().toLowerCase() === groupCode,
      );
    const href = groupLink ? $(groupLink).attr("href") : undefined;

    if (href) {
      return new URL(href, baseUrl).toString();
    }

    current = current.next();
  }

  throw new Error(`RKC ten-year ${groupCode} PDF link was not found`);
}

function isTargetBreedRow(
  row: ParsedRegistrationRow,
  targetBreedNames: string[],
): boolean {
  return targetBreedNames.includes(row.breedName);
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown RKC import error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
